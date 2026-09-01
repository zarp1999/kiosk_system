import { useEffect, useState } from 'react'
import type { ImportedPdf, UsbDrive, UsbPdf } from '../../../shared/pdf'
import { formatFileSize, getErrorMessage } from '../lib/format'

type FileSelectScreenProps = {
  onBack: () => void
  onImported: (pdf: ImportedPdf) => void
}

type PdfListState = {
  drivePath: string | null
  files: UsbPdf[]
  error: string | null
}

function FileSelectScreen({ onBack, onImported }: FileSelectScreenProps): React.JSX.Element {
  const [drives, setDrives] = useState<UsbDrive[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [pdfList, setPdfList] = useState<PdfListState>({
    drivePath: null,
    files: [],
    error: null
  })
  const [loadingDrives, setLoadingDrives] = useState(true)
  const [importing, setImporting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadDrives = (): void => {
      void window.api
        .listUsbDrives()
        .then((nextDrives) => {
          if (cancelled) {
            return
          }
          setDrives(nextDrives)
          setSelectedPath((current) => {
            if (current && nextDrives.some((drive) => drive.path === current)) {
              return current
            }
            return nextDrives[0]?.path ?? null
          })
          setLoadingDrives(false)
        })
        .catch((err) => {
          if (cancelled) {
            return
          }
          setActionError(getErrorMessage(err))
          setLoadingDrives(false)
        })
    }

    loadDrives()
    const timer = window.setInterval(loadDrives, 2000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!selectedPath) {
      return
    }

    const path = selectedPath
    let cancelled = false

    void window.api
      .listUsbPdfs(path)
      .then((files) => {
        if (!cancelled) {
          setPdfList({ drivePath: path, files, error: null })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfList({ drivePath: path, files: [], error: getErrorMessage(err) })
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedPath])

  const handleImportUsb = async (file: UsbPdf): Promise<void> => {
    if (file.tooLarge || importing) {
      return
    }
    setImporting(true)
    setActionError(null)
    try {
      const imported = await window.api.importUsbPdf(file.path)
      onImported(imported)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  const handleImportDialog = async (): Promise<void> => {
    if (importing) {
      return
    }
    setImporting(true)
    setActionError(null)
    try {
      const imported = await window.api.importPdfFromDialog()
      if (imported) {
        onImported(imported)
      }
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  const handleReload = (): void => {
    void window.api
      .listUsbDrives()
      .then((nextDrives) => {
        setDrives(nextDrives)
        setSelectedPath((current) => {
          if (current && nextDrives.some((drive) => drive.path === current)) {
            return current
          }
          return nextDrives[0]?.path ?? null
        })
        setActionError(null)
      })
      .catch((err) => setActionError(getErrorMessage(err)))
  }

  const pdfs = selectedPath && pdfList.drivePath === selectedPath ? pdfList.files : []
  const loadingPdfs = Boolean(selectedPath && pdfList.drivePath !== selectedPath)
  const error = actionError ?? (pdfList.drivePath === selectedPath ? pdfList.error : null)

  return (
    <section className="screen file-screen">
      <header className="screen-header">
        <button type="button" className="btn" onClick={onBack} disabled={importing}>
          ホームへ
        </button>
        <h1>ファイルを選ぶ</h1>
        <button type="button" className="btn" onClick={handleReload} disabled={importing}>
          再読み込み
        </button>
      </header>

      {error ? <p className="banner-error">{error}</p> : null}

      <div className="file-layout">
        <aside className="drive-pane">
          <h2>USBメモリ</h2>
          {loadingDrives && drives.length === 0 ? <p className="muted">確認中...</p> : null}
          {!loadingDrives && drives.length === 0 ? (
            <p className="muted">USBメモリが見つかりません。差し込んでください。</p>
          ) : null}
          <ul className="drive-list">
            {drives.map((drive) => (
              <li key={drive.id}>
                <button
                  type="button"
                  className={drive.path === selectedPath ? 'drive-card selected' : 'drive-card'}
                  onClick={() => setSelectedPath(drive.path)}
                  disabled={importing}
                >
                  <span className="drive-label">{drive.label}</span>
                  <span className="drive-path">{drive.path}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-block"
            onClick={() => void handleImportDialog()}
            disabled={importing}
          >
            このパソコンから選ぶ
          </button>
          <p className="hint">Macでの確認や、USBが認識されないときはこちらを使えます。</p>
        </aside>

        <div className="pdf-pane">
          <h2>PDFファイル</h2>
          {selectedPath && loadingPdfs ? <p className="muted">読み込み中...</p> : null}
          {selectedPath && !loadingPdfs && pdfs.length === 0 ? (
            <p className="muted">このUSBにPDFがありません（3階層まで検索します）。</p>
          ) : null}
          <ul className="pdf-list">
            {pdfs.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  className="pdf-card"
                  disabled={file.tooLarge || importing}
                  onClick={() => void handleImportUsb(file)}
                >
                  <span className="pdf-name">{file.name}</span>
                  <span className="pdf-meta">
                    {file.relativePath}
                    {' · '}
                    {formatFileSize(file.size)}
                    {file.tooLarge ? ' · 100MBを超えているため選べません' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {importing ? <div className="overlay">ファイルを取り込んでいます...</div> : null}
    </section>
  )
}

export default FileSelectScreen
