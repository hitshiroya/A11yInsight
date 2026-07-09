import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ChatMessage = ({ message }) => {
  const isAI = message.type === 'ai'

  if (isAI) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] md:max-w-4xl">
          <div className="text-white/90 text-[15px] leading-[1.7] font-normal break-words prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({children}) => <p className="mb-3 last:mb-0 text-white/85">{children}</p>,
                ul: ({children}) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-white/85">{children}</li>,
                strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-white/70">{children}</em>,
                code: ({children}) => (
                  <code className="px-1.5 py-0.5 rounded text-sm text-emerald-300 font-mono"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="p-3 rounded-xl overflow-x-auto text-sm mb-3 text-white/80"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {children}
                  </pre>
                ),
                h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-[15px] font-semibold mb-2 text-white/90">{children}</h3>,
                a: ({children, href}) => <a href={href} className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">{children}</a>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] md:max-w-2xl">
        <div className="rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
          <div className="text-white/90 text-[15px] leading-[1.6] font-normal break-words">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
