import { ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { listPdfsOnDrive, listRemovableDrives } from './usb'
import { discardImported, getImported, importPdfFromDialog, importUsbPdf } from './pdf-import'

export function registerIpcHandlers(): void {
  ipcMain.handle('usb:listDrives', async () => {
    return listRemovableDrives()
  })

  ipcMain.handle('usb:listPdfs', async (_event, drivePath: unknown) => {
    if (typeof drivePath !== 'string' || drivePath.length === 0) {
      throw new Error('USBメモリが指定されていません。')
    }
    return listPdfsOnDrive(drivePath)
  })

  ipcMain.handle('pdf:importUsb', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new Error('ファイルが指定されていません。')
    }
    return importUsbPdf(filePath)
  })

  ipcMain.handle('pdf:importDialog', async () => {
    return importPdfFromDialog()
  })

  ipcMain.handle('pdf:read', async (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('ファイルが指定されていません。')
    }
    const record = getImported(id)
    return readFile(record.tempPath)
  })

  ipcMain.handle('pdf:discard', async (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length === 0) {
      return
    }
    await discardImported(id)
  })
}
