export default interface Store {
  id: string;
  slug: string;
  name: string;
  platform: string;
  game: string;
  currency: string;
  description: string;
  website_url: string | null;
  support_email: string | null;
  integration_type: string;
  live_mode: boolean;
  logo_url: string | null;
  logo_square_url: string | null;
  created_at: string;
  updated_at: string;
}
