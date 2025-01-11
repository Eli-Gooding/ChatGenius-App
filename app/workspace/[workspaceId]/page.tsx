import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"

export default function WorkspacePage({ params }: { params: { workspaceId: string } }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspaceId={params.workspaceId} />
      <main className="flex-1 flex flex-col">
        <Header />
        <ChatArea />
      </main>
    </div>
  )
}

