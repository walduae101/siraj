import type Profile from "./profile";
import type Steam from "./steam";

export default interface Customer {
  id: string;
  store_id: string;
  profile: Profile;
  steam_id: string;
  steam: Steam;
  minecraft_uuid: string | null;
  minecraft: unknown;
  name: string | undefined;
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string | null;
}
