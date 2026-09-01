export const MAX_PDF_BYTES = 100 * 1024 * 1024
export const MAX_USB_PDF_FILES = 300
export const USB_SCAN_MAX_DEPTH = 3

export type UsbDrive = {
  id: string
  label: string
  path: string
}

export type UsbPdf = {
  name: string
  path: string
  relativePath: string
  size: number
  tooLarge: boolean
}

export type ImportedPdf = {
  id: string
  name: string
  size: number
}

export type KioskApi = {
  listUsbDrives: () => Promise<UsbDrive[]>
  listUsbPdfs: (drivePath: string) => Promise<UsbPdf[]>
  importUsbPdf: (filePath: string) => Promise<ImportedPdf>
  importPdfFromDialog: () => Promise<ImportedPdf | null>
  readImportedPdf: (id: string) => Promise<Uint8Array>
  discardImportedPdf: (id: string) => Promise<void>
}
