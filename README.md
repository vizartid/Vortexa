# Vortexa - AI-Powered Chat Assistant

Asisten chatbot AI yang cerdas dengan dukungan multi-model, dibangun menggunakan React, TypeScript, dan berbagai AI provider.

## 🚀 Fitur

- 🤖 **Multi-Model AI Support**: Dukungan untuk Gemini 1.5 Flash, Claude Haiku, dan GLM-4.5 Flash
- 💬 **Real-time Chat Interface**: Antarmuka chat yang responsif dan modern
- 📱 **Responsive Design**: Dioptimalkan untuk desktop dan mobile
- 🎨 **Modern UI**: Menggunakan Tailwind CSS dengan shadcn/ui components
- 🔄 **Model Switching**: Dapat beralih antar model AI secara real-time
- 💾 **Conversation Management**: Manajemen riwayat percakapan
- ⚡ **Serverless Deployment**: Deploy mudah ke Netlify

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **AI Models**: 
  - Google Gemini 1.5 Flash
  - Anthropic Claude Haiku
  - Zhipu GLM-4.5 Flash
- **Build Tool**: Vite
- **Deployment**: Netlify Functions (Serverless)
- **Styling**: Tailwind CSS dengan custom animations

## 📋 Prerequisites

- Node.js 20+
- API Keys untuk AI models:
  - Google API Key (untuk Gemini)
  - Anthropic API Key (untuk Claude)
  - Zhipu AI API Key (untuk GLM)

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone <repository-url>
cd vortexa
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
Buat file `.env` di root directory:
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

Aplikasi akan berjalan di [http://localhost:5000](http://localhost:5000)

## 🌐 Deployment

### Netlify Deployment

1. **Connect Repository**: Hubungkan repository ke Netlify
2. **Build Settings**:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/public`
3. **Environment Variables**: Set API keys di Netlify dashboard:
   ```
   GOOGLE_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key (optional)
   ZHIPUAI_API_KEY=your_key (optional)
   ```
4. **Deploy**: Deploy otomatis setiap push ke main branch

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
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── chat.tsx
│   │   │   ├── landing.tsx
│   │   │   └── not-found.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx
│   └── index.html
├── netlify/
│   └── functions/          # Serverless functions
│       ├── chat.js         # Main chat API
│       └── api.js          # Additional APIs
├── server/                 # Backend services (dev only)
│   ├── services/           # AI service integrations
│   │   ├── gemini.ts
│   │   ├── claude.ts
│   │   └── glm.ts
│   └── ...
├── shared/                 # Shared types and schemas
└── attached_assets/        # Static assets
```

## 🔧 Configuration

### Model Configuration
Models dapat dikonfigurasi di `client/src/components/ModelSelector.tsx`:

```typescript
const models = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
  { id: 'claude-3-haiku', name: 'Claude Haiku', provider: 'Anthropic' },
  { id: 'glm-4.5-flash', name: 'GLM-4.5 Flash', provider: 'Zhipu AI' }
];
```

### API Endpoints
- `POST /.netlify/functions/chat` - Send message dan dapatkan AI response
- `GET /.netlify/functions/api` - Additional API endpoints

## 🎨 Customization

### Styling
- File utama: `client/src/index.css`
- Tema dapat diubah di `tailwind.config.ts`
- Custom components di `client/src/components/ui/`

### Adding New AI Models
1. Buat service baru di `server/services/`
2. Update `netlify/functions/chat.js`
3. Tambahkan model ke `ModelSelector.tsx`

## 🔐 Environment Variables

| Variable | Required | Description |
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

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) untuk AI capabilities
- [Anthropic Claude](https://www.anthropic.com/) untuk advanced reasoning
- [Zhipu AI](https://www.zhipuai.cn/) untuk multilingual support
- [shadcn/ui](https://ui.shadcn.com/) untuk UI components
- [Tailwind CSS](https://tailwindcss.com/) untuk styling system

---

Dibuat oleh Muhammad Yusuf Aditiya 
