type Release = (item: HTMLElement) => void;

const owners = new WeakMap<HTMLElement, Release>();

/**
 * Take an item for a controller. An item moved here from another gallery is
 * first handed back by that gallery, so its values are not taken for the page's.
 */
export function claim(item: HTMLElement, release: Release) {
  const owner = owners.get(item);
  if (owner && owner !== release) owner(item);
  owners.set(item, release);
}

export function unclaim(item: HTMLElement, release: Release) {
  if (owners.get(item) === release) owners.delete(item);
}
