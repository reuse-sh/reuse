const marble = [
  ["lake", "Coral sky", "A soft marble texture in coral, sand and blue"],
  [
    "mountains",
    "Mint and ember",
    "A soft marble texture in mint, blue and orange",
  ],
  [
    "coast",
    "Lilac bloom",
    "A soft marble texture in lilac, rose and sea green",
  ],
  [
    "forest",
    "Sand and fern",
    "A soft marble texture in sand, green and violet",
  ],
  ["night", "Blue hour", "A soft marble texture in blue, lilac and gold"],
  ["woods", "Amber", "A soft marble texture in orange, yellow and blue"],
  ["dune", "Sea glass", "A soft marble texture in sea green, blue and pink"],
  ["meadow", "Dusk", "A soft marble texture in periwinkle, peach and green"],
] as const;

export const photos = marble.map(([id, caption, alt]) => ({
  id,
  src: `/images/marble-${id}.svg`,
  alt,
  caption,
  width: 1600,
  height: 1200,
}));

const prints = [
  ["lake", 1600, 900, "Coral sky", "Coral, sand and blue"],
  ["night", 800, 1200, "Blue hour", "Blue, lilac and gold"],
  ["mountains", 1500, 1000, "Mint and ember", "Mint, blue and orange"],
  ["coast", 1200, 1200, "Lilac bloom", "Lilac, rose and sea green"],
  ["woods", 2100, 900, "Amber", "A wide crop in orange, yellow and blue"],
  ["forest", 900, 1200, "Sand and fern", "Sand, green and violet"],
  ["dune", 1600, 1200, "Sea glass", "Sea green, blue and pink"],
  ["meadow", 1500, 1000, "Dusk", "Periwinkle, peach and green"],
  ["mountains", 900, 1200, "Ember study", "A narrow crop of Mint and ember"],
  ["coast", 1600, 900, "Lilac shore", "Lilac, rose and sea green"],
  ["night", 1600, 1200, "Gold edge", "Blue, lilac and gold"],
  ["woods", 1200, 1200, "Amber square", "Orange, yellow and blue"],
] as const;

/** Marble photos in mixed proportions, for layouts that keep each picture's ratio. */
export const galleryPhotos = prints.map(([id, width, height, title, note]) => {
  const size = `${width}x${height}`;
  const photo = photos.find((entry) => entry.id === id);
  if (!photo) throw new Error(`No marble photo "${id}".`);
  return {
    id: `${id}-${size}`,
    src: size === "1600x1200" ? photo.src : `/images/marble-${id}-${size}.svg`,
    alt: photo.alt,
    title,
    note,
    width,
    height,
  };
});
