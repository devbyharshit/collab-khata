# Collab Khata Frontend

This is the frontend application for Collab Khata, built with Next.js 14, TypeScript, and TailwindCSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with mobile-first responsive design
- **UI Components**: shadcn/ui
- **HTTP Client**: Axios
- **Authentication**: JWT tokens with localStorage

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your backend API URL if different from default
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with AuthProvider
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts
│   └── auth-context.tsx  # Authentication context
├── hooks/           # Custom React hooks
│   └── use-api-error.ts  # API error handling hook
├── lib/             # Utilities
│   ├── api-client.ts     # Axios instance with interceptors
│   └── utils.ts          # Utility functions
└── types/           # TypeScript type definitions
    └── index.ts          # Shared types
```

## Authentication

The application uses JWT-based authentication:

- Tokens are stored in localStorage
- API client automatically adds Authorization header
- 401 responses trigger automatic logout and redirect to login
- AuthContext provides authentication state and methods

### Using Authentication

```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  // Use authentication state and methods
}
```

## API Client

The API client is configured with:

- Base URL from environment variable
- Automatic JWT token injection
- Response/request interceptors
- Error handling with structured error format

### Using API Client

```tsx
import apiClient from '@/lib/api-client'

// Make authenticated requests
const response = await apiClient.get('/api/brands')
const data = await apiClient.post('/api/brands', { name: 'Brand Name' })
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: http://localhost:8000)

## Mobile-First Design

The application follows mobile-first responsive design principles:

- TailwindCSS breakpoints for responsive layouts
- Touch-friendly UI components
- Optimized for mobile devices
- Progressive enhancement for larger screens
