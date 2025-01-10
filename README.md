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

### Core
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime

### UI & Styling
- **CSS Framework:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Component Library:** Radix UI
- **Icons:** Lucide Icons
- **Fonts:** Next/Font with Google Fonts

### Utilities
- **Class Utilities:** clsx, tailwind-merge
- **Animations:** tailwindcss-animate
- **Form Validation:** React Hook Form
- **Date Handling:** date-fns

### Development
- **Package Manager:** npm
- **Code Quality:** TypeScript, ESLint
- **Formatting:** Prettier

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
```

3. Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

The project follows a clean and organized structure:

```
chat-genius/
├── src/
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions and configurations
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── migrations/              # Database migrations
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/) 