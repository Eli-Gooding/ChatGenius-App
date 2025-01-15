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
  users: {
    user_name: string;
    avatar_url: string | null;
  };
  reactions: DatabaseReaction[] | null;
  has_reply: boolean;
}

interface SupabaseMessageResponse {
  data: DatabaseMessageRow[];
  error: any;
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
  context?: {
    content: string;
    metadata: Record<string, any>;
  }[];
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
  isAIAssistant?: boolean;
}

function ChatArea({ channelName, userName, channelId, isDirectMessage, isAIAssistant }: ChatAreaProps) {
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
    if (!channelId && !isAIAssistant) return;
    
    if (isAIAssistant) {
      // For AI Assistant, we'll load messages from local storage
      const storedMessages = localStorage.getItem('ai_assistant_messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
      setIsLoading(false);
      return;
    }

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

              const newMessage: Message = {
                id: payload.new.id,
                user_id: payload.new.user_id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                has_reply: payload.new.has_reply || false,
                replies: [],
                reactions: {},
                user: {
                  user_name: userData.user_name,
                  avatar_url: userData.avatar_url
                }
              };

              setMessages(prev => [...prev, newMessage]);
              
              if (shouldScrollToBottom) {
                scrollToBottom();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, isAIAssistant]);

  // Save AI Assistant messages to local storage
  useEffect(() => {
    if (isAIAssistant && messages.length > 0) {
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
    }
  }, [messages, isAIAssistant]);

  const fetchMessages = async () => {
    if (!channelId) return;

    try {
      setIsLoading(true);
      saveScrollPosition();

      // Get messages with user data
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          has_reply,
          users (
            user_name,
            avatar_url
          ),
          reactions (
            emoji,
            user_id
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_message_id', null)
        .order('created_at') as SupabaseMessageResponse;

      if (messagesError) {
        toast.error('Error loading messages: ' + messagesError.message);
        return;
      }

      // Transform the data into our Message type
      const transformedMessages: Message[] = (messagesData || []).map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        has_reply: msg.has_reply || false,
        replies: [],
        user: {
          user_name: msg.users.user_name,
          avatar_url: msg.users.avatar_url
        },
        reactions: msg.reactions?.reduce((acc: { [key: string]: number }, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {})
      }));

      setMessages(transformedMessages);
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
    try {
      const { data: repliesData, error: repliesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            user_name,
            avatar_url
          ),
          reactions (
            emoji,
            user_id
          )
        `)
        .eq('parent_message_id', threadMessageId)
        .order('created_at') as SupabaseMessageResponse;

      if (repliesError) {
        toast.error('Error loading replies: ' + repliesError.message);
        return [];
      }

      return (repliesData || []).map(reply => ({
        id: reply.id,
        user_id: reply.user_id,
        content: reply.content,
        created_at: reply.created_at,
        user: {
          user_name: reply.users.user_name,
          avatar_url: reply.users.avatar_url
        },
        replies: [],
        reactions: reply.reactions?.reduce((acc: { [key: string]: number }, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {})
      }));
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };

  const handleOpenThread = async (message: Message) => {
    const replies = await fetchThreadReplies(message.id);
    message.replies = replies;
    setActiveThread({ ...message });
  };

  const toggleEmoji = async (messageId: string, emoji: string) => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to react to messages');
        return;
      }

      // Check if user has already reacted with this emoji
      const { data: existingReaction, error: checkError } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', session.user.id)
        .eq('emoji', emoji)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        toast.error('Error checking reaction: ' + checkError.message);
        return;
      }

      if (existingReaction) {
        // Remove reaction
        const { error: deleteError } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          toast.error('Error removing reaction: ' + deleteError.message);
          return;
        }
      } else {
        // Add reaction
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: session.user.id,
            emoji: emoji
          });

        if (insertError) {
          toast.error('Error adding reaction: ' + insertError.message);
          return;
        }
      }

      // Update the message in state
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (existingReaction) {
            reactions[emoji] = (reactions[emoji] || 1) - 1;
            if (reactions[emoji] === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji] = (reactions[emoji] || 0) + 1;
          }
          return { ...msg, reactions };
        }
        return msg;
      }));

      // If the message is in a thread, update the thread state too
      if (activeThread?.id === messageId) {
        setActiveThread(prev => {
          if (!prev) return null;
          const reactions = { ...prev.reactions };
          if (existingReaction) {
            reactions[emoji] = (reactions[emoji] || 1) - 1;
            if (reactions[emoji] === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji] = (reactions[emoji] || 0) + 1;
          }
          return { ...prev, reactions };
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b p-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-semibold">
            {isDirectMessage ? otherUserName : channelName}
          </h2>
          {!isAIAssistant && (
            <p className="text-sm text-gray-500">
              {isDirectMessage ? 'Direct Message' : 'Channel'}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className={`flex-1 flex flex-col min-h-0 ${activeThread ? 'border-r' : ''}`}>
          <ScrollArea className="flex-1 min-h-0 overflow-auto">
            <div ref={viewportRef} className="p-4 space-y-4">
              {isLoading ? (
                <div className="text-center">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  {isAIAssistant 
                    ? "Ask me anything about your workspace's conversations and files!"
                    : "No messages yet"}
                </div>
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
          </ScrollArea>
          <div className="shrink-0 border-t">
            <MessageInput
              placeholder={isAIAssistant 
                ? "Ask me anything about your workspace..."
                : "Type a message..."}
              channelId={channelId}
              onMessageSent={fetchMessages}
              isAIAssistant={isAIAssistant}
              setMessages={setMessages}
            />
          </div>
        </div>
        {activeThread && (
          <div className="w-96 flex flex-col min-h-0">
            <div className="border-b p-4 flex justify-between items-center shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Thread</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveThread(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0 overflow-auto">
              <div className="p-4 space-y-4">
                <MessageItem
                  message={activeThread}
                  toggleEmoji={toggleEmoji}
                  openThread={handleOpenThread}
                  isThreadView
                />
                {activeThread.replies.map((reply) => (
                  <MessageItem
                    key={reply.id}
                    message={reply}
                    toggleEmoji={toggleEmoji}
                    openThread={handleOpenThread}
                    isThreadView
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="shrink-0 border-t">
              <MessageInput
                placeholder="Reply to thread..."
                channelId={channelId}
                parentMessageId={activeThread.id}
                onMessageSent={() => handleOpenThread(activeThread)}
              />
            </div>
          </div>
        )}
      </div>
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
  isAIAssistant?: boolean;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

function MessageInput({ placeholder, channelId, parentMessageId, onMessageSent, isAIAssistant, setMessages }: MessageInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const supabase = createClientComponentClient();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline
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

  // Load messages from localStorage on mount
  useEffect(() => {
    if (isAIAssistant) {
      const storedMessages = localStorage.getItem('ai_assistant_messages');
      if (storedMessages) {
        const messages = JSON.parse(storedMessages);
        setLocalMessages(messages);
        if (setMessages) {
          setMessages(messages);
        }
      }
    }
  }, [isAIAssistant, setMessages]);

  const sendMessage = async () => {
    if (!editor?.getText().trim()) return;
    
    setIsSending(true);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to send messages');
        return;
      }

      const content = editor.getText().trim();

      if (isAIAssistant && setMessages) {
        try {
          // Add user message to state first
          const userMessage: Message = {
            id: crypto.randomUUID(),
            user_id: session.user.id,
            content: content,
            created_at: new Date().toISOString(),
            user: {
              user_name: 'You',
              avatar_url: null
            },
            replies: []
          };

          setMessages(prev => [...prev, userMessage]);

          // Get AI response
          const response = await fetch('/api/ai-assistant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: content
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to get AI response');
          }

          // Add AI response to state
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            user_id: 'ai-assistant',
            content: data.response,
            created_at: new Date().toISOString(),
            user: {
              user_name: 'AI Assistant',
              avatar_url: null
            },
            replies: [],
            context: data.context
          };

          setMessages(prev => [...prev, aiMessage]);

          // Save messages to local storage
          const updatedMessages = [...localMessages, userMessage, aiMessage];
          setLocalMessages(updatedMessages);
          localStorage.setItem('ai_assistant_messages', JSON.stringify(updatedMessages));
        } catch (error) {
          console.error('Error getting AI response:', error);
          let errorMessage = 'Failed to get AI response';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          toast.error(errorMessage);
          // Remove the user message if AI response fails
          setMessages(prev => prev.slice(0, -1));
        }
      } else {
        // Handle regular channel messages
        const { error } = await supabase
          .from('messages')
          .insert({
            channel_id: channelId,
            user_id: session.user.id,
            content: content,
            parent_message_id: parentMessageId
          });

        if (error) {
          toast.error('Error sending message: ' + error.message);
          return;
        }

        if (parentMessageId) {
          // Update has_reply flag on parent message
          await supabase
            .from('messages')
            .update({ has_reply: true })
            .eq('id', parentMessageId);
        }
      }

      editor.commands.setContent('');
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
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

