# QE Nexus - Frontend Client

React-based frontend application for the QE Nexus platform.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework with Typography plugin
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering for AI responses
- **Remark GFM** - GitHub Flavored Markdown support

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Configure environment variables (copy and edit)
cp config.env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Features

- **Dark Mode Interface** - Professional QE-focused design
- **Chat Interface** - ChatGPT-like conversation layout
- **Tools Popup** - Floating dropdown for tool selection
- **Responsive Design** - Works on desktop, tablet, mobile
- **Smooth Animations** - Modern transitions and effects

## 🎯 Components

- `App.jsx` - Main application component
- `ChatMessage.jsx` - Individual chat messages
- `InputSection.jsx` - Input box with tools and send button
- `ToolsPopup.jsx` - Floating tools selection overlay

## 🎨 Design System

### Color Palette
```css
/* QE Nexus Custom Colors */
--qe-primary: #10B981        /* Emerald green */
--qe-bg-primary: #0F172A     /* Slate-900 */
--qe-bg-secondary: #1E293B   /* Slate-800 */
--qe-text-primary: #F8FAFC   /* Slate-50 */
```

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

- **Vite**: Fast development server on port 3000
- **Tailwind**: Custom QE color palette and utilities
- **ESLint**: Code linting with React rules

## 🎯 Available Tools

- 💬 **General Chat** - Default AI assistant
- 📋 **Ask Project** - RAG-powered queries
- ♿ **A11y Audit Agent** - Accessibility testing
- 🏴‍☠️ **Performance Pirate** - Performance testing
- 🔬 **More Tools** - Future integrations

## 🚀 Deployment

```bash
# Build production bundle
npm run build

# Serve built files
npm run preview
```

Built with ❤️ using React and Tailwind CSS
