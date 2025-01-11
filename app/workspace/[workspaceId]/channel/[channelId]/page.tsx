import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"

export default function ChannelPage({ params }: { params: { workspaceId: string, channelId: string } }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspaceId={params.workspaceId} />
      <main className="flex-1 flex flex-col">
        <Header channelName={params.channelId} />
        <ChatArea channelName={params.channelId} />
      </main>
    </div>
  )
}

