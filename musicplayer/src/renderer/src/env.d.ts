/// <reference types="vite/client" />

export interface Track {
  id: number;
  file_path: string;
  filename: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  year?: number;
  album_image_path?: string;
}

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
  desc?: string;
  cover_image_path?: string;
}

export interface Album {
  id: number;
  // file_path: string;
  // filename: string;
  name?: string;
  artist?: string;
  duration?: number;
  year?: number;
  album_image_path?: string;
}

export interface Artist {
  id: number
  name: string;
  artist_image_path?: string;
}

declare global {
  interface Window {
    api: {
      selectFolder: () => Promise<Track[]>;
      selectFiles: () => Promise<Track[]>;
      getLibrary: () => Promise<Track[]>;
      getPlaylists: () => Promise<Playlist[]>;
      getPlaylistTracks: (id: number) => Promise<Track[]>;
      onScanFolder: (callback: (event: any) => void) => void
      onCreatePlaylist: (callback: (event: any) => void) => void
      onImportFile: (callback: (event: any) => void) => void
      onPlayPause: (callback: (event: any) => void) => void
      onNextTrack: (callback: (event: any) => void) => void
      onPrevTrack: (callback: (event: any) => void) => void
      onToggleMute: (callback: (event: any) => void) => void
      createPlaylist: (name: string, desc: string, coverImagePath: string | null) => Promise<number>;
      selectImage: () => Promise<string | null>;
      addTracksToPlaylist: (playlistId: number, trackIds: number[]) => Promise<boolean>;
      updatePlaylist: (id: number, name: string, desc: string, coverImagePath: string | null) => Promise<boolean>;
      deletePlaylist: (id: number) => Promise<boolean>;
      removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<boolean>;
      deleteTrack: (trackId: number) => Promise<boolean>;
    }
  }
}