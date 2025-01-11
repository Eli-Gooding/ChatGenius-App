import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  return (
    <>
      <Header channelName={params.channelId} />
      <ChatArea channelName={params.channelId} />
    </>
  )
}

