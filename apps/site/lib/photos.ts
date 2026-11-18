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
  src: `/images/marble-${id}.webp`,
  alt,
  caption,
  width: 2400,
  height: 1800,
}));

const prints = [
  ["lake", 2400, 1350, "Coral sky", "Coral, sand and blue"],
  ["night", 1200, 1800, "Blue hour", "Blue, lilac and gold"],
  ["mountains", 2250, 1500, "Mint and ember", "Mint, blue and orange"],
  ["coast", 1800, 1800, "Lilac bloom", "Lilac, rose and sea green"],
  ["woods", 3150, 1350, "Amber", "A wide crop in orange, yellow and blue"],
  ["forest", 1350, 1800, "Sand and fern", "Sand, green and violet"],
  ["dune", 2400, 1800, "Sea glass", "Sea green, blue and pink"],
  ["meadow", 2250, 1500, "Dusk", "Periwinkle, peach and green"],
  ["mountains", 1350, 1800, "Ember study", "A narrow crop of Mint and ember"],
  ["coast", 2400, 1350, "Lilac shore", "Lilac, rose and sea green"],
  ["night", 2400, 1800, "Gold edge", "Blue, lilac and gold"],
  ["woods", 1800, 1800, "Amber square", "Orange, yellow and blue"],
] as const;

/** Marble photos in mixed proportions, for layouts that keep each picture's ratio. */
export const galleryPhotos = prints.map(([id, width, height, title, note]) => {
  const size = `${width}x${height}`;
  const photo = photos.find((entry) => entry.id === id);
  if (!photo) throw new Error(`No marble photo "${id}".`);
  return {
    id: `${id}-${size}`,
    src: size === "2400x1800" ? photo.src : `/images/marble-${id}-${size}.webp`,
    alt: photo.alt,
    title,
    note,
    width,
    height,
  };
});
