# Summit Data Cloud

A decentralized cloud computing platform built on Solana blockchain, offering secure, scalable infrastructure for modern applications.

## Overview

Summit Data Cloud provides enterprise-grade cloud services including compute, storage, and networking capabilities powered by blockchain technology. Our platform enables users to deploy and manage infrastructure with enhanced security and transparency.

## Features

- **Decentralized Compute**: Provision and manage servers on a distributed network
- **Secure Storage**: Blockchain-verified storage solutions with data integrity
- **Real-time Analytics**: Monitor performance and usage metrics
- **Token Rewards**: Stake and earn rewards for participating in the network
- **Developer-Friendly**: Comprehensive API and SDK for seamless integration

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui components
- **Blockchain**: Solana Web3.js, SPL Token
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <your-repository-url>

# Navigate to project directory
cd summit-data-cloud

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Setup

Create a `.env` file in the root directory with your configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## Project Structure

```
summit-data-cloud/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components and routes
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React context providers
│   ├── lib/             # Utility functions
│   └── integrations/    # External service integrations
├── public/              # Static assets
└── supabase/           # Backend functions and migrations
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy the 'dist' folder via Netlify dashboard or CLI
```

### Other Platforms

Build the project and deploy the `dist` folder to any static hosting service.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For questions and support, please contact our team or open an issue in the repository.
