import React from 'react'
import { Track } from '../env'

interface PlaylistViewProps {
  playlistId: number
  playlistName: string
  playlistDesc?: string
  coverImagePath?: string | null
  tracks: Track[]
  currentTrackIndex: number | null
  isPlaying: boolean
  playTrack: (index: number) => void
  onAddSongsClick: () => void
  onEditClick: () => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
}

export default function PlaylistView({ 
  playlistName, 
  playlistDesc,
  coverImagePath,
  tracks, 
  currentTrackIndex, 
  isPlaying, 
  playTrack,
  onAddSongsClick,
  onEditClick,
  onTrackContextMenu
}: PlaylistViewProps) {
  
  return (
    <div>
      {/* --- PLAYLIST HEADER --- */}
      <div className="header">
        <div style={{ display: 'flex', gap: '30px', marginLeft: '16px'}}>
          <div className="playlist-image" style={{
          width: '200px', height: '200px', borderRadius: '8px', 
          justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            {coverImagePath ? (
              <img 
                src={`local://stream?path=${encodeURIComponent(coverImagePath.replace(/\\/g, '/'))}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt={playlistName} 
              />
            ) : (
              <span style={{ fontSize: '64px' }}>🎵</span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '48px', margin: '0 0 8px 0' }}>{playlistName}</h1>
            <p>{playlistDesc}</p>
            <span style={{ color: '#b3b3b3', fontSize: '14px', fontWeight: 'bold' }}>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>
        </div>
        <div>
          <button className="btn" style={{ marginRight: '10px' }} onClick={onEditClick}>Edit Details</button>
          <button className="btn btn-primary" onClick={onAddSongsClick}>Add Songs</button>
        </div>
      </div>

      {/* --- TRACK LIST OR EMPTY STATE --- */}
      {tracks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#888' }}>
          <h2>This playlist is looking a little empty.</h2>
          <p style={{ marginBottom: '24px' }}>Let's find some tracks to add to it.</p>
          <button className="btn btn-primary" onClick={onAddSongsClick}>
            Find Songs
          </button>
        </div>
      ) : (
        <div className="track-list">
          {tracks.map((track, index) => (
            <div 
              key={`${track.id}-${index}`} 
              className={`track-item ${currentTrackIndex === index ? 'active' : ''}`}
              onDoubleClick={() => playTrack(index)}
              // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
            >
              <span style={{ marginRight: '15px', width: '20px', color: '#b3b3b3' }}>
                {currentTrackIndex === index && isPlaying ? '▶' : index + 1}
              </span>
              <span>{track.title || track.filename}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}