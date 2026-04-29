import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Zap } from 'lucide-react'
import { registerNavigate } from '@/lib/navigation'

function AuthLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    registerNavigate(navigate)
  }, [navigate])

  return (
    <div className="min-h-screen bg-canvas mesh-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span
            className="text-4xl text-foreground"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            FITTRACK
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl bg-card border border-border p-8"
          style={{ boxShadow: 'var(--shadow-modal)' }}
        >
          <Outlet />
        </div>

        <p className="text-center text-xs text-subtle mt-6">
          © {new Date().getFullYear()} FitTrack. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export { AuthLayout }
