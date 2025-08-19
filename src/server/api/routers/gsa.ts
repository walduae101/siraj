import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import GameServerAnalytics from "../services/gsa";

export const gsaRouter = createTRPCRouter({
  getPlayerCount: publicProcedure.query(() =>
    GameServerAnalytics.getPlayerCount(),
  ),
});
