import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  onScanFolder: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('scan-folder')
    return ipcRenderer.on('scan-folder', callback)
  },
  getLibrary: () => ipcRenderer.invoke('db:getLibrary'),
  getPlaylists: () => ipcRenderer.invoke('db:getPlaylists'),
  getPlaylistTracks: (id: number) => ipcRenderer.invoke('db:getPlaylistTracks', id),
  createPlaylist: (name: string, desc: string, coverImagePath: string | null) => ipcRenderer.invoke('db:createPlaylist', name, desc, coverImagePath),
  updatePlaylist: (id: number, name: string, desc: string, coverImage: string | null) => ipcRenderer.invoke('db:updatePlaylist', id, name, desc, coverImage),
  selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
  addTracksToPlaylist: (playlistId: number, trackIds: number[]) => ipcRenderer.invoke('db:addTracksToPlaylist', playlistId, trackIds),
  deletePlaylist: (id: number) => ipcRenderer.invoke('db:deletePlaylist', id),
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('db:removeTrackFromPlaylist', playlistId, trackId),
  deleteTrack: (trackId: number) => ipcRenderer.invoke('db:deleteTrack', trackId)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
