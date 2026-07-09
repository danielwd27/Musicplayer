import React, { useRef, useEffect } from 'react'
import { Track, Playlist, Album } from '../env'
import { formatDuration } from '@renderer/utilities/formatting'

interface SearchPopupProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  library: Track[]
  playlists: Playlist[]
  albums: Album[]
  onTrackContextMenu: (e: React.MouseEvent, track: Track) => void
  onPlaylistContextMenu: (e: React.MouseEvent, playlist: Playlist) => void
  onAlbumContextMenu: (e: React.MouseEvent, album: Album) => void
  onPlayTrack: (track: Track) => void
  onPlayPlaylist: (playlist: Playlist) => void
  onClickPlaylist: ((playlist: Playlist) => void)
  onClickAlbum: (album: Album) => void
}

export default function SearchPopup({ isOpen, onClose, onTrackContextMenu, onPlaylistContextMenu, onAlbumContextMenu, onPlayTrack, onPlayPlaylist, onClickPlaylist, onClickAlbum, searchQuery, library, playlists, albums }: SearchPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = searchQuery.toLowerCase()

  // Filter the list based on the search bar
  const filteredLibrary = library.filter(track => 
    `${track.title || ''} ${track.filename} ${track.artist || ''} ${track.album || ''}`.toLowerCase().includes(normalizedQuery)
  )

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(normalizedQuery)
  )

  const filteredAlbums = albums.filter(album =>
    `${album.title} ${album.album_artist || ''} ${album.year || ''} ${album.genre || ''}`.toLowerCase().includes(normalizedQuery)
  )

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    }
  
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (popupRef.current && !popupRef.current.contains(target)) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null

  return (
    <div ref={popupRef} className="popup" style={{width:'300px', height:'auto', padding:'10px', borderRadius:'14px'}}>
      <div style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: 'var(--neutral-background-dark)', borderRadius: '8px', padding: '10px' }}>
          {filteredLibrary.length == 0 && filteredPlaylists.length == 0 && filteredAlbums.length == 0 ?
          <p className='text-soft'>No search results...</p> : '' 
          }

          {/* ALBUMS */}
          {filteredAlbums.length !== 0 ?
          <div style={{ display: 'flex', alignItems:'center'}}>
            <span>Albums</span> 
            <hr style={{width:'100%', marginLeft:'8px'}}/>
          </div> : ''
          }

          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="queue-item"
              onClick={() => {
                onClickAlbum(album)
                onClose()
              }}
              onContextMenu={(e) => onAlbumContextMenu(e, album)}
              style={{ gap: '6px' }}
            >
              <div className="sidebar-thumb" style={{ backgroundColor:'var(--neutral-background-dark)' }}>
                {album.cover_image_path ? (
                  <img
                    src={`local://stream?path=${encodeURIComponent(album.cover_image_path.replace(/\\/g, '/'))}`}
                    alt="album cover"
                  />
                ) : (
                  <span style={{ fontSize: '10px' }}>🎵</span>
                )}
              </div>
              <div className="item-title">
                <span>{album.title}</span>
                <div className="player-info" style={{ fontSize: '12px', textAlign: 'left' }}>
                  {album.album_artist || 'Unknown Artist'}
                  {album.track_count ? ` — ${album.track_count} ${album.track_count === 1 ? 'song' : 'songs'}` : ''}
                </div>
              </div>
            </div>
          ))}

          {/* SONGS */}
          {filteredLibrary.length !== 0 ?
          <div style={{ display: 'flex', alignItems:'center'}}>
            <span>Songs</span> 
            <hr style={{width:'100%', marginLeft:'8px'}}/>
          </div> : ''
          }

          {filteredLibrary.map(track => (
            <div className='queue-item'>
              <div 
                key={track.id} 
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track)}
                onDoubleClick={() => {
                  onPlayTrack(track)
                  onClose()
                }}
                className='item-title'
                style={{ 
                  display: 'flex', alignItems: 'center',  marginBottom: '4px', 
                  cursor: 'pointer', borderRadius: '6px',
                }}
              >
                <div className='item-title'>
                  <span>
                    {track.title || track.filename}
                  </span>
                  <div className='player-info' style={{fontSize: '12px', textAlign: 'left'}}>
                    {track?.artist ? track?.artist : 'Unknown Artist'}
                    {' — '}
                    {track?.album ? track.album : 'Unknown Album'}
                  </div>
                </div>
                <span className='text-soft' style={{marginLeft: '10px', overflow: 'clip'}}>
                  {formatDuration(track.duration)}
                </span>
              </div>
            </div>
          ))}

          {/* PLAYLISTS */}
          {filteredPlaylists.length !== 0 ?
          <div style={{ display: 'flex', alignItems:'center'}}>
            <span>Playlists</span> 
            <hr style={{width:'100%', marginLeft:'8px'}}/>
          </div> : ''
          }

          {filteredPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="queue-item"
                onContextMenu={(e) => onPlaylistContextMenu(e, playlist)}
                onDoubleClick={() => onPlayPlaylist(playlist)}
                onClick={() => {
                  onClickPlaylist(playlist)
                  onClose()
                }}
                style= {{ gap: '6px' }}
              >
                <div className="sidebar-thumb" style = {{backgroundColor:'var(--neutral-background-dark'}}>
                      {playlist.cover_image_path ? (
                        <img 
                          src={`local://stream?path=${encodeURIComponent(playlist.cover_image_path.replace(/\\/g, '/'))}`} 
                          alt="cover" 
                        />
                      ) : (
                        <span style={{ fontSize: '10px' }}>🎵</span>
                      )}
                    </div>
                <div className='item-title'>{playlist.name}</div>
              </div>
            ))}

        </div>

        {/* <div className="modal-actions">
          <button className="btn-light" onClick={onClose}>Cancel</button>
        </div> */}
      </div>
  )
}