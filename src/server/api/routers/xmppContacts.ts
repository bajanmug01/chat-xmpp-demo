import { z } from "zod";
import { client, xml } from "@xmpp/client";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "LA/env";
import type { Contact } from "LA/app/lib/types";
import type { XmlElement } from "@xmpp/client";

/**
 * Helper function to ensure values are strings
 */
function ensureString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Router for XMPP contact operations
 */
export const xmppContactsRouter = createTRPCRouter({
  // Get user's roster (contact list)
  getContacts: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { username, password } = input;
      
      const serviceUrl = env.NEXT_PUBLIC_XMPP_SERVICE;
      const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;
      
      if (!serviceUrl || !domain) {
        throw new Error("Missing required environment variables");
      }
      
      console.log(`Fetching roster for user ${username}@${domain}`);
      
      // Create XMPP client
      const xmpp = client({
        service: serviceUrl,
        domain,
        username,
        password,
        resource: 'rosterFetch'
      });
      
      try {
        // Set up error handler
        xmpp.on('error', (err) => {
          console.error('XMPP Error:', err.message);
        });
        
        // Connect to the server
        await xmpp.start();
        
        // Request roster (contact list) - use the xml function directly
        const rosterQuery = xml('query', { xmlns: 'jabber:iq:roster' });
        const rosterIQ = await xmpp.iqCaller.get(
          xml('iq', { type: 'get' }, rosterQuery)
        );
        
        // Process roster items
        const contacts: Contact[] = [];
        const items = rosterIQ.getChildren('query')[0]?.getChildren('item') ?? [];
        
        for (const item of items) {
          const jid = ensureString(item.attrs.jid, '');
          if (!jid) continue;
          
          // Extract username from JID (remove domain part)
          const contactUsername = jid.split('@')[0] ?? 'unknown';
          
          // Create contact object with guaranteed string value
          contacts.push({
            id: jid,
            name: ensureString(item.attrs.name, contactUsername),
            lastSeen: new Date(),
            isOnline: false,
            avatar: "/placeholder.svg?height=40&width=40",
          });
        }
        
        // Disconnect after getting roster
        await xmpp.stop();
        
        return { contacts };
      } catch (error) {
        console.error('Error fetching roster:', error);
        
        // Ensure we disconnect even on error
        try {
          await xmpp.stop();
        } catch (stopError) {
          console.error('Error disconnecting:', stopError);
        }
        
        throw error instanceof Error 
          ? error 
          : new Error('Unknown error fetching contacts');
      }
    }),
    
  // Add a contact to the user's roster
  addContact: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        contactUsername: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { username, password, contactUsername, name } = input;
      
      const serviceUrl = env.NEXT_PUBLIC_XMPP_SERVICE;
      const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;
      
      if (!serviceUrl || !domain) {
        throw new Error("Missing required environment variables");
      }
      
      console.log(`Adding contact ${contactUsername}@${domain} for user ${username}@${domain}`);
      
      // Create XMPP client
      const xmpp = client({
        service: serviceUrl,
        domain,
        username,
        password,
        resource: 'contactAdd'
      });
      
      try {
        // Connect to the server
        await xmpp.start();
        
        // Build the roster item with proper types - handle undefined
        const itemAttrs: Record<string, string> = {
          jid: `${contactUsername}@${domain}`
        };
        
        // Only add name attribute if it exists
        if (name) {
          itemAttrs.name = name;
        }
        
        const rosterQuery = xml('query', { xmlns: 'jabber:iq:roster' },
          xml('item', itemAttrs)
        );
        
        // Add to roster
        await xmpp.iqCaller.set(rosterQuery);
        
        // Send subscription request
        const presenceStanza = xml('presence', { 
          to: `${contactUsername}@${domain}`,
          type: 'subscribe'
        });
        
        await xmpp.send(presenceStanza);
        
        // Disconnect after adding contact
        await xmpp.stop();
        
        return { 
          success: true,
          contactJid: `${contactUsername}@${domain}` 
        };
      } catch (error) {
        console.error('Error adding contact:', error);
        
        // Ensure we disconnect even on error
        try {
          await xmpp.stop();
        } catch (stopError) {
          console.error('Error disconnecting:', stopError);
        }
        
        throw error instanceof Error 
          ? error 
          : new Error('Unknown error adding contact');
      }
    }),
    
  // Accept a contact subscription request
  acceptSubscription: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        contactJid: z.string(), // Full JID of the contact to accept
      }),
    )
    .mutation(async ({ input }) => {
      const { username, password, contactJid } = input;
      
      const serviceUrl = env.NEXT_PUBLIC_XMPP_SERVICE;
      const domain = env.NEXT_PUBLIC_XMPP_DOMAIN;
      
      if (!serviceUrl || !domain) {
        throw new Error("Missing required environment variables");
      }
      
      console.log(`Accepting subscription from ${contactJid} for user ${username}@${domain}`);
      
      // Create XMPP client
      const xmpp = client({
        service: serviceUrl,
        domain,
        username,
        password,
        resource: 'subscriptionAccept'
      });
      
      try {
        // Connect to the server
        await xmpp.start();
        
        // Accept subscription
        const acceptStanza = xml('presence', { 
          to: contactJid,
          type: 'subscribed'
        });
        
        await xmpp.send(acceptStanza);
        
        // Also subscribe to the contact
        const subscribeStanza = xml('presence', { 
          to: contactJid,
          type: 'subscribe'
        });
        
        await xmpp.send(subscribeStanza);
        
        // Disconnect after accepting subscription
        await xmpp.stop();
        
        return { success: true };
      } catch (error) {
        console.error('Error accepting subscription:', error);
        
        // Ensure we disconnect even on error
        try {
          await xmpp.stop();
        } catch (stopError) {
          console.error('Error disconnecting:', stopError);
        }
        
        throw error instanceof Error 
          ? error 
          : new Error('Unknown error accepting subscription');
      }
    }),
}); 