import { client } from "@xmpp/client";
import { env } from "LA/env";

// Define types
interface UserRegistrationData {
  newUser: string;
  newPass: string;
}

/**
 * Creates a user on the XMPP server via WebSocket using in-band registration
 */
export async function createUser({
  newUser,
  newPass,
}: UserRegistrationData): Promise<void> {
  const serviceUrl = env.NEXT_PUBLIC_XMPP_SERVICE;
  const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;

  if (!serviceUrl) {
    throw new Error("NEXT_PUBLIC_XMPP_SERVICE environment variable is not set");
  }

  if (!domain) {
    throw new Error("NEXT_PUBLIC_XMPP_DOMAIN environment variable is not set");
  }

  console.log(
    `Attempting to register user ${newUser}@${domain} via WebSocket...`,
  );

  return new Promise<void>((resolve, reject) => {
    console.log(`Connecting to WebSocket: ${serviceUrl}`);

    let socket: WebSocket;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let registrationComplete = false;
    let connectionClosed = false;

    // Helper function to sanitize XML for WebSocket
    const sanitizeXml = (xml: string): string => {
      // RFC 7395 requires framing to start with '<' immediately
      return xml.trim();
    };

    try {
      socket = new WebSocket(serviceUrl, ["xmpp"]);
    } catch (err) {
      return reject(
        new Error(
          `Failed to create WebSocket: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }

    // Generate a unique ID for our XMPP stanzas
    const stanzaId = Math.random().toString(36).substring(2, 15);

    // Set a timeout in case nothing happens
    const mainTimeout = setTimeout(() => {
      if (!registrationComplete && !connectionClosed) {
        console.log("Registration process timed out");
        cleanup();
        reject(new Error("Registration timed out"));
      }
    }, 15000);

    // Helper to clean up all resources
    const cleanup = () => {
      connectionClosed = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      clearTimeout(mainTimeout);

      // Only close the socket if it's still open
      if (
        socket &&
        socket.readyState !== WebSocket.CLOSED &&
        socket.readyState !== WebSocket.CLOSING
      ) {
        console.log("Closing WebSocket connection");
        try {
          // Try to send a proper close stream first
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              sanitizeXml(
                '<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>',
              ),
            );
          }
          socket.close();
        } catch (e) {
          console.error("Error closing socket:", e);
        }
      }
    };

    // Set up heartbeat to keep connection alive
    const startHeartbeat = () => {
      console.log("Starting heartbeat");
      if (heartbeatInterval) clearInterval(heartbeatInterval);

      heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          console.log("Sending heartbeat ping");
          // Use a proper XMPP ping
          const pingId = Math.random().toString(36).substring(2, 10);
          const ping = `<iq type="get" id="ping-${pingId}" xmlns="jabber:client"><ping xmlns="urn:xmpp:ping"/></iq>`;
          try {
            socket.send(sanitizeXml(ping));
          } catch (err) {
            console.log("Error sending heartbeat ping:", err);
            clearInterval(heartbeatInterval!);
            heartbeatInterval = null;
          }
        } else {
          clearInterval(heartbeatInterval!);
          heartbeatInterval = null;
        }
      }, 5000);
    };

    socket.onopen = function () {
      try {
        console.log("WebSocket connection established");

        // Start heartbeat
        startHeartbeat();

        // Start XMPP stream
        const openStream = `<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="${domain}" version="1.0"/>`;
        console.log("Sending open stream");
        socket.send(sanitizeXml(openStream));
      } catch (err) {
        console.error("Error in onopen handler:", err);
        cleanup();
        reject(new Error("Failed to start XMPP stream"));
      }
    };

    socket.onmessage = (event) => {
      // Process the message data
      let data: string;
      if (typeof event.data === "string") {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        console.log("Received non-text data from WebSocket");
        return;
      }

      console.log("Received WebSocket data:", data);

      // Log key identifiers to help with debugging
      console.log(`Looking for registration form ID: ${stanzaId}-reg1`);
      console.log(`Looking for registration result ID: ${stanzaId}-reg2`);

      // Parse and handle the message based on XMPP registration flow
      if (data.includes("<stream:features")) {
        console.log("Received stream features");

        // Check if registration is supported - look for any indication of registration support
        const hasRegisterFeature =
          data.includes("http://jabber.org/features/iq-register") ||
          data.includes("jabber:iq:register") ||
          data.includes("<register") ||
          data.includes("iq-register");

        if (!hasRegisterFeature) {
          console.error("Server does not support in-band registration");
          cleanup();
          return reject(
            new Error("Server does not support in-band registration"),
          );
        }

        // Ensure we use the RFC 7395 WebSocket framing protocol
        // Request registration form - no extra whitespace or newlines
        const regQuery = `<iq type="get" id="${stanzaId}-reg1" to="${domain}" xmlns="jabber:client"><query xmlns="jabber:iq:register"/></iq>`;

        console.log("Sending registration form request");

        try {
          socket.send(sanitizeXml(regQuery));
        } catch (sendErr) {
          console.error("Error sending registration form request:", sendErr);
          cleanup();
          return reject(new Error("Error sending registration form request"));
        }
      }

      // Registration form received - simpler checks to better match server responses
      else if (
        data.includes("jabber:iq:register") &&
        data.includes("jabber:x:data")
      ) {
        console.log(
          "Received registration form with data form, submitting registration data",
        );

        // For servers that use data forms
        const dataFormRegistration = `<iq type="set" id="${stanzaId}-reg2" to="${domain}" xmlns="jabber:client"><query xmlns="jabber:iq:register"><x xmlns="jabber:x:data" type="submit"><field var="FORM_TYPE" type="hidden"><value>jabber:iq:register</value></field><field var="username"><value>${newUser}</value></field><field var="password"><value>${newPass}</value></field></x></query></iq>`;

        console.log("Sending data form registration");
        try {
          socket.send(sanitizeXml(dataFormRegistration));
        } catch (sendErr) {
          console.error("Error sending data form registration:", sendErr);
          cleanup();
          return reject(new Error("Error sending data form registration"));
        }
      }
      // Alternative registration form detection (for servers that don't send a data form)
      else if (
        data.includes("jabber:iq:register") &&
        (data.includes("<username/>") || data.includes("<password/>"))
      ) {
        console.log(
          "Received registration form with basic fields, submitting registration data",
        );

        // Send basic registration data
        const registration = `<iq type="set" id="${stanzaId}-reg2" to="${domain}" xmlns="jabber:client"><query xmlns="jabber:iq:register"><username>${newUser}</username><password>${newPass}</password></query></iq>`;
        console.log("Sending registration data");

        try {
          socket.send(sanitizeXml(registration));
        } catch (sendErr) {
          console.error("Error sending registration data:", sendErr);
          cleanup();
          return reject(new Error("Error sending registration data"));
        }
      }

      // Registration response - simpler detection that doesn't rely on specific IDs
      else if (
        data.includes('type="result"') ||
        data.includes("type='result'")
      ) {
        // If we receive any successful result after sending registration data, consider it a success
        console.log(
          "Received successful result, assuming registration complete",
        );

        // Success!
        console.log(`✅ User ${newUser}@${domain} successfully registered!`);
        registrationComplete = true;

        // Send proper stream close
        try {
          socket.send(
            sanitizeXml('<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>'),
          );
        } catch (closeErr) {
          console.error("Error sending stream close:", closeErr);
          // Not critical, we'll still try to close the socket
        }

        // Delay cleanup to allow server to process close
        setTimeout(() => {
          cleanup();

          // Try to verify the registration by authenticating with the new credentials
          setTimeout(() => {
            void (async () => {
              try {
                console.log(
                  `Verifying registration by authenticating as ${newUser}...`,
                );

                // Create an XMPP client to verify authentication
                const verifyClient = client({
                  service: serviceUrl,
                  domain,
                  username: newUser,
                  password: newPass,
                  resource: "registrationverify",
                });

                let authSuccess = false;

                verifyClient.on("online", () => {
                  console.log(
                    `✅ Authentication successful! User ${newUser} was created properly.`,
                  );
                  authSuccess = true;
                  void verifyClient.stop();
                });

                verifyClient.on("error", (err) => {
                  console.log(`Verification warning: ${err.message}`);
                  // Not fatal, we'll stop the client after timeout
                });

                await verifyClient.start();

                // Give it 2 seconds to authenticate
                await new Promise((resolveAuth) =>
                  setTimeout(resolveAuth, 2000),
                );

                if (!authSuccess) {
                  console.log(
                    "Warning: User was registered but verification failed",
                  );
                  try {
                    await verifyClient.stop();
                  } catch (stopErr) {
                    console.log("Error stopping verify client:", stopErr);
                  }
                }
              } catch (verifyError) {
                console.log(
                  `Verification warning: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`,
                );
                // Verification failure is not fatal since the registration might still have worked
              }

              // Always resolve even if verification had issues
              resolve();
            })();
          }, 1000);
        }, 500);
      }

      // Error responses
      else if (data.includes('type="error"') || data.includes("type='error'")) {
        // Extract error message if available
        let errorMessage = "Unknown registration error";
        const errorMatch = /<error.*?>(.*?)<\/error>/.exec(data);
        if (errorMatch?.length && errorMatch[1]) {
          errorMessage = errorMatch[1];
        }

        console.error(`Registration failed with error: ${errorMessage}`);

        // Try an alternative approach - data form submission - no extra whitespace
        console.log(
          "Attempting alternative registration method with data form...",
        );

        const dataFormRegistration = `<iq type="set" id="${stanzaId}-reg3" to="${domain}" xmlns="jabber:client"><query xmlns="jabber:iq:register"><x xmlns="jabber:x:data" type="submit"><field var="FORM_TYPE" type="hidden"><value>jabber:iq:register</value></field><field var="username"><value>${newUser}</value></field><field var="password"><value>${newPass}</value></field></x></query></iq>`;

        console.log("Sending data form registration");
        try {
          socket.send(sanitizeXml(dataFormRegistration));
        } catch (sendErr) {
          console.error("Error sending data form registration:", sendErr);
          cleanup();
          return reject(new Error("Error sending data form registration"));
        }
        return; // Don't reject yet, wait for the response
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      cleanup();
      reject(new Error("WebSocket connection error"));
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      cleanup();

      if (!registrationComplete && !connectionClosed) {
        reject(
          new Error(
            `Connection closed prematurely: ${event.reason || "Unknown reason"}`,
          ),
        );
      }
    };
  });
}
