// this is a deprecated file
import React from 'react'
import { Track } from '../env'

interface QueuePopoverProps {
  isOpen: boolean
  queue: Track[]
  currentIndex: number | null
  onClose: () => void
  onPlayTrack: (index: number) => void
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void 
}

export default function QueuePopover({ isOpen, queue, currentIndex, onClose, onPlayTrack, onContextMenu: onTrackContextMenu }: QueuePopoverProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 1. The Invisible Click-Catcher (closes the modal when you click away) */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 
        }} 
      />

      {/* 2. The Actual Popover Box */}
      <div className="queue-popover">
        <h3>Play Queue</h3>
        
        {queue.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px' }}>Your queue is empty.</p>
        ) : (
          <div className="queue-list">
            {queue.map((track, i) => (
              <div 
                key={`${track.id}-${i}`}
                className={`queue-item ${currentIndex === i ? 'playing' : ''}`}
                onDoubleClick={() => {
                  onPlayTrack(i)
                  onClose() // Close the queue after picking a song
                }}
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
