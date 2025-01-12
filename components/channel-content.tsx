"use client"

import { useState, useEffect } from 'react'
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface Channel {
  channel_name: string;
}

interface ChannelContentProps {
  workspaceId: string;
  channelId: string;
}

export function ChannelContent({ workspaceId, channelId }: ChannelContentProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('channel_name')
          .eq('id', channelId)
          .single();

        if (error) {
          toast.error('Error loading channel: ' + error.message);
          return;
        }

        setChannel(data);
      } catch (error) {
        console.error('Fetch error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannel();
  }, [channelId]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 flex flex-col">
        <Header channelName={channel?.channel_name} />
        <ChatArea 
          channelName={channel?.channel_name} 
          channelId={channelId}
        />
      </main>
    </div>
  );
} 