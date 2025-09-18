import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>
        send: (channel: string, ...args: any[]) => void
        on: (channel: string, listener: (...args: any[]) => void) => void
        once: (channel: string, listener: (...args: any[]) => void) => void
        removeListener: (channel: string, listener: (...args: any[]) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
    api: {
      sendLoginSuccess: () => void
      onLoginSuccessResponse: (callback: () => void) => void
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      send: (channel: string, data?: any) => void
      receive: (channel: string, callback: (...args: any[]) => void) => void
      removeListener: (channel: string) => void
    }
  }
}