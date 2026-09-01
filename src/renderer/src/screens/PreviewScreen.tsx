import { useEffect, useMemo, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { ImportedPdf } from '../../../shared/pdf'
import { formatFileSize, getErrorMessage } from '../lib/format'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

type PreviewScreenProps = {
  pdf: ImportedPdf
  onBack: () => void
  onHome: () => void
}

function PreviewScreen({ pdf, onBack, onHome }: PreviewScreenProps): React.JSX.Element {
  const [data, setData] = useState<Uint8Array | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void window.api
      .readImportedPdf(pdf.id)
      .then((bytes) => {
        if (!cancelled) {
          setData(bytes.slice())
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pdf.id])

  const file = useMemo(() => (data ? { data } : null), [data])

  return (
    <section className="screen preview-screen">
      <header className="screen-header">
        <button type="button" className="btn" onClick={onBack}>
          選び直す
        </button>
        <div className="header-title">
          <h1>プレビュー</h1>
          <p>
            {pdf.name} · {formatFileSize(pdf.size)}
            {numPages > 0 ? ` · ${page} / ${numPages}ページ` : ''}
          </p>
        </div>
        <button type="button" className="btn" onClick={onHome}>
          ホームへ
        </button>
      </header>

      {error ? <p className="banner-error">{error}</p> : null}

      <div className="preview-toolbar">
        <button
          type="button"
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          前のページ
        </button>
        <button
          type="button"
          className="btn"
          disabled={numPages === 0 || page >= numPages}
          onClick={() => setPage((value) => value + 1)}
        >
          次のページ
        </button>
      </div>

      <div className="preview-stage">
        {loading ? <p className="muted">読み込み中...</p> : null}
        {file ? (
          <Document
            file={file}
            onLoadSuccess={({ numPages: nextNumPages }) => {
              setNumPages(nextNumPages)
              setPage(1)
            }}
            onLoadError={(err) => setError(getErrorMessage(err))}
            loading={<p className="muted">PDFを表示しています...</p>}
          >
            <Page pageNumber={page} width={Math.min(840, window.innerWidth - 96)} />
          </Document>
        ) : null}
      </div>
    </section>
  )
}

export default PreviewScreen
