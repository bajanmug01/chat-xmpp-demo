import { createCallerFactory, createTRPCRouter } from "LA/server/api/trpc";
import { xmppRouter } from "./routers/xmpp";
import { xmppContactsRouter } from "./routers/xmppContacts";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  xmpp: xmppRouter,
  xmppContacts: xmppContactsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
