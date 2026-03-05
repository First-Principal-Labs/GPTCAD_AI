import Layout from './components/Layout'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  useKeyboardShortcuts()
  return <Layout />
}

export default App
