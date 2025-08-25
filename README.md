#Vortexa - AI-Powered Chat Assistant

An intelligent AI chatbot assistant with multi-model support, built using React, TypeScript, and various AI providers.

## 🚀 Features

- 🤖 **Multi-Model AI Support**: Support for Gemini 1.5 Flash, Claude Haiku, and GLM-4.5 Flash
- 💬 **Real-time Chat Interface**: Responsive and modern chat interface
- 📱 **Responsive Design**: Optimized for desktop and mobile
- 🎨 **Modern UI**: Uses Tailwind CSS with shadcn/ui components
- 🔄 **Model Switching**: Switch between AI models in real-time
- 💾 **Conversation Management**: Manage conversation history
- ⚡ **Serverless Deployment**: Easy deployment to Netlify

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **AI Models**:
- Google Gemini 1.5 Flash
- Anthropic Claude Haiku 
- Zhipu GLM-4.5 Flash
- **Build Tool**: Vite
- **Deployment**: Netlify Functions (Serverless)
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- Node.js 20+
- API Keys for AI models: 
- Google API Key (for Gemini) 
- Anthropic API Key (for Claude) 
- Zhipu AI API Key (for GLM)

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone <repository-url>
Vortex CD
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
Create a `.env` file in the root directory:
```bash
# Required - Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# Optional - Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional - Zhipu GLM API
ZHIPUAI_API_KEY=your_zhipu_api_key_here
```

### 4. Development
```bash
npm run dev
```

The application will run at [http://localhost:5000](http://localhost:5000)

## 🌐 Deployments

### Netlify Deployment

1. **Connect Repository**: Connect the repository to Netlify
2. **Build Settings**: 
- Build command: `npm run build:netlify` 
- Publish directory: `dist/public`
3. **Environment Variables**: Set API keys in Netlify dashboard: 
``` 
GOOGLE_API_KEY=your_key 
ANTHROPIC_API_KEY=your_key (optional) 
ZHIPUAI_API_KEY=your_key (optional) 
```
4. **Deploy**: Deploy automatically every push to the main branch

### Manual Build
```bash
npm run build:netlify
```

## 🤖 Supported AI Models

### Gemini 1.5 Flash (Default)
- **Provider**: Google AI
- **Features**: Fast responses, multimodal support
- **Required**: `GOOGLE_API_KEY`

### Claude Haiku
- **Provider**: Anthropic
- **Features**: High-quality reasoning, creative writing
- **Required**: `ANTHROPIC_API_KEY`

### GLM-4.5 Flash
- **Provider**: Zhipu AI
- **Features**: Multilingual support, competitive performance
- **Required**: `ZHIPUAI_API_KEY`

## 📁 Project Structure

```
vortexa/
├── client/ # Frontend React application
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ │ ├── ui/ # shadcn/ui components
│ │ │ ├── ChatInput.tsx
│ │ │ ├── ChatMessage.tsx
│ │ │ ├── ModelSelector.tsx
│ │ │ └── ...
│ │ ├── pages/ # Page components
│ │ │ ├── chat.tsx
│ │ │ ├── landing.tsx
│ │ │ └── not-found.tsx
│ │ ├── hooks/ # Custom React hooks
│ │ ├── lib/ # Utility functions
│ │ └── App.tsx
│ └── index.html
├── netlify/
│ └── functions/ # Serverless functions
│ ├── chat.js # Main chat API
│ └── api.js # Additional APIs
├── servers/ # Backend services (dev only)
│ ├── services/ # AI service integrations
│ │ ├── gemini.ts
│ │ ├── claude.ts
│ │ └── glm.ts
│ └── ...
├── shared/ # Shared types and schemas
└── attached_assets/ # Static assets
```

## 🔧 Configuration

### Model Configuration
Models can be configured in `client/src/components/ModelSelector.tsx`:

```typescript
const models = [ 
{ id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' }, 
{ id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic' }, 
{ id: 'glm-4.5-flash', name: 'GLM-4.5 Flash', provider: 'Zhipu AI' }
];
```

### API Endpoints
- `POST /.netlify/functions/chat` - Send message and get AI response
- `GET /.netlify/functions/api` - Additional API endpoints

## 🎨 Customization

### Styling
- Main file: `client/src/index.css`
- Themes can be changed in `tailwind.config.ts`
- Custom components in `client/src/components/ui/`

### Adding New AI Models
1. Create a new service in `server/services/`
2. Update `netlify/functions/chat.js`
3. Add the model to `ModelSelector.tsx`

## 🔐 Environment Variables

| Variables | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic Claude API key |
| `ZHIPUAI_API_KEY` | ✅ | Zhipu GLM API key |

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production with backend
- `npm run build:netlify` - Build for Netlify deployment
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Anthropic Claude](https://www.anthropic.com/) for advanced reasoning
- [Zhipu AI](https://www.zhipuai.cn/) for multilingual support
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling system

---

Created by Muhammad Yusuf Aditiya
