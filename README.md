# Chat Genius

A real-time messaging platform for teams and businesses, featuring organized channels, real-time messaging, file sharing, and emoji reactions.

## Features

- 💬 Real-time messaging with threaded conversations
- 📂 Channel management with public and private options
- 👥 User presence and status indicators
- 🎯 Emoji reactions and message interactions
- 📁 File sharing and search capabilities
- 🔒 Secure authentication with Supabase Auth
- 📱 Mobile-first, responsive design

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (AWS S3)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-genius.git
cd chat-genius
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
chat-genius/
├── public/
│   └── assets/                # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   ├── forms/            # Form components
│   │   ├── messages/         # Message components
│   │   └── modals/           # Modal components
│   ├── pages/                # Next.js pages
│   ├── context/              # React context
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities
│   ├── styles/               # Global styles
│   └── types/                # TypeScript types
```

## Development

- Follow the Airbnb JavaScript Style Guide
- Use ESLint and Prettier for code formatting
- Write descriptive comments and maintain clear documentation
- Follow semantic versioning for all internal APIs

## Testing

```bash
# Run unit tests
npm run test
# or
yarn test

# Run e2e tests
npm run test:e2e
# or
yarn test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 