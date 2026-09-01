export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    const nested = error.message.match(/Error invoking remote method '[^']+': (?:Error: )?(.+)$/)
    return nested?.[1] ?? error.message
  }
  return '処理に失敗しました。'
}
