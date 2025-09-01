import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// AWS Amplify Configuration
import { Amplify } from 'aws-amplify'
import awsExports from './aws-exports'

// React Query Configuration (Phase 3最適化)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

Amplify.configure(awsExports)

// React Query クライアント設定（Phase 3最適化）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ
      gcTime: 10 * 60 * 1000, // 10分間保持（React Query v5では cacheTime → gcTime）
      retry: 2, // 失敗時2回リトライ
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得を無効
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
