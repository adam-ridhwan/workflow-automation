/** The natural direction for each sort; `order` is only in the URL when it
 * deviates from this. */
export function defaultOrder(sort: string) {
  return sort === 'name' ? 'asc' : 'desc';
}
