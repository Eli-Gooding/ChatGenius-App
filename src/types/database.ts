export interface Channel {
  id: string
  created_at: string
  name: string
  description?: string
}

export interface Message {
  id: string
  created_at: string
  content: string
  channel_id: string
  user_id: string
  user: {
    id: string
    email: string
    display_name: string
    avatar_url?: string
  }
}

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  updated_at: string
} 