import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// AWS Amplify Configuration
import { Amplify } from 'aws-amplify'
import awsExports from './aws-exports'

// React Query Configuration (Phase 3最適化)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Amplify設定: aws-exports をベースに、環境変数でGraphQL設定を上書き
// - Vite の環境変数: VITE_APPSYNC_GRAPHQL_ENDPOINT / VITE_APPSYNC_REGION / VITE_APPSYNC_AUTH_TYPE / VITE_APPSYNC_API_KEY
const endpoint = import.meta.env.VITE_APPSYNC_GRAPHQL_ENDPOINT as string | undefined
const region = (import.meta.env.VITE_APPSYNC_REGION as string | undefined) || (awsExports as any).aws_appsync_region || (awsExports as any).aws_project_region
const authType = (import.meta.env.VITE_APPSYNC_AUTH_TYPE as string | undefined) || (awsExports as any).aws_appsync_authenticationType
const apiKey = (import.meta.env.VITE_APPSYNC_API_KEY as string | undefined) || (awsExports as any).aws_appsync_apiKey

const mergedConfig: any = { ...awsExports }

if (endpoint) {
  // Amplify v6 config shape for GraphQL API
  mergedConfig.API = {
    ...(mergedConfig.API || {}),
    GraphQL: {
      ...(mergedConfig.API?.GraphQL || {}),
      endpoint,
      region,
      defaultAuthMode: (authType || 'apiKey').toLowerCase() === 'api_key' ? 'apiKey' : (authType || 'apiKey'),
      apiKey,
    },
  }
}

Amplify.configure(mergedConfig)

// Explicit AppSync override provided by user (API_KEY auth)
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://krit327tvfek7bmj77g4dyzj2a.appsync-api.ap-northeast-1.amazonaws.com/graphql',
      region: 'ap-northeast-1',
      defaultAuthMode: 'apiKey',
      apiKey: 'da2-yu4c23egkrbythqiet7ycsr2dm'
    }
  }
})

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
