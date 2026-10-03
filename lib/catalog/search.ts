export interface SearchableComponent {
  id: string;
  name: string;
  description?: string | null;
  tags?: string | null;
}

export function searchComponents(components: SearchableComponent[], query: string): SearchableComponent[] {
  if (!query || query.trim() === "") return components;
  
  const q = query.toLowerCase().trim();
  
  return components.filter(c => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.description && c.description.toLowerCase().includes(q)) return true;
    if (c.tags && c.tags.toLowerCase().includes(q)) return true;
    return false;
  });
}
