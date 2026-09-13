/**
 * Query keys for the shop module.
 *
 * The active shop is read from the session payload rather than a shop-specific
 * GET, so this module holds no server-state key of its own. It is kept as the
 * conventional home for one if the backend publishes a shop list later.
 */
export const shopKeys = {
  all: ["shop"] as const,
} as const;
