/// <reference types="vite/client" />

export interface Track {
  id: number;
  file_path: string;
  filename: string;
  title?: string;
  artist?: string;
  album_artist?: string;
  album?: string;
  artist_id?: number;
  album_id?: number;
  duration: number;
  year?: number;
  genre?: string;
  bit_rate?: string;
  num_listens: number;
  is_favorite: boolean;
  track_num?: number;
  disc_num?: number;
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
  title: string;
  album_artist_id?: number;
  album_artist?: string;
  year?: number;
  genre?: string;
  cover_image_path?: string;
  track_count?: number;
  total_duration?: number;
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
      getAlbums: () => Promise<Album[]>;
      getAlbumTracks: (id: number) => Promise<Track[]>;
      getPlaylists: () => Promise<Playlist[]>;
      getPlaylistTracks: (id: number) => Promise<Track[]>;
      onScanFolder: (callback: (event: any) => void) => void
      onCreatePlaylist: (callback: (event: any) => void) => void
      onImportFile: (callback: (event: any) => void) => void
      onPlayPause: (callback: (event: any) => void) => void
      onNextTrack: (callback: (event: any) => void) => void
      onPrevTrack: (callback: (event: any) => void) => void
      onToggleMute: (callback: (event: any) => void) => void
      createPlaylist: (name: string, desc: string, coverImagePath: string | null) => id<number>;
      selectImage: () => Promise<string | null>;
      addTracksToPlaylist: (id: number, trackIds: number[]) => Promise<boolean>;
      updatePlaylist: (id: number, name: string, desc: string, coverImagePath: string | null) => Promise<boolean>;
      deletePlaylist: (id: number) => Promise<boolean>;
      removeTrackFromPlaylist: (id: number, trackId: number) => Promise<boolean>;
      deleteTrack: (trackId: number) => Promise<boolean>;
    }
  }
}