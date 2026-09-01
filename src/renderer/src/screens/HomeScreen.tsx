type HomeScreenProps = {
  onStartPrint: () => void
}

function HomeScreen({ onStartPrint }: HomeScreenProps): React.JSX.Element {
  return (
    <main className="screen home-screen">
      <p className="kicker">Print Shop Kiosk</p>
      <h1>印刷屋キオスクシステム</h1>
      <p className="lead">USBメモリのPDFを選んで、印刷前に内容を確認できます。</p>
      <button type="button" className="btn btn-primary" onClick={onStartPrint}>
        プリント
      </button>
    </main>
  )
}

export default HomeScreen
