// https://github.com/xmppjs/xmpp.js/tree/main/packages/client

import { EventEmitter } from "events";
import { client, xml, XmppClient, XmlElement } from "@xmpp/client";
import { env } from "LA/env";

// Types for XMPP messages and contacts
export type XMPPMessage = {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  encrypted?: boolean;
};

export type XMPPContact = {
  id: string;
  jid: string;
  name: string;
  status: "online" | "offline" | "away";
  publicKey?: string;
  avatar?: string;
  unreadCount: number;
  lastMessageTime: string;
};

export type XMPPPresence = {
  jid: string;
  status: "online" | "offline" | "away";
  timestamp: Date;
};

class XMPPClient extends EventEmitter {
  private xmppClient: XmppClient | null = null;
  private connected = false;
  private currentUser: string | null = null;
  private contacts: XMPPContact[] = [];
  private messages: Record<string, XMPPMessage[]> = {};

  constructor() {
    super();

    // Initialize with empty state
    this.contacts = [];
    this.messages = {};
  }

  /**
   * Connect to the XMPP server
   */
  public async connect(jid: string, password: string): Promise<boolean> {
    try {
      // Create XMPP client with environment variables
      console.log("jid: ", jid);

      this.xmppClient = client({
        service: env.NEXT_PUBLIC_XMPP_SERVICE,
        domain: env.NEXT_PUBLIC_XMPP_DOMAIN,
        username: jid.split("@")[0] ?? jid,
        password,
      });

      console.log("client: ", this.xmppClient);
      // Set up event handlers
      this.xmppClient.on("online", (data) => {
        console.log("Connected as", data.jid?.toString()); // Somehow undefined
        this.connected = true;
        this.currentUser = jid;

        console.log("currentUser: ", this.currentUser);

        // Handle async operations
        void (async () => {
          // Send initial presence
          await this.xmppClient?.send(xml("presence"));

          // Request roster (contact list)
          await this.xmppClient?.send(
            xml(
              "iq",
              { type: "get", id: "roster_1" },
              xml("query", { xmlns: "jabber:iq:roster" }),
            ),
          );
          
          // No need for key pair generation anymore
          this.emit("connected", { jid });
        })();
      });

      this.xmppClient.on("error", (err: Error) => {
        console.error("XMPP error:", err);
        this.emit("error", err);
      });

      this.xmppClient.on("stanza", (stanza: XmlElement) => {
        this.handleStanza(stanza);
      });

      this.xmppClient.on("offline", () => {
        console.log("XMPP client disconnected");
        this.connected = false;
        this.currentUser = null;
        this.emit("disconnected");
      });

      // Start the connection
      await this.xmppClient.start();
      return true;
    } catch (error) {
      console.error("Error connecting to XMPP server:", error);
      return false;
    }
  }

  /**
   * Disconnect from the XMPP server
   */
  public async disconnect(): Promise<void> {
    if (this.xmppClient && this.connected) {
      // Send unavailable presence
      await this.xmppClient.send(xml("presence", { type: "unavailable" }));

      // Stop the client
      await this.xmppClient.stop();
      this.connected = false;
      this.currentUser = null;
    }
  }

  /**
   * Check if connected to the XMPP server
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the list of contacts
   */
  public getContacts(): XMPPContact[] {
    return this.contacts;
  }

  /**
   * Get messages for a specific contact
   */
  public getMessages(contactId: string): XMPPMessage[] {
    return this.messages[contactId] ?? [];
  }

  /**
   * Send a message to a contact
   */
  public async sendMessage(
    to: string,
    body: string,
  ): Promise<XMPPMessage> {
    if (!this.connected || !this.currentUser) {
      throw new Error("Cannot send message: not connected");
    }

    //const contactId = "alice"; 
    const contactId = this.contacts.find((c) => c.jid === to)?.id;
    if (!contactId) {
      throw new Error("Cannot send message: contact not found");
    }

    const processedBody = body;

    const messageId = Math.random().toString(36).substring(2, 15);

    // Send message via XMPP
    const messageElement = xml(
      "message",
      { type: "chat", to, id: messageId },
      xml("body", {}, processedBody),
    );

    if (this.xmppClient) {
      await this.xmppClient.send(messageElement);
    }

    // Create message object for local storage
    const messageObj: XMPPMessage = {
      id: messageId,
      from: this.currentUser,
      to,
      body: processedBody,
      timestamp: new Date(),
    };

    // Add to messages
    if (!this.messages[contactId]) {
      this.messages[contactId] = [];
    }

    // Now we know this.messages[contact.id] exists
    this.messages[contactId]?.push(messageObj);

    // Update contact's last message time
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact) {
      contact.lastMessageTime = new Date().toISOString();
    }

    // Emit message event
    this.emit("message", messageObj);

    return messageObj;
  }

  /**
   * Mark messages from a contact as read
   */
  public markAsRead(contactId: string): void {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact) {
      contact.unreadCount = 0;
      this.emit("unreadCountChanged", { contactId, unreadCount: 0 });

      if (this.xmppClient && this.connected) {
        // In a real implementation, send read receipts via XEP-0184
        // This is a simplified version
        const messages = this.messages[contactId] ?? [];
        const unreadMessages = messages.filter(
          (m) => m.from !== this.currentUser,
        );

        if (unreadMessages.length > 0) {
          const lastMessage = unreadMessages[unreadMessages.length - 1];
          if (lastMessage) {
            // Send read receipt
            void this.xmppClient.send(
              xml(
                "message",
                { to: contact.jid },
                xml("received", {
                  xmlns: "urn:xmpp:receipts",
                  id: lastMessage.id,
                }),
              ),
            );
          }
        }
      }
    }
  }

  /**
   * Update presence status
   */
  public updatePresence(status: "online" | "offline" | "away"): void {
    if (!this.connected || !this.currentUser) return;

    if (this.xmppClient) {
      // Map status to XMPP presence
      let showValue: string | undefined;
      let typeValue: string | undefined;

      if (status === "away") {
        showValue = "away";
      } else if (status === "offline") {
        typeValue = "unavailable";
      }

      // Create presence stanza
      const presenceElement = xml("presence");

      if (showValue) {
        presenceElement.append(xml("show", {}, showValue));
      }

      if (typeValue) {
        presenceElement.attrs.type = typeValue;
      }

      // Send presence
      void this.xmppClient.send(presenceElement);
    }
  }

  /**
   * Handle incoming XMPP stanza
   */
  private handleStanza(stanza: XmlElement): void {
    if (!this.currentUser) return;

    // Handle message stanza
    if (stanza.is("message") && stanza.attrs.type === "chat") {
      const from = stanza.attrs.from;
      const body = stanza.getChildText("body");

      if (from && body) {
        // Remove encryption check
        // const isEncrypted =
        //   stanza.getChild("encrypted", "urn:xmpp:e2e:0") !== undefined;

        // Extract bare JID and local part
        const bareJid = from.split("/")[0];
        if (!bareJid) return;

        const localPart = bareJid.split("@")[0] ?? bareJid;

        // Find or create contact
        let contact = this.contacts.find((c) => c.jid === bareJid);
        if (!contact) {
          // Create new contact
          const contactId = Math.random().toString(36).substring(2, 15);

          contact = {
            id: contactId,
            jid: bareJid,
            name: localPart,
            status: "online",
            unreadCount: 0,
            lastMessageTime: new Date().toISOString(),
          };

          this.contacts.push(contact);
        }

        // Create message
        const message: XMPPMessage = {
          id: stanza.attrs.id ?? Math.random().toString(36).substring(2, 15),
          from: bareJid,
          to: this.currentUser,
          body,
          timestamp: new Date(),
        };

        // Add to messages
        if (!this.messages[contact.id]) {
          this.messages[contact.id] = [];
        }

        // Now we know this.messages[contact.id] exists
        this.messages[contact.id]?.push(message);

        // Update contact
        contact.lastMessageTime = new Date().toISOString();
        contact.unreadCount += 1;

        // Emit message event
        this.emit("message", message);
      }
    }

    // Handle presence stanza
    else if (stanza.is("presence")) {
      const from = stanza.attrs.from;
      if (from && from !== this.currentUser) {
        const bareJid = from.split("/")[0];
        if (!bareJid) return;

        // Determine status
        let status: "online" | "offline" | "away" = "online";

        if (stanza.attrs.type === "unavailable") {
          status = "offline";
        } else {
          const show = stanza.getChildText("show");
          if (show === "away" || show === "xa") {
            status = "away";
          }
        }

        // Find contact
        const contact = this.contacts.find((c) => c.jid === bareJid);
        if (contact) {
          contact.status = status;
        }

        // Emit presence event
        const presence: XMPPPresence = {
          jid: bareJid,
          status,
          timestamp: new Date(),
        };

        this.emit("presence", presence);
      }
    }

    // Handle roster (contact list) response
    else if (stanza.is("iq") && stanza.attrs.type === "result") {
      const query = stanza.getChild("query", "jabber:iq:roster");
      if (query) {
        const items = query.getChildren("item");

        if (items && items.length > 0) {
          for (const item of items) {
            const itemJid = item.attrs.jid;
            if (!itemJid) continue;

            const name = item.attrs.name ?? itemJid.split("@")[0] ?? itemJid;

            // Check if contact already exists
            const existingContact = this.contacts.find(
              (c) => c.jid === itemJid,
            );
            if (!existingContact) {
              // Create new contact
              const contactId = Math.random().toString(36).substring(2, 15);

              const contact: XMPPContact = {
                id: contactId,
                jid: itemJid,
                name,
                status: "offline", // Default to offline until we receive presence
                unreadCount: 0,
                lastMessageTime: new Date().toISOString(),
              };

              this.contacts.push(contact);
            }
          }

          // Emit contacts updated event
          this.emit("contactsUpdated", this.contacts);
        }
      }
    }
  }

  /**
   * Simulate an incoming message (for testing purposes)
   * This method creates a message as if it was received from another user
   */
  async simulateIncomingMessage(
    from: string,
    body: string,
  ): Promise<XMPPMessage> {
    // Generate a random message ID
    const messageId = Math.random().toString(36).substring(2, 15);

    // Create the message object
    const messageObj: XMPPMessage = {
      id: messageId,
      from,
      to: this.currentUser ?? "",
      body,
      timestamp: new Date(),
    };

    // Find the contact
    const contact = this.contacts.find((c) => c.jid === from);
    if (!contact) {
      throw new Error(`Cannot simulate message: contact ${from} not found`);
    }

    // Add to messages
    if (!this.messages[contact.id]) {
      this.messages[contact.id] = [];
    }

    // Add the message to the contact's message list
    this.messages[contact.id]?.push(messageObj);

    // Increment unread count
    contact.unreadCount += 1;

    // Update last message time
    contact.lastMessageTime = new Date().toISOString();

    // Emit events
    this.emit("message", messageObj);
    this.emit("unreadCountChanged", contact.id);

    return messageObj;
  }

  /**
   * Add a contact to the roster
   */
  public async addToRoster(jid: string, name?: string): Promise<boolean> {
    if (!this.connected || !this.xmppClient) {
      throw new Error('Cannot add contact: not connected');
    }

    try {
      // Send roster set IQ stanza
      const rosterSetId = `roster_set_${Math.random().toString(36).substring(2, 15)}`;
      
      await this.xmppClient.send(
        xml(
          'iq',
          { type: 'set', id: rosterSetId },
          xml(
            'query',
            { xmlns: 'jabber:iq:roster' },
            xml(
              'item',
              { jid, name: name ?? jid.split('@')[0] ?? jid }
            )
          )
        )
      );

      // Send subscription request
      await this.xmppClient.send(
        xml(
          'presence',
          { to: jid, type: 'subscribe' }
        )
      );

      // Create a local contact if it doesn't exist yet
      const existingContact = this.contacts.find(c => c.jid === jid);
      if (!existingContact) {
        const contactId = Math.random().toString(36).substring(2, 15);
        const displayName = name ?? jid.split('@')[0] ?? jid;
        
        const contact: XMPPContact = {
          id: contactId,
          jid,
          name: displayName,
          status: 'offline', // Default to offline until we receive presence
          unreadCount: 0,
          lastMessageTime: new Date().toISOString()
        };
        
        this.contacts.push(contact);
        this.emit('contactsUpdated', this.contacts);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding contact to roster:', error);
      return false;
    }
  }
}

// Export singleton instance
export const xmppClient = new XMPPClient();
