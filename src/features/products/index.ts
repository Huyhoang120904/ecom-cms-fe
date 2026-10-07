/**
 * Public exports of the products module.
 *
 * Routes import from this file, never from a deep path. Query factories are exported
 * alongside the hooks so a caller can prefetch with the same key it will later read.
 */

export { default as ProductsPage } from "./components/products-page";
export { default as ProductDetailPage } from "./components/product-detail-page";
export { default as ProductFormPage } from "./components/product-form-page";

export {
  productDetailOptions,
  productListOptions,
  productVariantsOptions,
  productsKeys,
  useProductQuery,
  useProductsQuery,
  useProductVariantsQuery,
} from "./queries";
export {
  useCreateProductMutation,
  useCreateVariantMutation,
  useDeleteProductImageMutation,
  useDeleteProductMutation,
  useDeleteVariantMutation,
  useMoveProductImageMutation,
  usePublishProductMutation,
  useUnpublishProductMutation,
  useUpdateProductMutation,
  useUpdateVariantMutation,
  useUploadProductImageMutation,
} from "./mutations";
export {
  attributeFieldLabel,
  attributeValueErrors,
  attributeValueIsEmpty,
  parseProductFilters,
  productFilterSchema,
  variantRowSchema,
  type AttributeValueInput,
  type AttributeValuesById,
  type ProductFilters,
  type ProductFormValues,
  type VariantRowValues,
} from "./schemas";
export {
  attributesToPayload,
  emptyAttributeValue,
  emptyProductForm,
  formatDate,
  formatVnd,
  formToCreatePayload,
  formToUpdatePayload,
  listParamsFromFilters,
  numberInputValue,
  productImageSlots,
  productImages,
  productStatusLabel,
  productToAttributeValues,
  productToFormValues,
  rowMatchesVariant,
  rowToVariantPayload,
  sellableSummary,
  suggestSku,
  variantImageSlots,
  variantImages,
  variantMatrixRows,
  variantOptionLabel,
  variantStatusLabel,
  type VariantMatrixRow,
} from "./mapping";
export {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_FIT_LABEL,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_LABEL,
  PAGE_SIZE_MAX,
  PRICE_MAX,
  PRODUCT_IMAGES_MAX,
  PRODUCT_STATUSES,
  STOCK_MAX,
  VARIANT_IMAGES_MAX,
  VARIANT_OPTIONS_MAX,
  VARIANT_STATUSES,
} from "./constants";
export type {
  Product,
  ProductAttribute,
  ProductCreatePayload,
  ProductImage,
  ProductPage,
  ProductStatus,
  ProductSummary,
  ProductUpdatePayload,
  Variant,
  VariantCreatePayload,
  VariantOption,
  VariantStatus,
  VariantUpdatePayload,
} from "./types";
