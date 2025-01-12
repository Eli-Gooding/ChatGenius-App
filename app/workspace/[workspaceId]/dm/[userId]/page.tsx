import { DMContent } from "@/components/dm-content"

interface PageProps {
  params: {
    workspaceId: string;
    userId: string;
  };
}

export default async function DirectMessagePage({ params }: PageProps) {
  return <DMContent workspaceId={params.workspaceId} userId={params.userId} />;
}

