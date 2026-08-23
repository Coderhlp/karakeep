import { z } from "zod";

export const LIBRARY_KINDS = ["project", "pet", "life"] as const;
export const LIBRARY_ITEM_TYPES = ["link", "note", "file"] as const;

export const zLibraryKindSchema = z.enum(LIBRARY_KINDS);
export type LibraryKind = z.infer<typeof zLibraryKindSchema>;
export const zLibraryItemTypeSchema = z.enum(LIBRARY_ITEM_TYPES);
export type LibraryItemType = z.infer<typeof zLibraryItemTypeSchema>;

export const zLibraryCollectionSchema = z.object({
  id: z.string(),
  kind: zLibraryKindSchema,
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string(),
  createdAt: z.date(),
  modifiedAt: z.date().nullable(),
});
export type LibraryCollection = z.infer<typeof zLibraryCollectionSchema>;

export const zLibraryKindSettingsSchema = z.object({
  kind: zLibraryKindSchema,
  name: z.string(),
});
export type LibraryKindSettings = z.infer<typeof zLibraryKindSettingsSchema>;

export const zCreateLibraryCollectionSchema = z.object({
  kind: zLibraryKindSchema,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().min(1).max(40).optional(),
});
export type CreateLibraryCollectionInput = z.infer<
  typeof zCreateLibraryCollectionSchema
>;

export const zUpdateLibraryCollectionSchema = z.object({
  collectionId: z.string(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
});
export type UpdateLibraryCollectionInput = z.infer<
  typeof zUpdateLibraryCollectionSchema
>;

export const zUpdateLibraryKindSettingsSchema = z.object({
  kind: zLibraryKindSchema,
  name: z.string().trim().min(1).max(40),
});
export type UpdateLibraryKindSettingsInput = z.infer<
  typeof zUpdateLibraryKindSettingsSchema
>;

export const zLibraryItemSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  type: zLibraryItemTypeSchema,
  title: z.string(),
  url: z.string().nullable(),
  note: z.string().nullable(),
  assetId: z.string().nullable(),
  fileName: z.string().nullable(),
  contentType: z.string().nullable(),
  createdAt: z.date(),
  modifiedAt: z.date().nullable(),
});
export type LibraryItem = z.infer<typeof zLibraryItemSchema>;

const zLibraryUrlSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}, z.string().url().max(2048));

export const zCreateLibraryItemSchema = z
  .object({
    collectionId: z.string(),
    type: zLibraryItemTypeSchema,
    title: z.string().trim().min(1).max(120),
    url: zLibraryUrlSchema.optional(),
    note: z.string().trim().max(10000).optional(),
    assetId: z.string().optional(),
    fileName: z.string().trim().max(255).optional(),
    contentType: z.string().trim().max(255).optional(),
  })
  .superRefine((item, ctx) => {
    if (item.type === "link" && !item.url) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Link items require a URL",
      });
    }

    if (item.type === "note" && !item.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Note items require note content",
      });
    }

    if (item.type === "file" && !item.assetId) {
      ctx.addIssue({
        code: "custom",
        path: ["assetId"],
        message: "File items require an asset",
      });
    }
  });
export type CreateLibraryItemInput = z.infer<typeof zCreateLibraryItemSchema>;

export const zUpdateLibraryItemSchema = z.object({
  itemId: z.string(),
  title: z.string().trim().min(1).max(120).optional(),
  url: zLibraryUrlSchema.optional(),
  note: z.string().trim().max(10000).optional(),
});
export type UpdateLibraryItemInput = z.infer<typeof zUpdateLibraryItemSchema>;
