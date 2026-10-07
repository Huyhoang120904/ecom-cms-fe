/**
 * Response validation for the catalog module.
 *
 * These schemas are the runtime half of `./types.ts`: the read routes feed a product
 * form, so a moved field has to fail here rather than render an empty select.
 */

import { z } from "zod";

import type { Brand, CategoryAttribute, CategoryTreeNode } from "./types";

const optionSchema = z.object({
  id: z.string(),
  value: z.string(),
  sort_order: z.number().int(),
});

export const categoryAttributeSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  type: z.enum(["TEXT", "NUMBER", "SELECT"]),
  required: z.boolean(),
  filterable: z.boolean(),
  searchable: z.boolean(),
  is_variation: z.boolean(),
  position: z.number().int(),
  options: z.array(optionSchema),
}) satisfies z.ZodType<CategoryAttribute>;

export const categoryAttributeListSchema = z.array(categoryAttributeSchema);

// Recursive: a category node carries nodes of its own shape. The explicit `ZodType`
// annotation is what lets the lazy reference resolve.
export const categoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    position: z.number().int(),
    is_leaf: z.boolean(),
    children: z.array(categoryTreeNodeSchema),
  }),
);

export const categoryTreeSchema = z.array(categoryTreeNodeSchema);

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
}) satisfies z.ZodType<Brand>;

export const brandListSchema = z.array(brandSchema);
