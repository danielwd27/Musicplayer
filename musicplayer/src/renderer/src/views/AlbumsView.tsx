import React, { useEffect, useRef, useState } from 'react'
import { Album, Track } from '../env'
import { formatDuration, formatPlaylistDuration } from '@renderer/utilities/formatting'

interface AlbumsViewProps {
  albums: Album[]
  selectedAlbum?: Album
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  onPlayTrackWithQueue?: (track: Track, index: number) => void
  onOpenAlbum: (album: Album) => void
  onBackToAlbums?: () => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
  onImportFiles: () => Promise<number[]>
  onImportFolder: () => Promise<number[]>
}

export default function AlbumsView({
  albums,
  selectedAlbum,
  tracks,
  currentTrack,
  isPlaying,
  playTrack,
  onPlayTrackWithQueue,
  onOpenAlbum,
  onBackToAlbums,
  onTrackContextMenu,
  onImportFiles,
  onImportFolder
}: AlbumsViewProps) {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedTrigger = buttonRef.current?.contains(target)
      const clickedMenu = menuRef.current?.contains(target)

      if (!clickedTrigger && !clickedMenu) {
        setIsImportMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const renderImportButton = () => (
    <div style={{ position: 'relative' }}>
      <button ref={buttonRef} className="btn" onClick={() => setIsImportMenuOpen((prev) => !prev)}>
        + Add Songs
      </button>

      {isImportMenuOpen && (
        <div ref={menuRef} className="popup">
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => {
              void onImportFiles()
              setIsImportMenuOpen(false)
            }}
          >
            Import File
          </button>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => {
              void onImportFolder()
              setIsImportMenuOpen(false)
            }}
          >
            Import Folder
          </button>
        </div>
      )}
    </div>
  )

  if (selectedAlbum) {
    return (
      <div>
        <div className="header">
          <button className="btn-light" onClick={onBackToAlbums}>Back to Albums</button>
          {renderImportButton()}
        </div>

        <div className="header" style={{ justifyContent: 'flex-start', gap: '30px' }}>
          <div className="playlist-image album-art-large">
            {selectedAlbum.cover_image_path ? (
              <img
                src={`local://stream?path=${encodeURIComponent(selectedAlbum.cover_image_path.replace(/\\/g, '/'))}`}
                alt={selectedAlbum.title}
              />
            ) : (
              <span style={{ fontSize: '64px' }}>🎵</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-soft">Album</div>
            <h1 style={{ fontSize: '48px', margin: '6px 0' }}>{selectedAlbum.title}</h1>
            <div className="text-soft">
              {selectedAlbum.album_artist || 'Unknown Artist'}
              {selectedAlbum.year ? ` • ${selectedAlbum.year}` : ''}
              {tracks.length > 0 && ` • ${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`}
              {tracks.length > 0 && ` • ${formatPlaylistDuration(totalDuration)}`}
            </div>
          </div>
        </div>

        {tracks.length === 0 ? (
          <p style={{ color: 'var(--text-3)' }}>No tracks found for this album.</p>
        ) : (
          <div className="track-list">
            {tracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onDoubleClick={() => onPlayTrackWithQueue ? onPlayTrackWithQueue(track, index) : playTrack(track)}
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span className="text-soft" style={{ marginRight: '20px', width: '24px' }}>
                    {currentTrack?.id === track.id && isPlaying ? '▶' : track.track_num || index + 1}
                  </span>
                  <span className="item-title">{track.title || track.filename}</span>
                  <span className="text-soft track-item-metadata">
                    <span>{track.artist}</span>
                    <span>{track.genre}</span>
                    <span>{track.year}</span>
                  </span>
                </div>
                <span className="text-soft">{formatDuration(track.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="header">
        <h1>Your Albums</h1>
        {renderImportButton()}
      </div>

      {albums.length === 0 ? (
        <p style={{ color: 'var(--text-3)' }}>You haven't imported any albums yet.</p>
      ) : (
        <div className="albums-grid">
          {albums.map((album) => (
            <div key={album.id} className="album-card" onClick={() => onOpenAlbum(album)}>
              <div className="playlist-image album-art">
                {album.cover_image_path ? (
                  <img
                    src={`local://stream?path=${encodeURIComponent(album.cover_image_path.replace(/\\/g, '/'))}`}
                    alt={album.title}
                  />
                ) : (
                  <span style={{ fontSize: '48px' }}>🎵</span>
                )}
              </div>
              <div className="item-title" title={album.title}>{album.title}</div>
              <div className="text-soft" title={album.album_artist}>{album.album_artist || 'Unknown Artist'}</div>
              <div className="text-soft">
                {album.year ? `${album.year} • ` : ''}{album.track_count || 0} {(album.track_count || 0) === 1 ? 'song' : 'songs'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}