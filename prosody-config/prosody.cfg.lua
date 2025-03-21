-- Basic server setup

--make sure tje jid is the same as the one in the 'create-user.ps1' script
admins = { "alice@localhost" }

use_libevent = true
modules_enabled = {
    -- Required modules
    "roster"; "saslauth"; "tls"; "dialback";
    "disco"; "posix"; "private"; "vcard";
    
    -- Nice to have
    "version"; "uptime"; "time"; "ping";
    "register"; "admin_adhoc";
    
    -- Modern XMPP chat features
    "pubsub"; -- Enable XMPP PubSub for chat features
    "carbons"; -- Message synchronization across devices
    "mam"; -- Message Archive Management
    "csi"; -- Client State Indication for mobile
    "blocklist"; -- Contact blocking
    "pep"; -- Personal Eventing Protocol

    "admin_adhoc"; -- Enables running admin tasks over XMPP Ad-Hoc commands
    
    -- Web interfaces
    "bosh"; "websocket";
}

-- Enable WebSocket
consider_websocket_secure = true
cross_domain_websocket = true

-- Allow registration
allow_registration = true

-- Enable HTTPS globally
https_ports = { 5281 }

https_ssl = {
    key = "/etc/prosody/certs/localhost.key";
    certificate = "/etc/prosody/certs/localhost.crt";
}

-- Set up your domain
VirtualHost "localhost"
    authentication = "internal_plain"
    --authentication = "anonymous"
    modules_enabled = { "register_ibr" }
    ssl = {
        key = "/etc/prosody/certs/localhost.key";
        certificate = "/etc/prosody/certs/localhost.crt";
    }

-- Create an admin user
Component "admin.localhost" "admin_telnet"

--[[
Module descriptions:
- pubsub - Publish-Subscribe functionality, allowing for features like typing indicators and presence updates
- smacks - Stream Management, which helps maintain connections during network changes or brief disconnections
- carbons - Message Carbons, which ensures messages are synchronized across multiple devices
- mam - Message Archive Management, which stores message history and allows retrieval of past messages
- csi - Client State Indication, which optimizes battery usage on mobile devices
- blocklist - Allows users to block unwanted contacts
- pep - Personal Eventing Protocol, which enables user avatars, status updates, and other personal events
]]