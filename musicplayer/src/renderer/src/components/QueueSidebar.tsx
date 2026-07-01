import React, {useState} from 'react'
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
  historyQueue: Track[]
  currentTrack: Track | null
  onClose: () => void
  onPlayTrack: (index: number) => void
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void 
}

export default function QueueSidebar({ isOpen, queue, historyQueue, currentTrack, onPlayTrack, onContextMenu: onTrackContextMenu }: QueueSidebarProps) {

  const[activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')

  if (!isOpen) return null

  const list = activeTab === 'queue' ? queue : historyQueue;
  const emptyText = activeTab === 'queue' ? 'Your queue is empty.' : 'No history available.';

  return (
    <>
      <div style={{display:'flex', justifyContent: 'space-between', flexDirection:'column', height:'100%'}}>
        <div className='tab-select'>
            <label> Queue
              <input type="radio" name="Queue" value="queue" 
                checked={activeTab === 'queue'}
                onChange={() => setActiveTab('queue')}
              />
            </label>
            <label> History
              <input type="radio" name="Queue" value="history"
                checked={activeTab === 'history'}
                onChange={() => setActiveTab('history')}
              />
          </label>
        </div>
        
        {queue.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <div className="queue-list">
            {list.map((track, i) => (
              <div 
                key={`${track.id}-${i}`}
                className={`queue-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onDoubleClick={() => {
                  onPlayTrack(i)
                }}
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => onTrackContextMenu(e, track, i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
            ))}
          </div>
        )}
        <button className='btn-light' style={{ marginTop: 'auto', border: '0px' }}>Clear</button>
      </div>
    </>
  )
}