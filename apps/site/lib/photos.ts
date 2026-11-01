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
] as const;

export const photos = marble.map(([id, caption, alt]) => ({
  id,
  src: `/images/marble-${id}.svg`,
  alt,
  caption,
  width: 1600,
  height: 1200,
}));
