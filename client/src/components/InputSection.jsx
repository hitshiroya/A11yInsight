import { Send } from 'lucide-react'

const InputSection = ({ value, onChange, onSend, onKeyPress, isLoading }) => {
  return (
    <div className="relative">
      <div className="glass-input flex items-center rounded-2xl overflow-hidden">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={isLoading ? "Auditing..." : "Enter a URL to audit for accessibility..."}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 px-5 py-3.5 text-[15px] font-normal disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={`flex-shrink-0 m-1.5 p-2.5 rounded-xl transition-all duration-200 ${
            value.trim() && !isLoading
              ? 'text-white cursor-pointer'
              : 'text-white/30 cursor-not-allowed'
          }`}
          style={value.trim() && !isLoading ? {
            background: 'rgba(16,185,129,0.3)',
            border: '1px solid rgba(16,185,129,0.5)',
          } : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          title={isLoading ? "Auditing..." : "Send"}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default InputSection
