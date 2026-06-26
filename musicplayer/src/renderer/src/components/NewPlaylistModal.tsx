import React, { useState, useEffect } from 'react'

interface NewPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, desc: string, image: string | null) => void 
}

export default function NewPlaylistModal({ isOpen, onClose, onCreate }: NewPlaylistModalProps) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [imagePath, setImagePath] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setDesc('')
      setImagePath(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectImage = async () => {
    const path = await window.api.selectImage()
    if (path) setImagePath(path)
  }

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), desc.trim(), imagePath)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Playlist</h2>
        
        {/* IMAGE PREVIEW & PICKER */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div 
            onClick={handleSelectImage}
            style={{
              width: '120px', height: '120px', backgroundColor: '#3e3e3e',
              borderRadius: '8px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0
            }}
          >
            {imagePath ? (
              <img 
                src={`local://stream?path=${encodeURIComponent(imagePath.replace(/\\/g, '/'))}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="Preview" 
              />
            ) : (
              <span style={{ fontSize: '32px' }}>📷</span>
            )}
          </div>

          <div style={{ flexGrow: 1 }}>
            <input 
              autoFocus 
              className="title-input"
              type="text" 
              placeholder="Playlist Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              className="search-input"
              type="text" 
              placeholder="Description (Optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  )
}