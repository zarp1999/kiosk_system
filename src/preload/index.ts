import { contextBridge, ipcRenderer } from 'electron'
import type { ImportedPdf, KioskApi, UsbDrive, UsbPdf } from '../shared/pdf'

function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }
  if (Array.isArray(data)) {
    return Uint8Array.from(data)
  }
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return Uint8Array.from((data as { data: number[] }).data)
  }
  throw new Error('PDFデータを読み込めませんでした。')
}

const api: KioskApi = {
  listUsbDrives: (): Promise<UsbDrive[]> => ipcRenderer.invoke('usb:listDrives'),
  listUsbPdfs: (drivePath: string): Promise<UsbPdf[]> =>
    ipcRenderer.invoke('usb:listPdfs', drivePath),
  importUsbPdf: (filePath: string): Promise<ImportedPdf> =>
    ipcRenderer.invoke('pdf:importUsb', filePath),
  importPdfFromDialog: (): Promise<ImportedPdf | null> => ipcRenderer.invoke('pdf:importDialog'),
  readImportedPdf: async (id: string): Promise<Uint8Array> => {
    const data = await ipcRenderer.invoke('pdf:read', id)
    return toUint8Array(data)
  },
  discardImportedPdf: (id: string): Promise<void> => ipcRenderer.invoke('pdf:discard', id)
}

if (!process.contextIsolated) {
  throw new Error('contextIsolation が無効です。')
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}
