import React from 'react'
import { Track } from '../env'

const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface QueueSidebarProps {
  isOpen: boolean
  queue: Track[]
  currentTrack: Track | null
  onClose: () => void
  onPlayTrack: (index: number) => void
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void 
}

export default function QueuePopover({ isOpen, queue, currentTrack, onPlayTrack, onContextMenu: onTrackContextMenu }: QueueSidebarProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="queue-sidebar">
        <h3>Queue</h3>
        
        {queue.length === 0 ? (
          <p>Your queue is empty.</p>
        ) : (
          <div className="queue-list">
            {queue.map((track, i) => (
              <div 
                key={`${track.id}-${i}`}
                className={`queue-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onDoubleClick={() => {
                  onPlayTrack(i)
                }}
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span className="item-title" style={{ flex: 1 }}>
                  {track.title || track.filename}
                </span>
                <span className='text-soft' style={{marginLeft: '10px'}}>
                  {formatDuration(track.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}