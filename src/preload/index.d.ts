import type { KioskApi } from '../shared/pdf'

declare global {
  interface Window {
    api: KioskApi
  }
}

export {}
