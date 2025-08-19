import { env } from "~/env-server";

import axios from "axios";

export default class GameServerAnalytics {
  public static async getPlayerCount() {
    const req = await axios.request<{ players: number }>({
      method: "GET",
      url: "https://gameserveranalytics.com/api/v2/query",
      params: {
        game: env.GAMESERVER_GAME,
        ip: env.GAMESERVER_IP,
        port: env.GAMESERVER_PORT,
      },
    });

    return req.data.players;
  }
}
