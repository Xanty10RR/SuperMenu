import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        send: (channel: string, ...args: unknown[]) => void
        on: (channel: string, listener: (...args: unknown[]) => void) => void
        once: (channel: string, listener: (...args: unknown[]) => void) => void
        removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
    api: {
      sendLoginSuccess: () => void
      onLoginSuccessResponse: (callback: () => void) => void
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      send: (channel: string, data?: unknown) => void
      receive: (channel: string, callback: (...args: unknown[]) => void) => void
      removeListener: (channel: string) => void
    }
  }
}
