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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Playlists</h1>
        <div>
          <button onClick={onNewPlaylist} className="btn">+ New</button>
          <button className="btn">Edit</button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <p style={{ color: '#888' }}>You haven't created any playlists yet.</p>
      ) : (
        <div className="playlists-grid">
          {playlists.map(pl => (
            <div 
              key={pl.id} 
              className="playlist-card"
              onClick={() => onOpenPlaylist(pl)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault()
                onContextMenu?.(e, pl)
              }}
            >
              {pl.cover_image_path ? (
                <img 
                  src={`local://stream?path=${encodeURIComponent(pl.cover_image_path.replace(/\\/g, '/'))}`} 
                  className="playlist-image" 
                  style={{ objectFit: 'cover', padding: 0 }} 
                  alt={pl.name}
                />
              ) : (
                <div className="playlist-image">
                  🎵
                </div>
              )}
              <h3>{pl.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}