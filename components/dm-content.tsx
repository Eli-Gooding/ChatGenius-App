"use client"

import { useState, useEffect } from 'react'
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ChatArea } from "@/components/chat-area"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface User {
  user_name: string;
}

interface DMChannel {
  id: string;
  other_user_name: string;
}

interface DMContentProps {
  workspaceId: string;
  userId: string;
}

export function DMContent({ workspaceId, userId }: DMContentProps) {
  const [dmChannel, setDmChannel] = useState<DMChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchDMChannel = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please sign in to view messages');
          return;
        }

        // First get the other user's name
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_name')
          .eq('id', userId)
          .single();

        if (userError) {
          toast.error('Error loading user: ' + userError.message);
          return;
        }

        // Then get or create the DM channel
        const { data: dmData, error: dmError } = await supabase
          .rpc('get_or_create_dm_channel', {
            other_user_id: userId,
            workspace_id: workspaceId
          });

        if (dmError) {
          toast.error('Error loading DM channel: ' + dmError.message);
          return;
        }

        setDmChannel({
          id: dmData.channel_id,
          other_user_name: userData.user_name
        });
      } catch (error) {
        console.error('Fetch error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDMChannel();
  }, [userId, workspaceId]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 flex flex-col">
        <Header userName={dmChannel?.other_user_name} />
        <ChatArea 
          userName={dmChannel?.other_user_name}
          channelId={dmChannel?.id}
        />
      </main>
    </div>
  );
} 