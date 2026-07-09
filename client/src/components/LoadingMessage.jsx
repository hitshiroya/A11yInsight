const LoadingMessage = () => {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl px-4 py-3" style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div className="flex items-center space-x-1.5 h-5">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400/70"
              style={{
                animation: 'typing 1.4s infinite ease-in-out',
                animationDelay: `${delay}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingMessage
