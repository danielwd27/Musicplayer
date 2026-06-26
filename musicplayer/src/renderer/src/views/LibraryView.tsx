import React from 'react'
import { Track } from '../env'
import playbackQueue from '../App'

// Define the data this page needs to do its job
interface LibraryViewProps {
  tracks: Track[]
  currentTrackIndex: number | null
  isPlaying: boolean
  playTrack: (index: number) => void
  onTrackContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
}

export default function LibraryView({ tracks, currentTrackIndex, isPlaying, playTrack, onTrackContextMenu: onTrackContextMenu }: LibraryViewProps) {
  
  if (tracks.length === 0) {
    return <p style={{ color: '#888' }}>No music loaded. Click 'Scan' to start.</p>
  }

  return (
    <>
      <div className="header">
        <h1>Your Music</h1>
        <button className="btn">Add Songs</button>
      </div>
      <div className="track-list">
        {tracks.map((track, index) => (
          <div 
            key={track.id} 
            className={`track-item ${
              /* Compare the ID of the row to the ID of the playing track! */
              currentTrackIndex !== null && playbackQueue[currentTrackIndex]?.id === track.id 
                ? 'active' 
                : ''
            }`}
            onDoubleClick={() => playTrack(index)}
            // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, index)}
          >
            <span style={{ marginRight: '15px', width: '20px' }}>
              {currentTrackIndex === index && isPlaying ? '▶' : index + 1}
            </span>
            <span>{track.title || track.filename}</span>
          </div>
        ))}
      </div>
    </>
  )
}