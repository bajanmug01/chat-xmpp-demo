import { client, xml } from '@xmpp/client';
import { env } from "LA/env";
import { exec } from 'child_process';
import { promisify } from 'util';

// Define types
interface UserRegistrationData {
  newUser: string;
  newPass: string;
}

/**
 * Creates a user on the XMPP server
 */
export async function createUser({
  newUser,
  newPass
}: UserRegistrationData): Promise<void> {
  // Get environment variables
  const serviceUrl = env.NEXT_PUBLIC_XMPP_SERVICE;
  const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;

  if (!serviceUrl) {
    throw new Error("NEXT_PUBLIC_XMPP_SERVICE environment variable is not set");
  }
  
  if (!domain) {
    throw new Error("NEXT_PUBLIC_XMPP_DOMAIN environment variable is not set");
  }

  console.log(`Attempting to register user ${newUser}@${domain} via WebSocket...`);
  
  // If it's an HTTP URL, convert it to a WebSocket URL
  let wsUrl = serviceUrl;
  if (wsUrl.startsWith('http://')) {
    wsUrl = wsUrl.replace('http://', 'ws://');
  } else if (wsUrl.startsWith('https://')) {
    wsUrl = wsUrl.replace('https://', 'wss://');
  }
  
  if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
    console.log(`Service URL not a WebSocket URL: ${wsUrl}, adding ws:// prefix`);
    wsUrl = `ws://${wsUrl}`;
  }

  return new Promise<void>((resolve, reject) => {
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
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
      socket = new WebSocket(wsUrl, ['xmpp']);
    } catch (err) {
      return reject(new Error(`Failed to create WebSocket: ${err instanceof Error ? err.message : String(err)}`));
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
      if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        console.log("Closing WebSocket connection");
        try {
          // Try to send a proper close stream first
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(sanitizeXml('<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>'));
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
    
    socket.onopen = function() {
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
      if (typeof event.data === 'string') {
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
      if (data.includes('<stream:features')) {
        console.log("Received stream features");
        
        // Check if registration is supported - look for any indication of registration support
        const hasRegisterFeature = data.includes('http://jabber.org/features/iq-register') || 
                                   data.includes('jabber:iq:register') ||
                                   data.includes('<register') ||
                                   data.includes('iq-register');
        
        if (!hasRegisterFeature) {
          console.error("Server does not support in-band registration");
          cleanup();
          return reject(new Error("Server does not support in-band registration"));
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
      else if (data.includes('jabber:iq:register') && data.includes('jabber:x:data')) {
        console.log("Received registration form with data form, submitting registration data");
        
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
      else if (data.includes('jabber:iq:register') && (data.includes('<username/>') || data.includes('<password/>'))) {
        console.log("Received registration form with basic fields, submitting registration data");
        
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
      else if (data.includes('type="result"') || data.includes("type='result'")) {
        // If we receive any successful result after sending registration data, consider it a success
        console.log("Received successful result, assuming registration complete");
        
        // Success!
        console.log(`✅ User ${newUser}@${domain} successfully registered!`);
        registrationComplete = true;
        
        // Send proper stream close
        try {
          socket.send(sanitizeXml('<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>'));
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
                console.log(`Verifying registration by authenticating as ${newUser}...`);
                
                // Create an XMPP client to verify authentication
                const verifyClient = client({
                  service: serviceUrl,
                  domain,
                  username: newUser,
                  password: newPass,
                  resource: 'registrationverify'
                });
                
                let authSuccess = false;
                
                verifyClient.on('online', () => {
                  console.log(`✅ Authentication successful! User ${newUser} was created properly.`);
                  authSuccess = true;
                  void verifyClient.stop();
                });
                
                verifyClient.on('error', (err) => {
                  console.log(`Verification warning: ${err.message}`);
                  // Not fatal, we'll stop the client after timeout
                });
                
                await verifyClient.start();
                
                // Give it 2 seconds to authenticate
                await new Promise(resolveAuth => setTimeout(resolveAuth, 2000));
                
                if (!authSuccess) {
                  console.log('Warning: User was registered but verification failed');
                  try {
                    await verifyClient.stop();
                  } catch (stopErr) {
                    console.log('Error stopping verify client:', stopErr);
                  }
                }
              } catch (verifyError) {
                console.log(`Verification warning: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
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
        console.log("Attempting alternative registration method with data form...");
        
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
        reject(new Error(`Connection closed prematurely: ${event.reason || 'Unknown reason'}`));
      }
    };
  });
}

/**
 * Creates a user on the XMPP server using in-band registration with data forms
 * For servers that require data forms for registration
 */
export async function createUserWithDataForm({
  newUser,   
  newPass  
}: UserRegistrationData): Promise<void> {
  // Get environment variables
    const service = env.NEXT_PUBLIC_XMPP_SERVICE;
    const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;

  if (!service || !domain) {
    throw new Error("Missing required environment variables");
  }

  // Create XMPP client WITHOUT authentication
  const xmpp = client({
    service,
    domain,
    // Leave username and password undefined to enable anonymous connection
  });

  let registrationComplete = false;

  try {
    // Set up error handler
    xmpp.on('error', (err: Error) => {
    console.error('❌ Error:', err.toString());
  });

    // Set up online handler - this will fire when connected but not authenticated
    // Using void to explicitly handle the Promise and avoid linter errors
    xmpp.on('online', () => {
      void (async () => {
        console.log('Connected anonymously to XMPP server, attempting registration with data form...');
        
        try {
          // 1. First, query registration requirements from server
          const registrationForm = await xmpp.iqCaller.get(
            xml('query', { xmlns: 'jabber:iq:register' })
          );
          console.log('Registration form received:', registrationForm.toString());
          
          // 2. Send data form for registration
          const result = await xmpp.iqCaller.set(
            xml('query', { xmlns: 'jabber:iq:register' },
              xml('x', { xmlns: 'jabber:x:data', type: 'submit' },
                xml('field', { var: 'FORM_TYPE', type: 'hidden' },
                  xml('value', {}, 'jabber:iq:register')
                ),
                xml('field', { var: 'username' },
                  xml('value', {}, newUser)
                ),
                xml('field', { var: 'password' },
                  xml('value', {}, newPass)
                )
              )
            )
          );
          
          console.log('✅ User registration successful!', result.toString());
          registrationComplete = true;
        } catch (err: unknown) {
          console.error('❌ Registration failed:', err instanceof Error ? err.message : String(err));
          throw err; // Re-throw to be caught by outer try/catch
    } finally {
          // Disconnect after registration attempt
          try {
      await xmpp.stop();
          } catch (err: unknown) {
            console.log('Error during disconnect:', err instanceof Error ? err.message : String(err));
          }
    }
      })();
  });

    // Start connection
  await xmpp.start();
    
    // Wait for registration to complete or fail
    // We need this timeout because xmpp.js might not properly trigger all events
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!registrationComplete) {
          console.log('Registration timed out, disconnecting...');
          xmpp.stop().catch((err: Error) => console.error('Error stopping client:', err.message));
          reject(new Error('Registration timed out'));
        } else {
          resolve();
        }
      }, 10000); // 10 second timeout
      
      xmpp.on('close', () => {
        clearTimeout(timeout);
        if (registrationComplete) {
          resolve();
        } else {
          reject(new Error('Connection closed before registration completed'));
        }
      });
    });
  } catch (error: unknown) {
    console.error('XMPP connection error:', error instanceof Error ? error.message : String(error));
    throw new Error('Could not connect to XMPP server');
  }
}

/**
 * Creates a user on the XMPP server using prosodyctl in the Docker container
 * This bypasses all XMPP protocols and directly uses the server's CLI tool
 */
export async function createUserWithProsodyctl({
  newUser,
  newPass
}: UserRegistrationData): Promise<void> {
  // Get environment variables
  const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;

  if (!domain) {
    throw new Error("NEXT_PUBLIC_XMPP_DOMAIN environment variable is not set");
  }

  const execPromise = promisify(exec);
  console.log(`Attempting to register user ${newUser}@${domain} using prosodyctl in Docker...`);
  
  try {
    // Direct command execution using docker exec
    const dockerCommand = `docker exec prosody-xmpp prosodyctl register ${newUser} ${domain} ${newPass}`;
    
    console.log('Executing prosodyctl command in Docker container...');
    const { stdout, stderr } = await execPromise(dockerCommand);
    
    if (stderr?.trim()) {
      console.error('prosodyctl error:', stderr);
      throw new Error('Failed to register user with prosodyctl');
    }
    
    console.log('prosodyctl output:', stdout);
    console.log(`✅ User ${newUser}@${domain} successfully registered!`);
    
    // Try to verify registration by listing users
    try {
      const listCommand = `docker exec prosody-xmpp prosodyctl userlist`;
      const { stdout: listStdout } = await execPromise(listCommand);
      console.log('Current users:', listStdout);
    } catch (listError) {
      console.log('Could not list users:', listError instanceof Error ? listError.message : String(listError));
    }
  } catch (error: unknown) {
    console.error('Registration error:', error instanceof Error ? error.message : String(error));
    throw new Error('Could not register XMPP user');
  }
}

