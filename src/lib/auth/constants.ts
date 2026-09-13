/**
 * Field bounds shared by the validation schemas and the form inputs.
 *
 * One definition, two consumers: the zod schema produces the human message and the
 * `minLength`/`maxLength` attributes let the browser refuse an over-long value
 * before a request is made. If these numbers lived in both places they would drift,
 * and the input would accept what the schema rejects.
 *
 * Every value mirrors a bound the backend declares and enforces. The backend remains
 * the authority; these only save the seller a round trip.
 */

// Mirrors UserData and RegisterRequest.
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const FULL_NAME_MIN = 1;
export const FULL_NAME_MAX = 120;
export const BIO_MAX = 500;
export const PHONE_MAX = 32;
export const JOB_TITLE_MAX = 80;

// Mirrors ShopData and ShopUpdateRequest.
export const SHOP_NAME_MIN = 2;
export const SHOP_NAME_MAX = 80;
export const SHOP_DESCRIPTION_MAX = 300;
export const SHOP_WEBSITE_MAX = 255;
