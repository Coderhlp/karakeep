"use client";

import NextImage from "next/image";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link,
  Play,
  NotebookPen,
  PawPrint,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import useUpload from "@/lib/hooks/upload-file";
import { useTRPC } from "@karakeep/shared-react/trpc";
import type {
  LibraryCollection,
  LibraryItem,
  LibraryItemType,
  LibraryKindSettings,
  LibraryKind,
} from "@karakeep/shared/types/library";
import { LIBRARY_KINDS } from "@karakeep/shared/types/library";

interface LibraryTemplate {
  kind: LibraryKind;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  className: string;
  accentClass: string;
  coverClassName: string;
  motifLabels: string[];
}

interface LibraryInspirationCard {
  kind: LibraryKind;
  name: string;
  description: string;
  icon: string;
}

interface MaterialItem {
  title: string;
  description: string;
  source: string;
}

interface MaterialGroup {
  title: string;
  icon: React.ReactNode;
  items: MaterialItem[];
}

export type LibraryDisplayType =
  | "all"
  | "link"
  | "note"
  | "image"
  | "video"
  | "pdf"
  | "file";

export type LibraryPageMode = "overview" | "detail";

const ITEM_FILTERS: { label: string; value: LibraryDisplayType }[] = [
  { label: "全部", value: "all" },
  { label: "链接", value: "link" },
  { label: "笔记", value: "note" },
  { label: "图片", value: "image" },
  { label: "视频", value: "video" },
  { label: "PDF", value: "pdf" },
  { label: "文件", value: "file" },
];

export const PERSONAL_LIBRARY_TEMPLATES: LibraryTemplate[] = [
  {
    kind: "project",
    title: "项目素材库",
    subtitle: "链接、截图、笔记、PDF 聚合成项目看板",
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    className: "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
    accentClass: "bg-blue-500",
    coverClassName:
      "border-blue-200 bg-blue-50/80 text-blue-950 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-50",
    motifLabels: ["链接", "截图", "PDF", "笔记"],
  },
  {
    kind: "pet",
    title: "宠物知识库",
    subtitle: "用品、喂养资料、健康记录和日常照片",
    icon: <PawPrint className="h-5 w-5" />,
    className:
      "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    accentClass: "bg-emerald-500",
    coverClassName:
      "border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-50",
    motifLabels: ["用品", "喂养", "健康", "照片"],
  },
  {
    kind: "life",
    title: "日常生活库",
    subtitle: "图片、视频、票据、说明书和生活灵感",
    icon: <Camera className="h-5 w-5" />,
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    accentClass: "bg-amber-500",
    coverClassName:
      "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50",
    motifLabels: ["图片", "视频", "票据", "灵感"],
  },
];

export const LIBRARY_INSPIRATION_CARDS: LibraryInspirationCard[] = [
  {
    kind: "project",
    name: "家庭 NAS 搭建",
    description: "方案链接、硬件截图和迁移笔记",
    icon: "BriefcaseBusiness",
  },
  {
    kind: "project",
    name: "装修资料盒",
    description: "报价、票据和施工灵感",
    icon: "FileText",
  },
  {
    kind: "pet",
    name: "猫咪护理册",
    description: "喂养记录、疫苗提醒和用品清单",
    icon: "PawPrint",
  },
  {
    kind: "pet",
    name: "宠物好物架",
    description: "粮食、玩具、药品和价格比较",
    icon: "PawPrint",
  },
  {
    kind: "life",
    name: "旅行相册",
    description: "照片、路线、票据和灵感",
    icon: "Camera",
  },
  {
    kind: "life",
    name: "说明书收纳盒",
    description: "电器说明书、保修单和购买记录",
    icon: "FileText",
  },
];

export const PROJECT_MATERIAL_GROUPS: MaterialGroup[] = [
  {
    title: "链接资料",
    icon: <Link className="h-4 w-4" />,
    items: [
      {
        title: "群晖与 TrueNAS 对比",
        description: "方案差异、硬件要求、维护成本",
        source: "nas-links",
      },
      {
        title: "Docker Compose 模板",
        description: "常用服务编排参考",
        source: "deployment",
      },
    ],
  },
  {
    title: "截图素材",
    icon: <ImageIcon className="h-4 w-4" />,
    items: [
      {
        title: "硬盘价格截图",
        description: "采购比价、容量和保修记录",
        source: "hardware",
      },
      {
        title: "机箱风道参考图",
        description: "散热布局与线缆整理",
        source: "design",
      },
    ],
  },
  {
    title: "PDF 文档",
    icon: <FileText className="h-4 w-4" />,
    items: [
      {
        title: "ZFS 入门 PDF",
        description: "池、快照、校验与恢复策略",
        source: "storage",
      },
    ],
  },
  {
    title: "项目笔记",
    icon: <NotebookPen className="h-4 w-4" />,
    items: [
      {
        title: "购买 UPS 前确认功率",
        description: "设备功耗、续航、预算范围",
        source: "notes",
      },
      {
        title: "旧 NAS 迁移清单",
        description: "数据校验、服务切换、回滚步骤",
        source: "migration",
      },
    ],
  },
];

export default function PersonalLibraryPage({
  initialCollectionId,
  initialKind,
}: {
  initialCollectionId?: string;
  initialKind?: LibraryKind;
}) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeKind =
    parseLibraryKindParam(searchParams.get("kind")) ?? initialKind;
  const pageMode = getLibraryPageMode({ initialCollectionId });
  const isDetailPage = pageMode === "detail";
  const [kind, setKind] = React.useState<LibraryKind>(routeKind ?? "project");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedCollectionId, setSelectedCollectionId] = React.useState<
    string | null
  >(null);
  const [activeKind, setActiveKind] = React.useState<LibraryKind>(
    routeKind ?? "project",
  );
  const [itemType, setItemType] = React.useState<LibraryItemType>("link");
  const [itemTitle, setItemTitle] = React.useState("");
  const [itemContent, setItemContent] = React.useState("");
  const [itemFile, setItemFile] = React.useState<File | null>(null);
  const [itemError, setItemError] = React.useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = React.useState<
    string | null
  >(null);
  const [collectionName, setCollectionName] = React.useState("");
  const [collectionDescription, setCollectionDescription] = React.useState("");
  const [isEditingKindName, setIsEditingKindName] = React.useState(false);
  const [kindName, setKindName] = React.useState("");
  const itemFormRef = React.useRef<HTMLFormElement>(null);
  const itemLinkInputRef = React.useRef<HTMLInputElement>(null);
  const itemNoteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const itemFileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: collections, isLoading } = useQuery(
    api.library.list.queryOptions(undefined, {
      select: (data) => data.collections,
    }),
  );
  const { data: kindSettings } = useQuery(
    api.library.listKindSettings.queryOptions(undefined, {
      select: (data) => data.settings,
    }),
  );
  const libraryTemplates = applyLibraryKindSettings(
    PERSONAL_LIBRARY_TEMPLATES,
    kindSettings ?? [],
  );
  const visibleCollections = filterLibraryCollectionsByKind(
    collections ?? [],
    activeKind,
  );
  const selectedCollectionCandidate =
    collections?.find(
      (collection) =>
        collection.id === selectedCollectionId &&
        collection.kind === activeKind,
    ) ?? null;
  const selectedCollection =
    selectedCollectionCandidate ??
    (isDetailPage ? null : (visibleCollections[0] ?? null));
  const activeCollectionId = selectedCollection?.id ?? "";
  const activeTemplate = libraryTemplates.find(
    (template) => template.kind === activeKind,
  );
  const activeInspirationCards = getLibraryInspirationCards(activeKind);
  const formTemplate = libraryTemplates.find(
    (template) => template.kind === kind,
  );
  const formInspirationCards = getLibraryInspirationCards(kind);

  const { data: items, isLoading: isItemsLoading } = useQuery(
    api.library.listItems.queryOptions(
      { collectionId: activeCollectionId },
      {
        enabled: Boolean(activeCollectionId),
        select: (data) => data.items,
      },
    ),
  );
  const currentItemCount = items?.length ?? 0;

  React.useEffect(() => {
    if (!collections) {
      return;
    }

    const nextSelection = getNextLibrarySelection({
      activeKind,
      collections,
      initialCollectionId,
      routeKind,
      selectedCollectionId,
    });

    if (!nextSelection) {
      return;
    }

    if (activeKind !== nextSelection.activeKind) {
      setActiveKind(nextSelection.activeKind);
    }
    if (kind !== nextSelection.activeKind) {
      setKind(nextSelection.activeKind);
    }
    if (selectedCollectionId !== nextSelection.selectedCollectionId) {
      setSelectedCollectionId(nextSelection.selectedCollectionId);
    }
  }, [
    activeKind,
    collections,
    initialCollectionId,
    kind,
    routeKind,
    selectedCollectionId,
  ]);

  const createCollection = useMutation(
    api.library.create.mutationOptions({
      onSuccess: (collection) => {
        setActiveKind(collection.kind);
        setSelectedCollectionId(collection.id);
        setName("");
        setDescription("");
        router.push(getLibraryCollectionHref(collection.id));
        void queryClient.invalidateQueries(api.library.list.pathFilter());
      },
    }),
  );
  const updateCollection = useMutation(
    api.library.update.mutationOptions({
      onSuccess: () => {
        setEditingCollectionId(null);
        void queryClient.invalidateQueries(api.library.list.pathFilter());
        toast({ description: "集合已更新。" });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          description: error.message || "更新集合失败。",
        });
      },
    }),
  );
  const updateKindSettings = useMutation(
    api.library.updateKindSettings.mutationOptions({
      onSuccess: () => {
        setIsEditingKindName(false);
        void queryClient.invalidateQueries(
          api.library.listKindSettings.pathFilter(),
        );
        toast({ description: "资料库名称已更新。" });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          description: error.message || "更新资料库名称失败。",
        });
      },
    }),
  );
  const createItem = useMutation(
    api.library.createItem.mutationOptions({
      onSuccess: () => {
        setItemTitle("");
        setItemContent("");
        setItemFile(null);
        setItemError(null);
        void queryClient.invalidateQueries(api.library.listItems.pathFilter());
      },
      onError: (error) => {
        setItemError(error.message);
      },
    }),
  );
  const deleteCollection = useMutation(
    api.library.delete.mutationOptions({
      onSuccess: (_data, input) => {
        const nextCollectionId = getSelectedCollectionIdAfterDelete(
          collections ?? [],
          activeKind,
          input.collectionId,
          activeCollectionId,
        );

        setSelectedCollectionId(nextCollectionId);
        void queryClient.invalidateQueries(api.library.list.pathFilter());
        void queryClient.invalidateQueries(api.library.listItems.pathFilter());
        if (isDetailPage && input.collectionId === activeCollectionId) {
          router.push(
            nextCollectionId
              ? getLibraryCollectionHref(nextCollectionId)
              : getLibraryKindHref(activeKind),
          );
        }
        toast({ description: "集合已删除。" });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          description: error.message || "删除集合失败。",
        });
      },
    }),
  );
  const uploadFile = useUpload({
    onError: (error) => {
      setItemError(error.error);
    },
  });

  function handleCreateCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      return;
    }

    createCollection.mutate({
      kind,
      name: trimmedName,
      description: trimmedDescription || undefined,
    });
  }

  function handleSelectLibraryKind(nextKind: LibraryKind) {
    setActiveKind(nextKind);
    setKind(nextKind);
    const nextCollection =
      collections?.find((collection) => collection.kind === nextKind) ?? null;
    setSelectedCollectionId(nextCollection?.id ?? null);
  }

  function handleUseInspiration(card: LibraryInspirationCard) {
    setKind(card.kind);
    setName(card.name);
    setDescription(card.description);
  }

  function handleStartEditKindName() {
    setKindName(activeTemplate?.title ?? "");
    setIsEditingKindName(true);
  }

  function handleSaveKindName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = kindName.trim();

    if (!trimmedName) {
      return;
    }

    updateKindSettings.mutate({
      kind: activeKind,
      name: trimmedName,
    });
  }

  function handleStartEditCollection(collection: LibraryCollection) {
    setCollectionName(collection.name);
    setCollectionDescription(collection.description ?? "");
    setEditingCollectionId(collection.id);
  }

  function handleSaveCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    const trimmedName = collectionName.trim();
    if (!trimmedName) {
      return;
    }

    updateCollection.mutate({
      collectionId: selectedCollection.id,
      name: trimmedName,
      description: collectionDescription.trim(),
    });
  }

  function handleDeleteCollection(
    collection: LibraryCollection,
    setDialogOpen: (open: boolean) => void,
  ) {
    deleteCollection.mutate(
      { collectionId: collection.id },
      { onSuccess: () => setDialogOpen(false) },
    );
  }

  function handlePickItemType(nextType: LibraryItemType) {
    flushSync(() => {
      setItemType(nextType);
      setItemContent("");
      setItemFile(null);
      setItemError(null);
    });

    itemFormRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });

    if (nextType === "file") {
      itemFileInputRef.current?.click();
      return;
    }

    if (nextType === "note") {
      itemNoteInputRef.current?.focus();
      return;
    }

    itemLinkInputRef.current?.focus();
  }

  async function handleCreateItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title =
      itemTitle.trim() || (itemType === "file" ? (itemFile?.name ?? "") : "");
    const content = itemContent.trim();
    setItemError(null);

    if (!activeCollectionId || !title) {
      setItemError("请选择集合并填写资料标题。");
      return;
    }

    if (itemType === "file") {
      if (!itemFile) {
        setItemError("请选择要上传的文件。");
        return;
      }
      const uploaded = await uploadFile.mutateAsync(itemFile);
      createItem.mutate({
        collectionId: activeCollectionId,
        type: "file",
        title,
        assetId: uploaded.assetId,
        fileName: uploaded.fileName,
        contentType: uploaded.contentType,
      });
      return;
    }

    if (!content) {
      setItemError(itemType === "link" ? "请填写链接。" : "请填写笔记内容。");
      return;
    }

    createItem.mutate({
      collectionId: activeCollectionId,
      type: itemType,
      title,
      url: itemType === "link" ? content : undefined,
      note: itemType === "note" ? content : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {!isDetailPage && (
        <header className="overflow-hidden rounded-md border bg-card">
          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_280px] md:p-5">
            <div className="flex min-w-0 flex-col justify-between gap-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                  个人资料库
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  把链接、图片、视频、PDF 和笔记收成可翻看的主题收藏架。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTemplate?.motifLabels.map((label) => (
                  <span
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium",
                      activeTemplate.coverClassName,
                    )}
                    key={label}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div
              className={cn(
                "relative min-h-[150px] overflow-hidden rounded-md border p-4",
                activeTemplate?.coverClassName,
              )}
            >
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-4 gap-2">
                {(
                  activeTemplate?.motifLabels ??
                  ITEM_FILTERS.slice(1, 5).map((item) => item.label)
                ).map((label, index) => (
                  <div
                    className="flex h-16 items-end rounded-md border bg-background/70 p-2 text-[11px] font-medium shadow-sm"
                    key={label}
                    style={{
                      transform: `translateY(${index % 2 === 0 ? 0 : 8}px)`,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="relative flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md",
                    activeTemplate?.className,
                  )}
                >
                  {activeTemplate?.icon}
                </div>
                {isEditingKindName ? (
                  <form
                    className="grid min-w-0 flex-1 gap-2"
                    onSubmit={handleSaveKindName}
                  >
                    <Input
                      className="h-8 bg-background/80"
                      maxLength={40}
                      onChange={(event) => setKindName(event.target.value)}
                      value={kindName}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="h-7"
                        disabled={updateKindSettings.isPending}
                        size="sm"
                        type="submit"
                      >
                        <Save className="mr-1 h-3.5 w-3.5" />
                        保存
                      </Button>
                      <Button
                        className="h-7"
                        onClick={() => setIsEditingKindName(false)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        取消
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {activeTemplate?.title ?? "个人资料库"}
                      </div>
                      <div className="mt-1 truncate text-xs opacity-75">
                        {selectedCollection?.name ?? "未选择集合"}
                      </div>
                    </div>
                    <Button
                      aria-label="修改资料库名称"
                      className="h-7 w-7 bg-background/70"
                      onClick={handleStartEditKindName}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {!isDetailPage && (
        <section className="grid gap-3 md:grid-cols-3">
          {libraryTemplates.map((template) => {
            const collectionCount = filterLibraryCollectionsByKind(
              collections ?? [],
              template.kind,
            ).length;

            return (
              <NextLink
                aria-current={activeKind === template.kind ? "page" : undefined}
                className="block text-left"
                href={getLibraryKindHref(template.kind)}
                key={template.kind}
                onClick={() => handleSelectLibraryKind(template.kind)}
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-sm",
                    template.coverClassName,
                    activeKind === template.kind &&
                      "border-primary ring-1 ring-primary",
                  )}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md bg-background/70",
                        )}
                      >
                        {template.icon}
                      </div>
                      <span className="rounded-md bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
                        {collectionCount > 0 ? `${collectionCount} 个` : "空架"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {template.motifLabels.map((label) => (
                        <span
                          className="truncate rounded-sm border bg-background/60 px-1.5 py-1 text-center text-[11px]"
                          key={label}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {template.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {template.subtitle}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end">
                    <div className="text-xs text-muted-foreground">
                      {activeKind === template.kind ? "正在查看" : "打开"}
                    </div>
                  </CardContent>
                </Card>
              </NextLink>
            );
          })}
        </section>
      )}

      {!isDetailPage && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">新建集合</CardTitle>
            <CardDescription>
              选一个灵感封面，或直接写自己的主题。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {formInspirationCards.map((card) => (
                <button
                  className={cn(
                    "grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/60",
                    name === card.name && "border-primary bg-primary/5",
                  )}
                  key={card.name}
                  onClick={() => handleUseInspiration(card)}
                  type="button"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md",
                      formTemplate?.className,
                    )}
                  >
                    {getCollectionIcon(card.icon)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {card.name}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {card.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <form
              className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
              onSubmit={handleCreateCollection}
            >
              <Select
                onValueChange={(value) => setKind(value as LibraryKind)}
                value={kind}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {libraryTemplates.map((template) => (
                      <SelectItem key={template.kind} value={template.kind}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder="集合名称，例如：装修资料"
                value={name}
              />
              <Input
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="描述，可选"
                value={description}
              />
              <Button disabled={createCollection.isPending} type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                {createCollection.isPending ? "保存中" : "新建"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4">
        {isDetailPage && (
          <>
            <NextLink
              className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href={getLibraryKindHref(selectedCollection?.kind ?? activeKind)}
            >
              <ArrowLeft className="h-4 w-4" />
              返回资料库
            </NextLink>
            <Card className="overflow-hidden">
              <div
                className={cn(
                  "h-2",
                  activeTemplate?.accentClass ?? "bg-primary",
                )}
              />
              <CardHeader className="gap-4 md:grid md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
                <div
                  className={cn(
                    "flex aspect-square h-24 items-center justify-center rounded-md border",
                    activeTemplate?.coverClassName,
                  )}
                >
                  {selectedCollection
                    ? getCollectionIcon(selectedCollection.icon, "h-8 w-8")
                    : activeTemplate?.icon}
                </div>
                {selectedCollection &&
                editingCollectionId === selectedCollection.id ? (
                  <form
                    className="min-w-0 space-y-3"
                    onSubmit={handleSaveCollection}
                  >
                    <Input
                      maxLength={80}
                      onChange={(event) =>
                        setCollectionName(event.target.value)
                      }
                      value={collectionName}
                    />
                    <Input
                      maxLength={500}
                      onChange={(event) =>
                        setCollectionDescription(event.target.value)
                      }
                      placeholder="描述，可选"
                      value={collectionDescription}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={updateCollection.isPending}
                        size="sm"
                        type="submit"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                      <Button
                        onClick={() => setEditingCollectionId(null)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="mr-2 h-4 w-4" />
                        取消
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="min-w-0">
                    <CardTitle className="truncate text-xl">
                      {selectedCollection?.name ??
                        `${activeTemplate?.title ?? "资料库"}待开箱`}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {selectedCollection
                        ? getCollectionSubtitle(
                            selectedCollection,
                            libraryTemplates,
                          )
                        : "选择一张灵感卡或新建集合后，这里会变成当前收藏台。"}
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(activeTemplate?.motifLabels ?? []).map((label) => (
                        <span
                          className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground"
                          key={label}
                        >
                          {label}
                        </span>
                      ))}
                      {selectedCollection && (
                        <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                          {currentItemCount} 条资料
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {selectedCollection && (
                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    <Button
                      onClick={() =>
                        handleStartEditCollection(selectedCollection)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      编辑集合
                    </Button>
                    <DeleteCollectionAction
                      collection={selectedCollection}
                      isPending={deleteCollection.isPending}
                      onDelete={handleDeleteCollection}
                    >
                      <Button size="sm" type="button" variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除集合
                      </Button>
                    </DeleteCollectionAction>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <LibraryItemsList
                  isLoading={isItemsLoading}
                  items={items}
                  onPickItemType={handlePickItemType}
                />
                {selectedCollection && (
                  <form
                    className="mt-4 space-y-3 rounded-md border bg-muted/20 p-3"
                    onSubmit={handleCreateItem}
                    ref={itemFormRef}
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                      <Select
                        onValueChange={(value) =>
                          handlePickItemType(value as LibraryItemType)
                        }
                        value={itemType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="资料类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="link">链接</SelectItem>
                            <SelectItem value="note">笔记</SelectItem>
                            <SelectItem value="file">文件</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      maxLength={120}
                      onChange={(event) => setItemTitle(event.target.value)}
                      placeholder="资料标题"
                      value={itemTitle}
                    />
                    {itemType === "link" && (
                      <Input
                        id={getLibraryItemInstantInputId("link")}
                        maxLength={2048}
                        onChange={(event) => setItemContent(event.target.value)}
                        placeholder="https://example.com"
                        ref={itemLinkInputRef}
                        value={itemContent}
                      />
                    )}
                    {itemType === "note" && (
                      <Textarea
                        id={getLibraryItemInstantInputId("note")}
                        maxLength={10000}
                        onChange={(event) => setItemContent(event.target.value)}
                        placeholder="记录笔记内容"
                        ref={itemNoteInputRef}
                        value={itemContent}
                      />
                    )}
                    {itemType === "file" && (
                      <Input
                        accept="image/*,video/*,application/pdf"
                        id={getLibraryItemInstantInputId("file")}
                        onChange={(event) =>
                          setItemFile(event.target.files?.[0] ?? null)
                        }
                        ref={itemFileInputRef}
                        type="file"
                      />
                    )}
                    <Button
                      className="w-full"
                      disabled={
                        !activeCollectionId ||
                        createItem.isPending ||
                        uploadFile.isPending
                      }
                      type="submit"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {createItem.isPending || uploadFile.isPending
                        ? "保存中"
                        : "保存资料"}
                    </Button>
                    {itemError && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                        {itemError}
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!isDetailPage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {activeTemplate?.title ?? "个人资料库"}收藏架
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  正在加载集合...
                </div>
              )}
              {!isLoading && visibleCollections.length === 0 && (
                <InspirationShelf
                  cards={activeInspirationCards}
                  onUseInspiration={handleUseInspiration}
                  template={activeTemplate}
                />
              )}
              {visibleCollections.map((collection) => (
                <CollectionCoverCard
                  collection={collection}
                  isSelected={false}
                  key={collection.id}
                  isDeleting={deleteCollection.isPending}
                  onDelete={handleDeleteCollection}
                  templates={libraryTemplates}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function InspirationShelf({
  cards,
  onUseInspiration,
  template,
}: {
  cards: LibraryInspirationCard[];
  onUseInspiration: (card: LibraryInspirationCard) => void;
  template: LibraryTemplate | undefined;
}) {
  return (
    <div className="grid gap-2">
      {cards.map((card) => (
        <button
          className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/60"
          key={card.name}
          onClick={() => onUseInspiration(card)}
          type="button"
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              template?.className,
            )}
          >
            {getCollectionIcon(card.icon)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{card.name}</div>
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {card.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function CollectionCoverCard({
  collection,
  isDeleting,
  isSelected,
  onDelete,
  templates,
}: {
  collection: LibraryCollection;
  isDeleting: boolean;
  isSelected: boolean;
  onDelete: (
    collection: LibraryCollection,
    setDialogOpen: (open: boolean) => void,
  ) => void;
  templates: LibraryTemplate[];
}) {
  const template = templates.find((item) => item.kind === collection.kind);

  return (
    <div
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2 rounded-md border p-2 text-left transition-colors",
        template?.coverClassName,
        isSelected && "border-primary ring-1 ring-primary",
      )}
    >
      <NextLink
        className="grid min-h-[96px] min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-sm p-1"
        href={getLibraryCollectionHref(collection.id)}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-background/70">
          {getCollectionIcon(collection.icon, "h-5 w-5")}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {collection.name}
          </div>
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {getCollectionSubtitle(collection, templates)}
          </div>
          <div className="mt-3 flex gap-1.5">
            {(template?.motifLabels ?? []).slice(0, 3).map((label) => (
              <span
                className="rounded-sm bg-background/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </NextLink>
      <DeleteCollectionAction
        collection={collection}
        isPending={isDeleting}
        onDelete={onDelete}
      >
        <Button
          aria-label={`删除集合 ${collection.name}`}
          className="h-8 w-8"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DeleteCollectionAction>
    </div>
  );
}

function DeleteCollectionAction({
  children,
  collection,
  isPending,
  onDelete,
}: {
  children: React.ReactNode;
  collection: LibraryCollection;
  isPending: boolean;
  onDelete: (
    collection: LibraryCollection,
    setDialogOpen: (open: boolean) => void,
  ) => void;
}) {
  return (
    <ActionConfirmingDialog
      title={`删除集合「${collection.name}」？`}
      description={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>集合下的链接、笔记和文件资料会一起删除。</p>
          {collection.description && (
            <p className="rounded-md border bg-muted/40 p-3">
              {collection.description}
            </p>
          )}
        </div>
      }
      actionButton={(setDialogOpen) => (
        <ActionButton
          loading={isPending}
          onClick={() => onDelete(collection, setDialogOpen)}
          type="button"
          variant="destructive"
        >
          删除
        </ActionButton>
      )}
    >
      {children}
    </ActionConfirmingDialog>
  );
}

function getCollectionSubtitle(
  collection: LibraryCollection,
  templates = PERSONAL_LIBRARY_TEMPLATES,
) {
  const template = templates.find((item) => item.kind === collection.kind);

  return `${template?.title ?? "个人资料库"}${
    collection.description ? ` / ${collection.description}` : ""
  }`;
}

export function filterLibraryCollectionsByKind(
  collections: LibraryCollection[],
  kind: LibraryKind,
) {
  return collections.filter((collection) => collection.kind === kind);
}

export function applyLibraryKindSettings(
  templates: LibraryTemplate[],
  settings: LibraryKindSettings[],
) {
  return templates.map((template) => {
    const customName = settings.find(
      (setting) => setting.kind === template.kind,
    )?.name;

    return customName ? { ...template, title: customName } : template;
  });
}

export function getLibraryKindSummary(
  kind: LibraryKind,
  collections: LibraryCollection[],
) {
  const count = filterLibraryCollectionsByKind(collections, kind).length;

  return count > 0 ? `${count} 个集合` : "暂无集合";
}

export function getLibraryKindHref(kind: LibraryKind) {
  return `/dashboard/library?kind=${kind}`;
}

export function getLibraryCollectionHref(collectionId: string) {
  return `/dashboard/library/${collectionId}`;
}

export function getLibraryInspirationCards(kind: LibraryKind) {
  return LIBRARY_INSPIRATION_CARDS.filter((card) => card.kind === kind);
}

export function getLibraryPageMode({
  initialCollectionId,
}: {
  initialCollectionId: string | undefined;
}): LibraryPageMode {
  return initialCollectionId ? "detail" : "overview";
}

export function getNextLibrarySelection({
  activeKind,
  collections,
  initialCollectionId,
  routeKind,
  selectedCollectionId,
}: {
  activeKind: LibraryKind;
  collections: LibraryCollection[];
  initialCollectionId: string | undefined;
  routeKind: LibraryKind | undefined;
  selectedCollectionId: string | null;
}) {
  const initialCollection = initialCollectionId
    ? collections.find((collection) => collection.id === initialCollectionId)
    : null;

  if (initialCollectionId && !initialCollection) {
    return null;
  }

  if (
    initialCollection &&
    (activeKind !== initialCollection.kind ||
      selectedCollectionId !== initialCollection.id)
  ) {
    return {
      activeKind: initialCollection.kind,
      selectedCollectionId: initialCollection.id,
    };
  }

  const targetKind = routeKind ?? activeKind;
  const selectedCollection = selectedCollectionId
    ? collections.find((collection) => collection.id === selectedCollectionId)
    : null;

  if (
    selectedCollection &&
    selectedCollection.kind === targetKind &&
    activeKind === targetKind
  ) {
    return null;
  }

  const targetCollection =
    collections.find((collection) => collection.kind === targetKind) ??
    (routeKind ? null : collections[0]) ??
    null;
  const nextActiveKind = targetCollection?.kind ?? targetKind;
  const nextSelectedCollectionId = targetCollection?.id ?? null;

  if (
    activeKind === nextActiveKind &&
    selectedCollectionId === nextSelectedCollectionId
  ) {
    return null;
  }

  return {
    activeKind: nextActiveKind,
    selectedCollectionId: nextSelectedCollectionId,
  };
}

export function getSelectedCollectionIdAfterDelete(
  collections: LibraryCollection[],
  activeKind: LibraryKind,
  deletedCollectionId: string,
  selectedCollectionId: string,
) {
  if (selectedCollectionId !== deletedCollectionId) {
    return selectedCollectionId;
  }

  return (
    collections.find(
      (collection) =>
        collection.kind === activeKind && collection.id !== deletedCollectionId,
    )?.id ?? null
  );
}

export function parseLibraryKindParam(kind: string | null) {
  return LIBRARY_KINDS.includes(kind as LibraryKind)
    ? (kind as LibraryKind)
    : undefined;
}

export function getLibraryItemInstantInputId(type: LibraryItemType) {
  switch (type) {
    case "link":
      return "library-item-url";
    case "note":
      return "library-item-note";
    case "file":
      return "library-item-file";
  }
}

function LibraryItemsList({
  isLoading,
  items,
  onPickItemType,
}: {
  isLoading: boolean;
  items: LibraryItem[] | undefined;
  onPickItemType: (type: LibraryItemType) => void;
}) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [filter, setFilter] = React.useState<LibraryDisplayType>("all");
  const updateItem = useMutation(
    api.library.updateItem.mutationOptions({
      onSuccess: () => {
        setEditingId(null);
        void queryClient.invalidateQueries(api.library.listItems.pathFilter());
      },
    }),
  );
  const deleteItem = useMutation(
    api.library.deleteItem.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(api.library.listItems.pathFilter());
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="mt-4 rounded-md border p-3 text-sm text-muted-foreground">
        正在加载资料...
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="mt-4 grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-3">
        <button
          className="flex min-h-[104px] flex-col justify-between rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/60"
          onClick={() => onPickItemType("link")}
          type="button"
        >
          <Link className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">放链接</span>
        </button>
        <button
          className="flex min-h-[104px] flex-col justify-between rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/60"
          onClick={() => onPickItemType("note")}
          type="button"
        >
          <NotebookPen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">写笔记</span>
        </button>
        <button
          className="flex min-h-[104px] flex-col justify-between rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/60"
          onClick={() => onPickItemType("file")}
          type="button"
        >
          <ImageIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">传文件</span>
        </button>
      </div>
    );
  }

  function startEditing(item: LibraryItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.type === "link" ? (item.url ?? "") : (item.note ?? ""));
  }

  function saveEditing(item: LibraryItem) {
    updateItem.mutate({
      itemId: item.id,
      title: editTitle,
      url: item.type === "link" ? editContent : undefined,
      note: item.type === "note" ? editContent : undefined,
    });
  }

  const filteredItems =
    filter === "all"
      ? items
      : items.filter((item) => getLibraryItemDisplayType(item) === filter);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {ITEM_FILTERS.map((itemFilter) => (
          <button
            className={cn(
              "rounded-md border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted/60",
              filter === itemFilter.value && "border-primary bg-primary/10",
            )}
            key={itemFilter.value}
            onClick={() => setFilter(itemFilter.value)}
            type="button"
          >
            {itemFilter.label}
          </button>
        ))}
      </div>
      {filteredItems.length === 0 && (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          当前筛选下没有资料。
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {filteredItems.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div
              className={cn(
                "flex min-h-[190px] flex-col rounded-md border p-3 transition-shadow hover:shadow-sm",
                getItemCardClassName(item),
              )}
              key={item.id}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {getItemIcon(item)}
                {isEditing ? (
                  <Input
                    maxLength={120}
                    onChange={(event) => setEditTitle(event.target.value)}
                    value={editTitle}
                  />
                ) : (
                  <span className="truncate">{item.title}</span>
                )}
              </div>

              {isEditing && item.type !== "file" ? (
                item.type === "link" ? (
                  <Input
                    className="mt-2"
                    maxLength={2048}
                    onChange={(event) => setEditContent(event.target.value)}
                    value={editContent}
                  />
                ) : (
                  <Textarea
                    className="mt-2"
                    maxLength={10000}
                    onChange={(event) => setEditContent(event.target.value)}
                    value={editContent}
                  />
                )
              ) : (
                <LibraryItemPreview item={item} />
              )}

              <div className="mt-auto flex justify-end gap-2 pt-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => saveEditing(item)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="mr-2 h-4 w-4" />
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => startEditing(item)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      编辑
                    </Button>
                    <Button
                      onClick={() => deleteItem.mutate({ itemId: item.id })}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LibraryItemPreview({ item }: { item: LibraryItem }) {
  if (item.type === "link" && item.url) {
    return (
      <a
        className="mt-2 flex items-center gap-1 truncate text-xs text-primary"
        href={item.url}
        rel="noreferrer"
        target="_blank"
      >
        {item.url}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  if (item.type === "file" && item.assetId) {
    const assetUrl = `/api/assets/${item.assetId}`;
    const displayType = getLibraryItemDisplayType(item);

    if (displayType === "image") {
      return (
        <a
          className="mt-3 block overflow-hidden rounded-md border bg-muted"
          href={assetUrl}
          rel="noreferrer"
          target="_blank"
        >
          <NextImage
            alt={item.title}
            className="aspect-video h-full w-full object-cover"
            height={360}
            src={assetUrl}
            unoptimized
            width={640}
          />
        </a>
      );
    }

    if (displayType === "video") {
      return (
        <video
          className="mt-3 aspect-video w-full rounded-md border bg-muted"
          controls
          src={assetUrl}
        >
          <track kind="captions" />
        </video>
      );
    }

    if (displayType === "pdf") {
      return (
        <a
          className="mt-3 flex min-h-[120px] flex-col items-center justify-center rounded-md border bg-muted/40 p-4 text-center text-sm text-primary"
          href={assetUrl}
          rel="noreferrer"
          target="_blank"
        >
          <FileText className="mb-2 h-8 w-8" />
          打开 PDF
          <span className="mt-1 max-w-full truncate text-xs text-muted-foreground">
            {item.fileName ?? item.title}
          </span>
        </a>
      );
    }

    return (
      <a
        className="mt-3 flex min-h-[96px] flex-col items-center justify-center rounded-md border bg-muted/40 p-4 text-center text-sm text-primary"
        href={assetUrl}
        rel="noreferrer"
        target="_blank"
      >
        <FileText className="mb-2 h-7 w-7" />
        打开文件
        <span className="mt-1 max-w-full truncate text-xs text-muted-foreground">
          {item.fileName ?? item.title}
        </span>
      </a>
    );
  }

  return (
    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
      {item.note}
    </p>
  );
}

export function getLibraryItemDisplayType(
  item: Pick<LibraryItem, "type" | "contentType">,
): LibraryDisplayType {
  if (item.type === "link" || item.type === "note") {
    return item.type;
  }

  if (item.contentType?.startsWith("image/")) {
    return "image";
  }
  if (item.contentType?.startsWith("video/")) {
    return "video";
  }
  if (item.contentType === "application/pdf") {
    return "pdf";
  }

  return "file";
}

function getItemCardClassName(item: LibraryItem) {
  switch (getLibraryItemDisplayType(item)) {
    case "link":
      return "bg-blue-50/50 dark:bg-blue-950/20";
    case "image":
      return "bg-emerald-50/50 dark:bg-emerald-950/20";
    case "video":
      return "bg-cyan-50/50 dark:bg-cyan-950/20";
    case "pdf":
      return "bg-amber-50/50 dark:bg-amber-950/20";
    case "note":
      return "bg-violet-50/50 dark:bg-violet-950/20";
    case "file":
      return "bg-muted/30";
    case "all":
      return "bg-card";
  }
}

function getItemIcon(item: LibraryItem) {
  switch (getLibraryItemDisplayType(item)) {
    case "link":
      return <Link className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Play className="h-4 w-4" />;
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "file":
      return <FileText className="h-4 w-4" />;
    case "note":
      return <NotebookPen className="h-4 w-4" />;
    case "all":
      return <FileText className="h-4 w-4" />;
  }
}

function getCollectionIcon(icon: string, className = "h-4 w-4") {
  switch (icon) {
    case "BriefcaseBusiness":
      return <BriefcaseBusiness className={className} />;
    case "PawPrint":
      return <PawPrint className={className} />;
    case "Camera":
      return <Camera className={className} />;
    default:
      return <FileText className={className} />;
  }
}
