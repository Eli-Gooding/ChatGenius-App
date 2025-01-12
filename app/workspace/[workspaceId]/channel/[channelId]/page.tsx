import { ChannelContent } from "@/components/channel-content"

interface PageProps {
  params: {
    workspaceId: string;
    channelId: string;
  };
}

export default async function ChannelPage({ params }: PageProps) {
  return <ChannelContent workspaceId={params.workspaceId} channelId={params.channelId} />;
}

