import React, { useEffect, useRef, useState } from 'react'
import { Album, Track } from '../env'
import { formatDuration, formatPlaylistDuration } from '@renderer/utilities/formatting'

type AlbumSortMode = 'recently-imported' | 'release-year' | 'genre'

interface AlbumsViewProps {
  albums: Album[]
  selectedAlbum?: Album
  tracks: Track[]
  currentTrack: Track | null
  playTrack: (track: Track) => void
  onSelectTrack: (track: Track) => void
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
  onSelectTrack,
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
  const [albumSortMode, setAlbumSortMode] = useState<AlbumSortMode | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)

  const sortedAlbums = albums
    .toSorted((a, b) => {
      if (albumSortMode === 'recently-imported') {
        return new Date(b.imported_at || 0).getTime() - new Date(a.imported_at || 0).getTime()
      }

      if (albumSortMode === 'release-year') {
        return (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title)
      }

      if (albumSortMode === 'genre') {
        const genreCompare = (a.genre || 'Unknown Genre').localeCompare(b.genre || 'Unknown Genre')
        return genreCompare || a.title.localeCompare(b.title)
      }

      return a.title.localeCompare(b.title)
    })

  const getAlbumGroupLabel = (album: Album) => {
    if (albumSortMode === 'recently-imported') {
      const importedDate = album.imported_at ? new Date(album.imported_at) : null
      return importedDate && !Number.isNaN(importedDate.getTime())
        ? importedDate.toLocaleDateString()
        : 'Unknown Import Date'
    }

    if (albumSortMode === 'release-year') {
      return album.year ? String(album.year) : 'Unknown Year'
    }

    if (albumSortMode === 'genre') {
      return album.genre?.trim() || 'Unknown Genre'
    }

    return ''
  }

  const albumGroups = sortedAlbums.reduce<Array<{ label: string; albums: Album[] }>>((groups, album) => {
    if (!albumSortMode) return groups

    const label = getAlbumGroupLabel(album)
    const existingGroup = groups.find((group) => group.label === label)

    if (existingGroup) {
      existingGroup.albums.push(album)
    } else {
      groups.push({ label, albums: [album] })
    }

    return groups
  }, [])

  const toggleAlbumSortMode = (mode: AlbumSortMode) => {
    setAlbumSortMode((prev) => prev === mode ? null : mode)
  }

  const renderAlbumCard = (album: Album) => (
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
  )

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
                onClick={() => onSelectTrack(track)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className={albumSortMode === 'recently-imported' ? 'btn-primary' : 'btn-light'}
            onClick={() => toggleAlbumSortMode('recently-imported')}
          >
            Recent
          </button>
          <button
            className={albumSortMode === 'release-year' ? 'btn-primary' : 'btn-light'}
            onClick={() => toggleAlbumSortMode('release-year')}
          >
            Year
          </button>
          <button
            className={albumSortMode === 'genre' ? 'btn-primary' : 'btn-light'}
            onClick={() => toggleAlbumSortMode('genre')}
          >
            Genre
          </button>

          {renderImportButton()}
        </div>
      </div>

      {albums.length === 0 ? (
        <p style={{ color: 'var(--text-3)' }}>You haven't imported any albums yet.</p>
      ) : albumSortMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {albumGroups.map(({ label, albums: groupAlbums }) => (
            <section key={label}>
              <h2 className="text-soft" style={{ margin: '0 0 12px', fontSize: '20px' }}>{label}</h2>
              <div className="albums-grid">
                {groupAlbums.map(renderAlbumCard)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="albums-grid">
          {sortedAlbums.map(renderAlbumCard)}
        </div>
      )}
    </>
  )
}