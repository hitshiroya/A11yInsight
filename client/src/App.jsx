import { useState, useRef, useEffect } from 'react'
import { Accessibility } from 'lucide-react'
import ChatMessage from './components/ChatMessage'
import InputSection from './components/InputSection'
import LoadingMessage from './components/LoadingMessage'

const A11Y_WELCOME = `# ♿ A11y Audit Agent

I'm your **accessibility specialist** — I can answer questions about web accessibility *and* run real automated audits on any live webpage.

## Run a live audit:
Share a URL and I'll scan it with axe-core + AI analysis:
\`Audit https://example.com\`
\`Check accessibility for https://github.com\`

## What the audit checks:
• **WCAG 2.1 A/AA compliance** — full axe-core scan
• **Keyboard navigation** — tab order and focus management
• **Screen reader compatibility** — ARIA and semantic HTML
• **Color contrast** — text readability standards
• **Forms & interactive components** — labels and structure

## Ask me anything:
• \`What is WCAG 2.2 and what changed from 2.1?\`
• \`How do I make a modal dialog accessible?\`
• \`What ARIA role should a custom dropdown use?\`
• \`Explain focus management best practices\`

**Ready to make the web more accessible!**`

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: A11Y_WELCOME,
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      let urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/i)
      let extractedUrl = null

      if (urlMatch) {
        extractedUrl = urlMatch[1]
      } else {
        const domainMatch = userMessage.match(/(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/i)
        if (domainMatch) {
          const candidate = `https://${domainMatch[0]}`
          try {
            new URL(candidate)
            extractedUrl = candidate
          } catch {
            // not a valid URL — treat as plain question
          }
        }
      }

      if (extractedUrl) {
        // --- Audit mode: run axe scan + LLM analysis ---
        const auditResponse = await fetch(`${apiUrl}/api/a11y/audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: extractedUrl })
        })

        if (!auditResponse.ok) {
          const errData = await auditResponse.json().catch(() => ({}))
          throw new Error(errData.detail || `Audit failed: ${auditResponse.status}`)
        }

        const auditData = await auditResponse.json()

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          content: auditData.response,
          timestamp: Date.now(),
          metadata: {
            tool: 'a11y-audit',
            url: auditData.url,
            auditResults: auditData.audit,
            llmAnalysis: true
          }
        }])
      } else {
        // --- Chat mode: general a11y Q&A via LLM ---
        const chatResponse = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        })

        if (!chatResponse.ok) {
          const errData = await chatResponse.json().catch(() => ({}))
          throw new Error(errData.detail || `Chat failed: ${chatResponse.status}`)
        }

        const chatData = await chatResponse.json()

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          content: chatData.response,
          timestamp: Date.now(),
          metadata: { tool: 'a11y-chat' }
        }])
      }

      setIsLoading(false)

    } catch (error) {
      console.error('A11y error:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: `Something went wrong: ${error.message}\n\nPlease make sure the backend is running on port 5000.`,
        timestamp: Date.now(),
        error: true
      }])
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const isInitialScreen = messages.length === 1 && messages[0].type === 'ai'

  return (
    <div className="h-screen text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="glass shrink-0">
        <div className="h-16 px-6 flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>
              <Accessibility className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight leading-none">A11y Audit</h1>
              <p className="text-[11px] text-white/50 leading-none mt-0.5">Accessibility Testing Agent</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[12px] text-white/50">Ready</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {isInitialScreen ? (
          /* Initial screen — hero layout */
          <div className="flex-1 overflow-y-auto chat-scrollbar">
            <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col items-center gap-8">
              {/* Hero image */}
              <img
                src="/a11y-hero.png"
                alt="Accessibility audit illustration"
                className="w-full max-w-xl rounded-2xl"
                style={{ boxShadow: '0 0 60px rgba(16,185,129,0.15)' }}
              />
              {/* Welcome card */}
              <div className="glass-strong rounded-2xl px-8 py-6 w-full">
                <ChatMessage message={messages[0]} />
              </div>
            </div>
          </div>
        ) : (
          /* Conversation view */
          <div className="flex-1 overflow-hidden pb-24">
            <div className="max-w-4xl mx-auto px-4 h-full">
              <div className="h-full overflow-y-auto chat-scrollbar py-8 space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <LoadingMessage />}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Fixed input bar */}
        <div className="fixed bottom-0 left-0 right-0 glass border-t-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <InputSection
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              onKeyPress={handleKeyPress}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
