import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "LA/server/api/trpc";
import { createUser } from "LA/server/xmppHelper";

export const xmppRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      await createUser({
        newUser: input.username,
        newPass: input.password,
      });
      return { success: true };
    }),
});
