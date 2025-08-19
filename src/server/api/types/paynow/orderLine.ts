import type Customer from "./customer";

export default interface OrderLine {
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  gift: boolean;
  gift_to_customer: Customer | null;
  price: string | null;
  total_amount: string | null;
  quantity: number;
}
