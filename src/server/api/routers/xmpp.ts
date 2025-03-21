import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc"; 
import { connectAsAdmin, createUser } from "LA/server/xmppAdmin";

export const xmppRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(
      z.object({
        jid: z.string(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {

      const adminClient = await connectAsAdmin();

      await createUser(adminClient, input.jid, input.password);

      await adminClient.stop();

      return { success: true };
    }),
});
