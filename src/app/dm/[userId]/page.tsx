import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"

export default function DirectMessagePage({ params }: { params: { userId: string } }) {
  return (
    <>
      <Header userName={decodeURIComponent(params.userId)} />
      <ChatArea userName={decodeURIComponent(params.userId)} />
    </>
  )
}

