import type Gameserver from "./gameserver";
import type Tag from "./tag";

export default interface Product {
  id: string;
  store_id: string;
  version_id: string;
  image_url: string | null;
  slug: string;
  name: string;
  description: string;
  enabled_at: string | null;
  enabled_until: string | null;
  label: string | null;
  sort_order: number;
  price: number;
  currency: string;
  single_game_server_only: boolean;
  allow_one_time_purchase: boolean;
  allow_subscription: boolean;
  subscription_interval_value: number;
  subscription_interval_scale: string;
  remove_after_enabled: boolean;
  remove_after_time_value: number;
  remove_after_time_scale: string;
  pricing: {
    active_sale: {
      id: string;
      name: string;
      discount_type: string;
      discount_amount: number;
      minimum_order_value: number;
      begins_at: string;
      finishes_at: string | null;
    } | null;
    sale_value: number;
    vat_rate: {
      country_code: string;
      country_name: string;
      currency: string;
      vat_abbreviation: string;
      vat_local_name: string;
      eu_member_state: boolean;
      eservice_rate: number;
      percentage: number;
    };
    regional_pricing: {
      region_id: string;
      currency: string;
      tax_inclusive: boolean;
      base_price: number;
    } | null;
    price_original: number;
    price_final: number;
  };
  stock: {
    available_to_purchase: boolean;
    customer_available: number;
  };
  tags: Tag[];
  gameservers: Gameserver[];
  created_at: string;
  updated_at: string;
}
