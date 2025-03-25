# XMPP Chat Application

This is a simple XMPP chat application built with the [T3 Stack](https://create.t3.gg/). It provides real-time messaging capabilities using XMPP protocol.

## Features

- Real-time messaging using XMPP
- Contact management (roster)
- Message history
- Presence status (online, offline, away)
- Modern UI with Tailwind CSS

## Tech Stack

This project uses the following technologies:

- [Next.js](https://nextjs.org) - React framework
- [XMPP.js](https://github.com/xmppjs/xmpp.js) - XMPP client library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [tRPC](https://trpc.io) - API layer
- [T3 Stack](https://create.t3.gg/) - Full-stack framework

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```env
   NEXT_PUBLIC_XMPP_SERVICE=
   NEXT_PUBLIC_XMPP_DOMAIN=
   ```
4. Run the development server:

   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:3000`

6. Make sure you have Docker and Docker Compose installed
7. Run the following command to start the xmppServer in a docker container:
   ```bash
   docker compose up
   ```

To stop the container:

```bash
docker compose down
```

## Learn More

To learn more about the technologies used in this project:

- [XMPP.js Documentation](https://github.com/xmppjs/xmpp.js)
- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deployment

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
