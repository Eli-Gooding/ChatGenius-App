"use client"

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, LinkIcon, Smile, Paperclip, MessageSquare, X, Send, Code, Underline as UnderlineIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReactMarkdown from 'react-markdown'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Editor as TipTapEditor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

interface MessageUser {
  user_name: string;
  avatar_url: string | null;
}

interface DatabaseReaction {
  emoji: string;
  user_id: string;
}

interface DatabaseMessageRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: MessageUser;
  reactions: DatabaseReaction[] | null;
  has_reply: boolean;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: MessageUser;
  replies: Message[];
  reactions?: { [key: string]: number };
  has_reply?: boolean;
}

interface MembershipWithUser {
  user_id: string;
  users: {
    id: string;
    user_name: string;
  };
}

interface ChatAreaProps {
  channelName?: string;
  userName?: string;
  channelId?: string;
  isDirectMessage?: boolean;
}

function ChatArea({ channelName, userName, channelId, isDirectMessage }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const lastScrollPosition = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);
  const supabase = createClientComponentClient();

  // Fetch the other user's name for DMs
  useEffect(() => {
    const fetchDMUserName = async () => {
      if (!channelId || !isDirectMessage) return;

      try {
        // Get current user's session
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (!session) return;

        console.log('Current user ID:', session.user.id);

        // First get the memberships with user data
        const { data: memberships, error: membershipError } = await supabase
          .from('memberships')
          .select(`
            user_id,
            users (
              id,
              user_name
            )
          `)
          .eq('channel_id', channelId)
          .returns<MembershipWithUser[]>();

        if (membershipError || !memberships) {
          console.error('Error fetching memberships:', membershipError);
          return;
        }

        console.log('Memberships data:', memberships);

        // If it's a self DM (only one member)
        if (memberships.length === 1) {
          const member = memberships[0];
          setOtherUserName(`${member.users.user_name} (You)`);
          return;
        }

        // For regular DMs, find the other user
        const otherMember = memberships.find(m => m.user_id !== session.user.id);
        if (!otherMember) {
          console.error('Could not find other member in DM');
          return;
        }

        console.log('Other member:', otherMember);
        setOtherUserName(otherMember.users.user_name);
      } catch (error) {
        console.error('Error fetching DM user:', error);
      }
    };

    fetchDMUserName();
  }, [channelId, isDirectMessage]);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (viewportRef.current) {
      const viewport = viewportRef.current;
      requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
      });
    }
  };

  // Save scroll position before updates
  const saveScrollPosition = () => {
    if (viewportRef.current) {
      lastScrollPosition.current = viewportRef.current.scrollTop;
    }
  };

  // Restore scroll position after updates
  const restoreScrollPosition = () => {
    if (viewportRef.current) {
      requestAnimationFrame(() => {
        if (isInitialLoad.current || shouldScrollToBottom) {
          scrollToBottom();
          isInitialLoad.current = false;
        } else {
          viewportRef.current!.scrollTop = lastScrollPosition.current;
        }
      });
    }
  };

  // Function to check if scroll is near bottom
  const isNearBottom = () => {
    const viewport = viewportRef.current;
    if (!viewport) return true;
    
    const threshold = 100; // pixels from bottom
    const scrollBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    return scrollBottom < threshold;
  };

  // Handle all scroll events
  const handleScroll = () => {
    if (viewportRef.current) {
      setShouldScrollToBottom(isNearBottom());
      lastScrollPosition.current = viewportRef.current.scrollTop;
    }
  };

  // Scroll management after message updates
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      restoreScrollPosition();
    }
  }, [messages, isLoading]);

  // Reset scroll state when changing channels
  useEffect(() => {
    isInitialLoad.current = true;
    setShouldScrollToBottom(true);
  }, [channelId]);

  // Add scroll event listener
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!channelId) return;
    
    console.log('Setting up real-time subscription for channel:', channelId);
    
    // Initial fetch of messages
    fetchMessages();

    // Subscribe to new messages and reactions
    const channel = supabase
      .channel(`room-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          console.log('Message change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('New message received:', payload.new);
            
            // Only update main message list if it's a root message
            if (!payload.new.parent_message_id) {
              // Get the user data in parallel with handling the message
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_name, avatar_url')
                .eq('id', payload.new.user_id)
                .single();

              if (userError) {
                console.error('Error fetching user data:', userError);
                return;
              }

              console.log('User data fetched:', userData);

              const newMessage: Message = {
                id: payload.new.id,
                user_id: payload.new.user_id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                has_reply: payload.new.has_reply || false,
                replies: [],
                reactions: {},
                user: userData
              };

              console.log('Adding new message to state:', newMessage);
              setMessages(prev => {
                // Check if message already exists
                if (prev.some(msg => msg.id === newMessage.id)) {
                  console.log('Message already exists, skipping...');
                  return prev;
                }
                return [...prev, newMessage];
              });
            } else if (activeThread && payload.new.parent_message_id === activeThread.id) {
              // If it's a reply to the active thread, refresh thread replies
              const replies = await fetchThreadReplies(activeThread.id);
              setActiveThread(prev => prev ? { ...prev, replies } : null);
              // Also refresh the main messages to update has_reply status
              fetchMessages();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `message_id=in.(${messages.map(m => m.id).join(',')})`
        },
        (payload) => {
          console.log('Reaction change received:', payload);
          // Refresh messages to get updated reactions
          fetchMessages();
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error:', err);
          // Attempt to resubscribe after a delay
          setTimeout(() => {
            console.log('Attempting to resubscribe...');
            channel.subscribe();
          }, 1000);
        }
        if (status === 'TIMED_OUT') {
          console.error('Subscription timed out, reconnecting...');
          channel.subscribe();
        }
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up subscription for channel:', channelId);
      channel.unsubscribe();
    };
  }, [channelId, messages]); // Added messages to dependency array for reactions filter

  const fetchMessages = async () => {
    if (!channelId) return;
    
    try {
      console.log('Fetching messages for channel:', channelId);
      saveScrollPosition();
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to view messages');
        return;
      }

      const { data: rawData, error } = await supabase
        .from('messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          has_reply,
          users:users!messages_user_id_fkey (
            user_name,
            avatar_url
          ),
          reactions (
            emoji,
            user_id
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_message_id', null) // Only fetch root messages
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Error loading messages: ' + error.message);
        return;
      }

      console.log('Fetched messages:', rawData);
      const messagesData = rawData as unknown as DatabaseMessageRow[];
      const newMessages = messagesData.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        has_reply: msg.has_reply,
        replies: [],
        reactions: msg.reactions?.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        user: msg.users
      }));

      setMessages(newMessages);
    } catch (error) {
      console.error('Fetch error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreadReplies = async (threadMessageId: string): Promise<Message[]> => {
    if (!channelId) return [];
    
    try {
      const { data: rawData, error } = await supabase
        .from('messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          users:users!messages_user_id_fkey (
            user_name,
            avatar_url
          ),
          reactions (
            emoji,
            user_id
          )
        `)
        .eq('channel_id', channelId)
        .eq('parent_message_id', threadMessageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread replies:', error);
        toast.error('Error loading replies: ' + error.message);
        return [];
      }

      const messagesData = rawData as unknown as DatabaseMessageRow[];
      return messagesData.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        replies: [],
        reactions: msg.reactions?.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        user: msg.users
      })) as Message[];
    } catch (error) {
      console.error('Fetch thread replies error:', error);
      return [];
    }
  };

  // Modify the setActiveThread to fetch replies when opening a thread
  const handleOpenThread = async (message: Message) => {
    const replies = await fetchThreadReplies(message.id);
    setActiveThread({
      ...message,
      replies
    });
  };

  const toggleEmoji = async (messageId: string, emoji: string) => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to react to messages');
        return;
      }

      const { data: existingReaction } = await supabase
        .from('reactions')
        .select()
        .eq('message_id', messageId)
        .eq('user_id', session.user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', session.user.id)
          .eq('emoji', emoji);
      } else {
        // Add reaction
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: session.user.id,
            emoji: emoji
          });
      }

      // Refresh messages to get updated reactions
      fetchMessages();
    } catch (error) {
      console.error('Reaction error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const placeholder = isDirectMessage 
    ? `Message ${otherUserName || userName || '...'}`
    : channelName 
      ? `Message #${channelName}` 
      : 'Message';

  return (
    <div className="flex-1 flex bg-white h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full">
              <div className="space-y-4 p-4">
                {isLoading ? (
                  <div className="text-center text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">No messages yet</div>
                ) : (
                  messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      toggleEmoji={toggleEmoji}
                      openThread={handleOpenThread}
                    />
                  ))
                )}
              </div>
            </ScrollAreaPrimitive.Viewport>
          </ScrollArea>
        </div>
        <MessageInput 
          placeholder={placeholder} 
          channelId={channelId} 
          onMessageSent={() => {
            setShouldScrollToBottom(true);
            fetchMessages();
          }}
        />
      </div>
      {activeThread && (
        <div className="w-96 flex flex-col border-l">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Thread</h3>
            <Button variant="ghost" size="icon" onClick={() => setActiveThread(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <ScrollAreaPrimitive.Viewport className="h-full w-full">
                <div className="space-y-4 p-4">
                  <MessageItem
                    message={activeThread}
                    toggleEmoji={toggleEmoji}
                    openThread={handleOpenThread}
                    isThreadView
                  />
                  {activeThread.replies?.map((reply) => (
                    <MessageItem
                      key={reply.id}
                      message={reply}
                      toggleEmoji={toggleEmoji}
                      openThread={handleOpenThread}
                      isThreadView
                    />
                  ))}
                </div>
              </ScrollAreaPrimitive.Viewport>
            </ScrollArea>
          </div>
          <MessageInput 
            placeholder="Reply in thread" 
            channelId={channelId}
            parentMessageId={activeThread.id}
            onMessageSent={fetchMessages}
          />
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  toggleEmoji: (messageId: string, emoji: string) => void;
  openThread: (message: Message) => void;
  isThreadView?: boolean;
}

function MessageItem({ message, toggleEmoji, openThread, isThreadView }: MessageItemProps) {
  return (
    <div className="flex items-start gap-4 group">
      <Avatar>
        <AvatarImage src={message.user.avatar_url || undefined} />
        <AvatarFallback>{message.user.user_name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-900">{message.user.user_name}</div>
          <div className="text-xs text-gray-500">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
        <div className="text-sm text-gray-700">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {message.reactions && Object.entries(message.reactions).map(([emoji, count]) => (
            <Button key={emoji} variant="ghost" size="sm" onClick={() => toggleEmoji(message.id, emoji)}>
              {emoji} {count}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <Smile className="h-4 w-4 mr-1" />
                React
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-8 gap-2">
                {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                  <Button key={emoji} variant="ghost" size="sm" onClick={() => toggleEmoji(message.id, emoji)}>
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100"
            onClick={() => openThread(message)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
          {!isThreadView && message.has_reply && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
              onClick={() => openThread(message)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              See Replies
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageInputProps {
  placeholder: string;
  channelId?: string;
  parentMessageId?: string;
  onMessageSent: () => void;
}

function MessageInput({ placeholder, channelId, parentMessageId, onMessageSent }: MessageInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClientComponentClient();

  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Underline.configure(),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[60px] px-3 py-2',
      },
    },
    content: '',
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  const sendMessage = async () => {
    if (!editor?.getText().trim() || !channelId) return;

    try {
      setIsSending(true);
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to send messages');
        return;
      }

      // Convert the rich text content to markdown
      const markdown = editor.getHTML()
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<u>/g, '__')
        .replace(/<\/u>/g, '__')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .trim();

      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          user_id: session.user.id,
          content: markdown,
          parent_message_id: parentMessageId
        });

      if (error) {
        toast.error('Error sending message: ' + error.message);
        return;
      }

      editor?.commands.setContent('');
      onMessageSent();
    } catch (error) {
      console.error('Send error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const applyFormatting = (format: string) => {
    if (!editor) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && editor?.isFocused) {
        e.preventDefault();
        sendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  return (
    <div className="p-4 border-t">
      <div className="mb-2 flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive('bold') ? 'bg-purple-100 text-purple-900' : 'text-purple-700'}`}
            onClick={() => applyFormatting('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive('italic') ? 'bg-purple-100 text-purple-900' : 'text-purple-700'}`}
            onClick={() => applyFormatting('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive('underline') ? 'bg-purple-100 text-purple-900' : 'text-purple-700'}`}
            onClick={() => applyFormatting('underline')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${editor?.isActive('code') ? 'bg-purple-100 text-purple-900' : 'text-purple-700'}`}
            onClick={() => applyFormatting('code')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1"
          onClick={sendMessage}
          disabled={isSending || !editor?.getText().trim()}
        >
          <Send className="h-4 w-4 mr-1" />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <div className={`rounded-lg transition-shadow duration-200 ${
        isFocused || editor?.getText().length
          ? 'ring-2 ring-purple-700'
          : 'ring-1 ring-gray-200'
      }`}>
        <EditorContent 
          editor={editor} 
          className="min-h-[60px] focus-within:outline-none"
        />
      </div>
    </div>
  );
}

export { ChatArea };

