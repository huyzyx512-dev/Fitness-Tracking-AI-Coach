import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'var(--shadow-modal)',
          },
          success: {
            iconTheme: { primary: 'var(--color-success)', secondary: 'transparent' },
          },
          error: {
            iconTheme: { primary: 'var(--color-danger)', secondary: 'transparent' },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
