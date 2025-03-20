# Prosody XMPP Server Setup

This guide explains how to set up a Prosody XMPP server using Docker for local development.

## Prerequisites

- Docker and Docker Compose installed
- OpenSSL for certificate generation

## Setup Steps

### 1. Generate SSL Certificates

On Linux/Mac:
```bash
chmod +x generate-certs.sh
./generate-certs.sh
```

On Windows (PowerShell):
```powershell
.\generate-certs.ps1
```

### 2. Start the Prosody Server

```bash
docker-compose up -d
```

### 3. Create a User

```bash
docker exec -it prosody-xmpp prosodyctl register username localhost password
```

Replace `username` and `password` with your desired credentials.

### 4. Update Your Environment Variables

Create or update your `.env.local` file with:

```
NEXT_PUBLIC_XMPP_SERVICE="ws://localhost:5280/xmpp-websocket"
NEXT_PUBLIC_XMPP_DOMAIN="localhost"
NEXT_PUBLIC_XMPP_USE_MOCK="false"
```

### 5. Connect from Your App

Use these credentials in your login form:
- JID: `username@localhost`
- Password: `password`

## Useful Commands

- View logs: `docker-compose logs -f prosody`
- Access admin console: `docker exec -it prosody-xmpp prosodyctl shell`
- Stop the server: `docker-compose down`
- Restart the server: `docker-compose restart prosody`

## Troubleshooting

- If you can't connect, check that the server is running: `docker ps`
- Verify the certificates were generated correctly in `prosody-config/certs/`
- Check the logs for errors: `docker-compose logs prosody` 