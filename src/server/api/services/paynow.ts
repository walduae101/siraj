import { env } from "~/env-combined";

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

import { TRPCError } from "@trpc/server";

import { Cookie } from "tough-cookie";

import type Context from "../types/context";

import type Cart from "../types/paynow/cart";
import type Customer from "../types/paynow/customer";
import type GiftCard from "../types/paynow/giftCard";
import type Module from "../types/paynow/module";
import type Navlink from "../types/paynow/navlink";
import type Product from "../types/paynow/product";
import type Store from "../types/paynow/store";
import type Tag from "../types/paynow/tag";

export default class PayNowService {
  private static HTTP: AxiosInstance = axios.create({
    baseURL: "https://api.paynow.gg/v1",
    headers: {
      "x-paynow-store-id": env.NEXT_PUBLIC_PAYNOW_STORE_ID,
    },
  });

  private static async request<T>(config: AxiosRequestConfig) {
    const request = await PayNowService.HTTP.request(config);
    return request.data as T;
  }

  private static getSanitizedApiKey(): string {
    return (env.PAYNOW_API_KEY ?? "")
      .replace(/["']/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
  }

  private static paynowHeaders(): Record<string, string> {
    const key = PayNowService.getSanitizedApiKey();
    const auth = `APIKey ${key}`;
    if (/[\r\n]/.test(auth) || !key) throw new Error("Invalid PAYNOW_API_KEY");
    return {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  public static async getStore(ctx: Context) {
    return PayNowService.request<Store>({
      method: "GET",
      url: "/store",
      headers: ctx.payNowStorefrontHeaders,
    });
  }

  public static async getProducts(ctx: Context) {
    return PayNowService.request<Product[]>({
      method: "GET",
      url: "/store/products",
      headers: ctx.payNowStorefrontHeaders,
    });
  }

  public static async getNavlinks(ctx: Context) {
    return PayNowService.request<Navlink[]>({
      method: "GET",
      url: "/store/navlinks",
      headers: ctx.payNowStorefrontHeaders,
    });
  }

  public static async getTags(ctx: Context) {
    return PayNowService.request<Tag[]>({
      method: "GET",
      url: "/store/tags",
      headers: ctx.payNowStorefrontHeaders,
    });
  }

  public static async getModules(ctx: Context) {
    return PayNowService.request<Module[]>({
      method: "GET",
      url: `/webstores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/modules/prepared`,
      headers: ctx.payNowStorefrontHeaders,
    });
  }

  public static async getAuth(ctx: Context) {
    try {
      return await PayNowService.request<Customer>({
        method: "GET",
        url: "/store/customer",
        headers: ctx.payNowStorefrontHeaders,
      });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        return null;
      }
      throw err;
    }
  }

  public static async getCart(ctx: Context) {
    try {
      return await PayNowService.request<Cart>({
        method: "GET",
        url: "/store/cart",
        headers: ctx.payNowStorefrontHeaders,
      });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        return null;
      }
      throw err;
    }
  }

  public static async updateCartItem(
    ctx: Context,
    input: {
      product_id: string;
      quantity: number;
      gameserver_id?: string | null;
      increment?: boolean;
    },
  ) {
    return PayNowService.request<void>({
      method: "PUT",
      url: "/store/cart/lines",
      headers: ctx.payNowStorefrontHeaders,
      params: input,
    });
  }

  public static async checkout(
    ctx: Context,
    input: {
      subscription: boolean;
      lines: Array<{
        product_id: string;
        quantity: number;
        gift_to?: { platform: string; id: string } | null;
        gift_to_customer_id?: string | null;
        selected_gameserver_id?: string | null;
        subscription?: boolean;
      }>;
    },
  ) {
    try {
      return await PayNowService.request<{ url: string }>({
        method: "POST",
        url: "/checkouts",
        headers: ctx.payNowStorefrontHeaders,
        data: input,
      });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 400) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.response.data.message,
        });
      }
      throw err;
    }
  }

  public static async checkoutFromCart(
    ctx: Context,
    input: {
      subscription: boolean;
      lines: Array<{
        product_id: string;
        quantity: number;
        gift_to?: { platform: string; id: string } | null;
        gift_to_customer_id?: string | null;
        selected_gameserver_id?: string | null;
        subscription?: boolean;
      }>;
    },
  ) {
    try {
      return await PayNowService.request<{ url: string }>({
        method: "POST",
        url: "/store/cart/checkout",
        headers: ctx.payNowStorefrontHeaders,
        data: input,
      });
    } catch (err) {
      console.log(err);

      if (err instanceof AxiosError && err.response?.status === 400) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.response.data.message,
        });
      }

      throw err;
    }
  }

  public static async findOrCreateMinecraftCustomer(
    username: string,
    platform: "bedrock" | "java",
  ): Promise<string> {
    try {
      const customer = await PayNowService.request<Customer>({
        method: "GET",
        url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers/lookup`,
        headers: PayNowService.paynowHeaders(),
        params:
          platform === "bedrock"
            ? { minecraft_bedrock_name: username }
            : { minecraft_java_name: username },
      });

      return customer.id;
    } catch (err) {
      if (!(err instanceof AxiosError && err.response?.status === 404)) {
        throw err;
      }
    }

    try {
      const newCustomer = await PayNowService.request<Customer>({
        method: "POST",
        url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers`,
        headers: PayNowService.paynowHeaders(),
        data: {
          name: username,
          minecraft_platform: platform,
        },
      });

      return newCustomer.id;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        throw new TRPCError({
          message: `No account was found for given ${platform} account`,
          code: "NOT_FOUND",
        });
      }

      throw err;
    }
  }

  public static async findOrCreateSteamCustomer(steamId: string) {
    try {
      const customer = await PayNowService.request<Customer>({
        method: "GET",
        url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers/lookup`,
        headers: PayNowService.paynowHeaders(),
        params: {
          steam_id: steamId,
        },
      });

      return customer.id;
    } catch (err) {
      if (!(err instanceof AxiosError && err.response?.status === 404)) {
        throw err;
      }
    }

    const newCustomer = await PayNowService.request<Customer>({
      method: "POST",
      url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers`,
      headers: {
        ...PayNowService.paynowHeaders(),
      },
      data: {
        steam_id: steamId,
      },
    });

    return newCustomer.id;
  }

  public static async findOrCreateCustomerByEmail(email: string, name: string) {
    if (!email?.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Missing email" });
    }

    try {
      const existing = await PayNowService.request<Customer>({
        method: "GET",
        url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers/lookup`,
        headers: PayNowService.paynowHeaders(),
        params: { email },
      });

      return existing.id;
    } catch (err) {
      if (!(err instanceof AxiosError && err.response?.status === 404)) {
        throw err;
      }
    }

    const created = await PayNowService.request<Customer>({
      method: "POST",
      url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers`,
      headers: {
        ...PayNowService.paynowHeaders(),
      },
      data: { name, email },
    });

    return created.id;
  }

  public static async generateAuthToken(customerId: string): Promise<string> {
    if (!customerId) {
      throw new TRPCError({
        message: "Failed to create or find customer",
        code: "BAD_GATEWAY",
      });
    }

    const { token } = await PayNowService.request<{ token: string }>({
      method: "POST",
      url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/customers/${customerId}/tokens`,
      headers: {
        ...PayNowService.paynowHeaders(),
      },
    });

    // Sanitize token to remove any control characters or extra whitespace
    return token.trim().replace(/[\r\n\t]/g, "");
  }

  public static setAuthCookie(ctx: Context, token: string): void {
    const expiryDate = new Date();

    expiryDate.setDate(expiryDate.getDate() + 7);

    ctx.resHeaders.set(
      "Set-Cookie",
      new Cookie({
        key: "pn_token",
        value: token,
        expires: expiryDate,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }).toString(),
    );
  }

  public static logout(ctx: Context): void {
    ctx.resHeaders.set(
      "Set-Cookie",
      new Cookie({
        key: "pn_token",
        value: "",
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }).toString(),
    );
  }

  public static async getGiftcardBalanceByCode(code: string): Promise<number> {
    const giftCardsReq = await PayNowService.request<GiftCard[]>({
      method: "GET",
      url: `/stores/${env.NEXT_PUBLIC_PAYNOW_STORE_ID}/giftcards`,
      headers: {
        ...PayNowService.paynowHeaders(),
      },
      params: {
        code: code,
        limit: 1,
        include_canceled: false,
      },
    });

    const giftCard = giftCardsReq[0];

    if (!giftCard) {
      throw new TRPCError({
        message: "Gift card was not found",
        code: "NOT_FOUND",
      });
    }

    return giftCard.balance;
  }
}
