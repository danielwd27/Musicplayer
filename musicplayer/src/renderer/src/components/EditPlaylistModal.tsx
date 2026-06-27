import React, { useState, useEffect } from 'react'

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, desc: string, image: string | null) => void
  initialName: string
  initialDesc: string
  initialImage: string | null
}

export default function EditPlaylistModal({ 
  isOpen, onClose, onSave, initialName, initialDesc, initialImage 
}: EditPlaylistModalProps) {
  
  const [name, setName] = useState(initialName)
  const [desc, setDesc] = useState(initialDesc)
  const [imagePath, setImagePath] = useState<string | null>(initialImage)

  // Pre-fill the data whenever the modal opens!
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setDesc(initialDesc)
      setImagePath(initialImage)
    }
  }, [isOpen, initialName, initialDesc, initialImage])

  if (!isOpen) return null

  const handleSelectImage = async () => {
    const path = await window.api.selectImage()
    if (path) setImagePath(path)
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), desc.trim(), imagePath)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginBottom: '8px' }}>Edit Details</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div 
            onClick={handleSelectImage}
            className="playlist-image"
            style={{
              backgroundColor: '#3e3e3e',
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
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}