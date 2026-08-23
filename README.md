# 个人资料库版 Karakeep

这是基于 Karakeep 定制的个人资料库系统，用来把链接、笔记、图片、视频、PDF 和普通文件整理成主题集合。当前版本的重点不是原版的通用书签介绍，而是面向个人项目、宠物资料、日常生活资料的资料库工作流。

## 当前设计

- 中文优先的界面与默认语言。
- 左侧导航新增“个人资料库”入口。
- 资料库首页只展示资料库分类、集合列表和新建集合入口。
- 每个集合使用二级详情页：`/dashboard/library/[collectionId]`。
- 集合详情页只展示当前集合的信息、资料列表、编辑/删除集合，以及添加资料入口。
- 空集合里的“放链接”“写笔记”“传文件”会直接响应：链接和笔记聚焦到当前详情页输入区，文件会直接打开文件选择器。
- 支持三类集合模板：项目素材库、宠物知识库、日常生活库。
- 支持资料类型：链接、笔记、图片、视频、PDF、文件。

## 页面结构

- `/dashboard/library`
  - 资料库概览页
  - 展示分类卡片、当前分类集合、新建集合表单

- `/dashboard/library/[collectionId]`
  - 集合详情页
  - 展示单个集合的资料内容和即时添加表单

## 主要功能

- 新建集合：选择项目、宠物或生活分类，也可以使用灵感卡快速填充名称和描述。
- 管理集合：在集合详情页编辑或删除当前集合。
- 添加资料：
  - 放链接：保存标题和 URL。
  - 写笔记：保存标题和正文。
  - 传文件：上传图片、视频、PDF 或其他文件。
- 浏览资料：根据内容类型展示不同的卡片预览。
- 筛选资料：按全部、链接、笔记、图片、视频、PDF、文件筛选。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- tRPC
- Drizzle ORM
- SQLite
- Vitest
- oxlint / oxfmt

## 本地开发

安装依赖后启动 Web：

```bash
pnpm web
```

常用验证命令：

```bash
pnpm --filter @karakeep/web test -- components/dashboard/library/PersonalLibraryPage.test.ts --run
pnpm --filter @karakeep/web typecheck
pnpm --filter @karakeep/web lint
```

数据库结构更新后运行迁移：

```bash
pnpm db:migrate
```

## 当前版本范围

本版本聚焦个人资料库的核心闭环：

1. 进入资料库首页。
2. 新建主题集合。
3. 打开集合二级详情页。
4. 添加链接、笔记或文件。
5. 在集合内浏览和筛选资料。

后续如果继续扩展，优先考虑集合搜索、批量导入、资料标签和更细的文件预览能力。

## License

本项目继承原 Karakeep 的 AGPL-3.0 许可。
