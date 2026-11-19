import { AppHeader } from './components/AppHeader.tsx'
import { HomePage } from './pages/HomePage.tsx'

function App() {
  return (
    <div className="app">
      <AppHeader />
      <main>
        <HomePage />
      </main>
    </div>
  )
}

export default App
