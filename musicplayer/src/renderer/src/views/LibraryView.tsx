import React from 'react'
import { Track } from '../env'

const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Define the data this page needs to do its job
interface LibraryViewProps {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
}

export default function LibraryView({ tracks, currentTrack, isPlaying, playTrack, onTrackContextMenu: onTrackContextMenu }: LibraryViewProps) {
  
  if (tracks.length === 0) {
    return <p style={{ color: '#888' }}>No music loaded. Click 'Scan' to start.</p>
  }

  return (
    <>
      <div className="header">
        <h1>Your Music</h1>
        <button className="btn">+ Add Songs</button>
      </div>
      <div>
        {tracks.map((track, index) => (
          <div 
            key={track.id} 
            className={`track-item ${
              currentTrack?.id === track.id ? 'active' : ''
            }`}
            onDoubleClick={() => playTrack(track)}
            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1}}>
              <span style={{ marginRight: '15px', width: '20px' }}>
                {currentTrack?.id === track.id && isPlaying ? '▶' : index + 1}
              </span>
              <span className='item-title' style={{width: '20%'}}>{track.title || track.filename}</span>
              <span className='text-soft track-item-metadata'>
                <span>{track.artist}</span>
                <span>{track.album}</span>
                <span>{track.year}</span>
              </span>
              <span className='text-soft'>
              {formatDuration(track.duration)}
              </span>
            </div>
            
          </div>
        ))}
      </div>
    </>
  )
}