# Vortexa - AI-Powered Chat Assistant

An intelligent AI chatbot application built with React, Express, and Google Gemini AI.

## Features

- 🤖 AI-powered conversations using Google Gemini
- 💬 Real-time chat interface
- 📁 File upload support (images, documents)
- 💾 Conversation history management
- 📱 Responsive design for mobile and desktop
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini API
- **Storage**: In-memory storage (development)
- **Build Tool**: Vite
- **Deployment**: Netlify (frontend), separate hosting needed for backend

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google API Key for Gemini AI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file in the root directory
   GOOGLE_API_KEY=your_google_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5000](http://localhost:5000) in your browser

## Deployment

### Netlify (Frontend Only)

This project is configured for easy deployment to Netlify:

1. Connect your repository to Netlify
2. Set build command: `npm run build:netlify`
3. Set publish directory: `dist/public`
4. Deploy!

**Note**: The Netlify deployment only includes the frontend. For full functionality including AI chat, you'll need to deploy the backend separately to a service like Railway, Render, or Vercel.

### Full Stack Deployment

For complete functionality, deploy the backend to a Node.js hosting service:

1. **Backend**: Deploy to Railway, Render, or similar
2. **Frontend**: Update API endpoints to point to your backend URL
3. **Environment Variables**: Set `GOOGLE_API_KEY` in your backend hosting service

## Environment Variables

- `GOOGLE_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express application
│   ├── routes.ts           # API routes
│   ├── services/           # External service integrations
│   └── storage.ts          # Data storage layer
├── shared/                 # Shared types and schemas
└── netlify/               # Netlify deployment configuration
```

## API Endpoints

- `GET /api/conversations` - Get user conversations
- `POST /api/chat` - Send message and get AI response
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details