import { describe, expect, test } from "vitest";

import {
  applyLibraryKindSettings,
  filterLibraryCollectionsByKind,
  getLibraryCollectionHref,
  getLibraryInspirationCards,
  getLibraryKindHref,
  getLibraryKindSummary,
  getLibraryItemDisplayType,
  getLibraryItemInstantInputId,
  getLibraryPageMode,
  getNextLibrarySelection,
  getSelectedCollectionIdAfterDelete,
  parseLibraryKindParam,
  PERSONAL_LIBRARY_TEMPLATES,
  PROJECT_MATERIAL_GROUPS,
} from "./PersonalLibraryPage";
import type {
  LibraryCollection,
  LibraryKind,
} from "@karakeep/shared/types/library";

describe("personal library page model", () => {
  test("shows the three first-phase library templates", () => {
    expect(PERSONAL_LIBRARY_TEMPLATES.map((template) => template.kind)).toEqual(
      ["project", "pet", "life"],
    );
  });

  test("groups project materials by content type instead of workflow status", () => {
    expect(PROJECT_MATERIAL_GROUPS.map((group) => group.title)).toEqual([
      "链接资料",
      "截图素材",
      "PDF 文档",
      "项目笔记",
    ]);
  });

  test("offers inspiration cards for the active library kind", () => {
    expect(getLibraryInspirationCards("life").map((card) => card.name)).toEqual(
      ["旅行相册", "说明书收纳盒"],
    );
  });

  test("applies custom library kind names without changing template visuals", () => {
    const templates = applyLibraryKindSettings(PERSONAL_LIBRARY_TEMPLATES, [
      { kind: "project", name: "工作资料库" },
    ]);

    expect(
      templates.find((template) => template.kind === "project")?.title,
    ).toEqual("工作资料库");
    expect(
      templates.find((template) => template.kind === "project")?.accentClass,
    ).toEqual(PERSONAL_LIBRARY_TEMPLATES[0].accentClass);
  });

  test("classifies library files by content type for richer cards", () => {
    expect(
      getLibraryItemDisplayType({ type: "file", contentType: "image/png" }),
    ).toEqual("image");
    expect(
      getLibraryItemDisplayType({ type: "file", contentType: "video/mp4" }),
    ).toEqual("video");
    expect(
      getLibraryItemDisplayType({
        type: "file",
        contentType: "application/pdf",
      }),
    ).toEqual("pdf");
    expect(
      getLibraryItemDisplayType({
        type: "file",
        contentType: "application/zip",
      }),
    ).toEqual("file");
  });

  test("opens the matching instant input when a library item type is picked", () => {
    expect(getLibraryItemInstantInputId("link")).toEqual("library-item-url");
    expect(getLibraryItemInstantInputId("note")).toEqual("library-item-note");
    expect(getLibraryItemInstantInputId("file")).toEqual("library-item-file");
  });

  test("uses overview for the library index and detail for collection routes", () => {
    expect(getLibraryPageMode({ initialCollectionId: undefined })).toEqual(
      "overview",
    );
    expect(getLibraryPageMode({ initialCollectionId: "collection-1" })).toEqual(
      "detail",
    );
  });

  test("summarizes top library cards from real collections", () => {
    expect(
      getLibraryKindSummary("project", [
        collection({ id: "project-1", kind: "project" }),
        collection({ id: "project-2", kind: "project" }),
        collection({ id: "pet-1", kind: "pet" }),
      ]),
    ).toEqual("2 个集合");
  });

  test("filters collections when a top library card is selected", () => {
    const collections = [
      collection({ id: "project-1", kind: "project", name: "家庭 NAS 搭建" }),
      collection({ id: "pet-1", kind: "pet", name: "猫咪用品清单" }),
      collection({ id: "life-1", kind: "life", name: "周末露营照片" }),
    ];

    expect(
      filterLibraryCollectionsByKind(collections, "pet").map(
        (item) => item.name,
      ),
    ).toEqual(["猫咪用品清单"]);
  });

  test("links top library cards to real library routes", () => {
    expect(getLibraryKindHref("pet")).toEqual("/dashboard/library?kind=pet");
  });

  test("links collection cards to real collection routes", () => {
    expect(getLibraryCollectionHref("life-1")).toEqual(
      "/dashboard/library/life-1",
    );
  });

  test("parses library kind from the current route", () => {
    expect(parseLibraryKindParam("life")).toEqual("life");
    expect(parseLibraryKindParam("unknown")).toBeUndefined();
    expect(parseLibraryKindParam(null)).toBeUndefined();
  });

  test("selects the route kind collection without bouncing through the first collection", () => {
    expect(
      getNextLibrarySelection({
        activeKind: "pet",
        collections: [
          collection({ id: "project-1", kind: "project" }),
          collection({ id: "pet-1", kind: "pet" }),
        ],
        initialCollectionId: undefined,
        routeKind: "pet",
        selectedCollectionId: null,
      }),
    ).toEqual({
      activeKind: "pet",
      selectedCollectionId: "pet-1",
    });
  });

  test("keeps an empty route kind selected instead of falling back to another kind", () => {
    expect(
      getNextLibrarySelection({
        activeKind: "project",
        collections: [collection({ id: "project-1", kind: "project" })],
        initialCollectionId: undefined,
        routeKind: "life",
        selectedCollectionId: "project-1",
      }),
    ).toEqual({
      activeKind: "life",
      selectedCollectionId: null,
    });
  });

  test("does not update selection when route kind and selected collection already match", () => {
    expect(
      getNextLibrarySelection({
        activeKind: "pet",
        collections: [
          collection({ id: "project-1", kind: "project" }),
          collection({ id: "pet-1", kind: "pet" }),
        ],
        initialCollectionId: undefined,
        routeKind: "pet",
        selectedCollectionId: "pet-1",
      }),
    ).toBeNull();
  });

  test("keeps the route collection selected after local same-kind selection drifts", () => {
    expect(
      getNextLibrarySelection({
        activeKind: "life",
        collections: [
          collection({ id: "life-1", kind: "life" }),
          collection({ id: "life-2", kind: "life" }),
        ],
        initialCollectionId: "life-1",
        routeKind: undefined,
        selectedCollectionId: "life-2",
      }),
    ).toEqual({
      activeKind: "life",
      selectedCollectionId: "life-1",
    });
  });

  test("does not replace a missing collection route with another collection", () => {
    expect(
      getNextLibrarySelection({
        activeKind: "project",
        collections: [collection({ id: "project-1", kind: "project" })],
        initialCollectionId: "missing",
        routeKind: undefined,
        selectedCollectionId: null,
      }),
    ).toBeNull();
  });

  test("selects a nearby collection after deleting the active collection", () => {
    const collections = [
      collection({ id: "project-1", kind: "project" }),
      collection({ id: "project-2", kind: "project" }),
      collection({ id: "pet-1", kind: "pet" }),
    ];

    expect(
      getSelectedCollectionIdAfterDelete(
        collections,
        "project",
        "project-1",
        "project-1",
      ),
    ).toEqual("project-2");
  });

  test("keeps the current collection when deleting another collection", () => {
    expect(
      getSelectedCollectionIdAfterDelete(
        [
          collection({ id: "project-1", kind: "project" }),
          collection({ id: "project-2", kind: "project" }),
        ],
        "project",
        "project-2",
        "project-1",
      ),
    ).toEqual("project-1");
  });
});

function collection(overrides: Partial<LibraryCollection>): LibraryCollection {
  return { ...baseCollection(), ...overrides };
}

function baseCollection(): LibraryCollection {
  return {
    id: "collection-1",
    kind: "project" satisfies LibraryKind,
    name: "集合",
    description: null,
    icon: "BriefcaseBusiness",
    createdAt: new Date("2026-08-22T00:00:00.000Z"),
    modifiedAt: null,
  };
}
