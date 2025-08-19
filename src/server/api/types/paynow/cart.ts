import type CartLine from "./cartLine";

export default interface Cart {
  store_id: string;
  customer_id: string;
  lines: CartLine[];
  total: number;
  currency: string;
}
