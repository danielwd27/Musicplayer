import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  selectFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  onScanFolder: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('scan-folder')
    return ipcRenderer.on('scan-folder', callback)
  },
  onCreatePlaylist: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('create-playlist')
    return ipcRenderer.on('create-playlist', callback)
  },
  onImportFile: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('import-file')
    return ipcRenderer.on('import-file', callback)
  },
  onPlayPause: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('play-pause')
    return ipcRenderer.on('play-pause', callback)
  },
  onNextTrack: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('next-track')
    return ipcRenderer.on('next-track', callback)
  },
  onPrevTrack: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('prev-track')
    return ipcRenderer.on('prev-track', callback)
  },
  onToggleMute: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.removeAllListeners('toggle-mute')
    return ipcRenderer.on('toggle-mute', callback)
  },
  getLibrary: () => ipcRenderer.invoke('db:getLibrary'),
  incrementTrackListenCount: (trackId: number) => ipcRenderer.invoke('db:incrementTrackListenCount', trackId),
  getAlbums: () => ipcRenderer.invoke('db:getAlbums'),
  getAlbumTracks: (id: number) => ipcRenderer.invoke('db:getAlbumTracks', id),
  getArtists: () => ipcRenderer.invoke('db:getArtists'),
  getArtistTracks: (id: number) => ipcRenderer.invoke('db:getArtistTracks', id),
  getArtistAlbums: (id: number) => ipcRenderer.invoke('db:getArtistAlbums', id),
  updateArtist: (id: number, name: string, description: string, imagePath: string | null) => ipcRenderer.invoke('db:updateArtist', id, name, description, imagePath),
  getPlaylists: () => ipcRenderer.invoke('db:getPlaylists'),
  getPlaylistTracks: (id: number) => ipcRenderer.invoke('db:getPlaylistTracks', id),
  createPlaylist: (name: string, desc: string, tag: string, coverImagePath: string | null) => ipcRenderer.invoke('db:createPlaylist', name, desc, tag, coverImagePath),
  updatePlaylist: (id: number, name: string, desc: string, tag: string, coverImage: string | null) => ipcRenderer.invoke('db:updatePlaylist', id, name, desc, tag, coverImage),
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
