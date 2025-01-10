"use client"

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, LinkIcon, Smile, Paperclip, MessageSquare, X, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Message {
  id: number;
  user: string;
  content: string;
  timestamp: string;
  replies: Message[];
  reactions?: { [key: string]: number };
}

interface ChatAreaProps {
  channelName?: string;
  userName?: string;
}

export function ChatArea({ channelName, userName }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "User 1",
      content: "This is a sample message in the chat area.",
      timestamp: "12:34 PM",
      replies: [
        {
          id: 4,
          user: "User 2",
          content: "This is a reply to the first message.",
          timestamp: "12:36 PM",
          replies: [],
        },
      ],
    },
    {
      id: 2,
      user: "User 2",
      content: "Here's another message with some content.",
      timestamp: "12:35 PM",
      replies: [],
    },
    {
      id: 3,
      user: "User 3",
      content: "And a third message to show multiple messages.",
      timestamp: "12:36 PM",
      replies: [],
    },
  ]);

  const [activeThread, setActiveThread] = useState<Message | null>(null);

  const placeholder = channelName ? `Message #${channelName}` : `Message ${userName}`;

  const toggleEmoji = (messageId: number, emoji: string) => {
    setMessages(messages.map(message => {
      if (message.id === messageId) {
        const reactions = message.reactions || {};
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...message, reactions };
      }
      return message;
    }));
  };

  const openThread = (message: Message) => {
    setActiveThread(message);
  };

  const closeThread = () => {
    setActiveThread(null);
  };

  return (
    <div className="flex h-full bg-white">
      <div className="flex-1 flex flex-col h-full">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                toggleEmoji={toggleEmoji}
                openThread={openThread}
              />
            ))}
          </div>
        </ScrollArea>
        <MessageInput placeholder={placeholder} />
      </div>
      {activeThread && (
        <div className="w-96 border-l border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Thread</h3>
            <Button variant="ghost" size="icon" onClick={closeThread}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <MessageItem
              message={activeThread}
              toggleEmoji={toggleEmoji}
              openThread={openThread}
              isThreadView
            />
            {activeThread.replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                toggleEmoji={toggleEmoji}
                openThread={openThread}
                isThreadView
              />
            ))}
          </ScrollArea>
          <MessageInput placeholder="Reply in thread" />
        </div>
      )}
    </div>
  )
}

interface MessageItemProps {
  message: Message;
  toggleEmoji: (messageId: number, emoji: string) => void;
  openThread: (message: Message) => void;
  isThreadView?: boolean;
}

function MessageItem({ message, toggleEmoji, openThread, isThreadView }: MessageItemProps) {
  return (
    <div className="flex items-start gap-4 group hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
      <Avatar>
        <AvatarImage src={`/placeholder.svg?${message.user}`} />
        <AvatarFallback>{message.user[0]}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-900">{message.user}</div>
          <div className="text-xs text-gray-500">{message.timestamp}</div>
        </div>
        <div className="text-sm text-gray-700">{message.content}</div>
        <div className="flex items-center gap-2 mt-1">
          {message.reactions && Object.entries(message.reactions).map(([emoji, count]) => (
            <Button key={emoji} variant="ghost" size="sm" onClick={() => toggleEmoji(message.id, emoji)}>
              {emoji} {count}
            </Button>
          ))}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-purple-700 opacity-40 hover:opacity-100">
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
            {!isThreadView && (
              <Button variant="ghost" size="sm" className="text-purple-700 opacity-40 hover:opacity-100" onClick={() => openThread(message)}>
                <MessageSquare className="h-4 w-4 mr-1" />
                {message.replies.length > 0 ? `${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageInput({ placeholder }: { placeholder: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  return (
    <div className="p-4 border-t">
      <div className="mb-2 flex items-center p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
            <Smile className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <div className={`flex-1 rounded-lg transition-shadow duration-200 bg-gray-50 outline-none ${
          isFocused || messageContent.length > 0
            ? 'ring-2 ring-orange-200 shadow-[0_0_8px_4px_rgba(251,146,60,0.08)]'
            : 'ring-1 ring-gray-200'
        }`}>
          <Textarea
            placeholder={placeholder}
            className="border-0 resize-none focus-visible:ring-0 bg-transparent"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="bg-purple-700 hover:bg-purple-800 text-white h-full aspect-square"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

