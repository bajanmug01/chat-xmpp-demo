// https://github.com/xmppjs/xmpp.js/tree/main/packages/client

import { EventEmitter } from "events";
import { client, xml, type XmppClient, type XmlElement } from "@xmpp/client";
import { env } from "LA/env";
import { Contact } from "lucide-react";

// Types for XMPP messages and contacts
export type XMPPMessage = {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  //status: "read" | "unread";
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
      const username = jid.includes("@") ? jid.split("@")[0] : jid;
      const fullJid = `${username}@${env.NEXT_PUBLIC_XMPP_DOMAIN}`; // since users can have other emails addresses than local domain (not a good implementation but ok for demo)
      // Create XMPP client with environment variables
      console.log("username: ", username);
      console.log("password: ", password);

      this.xmppClient = client({
        service: env.NEXT_PUBLIC_XMPP_SERVICE,
        domain: env.NEXT_PUBLIC_XMPP_DOMAIN,
        username: username,
        password: password,
      });

      // Create a promise that resolves when we receive the roster
      const rosterPromise = new Promise<void>((resolve) => {
        const rosterHandler = (stanza: XmlElement) => {
          if (stanza.is("iq") && stanza.attrs.type === "result") {
            const query = stanza.getChild("query", "jabber:iq:roster");
            if (query) {
              this.xmppClient?.off("stanza", rosterHandler);
              resolve();
            }
          }
        };
        this.xmppClient?.on("stanza", rosterHandler);
      });

      // Set up event handlers
      this.xmppClient.on("online", (data) => {
        console.log("data: ", data);
        console.log("Connected as", username);
        this.connected = true;
        this.currentUser = fullJid;
        console.log("currentUser: ", this.currentUser);
      });

      this.xmppClient.on("error", (err: Error) => {
        console.error("XMPP error:", err);
        this.connected = false;
        this.currentUser = null;
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

      // Start the connection with a timeout
      const connectionPromise = this.xmppClient.start();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection timeout after 15 seconds")),
          10000,
        );
      });

      // Wait for connection
      await Promise.race([connectionPromise, timeoutPromise]);

      await this.xmppClient.send(xml("presence"));

      await this.xmppClient.send(
        xml(
          "iq",
          { type: "get", id: "roster_1" },
          xml("query", { xmlns: "jabber:iq:roster" }),
        ),
      );

      // Wait for roster to be received
      await rosterPromise;

      await this.fetchArchivedMessages();

      // Emit connected event after roster is loaded
      this.emit("connected", { jid });

      return this.connected;
    } catch (error) {
      console.error("Error connecting to XMPP server:", error);

      // Make sure we emit the error
      if (error instanceof Error) {
        this.emit("error", error);
      } else {
        this.emit(
          "error",
          new Error("Unknown error connecting to XMPP server"),
        );
      }

      this.connected = false;
      this.currentUser = null;
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

      // Clear all state
      this.connected = false;
      this.currentUser = null;
      this.contacts = []; // Clear contacts
      this.messages = {}; // Clear messages

      // Emit events to update UI
      this.emit("contactsUpdated", []);
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
  public async sendMessage(to: string, body: string): Promise<XMPPMessage> {
    if (!this.connected || !this.currentUser) {
      throw new Error("Cannot send message: not connected");
    }

    // Ensure 'to' has the domain if needed
    const fullTo = to.includes("@")
      ? to
      : `${to}@${env.NEXT_PUBLIC_XMPP_DOMAIN}`;

    const contactId = this.contacts.find((c) => c.jid === fullTo)?.id;
    if (!contactId) {
      throw new Error("Cannot send message: contact not found");
    }

    const processedBody = body;

    const messageId = Math.random().toString(36).substring(2, 15);

    console.log("send message to: ", fullTo);

    // Send message via XMPP
    const messageElement = xml(
      "message",
      { type: "chat", to: fullTo, id: messageId },
      xml("body", {}, processedBody),
    );

    if (this.xmppClient) {
      await this.xmppClient.send(messageElement);
    }

    console.log("currentuserxx: ", this.currentUser);

    // Create message object for local storage
    const messageObj: XMPPMessage = {
      id: messageId,
      from: this.currentUser,
      to: fullTo,
      body: processedBody,
      timestamp: new Date().toLocaleDateString(),
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
      contact.lastMessageTime = new Date().toLocaleString();
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
   * Add a contact to the roster
   */
  public async addToRoster(
    jid: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.connected || !this.xmppClient) {
      throw new Error("Cannot add contact: not connected");
    }

    // Normalize the JID format
    const username = jid.includes("@") ? jid.split("@")[0] : jid;
    const fullJid = jid.includes("@")
      ? jid
      : `${username}@${env.NEXT_PUBLIC_XMPP_DOMAIN}`;

    console.log("add username: ", username);

    try {
      // TODO: Check if user exists
      /*
        // Send a message and wait a few seconds for error
  await xmppClient.send(xml("message", { to: domainJid, type: "chat" }, xml("body", {}, "ping")));
  
  // Wait and listen for error stanza
  client.on("stanza", stanza => {
    if (stanza.is("message") && stanza.attrs.type === "error") {
      console.log("Probably doesn't exist!");
    }
  });
        */

      // Send roster set IQ stanza
      const rosterSetId = `roster_set_${Math.random().toString(36).substring(2, 15)}`;

      await this.xmppClient.send(
        xml(
          "iq",
          { type: "set", id: rosterSetId },
          xml(
            "query",
            { xmlns: "jabber:iq:roster" },
            xml("item", { jid: fullJid, name: username! }),
          ),
        ),
      );

      // Send subscription request
      await this.xmppClient.send(
        xml("presence", { to: fullJid, type: "subscribe" }),
      );

      // Create a local contact if it doesn't exist yet
      const existingContact = this.contacts.find((c) => c.jid === fullJid);
      if (!existingContact) {
        const contactId = Math.random().toString(36).substring(2, 15);
        const displayName = username!;

        const contact: XMPPContact = {
          id: contactId,
          jid: fullJid,
          name: displayName,
          status: "offline", // Default to offline until we receive presence
          unreadCount: 0,
          lastMessageTime: new Date().toISOString(),
        };

        this.contacts.push(contact);
        this.emit("contactsUpdated", this.contacts);
      }
      console.log("added contact to roster: ", Contact.name);

      return { success: true };
    } catch (error) {
      console.error(
        "Error adding contact to roster:",
        error instanceof Error ? error.message : error,
      );
      return { success: false, error: "Error adding contact" };
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
        const bareJid = from.split("/")[0]; // This keeps the domain part
        if (!bareJid) return;

        // Find or create contact
        let contact = this.contacts.find((c) => c.jid === bareJid);
        if (!contact) {
          // Create new contact
          const contactId = Math.random().toString(36).substring(2, 15);
          const localPart = bareJid.split("@")[0] ?? bareJid;

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
          timestamp: new Date().toLocaleDateString(),
        };

        console.log("Send message contactId: ", contact.id);

        // Add to messages
        if (!this.messages[contact.id]) {
          this.messages[contact.id] = [];
        }

        // Now we know this.messages[contact.id] exists
        this.messages[contact.id]?.push(message);

        console.log("message stanza: ", message);
        console.log("messages afer recieve stanza: ", this.messages);

        // Update contact
        contact.lastMessageTime = new Date().toISOString();
        contact.unreadCount += 1;

        // Emit message event
        this.emit("message", message);
      }
      // Handle archived message stanza
    } else if (
      stanza.is("message") &&
      stanza.getChild("result", "urn:xmpp:mam:2") !== undefined
    ) {
      const result = stanza.getChild("result", "urn:xmpp:mam:2");
      const forwarded = result?.getChild("forwarded", "urn:xmpp:forward:0");
      const message = forwarded?.getChild("message");
      const delay = forwarded?.getChild("delay", "urn:xmpp:delay");

      const from = message?.attrs.from;
      const to = message?.attrs.to;
      const body = message?.getChildText("body");
      const timestamp = delay?.attrs.stamp ?? new Date().toISOString();

      if (!from || !to || !body) return;

      // Keep the full JID including domain
      const fromBareJid = from.split("/")[0];
      const toBareJid = to.split("/")[0];
      if (!fromBareJid || !toBareJid) return;

      const currentUserBareJid = this.currentUser;

      const isFromMe = fromBareJid === currentUserBareJid;

      const peerBareJid = isFromMe ? toBareJid : fromBareJid;

      let contact = this.contacts.find((c) => c.jid === peerBareJid);
      if (!contact) {
        const localPart = peerBareJid.split("@")[0] ?? peerBareJid;
        const contactId = Math.random().toString(36).substring(2, 15);

        contact = {
          id: contactId,
          jid: peerBareJid,
          name: localPart,
          status: "online",
          unreadCount: 0,
          lastMessageTime: timestamp,
        };
        this.contacts.push(contact);
      }

      console.log("fromBareJid", fromBareJid);
      console.log("toBareJid", toBareJid);

      // Build the message
      const messageObj: XMPPMessage = {
        id: message?.attrs.id ?? Math.random().toString(36).substring(2, 15),
        from: fromBareJid,
        to: toBareJid,
        body,
        timestamp,
      };

      // Store it in messages under contact.id
      if (!this.messages[contact.id]) {
        this.messages[contact.id] = [];
      }
      this.messages[contact.id]?.push(messageObj);

      console.log("archived message contactId: ", contact.id);
      console.log("archivedMessages: ", this.messages);

      // Emit (if you want)
      this.emit("archivedMessage", messageObj);
    }
    // Trigger hook to stop collecting archived Messages
    /*else if (
      stanza.is("iq") &&
      stanza.getChild("fin", "urn:xmpp:mam:2") !== undefined
    ) {
      console.log("✅ MAM finished loading archived messages");
      this.emit("mamFinished");
    }*/

    // Handle presence stanza
    else if (stanza.is("presence")) {
      const from = stanza.attrs.from;
      if (from && from !== this.currentUser) {
        const bareJid = from.split("/")[0]; // Keep domain part
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

        console.log("rosteritems: ", items);

        if (items && items.length > 0) {
          for (const item of items) {
            const itemJid = item.attrs.jid;
            if (!itemJid) continue;

            const name = item.attrs.name ?? itemJid.split("@")[0] ?? itemJid;

            // Check if contact already exists
            const existingContact = this.contacts.find(
              (c) => c.jid === itemJid, // itemJid already has the domain
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

          console.log("Stanza Contacts: ", this.contacts);

          // Emit contacts updated event
          this.emit("contactsUpdated", this.contacts);
        }
      }
    }
  }

  private async fetchArchivedMessages(): Promise<void> {
    if (!this.xmppClient) return;

    const mamQuery = xml(
      "iq",
      { type: "set", id: "mam1" },
      xml(
        "query",
        { xmlns: "urn:xmpp:mam:2" },
        xml(
          "x",
          { xmlns: "jabber:x:data", type: "submit" },
          xml(
            "field",
            { var: "FORM_TYPE", type: "hidden" },
            xml("value", {}, "urn:xmpp:mam:2"),
          ),
        ),
      ),
    );

    try {
      await this.xmppClient.send(mamQuery);
      console.log("MAM query sent");
    } catch (err) {
      console.error("Error sending MAM query:", err);
    }
  }
}

// Export singleton instance
export const xmppClient = new XMPPClient();
