import PersonalLibraryPage from "@/components/dashboard/library/PersonalLibraryPage";

export const metadata = {
  title: "集合资料 | Karakeep",
};

export default async function LibraryCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;

  return <PersonalLibraryPage initialCollectionId={collectionId} />;
}
