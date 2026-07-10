import React from 'react'
import { Playlist } from '../env'

interface PlaylistsViewProps {
  playlists: Playlist[]
  onOpenPlaylist: (playlist: Playlist) => void
  onNewPlaylist: () => void
  onContextMenu?: (e: React.MouseEvent, playlist: Playlist) => void
}

export default function PlaylistsView({ playlists, onOpenPlaylist, onNewPlaylist, onContextMenu }: PlaylistsViewProps) {
  return (
    <div>
      <div className='header'>
        <h1>Playlists</h1>
        <div>
          <button onClick={onNewPlaylist} className="btn">+ New</button>
          <button className="btn">Edit</button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <p style={{color: 'var(--text-3)'}}>You haven't created any playlists yet.</p>
      ) : (
        <div className="albums-grid">
          {playlists.map(pl => (
            <div 
              key={pl.id} 
              className="album-card"
              onClick={() => onOpenPlaylist(pl)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault()
                onContextMenu?.(e, pl)
              }}
            >                
            <div className='card-image'>
              {pl.cover_image_path ? (
                  <img 
                    src={`local://stream?path=${encodeURIComponent(pl.cover_image_path.replace(/\\/g, '/'))}`} 
                    // className="card-image" 
                    alt={pl.name}
                  />
                ) : (
                <div>
                  🎵
                </div>
              )}
              </div>

              <h3 style={{ width: '80%', overflow:'hidden', textOverflow:'ellipsis' }}>{pl.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}