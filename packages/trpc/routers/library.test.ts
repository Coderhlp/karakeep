import { beforeEach, describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";

import { assets, AssetTypes, libraryItems } from "@karakeep/db/schema";

import type { CustomTestContext } from "../testUtils";
import { defaultBeforeEach } from "../testUtils";

beforeEach<CustomTestContext>(defaultBeforeEach(true));

describe("Library Routes", () => {
  test<CustomTestContext>("creates and lists collections for the current user", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;

    const created = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
      description: "链接、截图、PDF 和笔记",
    });

    expect(created.name).toEqual("家庭 NAS 搭建");
    expect(created.kind).toEqual("project");
    expect(created.icon).toEqual("BriefcaseBusiness");

    const result = await api.list();

    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].id).toEqual(created.id);
  });

  test<CustomTestContext>("filters collections by kind", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;

    await api.create({ kind: "project", name: "家庭 NAS 搭建" });
    await api.create({ kind: "pet", name: "猫咪用品清单" });

    const result = await api.list({ kind: "pet" });

    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].name).toEqual("猫咪用品清单");
  });

  test<CustomTestContext>("does not leak collections between users", async ({
    apiCallers,
  }) => {
    await apiCallers[0].library.create({
      kind: "life",
      name: "周末露营照片",
    });

    const result = await apiCallers[1].library.list();

    expect(result.collections).toHaveLength(0);
  });

  test<CustomTestContext>("deletes owned collections with their items", async ({
    apiCallers,
    db,
  }) => {
    const api = apiCallers[0].library;
    const collection = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
    });
    await api.createItem({
      collectionId: collection.id,
      type: "note",
      title: "旧 NAS 迁移清单",
      note: "数据校验、服务切换、回滚步骤",
    });

    await api.delete({ collectionId: collection.id });

    const result = await api.list();
    const remainingItems = await db
      .select()
      .from(libraryItems)
      .where(eq(libraryItems.collectionId, collection.id));

    expect(result.collections).toHaveLength(0);
    expect(remainingItems).toHaveLength(0);
  });

  test<CustomTestContext>("does not allow deleting another user's collection", async ({
    apiCallers,
  }) => {
    const collection = await apiCallers[0].library.create({
      kind: "life",
      name: "装修票据与说明书",
    });

    await expect(() =>
      apiCallers[1].library.delete({ collectionId: collection.id }),
    ).rejects.toThrow(/Library collection not found/);

    const result = await apiCallers[0].library.list();
    expect(result.collections).toHaveLength(1);
  });

  test<CustomTestContext>("updates owned collection names", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;
    const collection = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
      description: "旧描述",
    });

    const updated = await api.update({
      collectionId: collection.id,
      name: "家庭服务器搭建",
      description: "硬件、部署和迁移资料",
    });

    expect(updated.name).toEqual("家庭服务器搭建");
    expect(updated.description).toEqual("硬件、部署和迁移资料");
    const result = await api.list();
    expect(result.collections[0].name).toEqual("家庭服务器搭建");
  });

  test<CustomTestContext>("does not allow updating another user's collection", async ({
    apiCallers,
  }) => {
    const collection = await apiCallers[0].library.create({
      kind: "life",
      name: "装修票据与说明书",
    });

    await expect(() =>
      apiCallers[1].library.update({
        collectionId: collection.id,
        name: "不该修改",
      }),
    ).rejects.toThrow(/Library collection not found/);
  });

  test<CustomTestContext>("updates library kind names for the current user", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;

    await api.updateKindSettings({
      kind: "project",
      name: "工作资料库",
    });

    const result = await api.listKindSettings();
    expect(result.settings).toEqual([{ kind: "project", name: "工作资料库" }]);
    const otherUserResult = await apiCallers[1].library.listKindSettings();
    expect(otherUserResult.settings).toEqual([]);
  });

  test<CustomTestContext>("creates and lists items inside a collection", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;
    const collection = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
    });

    const link = await api.createItem({
      collectionId: collection.id,
      type: "link",
      title: "Docker Compose 模板",
      url: "https://example.com/compose",
    });
    const note = await api.createItem({
      collectionId: collection.id,
      type: "note",
      title: "购买 UPS 前确认功率",
      note: "记录设备功耗和预算范围",
    });

    const result = await api.listItems({ collectionId: collection.id });

    expect(result.items.map((item) => item.id)).toEqual([link.id, note.id]);
    expect(result.items[0].url).toEqual("https://example.com/compose");
    expect(result.items[1].note).toEqual("记录设备功耗和预算范围");
  });

  test<CustomTestContext>("normalizes link item urls without a scheme", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;
    const collection = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
    });

    const item = await api.createItem({
      collectionId: collection.id,
      type: "link",
      title: "Docker Compose 模板",
      url: "example.com/compose",
    });

    expect(item.url).toEqual("https://example.com/compose");
  });

  test<CustomTestContext>("does not allow writing items into another user's collection", async ({
    apiCallers,
  }) => {
    const collection = await apiCallers[0].library.create({
      kind: "life",
      name: "装修票据与说明书",
    });

    await expect(() =>
      apiCallers[1].library.createItem({
        collectionId: collection.id,
        type: "note",
        title: "不该写入",
        note: "跨用户写入",
      }),
    ).rejects.toThrow(/Library collection not found/);
  });

  test<CustomTestContext>("does not allow reading another user's collection items", async ({
    apiCallers,
  }) => {
    const collection = await apiCallers[0].library.create({
      kind: "pet",
      name: "猫咪用品清单",
    });

    await apiCallers[0].library.createItem({
      collectionId: collection.id,
      type: "note",
      title: "猫粮记录",
      note: "适口性和价格",
    });

    await expect(() =>
      apiCallers[1].library.listItems({ collectionId: collection.id }),
    ).rejects.toThrow(/Library collection not found/);
  });

  test<CustomTestContext>("updates and deletes items owned by the current user", async ({
    apiCallers,
  }) => {
    const api = apiCallers[0].library;
    const collection = await api.create({
      kind: "project",
      name: "家庭 NAS 搭建",
    });
    const item = await api.createItem({
      collectionId: collection.id,
      type: "link",
      title: "旧标题",
      url: "https://example.com/old",
    });

    const updated = await api.updateItem({
      itemId: item.id,
      title: "新标题",
      url: "https://example.com/new",
    });

    expect(updated.title).toEqual("新标题");
    expect(updated.url).toEqual("https://example.com/new");

    await api.deleteItem({ itemId: item.id });

    const result = await api.listItems({ collectionId: collection.id });
    expect(result.items).toHaveLength(0);
  });

  test<CustomTestContext>("creates file items from owned uploaded assets", async ({
    apiCallers,
    db,
  }) => {
    const user = await apiCallers[0].users.whoami();
    const collection = await apiCallers[0].library.create({
      kind: "life",
      name: "装修票据与说明书",
    });

    await db.insert(assets).values({
      id: "library-file-asset",
      assetType: AssetTypes.UNKNOWN,
      bookmarkId: null,
      userId: user.id,
      contentType: "application/pdf",
      fileName: "manual.pdf",
      size: 1024,
    });

    const item = await apiCallers[0].library.createItem({
      collectionId: collection.id,
      type: "file",
      title: "说明书",
      assetId: "library-file-asset",
      fileName: "manual.pdf",
      contentType: "application/pdf",
    });

    expect(item.assetId).toEqual("library-file-asset");
    expect(item.fileName).toEqual("manual.pdf");
    expect(item.contentType).toEqual("application/pdf");
  });

  test<CustomTestContext>("does not allow updating another user's item", async ({
    apiCallers,
  }) => {
    const collection = await apiCallers[0].library.create({
      kind: "pet",
      name: "猫咪用品清单",
    });
    const item = await apiCallers[0].library.createItem({
      collectionId: collection.id,
      type: "note",
      title: "猫粮记录",
      note: "适口性和价格",
    });

    await expect(() =>
      apiCallers[1].library.updateItem({
        itemId: item.id,
        title: "不该修改",
      }),
    ).rejects.toThrow(/Library item not found/);
  });
});
