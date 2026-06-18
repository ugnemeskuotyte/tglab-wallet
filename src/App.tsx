import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, WalletProvider, ThemeProvider } from './context'
import { PrivateRoute, PublicRoute } from './routes'
import { Layout } from './components'
import { LoginPage, RegisterPage, DashboardPage, BetsPage, TransactionsPage } from './pages'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/bets" element={<BetsPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
