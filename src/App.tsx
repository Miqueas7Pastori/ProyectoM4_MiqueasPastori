import { Navigate, Route, Routes } from 'react-router'
import { AppHeader } from './components/AppHeader.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { TasksPage } from './pages/TasksPage.tsx'

function App() {
  return (
    <div className="app">
      <AppHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/tareas" element={<TasksPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
