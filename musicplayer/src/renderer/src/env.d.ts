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
  imported_at?: string;
}

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
  desc?: string;
  tag?: string;
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
  imported_at?: string;
  track_count?: number;
  total_duration?: number;
}

export interface Artist {
  id: number
  name: string;
  sort_name?: string;
  artist_image_path?: string;
  description?: string;
  track_count?: number;
  album_count?: number;
  total_duration?: number;
}

declare global {
  interface Window {
    api: {
      selectFolder: () => Promise<Track[]>;
      selectFiles: () => Promise<Track[]>;
      getLibrary: () => Promise<Track[]>;
      incrementTrackListenCount: (trackId: number) => Promise<number | null>;
      getAlbums: () => Promise<Album[]>;
      getAlbumTracks: (id: number) => Promise<Track[]>;
      getArtists: () => Promise<Artist[]>;
      getArtistTracks: (id: number) => Promise<Track[]>;
      getArtistAlbums: (id: number) => Promise<Album[]>;
      updateArtist: (id: number, name: string, description: string, imagePath: string | null) => Promise<boolean>;
      getPlaylists: () => Promise<Playlist[]>;
      getPlaylistTracks: (id: number) => Promise<Track[]>;
      onScanFolder: (callback: (event: any) => void) => void
      onCreatePlaylist: (callback: (event: any) => void) => void
      onImportFile: (callback: (event: any) => void) => void
      onPlayPause: (callback: (event: any) => void) => void
      onNextTrack: (callback: (event: any) => void) => void
      onPrevTrack: (callback: (event: any) => void) => void
      onToggleMute: (callback: (event: any) => void) => void
      onSetTheme: (callback: (themeId: string) => void) => void
      createPlaylist: (name: string, desc: string, tag: string, coverImagePath: string | null) => id<number>;
      selectImage: () => Promise<string | null>;
      addTracksToPlaylist: (id: number, trackIds: number[]) => Promise<boolean>;
      updatePlaylist: (id: number, name: string, desc: string, tag: string, coverImagePath: string | null) => Promise<boolean>;
      deletePlaylist: (id: number) => Promise<boolean>;
      removeTrackFromPlaylist: (id: number, trackId: number) => Promise<boolean>;
      deleteTrack: (trackId: number) => Promise<boolean>;
    }
  }
}