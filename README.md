# ChatGenius

ChatGenius is a modern real-time messaging application built with Next.js, featuring a clean and intuitive interface inspired by popular chat platforms. It provides organized channels, direct messaging, and rich interactive features for effective team communication.

## Features

- 💬 Real-time messaging
- 📂 Organized channels and direct messages
- 🎨 Modern, responsive UI with dark mode support
- 😊 Emoji reactions and threaded conversations
- 🔍 Message search functionality
- 📱 Mobile-friendly design

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide Icons
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ChatGenius-App.git
cd ChatGenius-App
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
chat-genius/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   └── ...        # Feature components
│   ├── app/           # Next.js app router pages
│   ├── lib/           # Utility functions
│   └── styles/        # Global styles
├── public/            # Static assets
└── ...                # Config files
```

## Features in Detail

### Channels
- Create and join channels
- Public and private channel support
- Channel member management
- Real-time message updates

### Direct Messages
- One-on-one conversations
- Online status indicators
- Message read receipts
- Typing indicators

### Message Features
- Rich text formatting
- Emoji reactions
- File attachments
- Thread replies
- Message editing and deletion

### User Interface
- Clean, modern design
- Responsive layout
- Dark mode support
- Customizable themes
- Intuitive navigation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/) 