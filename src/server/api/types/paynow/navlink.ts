export default interface Navlink {
  node_id: string;
  parent_node_id: string | null;
  tag_id: string;
  tag_slug: string;
  tag_query: string[];
  name: string;
  order: number;
  children: Navlink[];
}
