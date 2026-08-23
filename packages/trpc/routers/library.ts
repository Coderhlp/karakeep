import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import {
  assets,
  libraryCollections,
  libraryItems,
  libraryKindSettings,
} from "@karakeep/db/schema";
import { deleteAsset } from "@karakeep/shared/assetdb";
import type { LibraryKind } from "@karakeep/shared/types/library";
import {
  zCreateLibraryCollectionSchema,
  zCreateLibraryItemSchema,
  zLibraryCollectionSchema,
  zLibraryItemSchema,
  zLibraryKindSettingsSchema,
  zLibraryKindSchema,
  zUpdateLibraryCollectionSchema,
  zUpdateLibraryItemSchema,
  zUpdateLibraryKindSettingsSchema,
} from "@karakeep/shared/types/library";

import { createScopedAuthedProcedure, router } from "../index";
import { Asset } from "../models/assets";

const libraryProcedure = createScopedAuthedProcedure("library");

function getDefaultLibraryIcon(kind: LibraryKind) {
  switch (kind) {
    case "project":
      return "BriefcaseBusiness";
    case "pet":
      return "PawPrint";
    case "life":
      return "Camera";
  }
}

async function ensureCollectionOwner(
  ctx: {
    db: typeof import("@karakeep/db").db;
    user: { id: string };
  },
  collectionId: string,
) {
  const [collection] = await ctx.db
    .select({ id: libraryCollections.id })
    .from(libraryCollections)
    .where(
      and(
        eq(libraryCollections.id, collectionId),
        eq(libraryCollections.userId, ctx.user.id),
      ),
    );

  if (!collection) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Library collection not found",
    });
  }
}

async function getOwnedLibraryItem(
  ctx: {
    db: typeof import("@karakeep/db").db;
    user: { id: string };
  },
  itemId: string,
) {
  const [item] = await ctx.db
    .select()
    .from(libraryItems)
    .where(
      and(eq(libraryItems.id, itemId), eq(libraryItems.userId, ctx.user.id)),
    );

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Library item not found",
    });
  }

  return item;
}

export const libraryAppRouter = router({
  list: libraryProcedure
    .input(z.object({ kind: zLibraryKindSchema.optional() }).optional())
    .output(z.object({ collections: z.array(zLibraryCollectionSchema) }))
    .query(async ({ ctx, input }) => {
      const where = input?.kind
        ? and(
            eq(libraryCollections.userId, ctx.user.id),
            eq(libraryCollections.kind, input.kind),
          )
        : eq(libraryCollections.userId, ctx.user.id);

      const collections = await ctx.db
        .select()
        .from(libraryCollections)
        .where(where)
        .orderBy(asc(libraryCollections.createdAt));

      return { collections };
    }),
  create: libraryProcedure
    .input(zCreateLibraryCollectionSchema)
    .output(zLibraryCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const [collection] = await ctx.db
        .insert(libraryCollections)
        .values({
          ...input,
          description: input.description || null,
          icon: input.icon || getDefaultLibraryIcon(input.kind),
          userId: ctx.user.id,
        })
        .returning();

      return collection;
    }),
  update: libraryProcedure
    .input(zUpdateLibraryCollectionSchema)
    .output(zLibraryCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureCollectionOwner(ctx, input.collectionId);

      const [collection] = await ctx.db
        .update(libraryCollections)
        .set({
          ...(input.name ? { name: input.name } : {}),
          description:
            input.description === undefined
              ? undefined
              : input.description || null,
        })
        .where(
          and(
            eq(libraryCollections.id, input.collectionId),
            eq(libraryCollections.userId, ctx.user.id),
          ),
        )
        .returning();

      return collection;
    }),
  listKindSettings: libraryProcedure
    .output(z.object({ settings: z.array(zLibraryKindSettingsSchema) }))
    .query(async ({ ctx }) => {
      const settings = await ctx.db
        .select({
          kind: libraryKindSettings.kind,
          name: libraryKindSettings.name,
        })
        .from(libraryKindSettings)
        .where(eq(libraryKindSettings.userId, ctx.user.id))
        .orderBy(asc(libraryKindSettings.createdAt));

      return { settings };
    }),
  updateKindSettings: libraryProcedure
    .input(zUpdateLibraryKindSettingsSchema)
    .output(zLibraryKindSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const [settings] = await ctx.db
        .insert(libraryKindSettings)
        .values({
          kind: input.kind,
          name: input.name,
          userId: ctx.user.id,
        })
        .onConflictDoUpdate({
          target: [libraryKindSettings.userId, libraryKindSettings.kind],
          set: {
            name: input.name,
            modifiedAt: new Date(),
          },
        })
        .returning({
          kind: libraryKindSettings.kind,
          name: libraryKindSettings.name,
        });

      return settings;
    }),
  delete: libraryProcedure
    .input(z.object({ collectionId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      await ensureCollectionOwner(ctx, input.collectionId);

      const fileItems = await ctx.db
        .select({ assetId: libraryItems.assetId })
        .from(libraryItems)
        .where(
          and(
            eq(libraryItems.collectionId, input.collectionId),
            eq(libraryItems.userId, ctx.user.id),
          ),
        );
      const assetIds = fileItems.flatMap((item) =>
        item.assetId ? [item.assetId] : [],
      );

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(libraryCollections)
          .where(
            and(
              eq(libraryCollections.id, input.collectionId),
              eq(libraryCollections.userId, ctx.user.id),
            ),
          );

        if (assetIds.length > 0) {
          await tx
            .delete(assets)
            .where(
              and(inArray(assets.id, assetIds), eq(assets.userId, ctx.user.id)),
            );
        }
      });

      await Promise.all(
        assetIds.map((assetId) =>
          deleteAsset({ userId: ctx.user.id, assetId }).catch(() => ({})),
        ),
      );
    }),
  listItems: libraryProcedure
    .input(z.object({ collectionId: z.string() }))
    .output(z.object({ items: z.array(zLibraryItemSchema) }))
    .query(async ({ ctx, input }) => {
      await ensureCollectionOwner(ctx, input.collectionId);

      const items = await ctx.db
        .select({
          id: libraryItems.id,
          collectionId: libraryItems.collectionId,
          type: libraryItems.type,
          title: libraryItems.title,
          url: libraryItems.url,
          note: libraryItems.note,
          assetId: libraryItems.assetId,
          fileName: libraryItems.fileName,
          contentType: libraryItems.contentType,
          createdAt: libraryItems.createdAt,
          modifiedAt: libraryItems.modifiedAt,
        })
        .from(libraryItems)
        .where(
          and(
            eq(libraryItems.collectionId, input.collectionId),
            eq(libraryItems.userId, ctx.user.id),
          ),
        )
        .orderBy(asc(libraryItems.createdAt));

      return { items };
    }),
  createItem: libraryProcedure
    .input(zCreateLibraryItemSchema)
    .output(zLibraryItemSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureCollectionOwner(ctx, input.collectionId);
      if (input.type === "file" && input.assetId) {
        await Asset.ensureOwnership(ctx, input.assetId);
      }

      const [item] = await ctx.db
        .insert(libraryItems)
        .values({
          collectionId: input.collectionId,
          type: input.type,
          title: input.title,
          url: input.type === "link" ? input.url : null,
          note: input.type === "note" ? input.note : null,
          assetId: input.type === "file" ? input.assetId : null,
          fileName: input.type === "file" ? input.fileName || null : null,
          contentType: input.type === "file" ? input.contentType || null : null,
          userId: ctx.user.id,
        })
        .returning({
          id: libraryItems.id,
          collectionId: libraryItems.collectionId,
          type: libraryItems.type,
          title: libraryItems.title,
          url: libraryItems.url,
          note: libraryItems.note,
          assetId: libraryItems.assetId,
          fileName: libraryItems.fileName,
          contentType: libraryItems.contentType,
          createdAt: libraryItems.createdAt,
          modifiedAt: libraryItems.modifiedAt,
        });

      return item;
    }),
  updateItem: libraryProcedure
    .input(zUpdateLibraryItemSchema)
    .output(zLibraryItemSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getOwnedLibraryItem(ctx, input.itemId);

      const [item] = await ctx.db
        .update(libraryItems)
        .set({
          title: input.title ?? existing.title,
          url:
            existing.type === "link"
              ? (input.url ?? existing.url)
              : existing.url,
          note:
            existing.type === "note"
              ? (input.note ?? existing.note)
              : existing.note,
        })
        .where(
          and(
            eq(libraryItems.id, input.itemId),
            eq(libraryItems.userId, ctx.user.id),
          ),
        )
        .returning({
          id: libraryItems.id,
          collectionId: libraryItems.collectionId,
          type: libraryItems.type,
          title: libraryItems.title,
          url: libraryItems.url,
          note: libraryItems.note,
          assetId: libraryItems.assetId,
          fileName: libraryItems.fileName,
          contentType: libraryItems.contentType,
          createdAt: libraryItems.createdAt,
          modifiedAt: libraryItems.modifiedAt,
        });

      return item;
    }),
  deleteItem: libraryProcedure
    .input(z.object({ itemId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const item = await getOwnedLibraryItem(ctx, input.itemId);

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(libraryItems)
          .where(
            and(
              eq(libraryItems.id, input.itemId),
              eq(libraryItems.userId, ctx.user.id),
            ),
          );
        if (item.assetId) {
          await tx
            .delete(assets)
            .where(
              and(eq(assets.id, item.assetId), eq(assets.userId, ctx.user.id)),
            );
        }
      });

      if (item.assetId) {
        await deleteAsset({ userId: ctx.user.id, assetId: item.assetId }).catch(
          () => ({}),
        );
      }
    }),
});
