import React, {useState} from 'react'
import { Track } from '../env'
import { formatDuration } from '@renderer/utilities/formatting'

interface QueueSidebarProps {
  isOpen: boolean
  queue: Track[]
  historyQueue: Track[]
  isShuffled: boolean
  shuffledQueue: Track[]
  currentTrack: Track | null
  onClose: () => void
  onPlayTrack: (index: number) => void
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void
  onClear: (target: 'queue' | 'history') => void
}

export default function QueueSidebar({ isOpen, queue, historyQueue, isShuffled, shuffledQueue, currentTrack, onClose, onPlayTrack, onContextMenu: onTrackContextMenu, onClear }: QueueSidebarProps) {

  const[activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')
  let list: Track[] = queue;
  if (!isOpen) return null
  if (activeTab === 'queue' && !isShuffled) {
    list = queue;
  } else if (activeTab === 'queue' && isShuffled) {
    list = shuffledQueue;
  } else {
    list = historyQueue;
  }

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
        
        {list.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <div className="queue-list">
            {list.map((track, i) => (
              <div 
                key={`${track.id}-${i}`}
                className={`queue-item ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onDoubleClick={() => {
                  if (activeTab === 'queue') {
                    onPlayTrack(i)
                  }
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
                {/* <hr style={{alignSelf: 'end', width: '100%', zIndex: '500'}}/> */}
              </div>
            ))}
          </div>
        )}
        <button
          className='btn-light'
          style={{ marginTop: 'auto' }}
          onClick={() => onClear(activeTab)}
        >
          Clear
        </button>
      </div>
    </>
  )
}