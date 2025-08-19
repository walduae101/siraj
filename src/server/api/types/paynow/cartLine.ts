export default interface CartLine {
  line_key: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image_url: string;
  subscription: boolean;
}
