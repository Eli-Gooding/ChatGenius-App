# MagicChat

A modern real-time chat application built with Next.js and Supabase.

## Features

- Real-time messaging
- Multiple channels
- User authentication
- Profile customization with avatars
- Modern UI with dark mode

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Real-time**: Supabase Realtime

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/magicchat.git
cd magicchat
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The application uses the following tables in Supabase:

- `profiles`: User profiles with display names and avatars
- `channels`: Chat channels
- `messages`: Chat messages linked to channels and users

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
