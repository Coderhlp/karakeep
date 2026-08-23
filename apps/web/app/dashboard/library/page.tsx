import PersonalLibraryPage from "@/components/dashboard/library/PersonalLibraryPage";
import { LIBRARY_KINDS } from "@karakeep/shared/types/library";
import type { LibraryKind } from "@karakeep/shared/types/library";

export const metadata = {
  title: "个人资料库 | Karakeep",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const initialKind = LIBRARY_KINDS.includes(kind as LibraryKind)
    ? (kind as LibraryKind)
    : undefined;

  return <PersonalLibraryPage initialKind={initialKind} />;
}
