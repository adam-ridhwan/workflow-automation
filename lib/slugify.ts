export function slugify(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}
