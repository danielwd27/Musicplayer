import React from 'react'
import { Track } from '../env'

interface QueueSidebarProps {
  isOpen: boolean
  queue: Track[]
  currentIndex: number | null
  onClose: () => void
  onPlayTrack: (index: number) => void
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void 
}

export default function QueuePopover({ isOpen, queue, currentIndex, onClose, onPlayTrack, onContextMenu: onTrackContextMenu }: QueueSidebarProps) {
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
                className={`queue-item ${currentIndex === i ? 'playing' : ''}`}
                onDoubleClick={() => {
                  onPlayTrack(i)
                }}
                // @ts-expect-error onContextMenu is valid at runtime but not in React's type definitions
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, i)}
              >
                {/* Show a play icon if it's the current track, otherwise show the number */}
                <span className="queue-item-index">
                  {currentIndex === i ? '▶' : i + 1}
                </span>
                <span className="queue-item-title">
                  {track.title || track.filename}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}