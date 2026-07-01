import React from 'react'
import { Track } from '../env'

const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface PlaylistViewProps {
  playlistId: number
  playlistName: string
  playlistDesc?: string
  coverImagePath?: string | null
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  onAddSongsClick: () => void
  onEditClick: () => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
}

export default function PlaylistView({ 
  playlistName, 
  playlistDesc,
  coverImagePath,
  tracks, 
  currentTrack, 
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
          <div style={{display: 'flex', flexDirection: 'column', textAlign: 'left'}}>
            <h1 style={{ fontSize: '48px'}}>{playlistName}</h1>
            <p>{playlistDesc}</p>
            <span className='text-soft' style={{ fontWeight: 'bold', textAlign: 'left' }}>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </span>
            <div style={{marginTop: 'auto', display:'flex', flexDirection: 'row', gap: '2px'}}>
              <button className='play-btn play-btn-large'>
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button className="btn" onClick={onEditClick}>Edit Details</button>
              <button className="btn btn-primary" onClick={onAddSongsClick}>Add Songs</button>
            </div>
          </div>
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
              className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
              onDoubleClick={() => playTrack(track)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span className='text-soft' style={{ marginRight: '20px'}}>
                  {currentTrack?.id === track.id && isPlaying ? '▶' : index + 1}
                </span>
                <span className='item-title'>{track.title || track.filename}</span>
                  <span className='text-soft track-item-metadata'>
                  <span>{track.artist}</span>
                  <span>{track.album}</span>
                  <span>{track.year}</span>
              </span>
              </div>
              <span className='text-soft'>
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}