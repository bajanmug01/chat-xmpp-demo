import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    ADMIN_XMPP_JID: z.string(),
    ADMIN_XMPP_PASS: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    // NEXT_PUBLIC_XMPP_SERVICE: z.string().default("xmpp://localhost:5281"),
    //NEXT_PUBLIC_XMPP_SERVICE: z.string().default("wss://localhost:5281/xmpp-websocket"),
    NEXT_PUBLIC_XMPP_SERVICE: z.string().default("ws://localhost:5280/xmpp-websocket"),
    NEXT_PUBLIC_XMPP_DOMAIN: z.string().default("localhost"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
    ADMIN_XMPP_JID: process.env.ADMIN_XMPP_JID,
    ADMIN_XMPP_PASS: process.env.ADMIN_XMPP_PASS,

    NEXT_PUBLIC_XMPP_SERVICE: process.env.NEXT_PUBLIC_XMPP_SERVICE,
    NEXT_PUBLIC_XMPP_DOMAIN: process.env.NEXT_PUBLIC_XMPP_DOMAIN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
