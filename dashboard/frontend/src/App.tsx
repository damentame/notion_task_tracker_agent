function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-sm bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 shadow-xl">
            <h1 className="text-4xl font-semibold text-slate-100 mb-4">
              Midnight Agent Space Dashboard
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              React + Vite + Tailwind CSS frontend is ready
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 transition-all duration-200 hover:border-cyan-500/50">
                <div className="text-cyan-500 text-2xl mb-2">⚡</div>
                <h3 className="text-slate-100 font-semibold mb-2">Vite</h3>
                <p className="text-slate-400 text-sm">Lightning fast build tool</p>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 transition-all duration-200 hover:border-cyan-500/50">
                <div className="text-cyan-500 text-2xl mb-2">⚛️</div>
                <h3 className="text-slate-100 font-semibold mb-2">React 18</h3>
                <p className="text-slate-400 text-sm">Modern UI framework</p>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 transition-all duration-200 hover:border-cyan-500/50">
                <div className="text-cyan-500 text-2xl mb-2">🎨</div>
                <h3 className="text-slate-100 font-semibold mb-2">Tailwind CSS</h3>
                <p className="text-slate-400 text-sm">Utility-first styling</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
              <p className="text-slate-300 text-sm">
                <span className="text-emerald-500 font-semibold">✓</span> Design system configured with dark theme
              </p>
              <p className="text-slate-300 text-sm mt-2">
                <span className="text-emerald-500 font-semibold">✓</span> Primary accent: <span className="text-cyan-500">cyan-500</span>
              </p>
              <p className="text-slate-300 text-sm mt-2">
                <span className="text-emerald-500 font-semibold">✓</span> Background: slate-950 to slate-900 gradient
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
