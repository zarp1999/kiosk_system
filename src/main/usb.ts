import { execFile } from 'child_process'
import { join, relative, resolve } from 'path'
import { readdir, realpath, stat } from 'fs/promises'
import { promisify } from 'util'
import {
  MAX_USB_PDF_FILES,
  USB_SCAN_MAX_DEPTH,
  MAX_PDF_BYTES,
  type UsbDrive,
  type UsbPdf
} from '../shared/pdf'
import { isPathInside } from './paths'

const execFileAsync = promisify(execFile)

const SKIP_DIR_NAMES = new Set([
  '$RECYCLE.BIN',
  'System Volume Information',
  '.Trash',
  '.Trashes',
  '.Spotlight-V100',
  '.fseventsd',
  '.TemporaryItems'
])

type WindowsLogicalDisk = {
  DeviceID?: string
  VolumeName?: string
  Size?: number
  FreeSpace?: number
}

function asDiskArray(parsed: unknown): WindowsLogicalDisk[] {
  if (parsed == null || parsed === '') {
    return []
  }
  if (Array.isArray(parsed)) {
    return parsed as WindowsLogicalDisk[]
  }
  return [parsed as WindowsLogicalDisk]
}

async function listWindowsRemovableDrives(): Promise<UsbDrive[]> {
  const script = [
    'Get-CimInstance Win32_LogicalDisk |',
    'Where-Object { $_.DriveType -eq 2 } |',
    'Select-Object DeviceID, VolumeName, Size, FreeSpace |',
    'ConvertTo-Json -Compress'
  ].join(' ')

  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: 8000, windowsHide: true, encoding: 'utf8' }
  )

  const trimmed = stdout.trim()
  if (!trimmed) {
    return []
  }

  const disks = asDiskArray(JSON.parse(trimmed))
  return disks
    .filter((disk) => typeof disk.DeviceID === 'string' && disk.DeviceID.length > 0)
    .map((disk) => {
      const deviceId = disk.DeviceID as string
      const path = deviceId.endsWith('\\') ? deviceId : `${deviceId}\\`
      const volumeName = disk.VolumeName?.trim()
      return {
        id: deviceId,
        label: volumeName && volumeName.length > 0 ? volumeName : deviceId,
        path
      }
    })
}

async function listDarwinVolumes(): Promise<UsbDrive[]> {
  const volumesRoot = '/Volumes'
  const rootDev = (await stat('/')).dev
  const names = await readdir(volumesRoot)
  const drives: UsbDrive[] = []

  for (const name of names) {
    const volumePath = join(volumesRoot, name)
    try {
      const volumeStat = await stat(volumePath)
      if (volumeStat.dev === rootDev) {
        continue
      }
      drives.push({
        id: volumePath,
        label: name,
        path: volumePath
      })
    } catch {
      // unreadable mount
    }
  }

  return drives
}

async function listLinuxMedia(): Promise<UsbDrive[]> {
  const candidates = [
    join('/media', process.env.USER ?? ''),
    join('/run/media', process.env.USER ?? ''),
    '/media'
  ]
  const seen = new Set<string>()
  const drives: UsbDrive[] = []

  for (const base of candidates) {
    let names: string[]
    try {
      names = await readdir(base)
    } catch {
      continue
    }
    for (const name of names) {
      const mediaPath = join(base, name)
      if (seen.has(mediaPath)) {
        continue
      }
      seen.add(mediaPath)
      drives.push({ id: mediaPath, label: name, path: mediaPath })
    }
  }

  return drives
}

export async function listRemovableDrives(): Promise<UsbDrive[]> {
  try {
    if (process.platform === 'win32') {
      return await listWindowsRemovableDrives()
    }
    if (process.platform === 'darwin') {
      return await listDarwinVolumes()
    }
    return await listLinuxMedia()
  } catch (error) {
    console.error('Failed to list removable drives', error)
    return []
  }
}

export async function getDriveByPath(drivePath: string): Promise<UsbDrive | undefined> {
  const drives = await listRemovableDrives()
  const requested = resolve(drivePath)
  return drives.find((drive) => resolve(drive.path) === requested || drive.path === drivePath)
}

async function walkPdfs(dir: string, root: string, depth: number, out: UsbPdf[]): Promise<void> {
  if (out.length >= MAX_USB_PDF_FILES || depth > USB_SCAN_MAX_DEPTH) {
    return
  }

  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (out.length >= MAX_USB_PDF_FILES) {
      return
    }
    if (entry.name.startsWith('.') || SKIP_DIR_NAMES.has(entry.name)) {
      continue
    }

    const fullPath = join(dir, entry.name)
    if (!isPathInside(root, fullPath)) {
      continue
    }

    if (entry.isDirectory()) {
      await walkPdfs(fullPath, root, depth + 1, out)
      continue
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.pdf')) {
      continue
    }

    try {
      const fileStat = await stat(fullPath)
      out.push({
        name: entry.name,
        path: fullPath,
        relativePath: relative(root, fullPath),
        size: fileStat.size,
        tooLarge: fileStat.size > MAX_PDF_BYTES
      })
    } catch {
      // skip unreadable file
    }
  }
}

export async function listPdfsOnDrive(drivePath: string): Promise<UsbPdf[]> {
  const drive = await getDriveByPath(drivePath)
  if (!drive) {
    throw new Error('USBメモリが見つかりません。差し直してから再読み込みしてください。')
  }

  const root = await realpath(drive.path).catch(() => drive.path)
  const files: UsbPdf[] = []
  await walkPdfs(root, root, 0, files)
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'ja'))
  return files
}
