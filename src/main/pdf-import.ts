import { randomUUID } from 'crypto'
import { mkdir, rm, copyFile, stat, unlink } from 'fs/promises'
import { basename, join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import { MAX_PDF_BYTES, type ImportedPdf } from '../shared/pdf'
import { listRemovableDrives } from './usb'
import { isPathInside } from './paths'

type StoredPdf = {
  id: string
  name: string
  size: number
  tempPath: string
}

const imported = new Map<string, StoredPdf>()

function importDir(): string {
  return join(app.getPath('temp'), 'kiosk-system-imports')
}

export async function ensureImportDir(): Promise<void> {
  await mkdir(importDir(), { recursive: true })
}

export async function clearImportDir(): Promise<void> {
  imported.clear()
  await rm(importDir(), { recursive: true, force: true })
  await ensureImportDir()
}

function assertPdfName(fileName: string): void {
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('PDFファイルだけを選べます。')
  }
}

async function copyIntoStore(sourcePath: string, fileName: string): Promise<ImportedPdf> {
  const fileStat = await stat(sourcePath)
  if (!fileStat.isFile()) {
    throw new Error('ファイルを読み込めませんでした。')
  }
  if (fileStat.size > MAX_PDF_BYTES) {
    throw new Error('ファイルサイズは100MBまでです。')
  }

  assertPdfName(fileName)

  const id = randomUUID()
  const tempPath = join(importDir(), `${id}.pdf`)
  await copyFile(sourcePath, tempPath)

  const record: StoredPdf = { id, name: fileName, size: fileStat.size, tempPath }
  imported.set(id, record)
  return { id, name: fileName, size: fileStat.size }
}

export async function importUsbPdf(filePath: string): Promise<ImportedPdf> {
  const drives = await listRemovableDrives()
  const allowed = drives.some((drive) => isPathInside(drive.path, filePath))
  if (!allowed) {
    throw new Error('USBメモリ内のPDFだけを選べます。')
  }

  return copyIntoStore(filePath, basename(filePath))
}

export async function importPdfFromDialog(): Promise<ImportedPdf | null> {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = await dialog.showOpenDialog(window, {
    title: 'PDFを選択',
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const sourcePath = result.filePaths[0]
  return copyIntoStore(sourcePath, basename(sourcePath))
}

export function getImported(id: string): StoredPdf {
  const record = imported.get(id)
  if (!record) {
    throw new Error('プレビュー用のファイルが見つかりません。もう一度選んでください。')
  }
  return record
}

export async function discardImported(id: string): Promise<void> {
  const record = imported.get(id)
  if (!record) {
    return
  }
  imported.delete(id)
  await unlink(record.tempPath).catch(() => undefined)
}
