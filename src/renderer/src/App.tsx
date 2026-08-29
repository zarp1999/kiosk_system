import { useState } from 'react'

function App(): React.JSX.Element {
  const [ipcResult, setIpcResult] = useState<string>('')

  const handlePing = (): void => {
    window.electron.ipcRenderer.send('ping')
    setIpcResult('メインプロセスへ ping を送りました（Mac ではコンソールに pong と出ます）')
  }

  return (
    <main className="home">
      <p className="home-kicker">Print Shop Kiosk</p>
      <h1>印刷屋キオスクシステム</h1>
      <p className="home-lead">
        Electron + React + TypeScript の土台です。画面は Mac で作り、印刷と USB の確認は Windows
        実機で行います。
      </p>
      <ul className="home-next">
        <li>次の実装: USB から PDF を選んでプレビューする</li>
        <li>
          Windows: <code>git clone</code> → <code>npm install</code> → <code>npm run dev</code>
        </li>
      </ul>
      <button type="button" className="home-button" onClick={handlePing}>
        動作確認（IPC ping）
      </button>
      {ipcResult ? <p className="home-result">{ipcResult}</p> : null}
    </main>
  )
}

export default App
