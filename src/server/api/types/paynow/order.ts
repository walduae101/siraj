import type Customer from "./customer";
import type OrderLine from "./orderLine";

export default interface Order {
  customer: Customer;
  currency: string;
  lines: OrderLine[];
  total_amount: number;
  total_amount_str: string;
  completed_at: string | null;
}
