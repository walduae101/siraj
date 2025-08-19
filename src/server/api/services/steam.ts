import { TRPCError } from "@trpc/server";
import axios from "axios";
import { env } from "~/env-combined";

export default class SteamService {
  public static async getLoginUrl() {
    const params = {
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/steam/return`,
      "openid.realm": env.NEXT_PUBLIC_WEBSITE_URL,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    };

    return `https://steamcommunity.com/openid/login?${new URLSearchParams(params).toString()}`;
  }

  public static async resolveSteamIdFromOpenIdQS(query: string) {
    const params = new URLSearchParams(query);

    if (params.get("openid.mode") !== "id_res") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invaild OpenID Mode",
      });
    }

    const requiredFields = [
      "openid.op_endpoint",
      "openid.claimed_id",
      "openid.identity",
      "openid.response_nonce",
      "openid.assoc_handle",
      "openid.signed",
      "openid.sig",
    ];

    for (const field of requiredFields) {
      if (!params.get(field)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some required Open ID Fields are missing",
        });
      }
    }

    if (
      params.get("openid.op_endpoint") !==
      "https://steamcommunity.com/openid/login"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invaild OP Endpoint",
      });
    }

    const claimedId = params.get("openid.claimed_id");

    if (!claimedId?.startsWith("https://steamcommunity.com/openid/id/")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invaild OpenID Claimed ID",
      });
    }

    const verifyParams = new URLSearchParams(params);

    verifyParams.set("openid.mode", "check_authentication");

    const response = await axios.get(
      "https://steamcommunity.com/openid/login",
      { params: verifyParams },
    );

    if (!response.data.includes("is_valid:true")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Could not validate Steam login",
      });
    }

    const steamId = params.get("openid.claimed_id")?.split("/").pop();

    if (!steamId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Could not confirm SteamID64",
      });
    }

    return steamId;
  }
}
