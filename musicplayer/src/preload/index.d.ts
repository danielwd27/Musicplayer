import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  selectFolder: () => Promise<any[]>
  getLibrary: () => Promise<any[]>
  onScanFolder: (callback: (event: any) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
