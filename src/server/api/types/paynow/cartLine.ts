export default interface CartLine {
  line_key: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image_url: string;
  selected_gameserver_id: string | null;
  selected_gameserver: {
    id: string;
    name: string;
    enabled: boolean;
  } | null;
  subscription: boolean;
}
