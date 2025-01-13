import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"
import { notFound } from 'next/navigation'

export default function WorkspacePage({ params }: { params: { workspaceId: string } }) {
  // Validate workspaceId format (should be a UUID)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!params.workspaceId || !UUID_REGEX.test(params.workspaceId)) {
    notFound();
  }

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

