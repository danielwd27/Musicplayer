import React, { useEffect, useRef, useState } from 'react'
import { Album, Track } from '../env'
import { formatDuration, formatPlaylistDuration } from '@renderer/utilities/formatting'

interface AlbumsViewProps {
  albums: Album[]
  selectedAlbum?: Album
  tracks: Track[]
  currentTrack: Track | null
  playTrack: (track: Track) => void
  onPlayTrackWithQueue?: (track: Track, index: number) => void
  onOpenAlbum: (album: Album) => void
  onOpenAlbumArtist: (album: Album) => void
  onOpenTrackArtist: (track: Track) => void
  onBackToAlbums?: () => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
  onAlbumContextMenu: (e: React.MouseEvent, album: Album) => void
  onImportFiles: () => Promise<number[]>
  onImportFolder: () => Promise<number[]>
}

export default function AlbumsView({
  albums,
  selectedAlbum,
  tracks,
  currentTrack,
  playTrack,
  onPlayTrackWithQueue,
  onOpenAlbum,
  onOpenAlbumArtist,
  onOpenTrackArtist,
  onBackToAlbums,
  onTrackContextMenu,
  onAlbumContextMenu,
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
          <div className="card-image album-art-large">
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
              <button
                type="button"
                className="metadata-link"
                onClick={() => onOpenAlbumArtist(selectedAlbum)}
                disabled={!selectedAlbum.album_artist}
                title="Open artist page"
              >
                {selectedAlbum.album_artist || 'Unknown Artist'}
              </button>
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
                  <span className="text-soft track-item-index">
                    {currentTrack?.id === track.id ? '▶' : track.track_num || index + 1}
                  </span>
                  <div className="track-album-art">
                    {track.album_image_path ? (
                      <img
                        src={`local://stream?path=${encodeURIComponent(track.album_image_path.replace(/\\/g, '/'))}`}
                        alt={track.album || track.title || track.filename}
                      />
                    ) : (
                      <span>🎵</span>
                    )}
                  </div>
                  <span className="item-title" style={{width: '20%'}}>{track.title || track.filename}</span>
                  <span className="text-soft track-item-metadata">
                  <button
                    type="button"
                    className="metadata-link"
                    onClick={(e) => { e.stopPropagation(); onOpenTrackArtist(track) }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    disabled={!track.artist}
                    title="Open artist page"
                  >
                    {track.artist || 'Unknown Artist'}
                  </button>
                  {/* <span>{track.genre}</span> */}
                  <span>{track.year}</span>
                  </span>
                <span className="text-soft track-duration">{formatDuration(track.duration)}</span>
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
            <div 
              key={album.id} 
              className="album-card" 
              onClick={() => onOpenAlbum(album)} 
              onContextMenu={((e) => onAlbumContextMenu(e, album))
            }>
              <div className="card-image">
                {album.cover_image_path ? (
                  <img
                    src={`local://stream?path=${encodeURIComponent(album.cover_image_path.replace(/\\/g, '/'))}`}
                    alt={album.title}
                  />
                ) : (
                  <span>🎵</span>
                )}
              </div>
              <div className="item-title" title={album.title}>{album.title}</div>
              <button
                type="button"
                className="metadata-link text-soft"
                onClick={(e) => { e.stopPropagation(); onOpenAlbumArtist(album) }}
                onDoubleClick={(e) => e.stopPropagation()}
                disabled={!album.album_artist}
                title="Open artist page"
              >
                {album.album_artist || 'Unknown Artist'}
              </button>
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