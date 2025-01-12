import { ChannelContent } from "@/components/channel-content"
import { Suspense } from "react"

type PageProps = {
  params: Promise<{
    workspaceId: string;
    channelId: string;
  }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ChannelPage(props: PageProps) {
  const { workspaceId, channelId } = await props.params;
  
  return (
    <Suspense>
      <ChannelContent 
        workspaceId={workspaceId} 
        channelId={channelId} 
      />
    </Suspense>
  );
}

