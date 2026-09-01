import { useState } from 'react'
import type { ImportedPdf } from '../../shared/pdf'
import FileSelectScreen from './screens/FileSelectScreen'
import HomeScreen from './screens/HomeScreen'
import PreviewScreen from './screens/PreviewScreen'

type Screen = 'home' | 'files' | 'preview'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('home')
  const [imported, setImported] = useState<ImportedPdf | null>(null)

  const goHome = async (): Promise<void> => {
    if (imported) {
      await window.api.discardImportedPdf(imported.id)
    }
    setImported(null)
    setScreen('home')
  }

  const goFiles = async (): Promise<void> => {
    if (imported) {
      await window.api.discardImportedPdf(imported.id)
    }
    setImported(null)
    setScreen('files')
  }

  if (screen === 'files') {
    return (
      <FileSelectScreen
        onBack={() => void goHome()}
        onImported={(pdf) => {
          setImported(pdf)
          setScreen('preview')
        }}
      />
    )
  }

  if (screen === 'preview' && imported) {
    return (
      <PreviewScreen
        key={imported.id}
        pdf={imported}
        onBack={() => void goFiles()}
        onHome={() => void goHome()}
      />
    )
  }

  return <HomeScreen onStartPrint={() => setScreen('files')} />
}

export default App
