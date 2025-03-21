import {
  client as createXmppClient,
  type XmppClient,
  xml,
  type XmlElement,
} from "@xmpp/client";
import { env } from "LA/env";

// TODO: When starting the xmpp-Server for the first time execute script './create-user..ps1' to create admin manually (secrets from script should be the same from environment variables (.env))
export async function connectAsAdmin(): Promise<XmppClient> {
  const adminJid = process.env.ADMIN_XMPP_JID ?? "";
  const adminPass = process.env.ADMIN_XMPP_PASS ?? "";
  const xmppService = env.NEXT_PUBLIC_XMPP_SERVICE ?? "";
  const xmppDomain = env.NEXT_PUBLIC_XMPP_DOMAIN ?? "";

  // Check if required env variables are empty and throw error if they are
  if (!adminJid) {
    throw new Error("ADMIN_XMPP_JID environment variable is not set");
  }
  
  if (!adminPass) {
    throw new Error("ADMIN_XMPP_PASS environment variable is not set");
  }
  
  if (!xmppService) {
    throw new Error("XMPP_SERVICE environment variable is not set");
  }
  
  if (!xmppDomain) {
    throw new Error("XMPP_DOMAIN environment variable is not set");
  }

  console.log("Connecting as admin:", adminJid);
  console.log("XMPP Service:", xmppService);
  console.log("XMPP Domain:", xmppDomain);

  // Extract username from JID
  const adminUsername = adminJid.split("@")[0];
  console.log("Admin username:", adminUsername);

  const adminClient = createXmppClient({
    service: xmppService,
    domain: xmppDomain,
    username: adminUsername,
    password: adminPass,
  });

  // Set up error handling
  adminClient.on("error", (err) => {
    console.error("Admin XMPP error:", err);
  });
  
  // Add online handler for debugging
  adminClient.on("online", (data) => {
    console.log("Admin XMPP client is now online as:", data.jid?.toString());
  });
  
  // Add stanza handler for debugging
  adminClient.on("stanza", (stanza) => {
    console.log("Admin received stanza type:", stanza.attrs.type);
    if (stanza.attrs.type === "error") {
      console.log("Error stanza details:", JSON.stringify(stanza.attrs));
    }
  });

  // Set up a timeout for the connection (increase to 20 seconds)
  const connectionPromise = adminClient.start();
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Connection timeout after 20 seconds")), 20000);
  });

  try {
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log("Admin XMPP client connected!");
    return adminClient;
  } catch (error) {
    console.error("Failed to connect admin client:", error);
    // Did you create the admin user? Check script 'create-user.ps1'
    console.log("Did you create the admin user with 'create-user.ps1' script?");
    console.log("Admin username should be:", adminUsername);
    console.log("Domain should be:", xmppDomain);
    throw new Error("Could not connect to XMPP server as admin");
  }
}

// This function uses direct XMPP registration via In-Band Registration (XEP-0077)
export async function createUser(
  adminClient: XmppClient,
  userJid: string,
  userPass: string,
): Promise<boolean> {
  try {
    const domain = env.NEXT_PUBLIC_XMPP_DOMAIN ?? 'localhost';
    const username = userJid.includes('@') ? userJid.split('@')[0] : userJid;
    
    console.log(`Attempting to create user: ${username} on domain ${domain}`);

    // We'll use a simplified approach without relying on iqCaller
    console.log("Sending registration request for user:", username);
    
    try {
      // Generate a unique request ID for the registration form request
      const formId = `reg_form_${Date.now()}`;
      
      // First, request the registration form
      console.log("Requesting registration form...");
      const formRequest = xml(
        "iq", 
        { type: "get", id: formId },
        xml("query", { xmlns: "jabber:iq:register" })
      );
      
      // Send the form request
      await adminClient.send(formRequest);
      
      // Wait for the form response
      const formResponse = await new Promise<XmlElement>((resolve, reject) => {
        const formHandler = (stanza: XmlElement) => {
          if (stanza.is("iq") && stanza.attrs.id === formId) {
            adminClient.off("stanza", formHandler);
            
            if (stanza.attrs.type === "result") {
              console.log("Registration form received");
              resolve(stanza);
            } else {
              reject(new Error(`Failed to get registration form: ${stanza.attrs.type}`));
            }
          }
        };
        
        adminClient.on("stanza", formHandler);
        
        // Set timeout for form request
        setTimeout(() => {
          adminClient.off("stanza", formHandler);
          reject(new Error("Timeout waiting for registration form"));
        }, 5000);
      });
      
      // Look at the form to determine what fields are supported
      const query = formResponse.getChild("query", "jabber:iq:register");
      // Use optional chaining with type assertions
      const hasDataForm = Boolean(query?.getChild("x", "jabber:x:data"));
      const hasUsernameField = Boolean(query?.getChild("username"));
      
      console.log(`Form supports: ${hasDataForm ? 'data-forms' : 'no-data-forms'}, ${hasUsernameField ? 'username field' : 'no username field'}`);
      
      // Generate a unique request ID for the actual registration
      const registerId = `register_${Date.now()}`;
      
      // Now send the actual registration request - we have two formats to try
      console.log("Sending registration data...");
      
      // Choose format based on what the server supports
      let registerRequest;
      if (hasDataForm) {
        console.log("Using XEP-0004 data form format");
        registerRequest = xml(
          "iq", 
          { type: "set", id: registerId },
          xml("query", { xmlns: "jabber:iq:register" },
            xml("x",
              { type: "submit", xmlns: "jabber:x:data" },
              xml("field", { type: "hidden", var: "FORM_TYPE" },
                xml("value", {}, "jabber:iq:register")
              ),
              xml("field", { label: "Username", type: "text-single", var: "username" },
                xml("required"),
                xml("value", {}, String(username))
              ),
              xml("field", { label: "Password", type: "text-private", var: "password" },
                xml("required"),
                xml("value", {}, String(userPass))
              )
            )
          )
        );
      } else if (hasUsernameField) {
        console.log("Using basic registration format");
        registerRequest = xml(
          "iq", 
          { type: "set", id: registerId },
          xml("query", { xmlns: "jabber:iq:register" },
            xml("username", {}, String(username)),
            xml("password", {}, String(userPass))
          )
        );
      } else {
        throw new Error("Server doesn't support in-band registration in a format we recognize");
      }
      
      // Send the registration request
      await adminClient.send(registerRequest);
      
      // Wait for the response
      const result = await new Promise<boolean>((resolve, reject) => {
        const responseHandler = (stanza: XmlElement) => {
          if (stanza.is("iq") && stanza.attrs.id === registerId) {
            adminClient.off("stanza", responseHandler);
            
            if (stanza.attrs.type === "result") {
              console.log(`✅ User ${username} registered successfully!`);
              resolve(true);
            } else if (stanza.attrs.type === "error") {
              // Check for specific error conditions
              const error = stanza.getChild("error");
              
              // If conflict error (user already exists), we're fine
              if (error?.getChild("conflict")) {
                console.log(`User ${username} already exists, continuing`);
                resolve(true);
              } else {
                const errorType = error?.attrs?.type ?? "unknown";
                reject(new Error(`Registration failed: ${errorType}`));
              }
            } else {
              reject(new Error(`Unexpected response: ${stanza.attrs.type}`));
            }
          }
        };
        
        adminClient.on("stanza", responseHandler);
        
        // Set timeout for registration request
        setTimeout(() => {
          adminClient.off("stanza", responseHandler);
          reject(new Error("Timeout waiting for registration response"));
        }, 10000);
      });
      
      return result;
    } catch (xmppError) {
      console.error("XMPP Registration error:", xmppError);
      throw xmppError;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
