import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Header />
      <ChatArea />
    </main>
  )
}

