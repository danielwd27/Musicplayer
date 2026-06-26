import React, { useState, useEffect } from 'react'
import { Track } from '../env'

interface AddSongsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedTrackIds: number[]) => void
  library: Track[] // We will pass your cached 'allTracks' here!
}

export default function AddSongsModal({ isOpen, onClose, onSave, library }: AddSongsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      setSearchQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggleTrack = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleSave = () => {
    onSave(Array.from(selectedIds))
  }

  // Filter the list based on the search bar
  const filteredLibrary = library.filter(track => 
    track.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '500px', height: '600px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '12px' }}>Add Songs to Playlist</h2>
        
        <input 
          className="search-input" 
          placeholder="Search your library..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Scrollable Track List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', marginTop: '16px', backgroundColor: 'var(--neutral-background-dark)', borderRadius: '8px', padding: '8px' }}>
          {filteredLibrary.map(track => (
            <div 
              key={track.id} 
              onClick={() => toggleTrack(track.id)}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', 
                cursor: 'pointer', borderRadius: '6px',
                backgroundColor: selectedIds.has(track.id) ? 'var(--neutral-background-light)' : 'transparent'
              }}
            >
              <label className="chkbox" >
                <input 
                type="checkbox" 
                checked={selectedIds.has(track.id)} 
                readOnly 
                />
              </label>
              
              <span style={{marginLeft:'6px'}}>
                {track.filename}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={selectedIds.size === 0}
          >
            Add {selectedIds.size > 0 ? selectedIds.size : ''} Songs
          </button>
        </div>
      </div>
    </div>
  )
}