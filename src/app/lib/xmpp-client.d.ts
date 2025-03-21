declare module '@xmpp/client' {
    export interface IqCaller {
      get(stanza: XmlElement): Promise<XmlElement>;
      set(stanza: XmlElement): Promise<XmlElement>;
    }

    export interface XmppClient {
      start(): Promise<void>;
      stop(): Promise<void>;
      send(stanza: XmlElement): Promise<void>;
      on(event: 'online', listener: (data: { jid: { toString(): string } }) => void): void;
      on(event: 'error', listener: (error: Error) => void): void;
      on(event: 'stanza', listener: (stanza: XmlElement) => void): void;
      on(event: 'offline', listener: () => void): void;
      on(event: string, listener: (...args: unknown[]) => void): void;

      off(event: 'stanza', listener: (stanza: XmlElement) => void): void;
      off(event: string, listener: (...args: unknown[]) => void): void;
      
      iqCaller: IqCaller;
    }
  
    export interface XmlElement {
      attrs: Record<string, string>;
      append(child: XmlElement): void;
      getChild(name: string, xmlns?: string): XmlElement | undefined;
      getChildText(name: string): string | undefined;
      getChildren(name: string): XmlElement[];
      is(name: string): boolean;
      toString(): string;
    }
  
    export interface JID {
      toString(): string;
      bare(): JID;
      domain: string;
      local: string;
      resource: string;
    }
  
    export interface ClientOptions {
      service: string;
      domain: string;
      username?: string;
      password?: string;
      resource?: string;
    }
  
    export function client(options: ClientOptions): XmppClient;
    export function xml(name: string, attrs?: Record<string, string>, ...children: (XmlElement | string)[]): XmlElement;
    export const jid: {
      parse(jid: string): JID;
      equal(a: JID, b: JID): boolean;
    };
  } 