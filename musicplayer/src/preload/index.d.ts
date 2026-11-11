import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  selectFolder: () => Promise<any[]>
  selectFiles: () => Promise<any[]>
  getLibrary: () => Promise<any[]>
  incrementTrackListenCount: (trackId: number) => Promise<number | null>
  getAlbums: () => Promise<any[]>
  setAlbumFavorite: (albumId: number, isFavorite: boolean) => Promise<boolean>
  getAlbumTracks: (id: number) => Promise<any[]>
  getArtists: () => Promise<any[]>
  getArtistTracks: (id: number) => Promise<any[]>
  getArtistAlbums: (id: number) => Promise<any[]>
  updateArtist: (id: number, name: string, description: string, imagePath: string | null) => Promise<boolean>
  onScanFolder: (callback: (event: any) => void) => void
  onCreatePlaylist: (callback: (event: any) => void) => void
  onImportFile: (callback: (event: any) => void) => void
  onPlayPause: (callback: (event: any) => void) => void
  onNextTrack: (callback: (event: any) => void) => void
  onPrevTrack: (callback: (event: any) => void) => void
  onToggleMute: (callback: (event: any) => void) => void
  onSetTheme: (callback: (themeId: string) => void) => void
  createPlaylist: (name: string, desc: string, tag: string, coverImagePath: string | null) => Promise<number>
  getPlaylists: () => Promise<any[]>
  getPlaylistTracks: (id: number) => Promise<any[]>
  selectImage: () => Promise<string | null>
  addTracksToPlaylist: (playlistId: number, trackIds: number[]) => Promise<boolean>
  updatePlaylist: (id: number, name: string, desc: string, tag: string, coverImage: string | null) => Promise<boolean>
  deletePlaylist: (id: number) => Promise<boolean>
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<boolean>
  deleteTrack: (trackId: number) => Promise<boolean>
  deleteAlbums: (albumIds: number[]) => Promise<number>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
