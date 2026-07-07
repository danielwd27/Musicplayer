import { useState, useEffect } from 'react'
import { Track } from '../env'
import { formatDuration } from '@renderer/utilities/formatTime'

interface SearchPopupProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  library: Track[]
}

export default function SearchPopup({ isOpen, onClose, searchQuery, library }: SearchPopupProps) {
  if (!isOpen) return null

  // Filter the list based on the search bar
  const filteredLibrary = library.filter(track => 
    track.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    }
  window.addEventListener('keydown', handleKeyDown);

  return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="popup" style={{width:'300px'}}>
      <div className="modal-content" style={{display: 'flex', flexDirection: 'column', padding:'8px' }}>      
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px', backgroundColor: 'var(--neutral-background-dark)', borderRadius: '8px', padding: '8px' }}>
          <div style={{ display: 'flex', alignItems:'center'}}>
            <span>Songs</span>
            <hr style={{width:'100%', marginLeft:'8px'}}/>
          </div>
          {filteredLibrary.map(track => (
            <div className='queue-item'>
              <div 
                key={track.id} 
                className='item-title'
                style={{ 
                  display: 'flex', alignItems: 'center',  marginBottom: '4px', 
                  cursor: 'pointer', borderRadius: '6px',
                }}
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
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-light" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}