/**
 * Bounds and limits for the products module.
 *
 * Every number here is mirrored from the backend's own constants — `ecom-be`
 * `app/constants/catalog/product.py` and `app/constants/identity/*` — and names the
 * constant it comes from, exactly as `lib/auth/constants.ts` does. The browser and the
 * validator must never disagree: the backend re-validates everything, and a local check
 * that is *stricter* than the server rejects work that would have been accepted.
 */

export const PRODUCT_NAME_MIN = 2;
export const PRODUCT_NAME_MAX = 200;
export const PRODUCT_DESCRIPTION_MAX = 5000;

/** `VALUE_TEXT_MAX`. */
export const VALUE_TEXT_MAX = 500;

/** `VALUE_NUMBER_ABS_MAX`: `Numeric(18, 4)` leaves 14 integer digits. */
export const VALUE_NUMBER_ABS_MAX = 10 ** 14 - 1;

export const SKU_CODE_MIN = 1;
export const SKU_CODE_MAX = 64;

/** `PRICE_MAX`. Money is a whole number of the smallest VND unit, never a float. */
export const PRICE_MAX = 10 ** 12;

export const STOCK_MAX = 10 ** 9;

/** `ATTRIBUTE_VALUES_MAX`: a ceiling on the values one request may carry. */
export const ATTRIBUTE_VALUES_MAX = 100;

/** `VARIANT_OPTIONS_MAX`, and the cap on a variant's variation axes. */
export const VARIANT_OPTIONS_MAX = 5;

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

/** `PRODUCT_IMAGES_MAX` / `VARIANT_IMAGES_MAX`. */
export const PRODUCT_IMAGES_MAX = 9;
export const VARIANT_IMAGES_MAX = 5;

/**
 * The upload ceiling the backend enforces (`Settings.max_upload_bytes` default), the
 * same value the avatar and shop-background fields mirror.
 */
export const IMAGE_MAX_BYTES = 2_097_152;
export const IMAGE_MAX_LABEL = "2 MB";

/** `ACCEPTED_FORMATS` on the backend: everything is stored as WebP afterwards. */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** The product photo fit box; the backend downscales to fit, never crops or enlarges. */
export const IMAGE_FIT_LABEL = "1600 × 1600";

/** Mirrors `ProductStatus`. Only `publish`/`unpublish` move a product between them. */
export const PRODUCT_STATUSES = ["draft", "active", "inactive"] as const;

/** Mirrors `VariantStatus`. */
export const VARIANT_STATUSES = ["active", "inactive"] as const;
