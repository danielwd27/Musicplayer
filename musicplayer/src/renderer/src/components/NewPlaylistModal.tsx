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
        <h2 style={{ marginBottom: '8px' }}>Create New Playlist</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div 
            onClick={handleSelectImage}
            className='playlist-image'
            style={{
              width: '120px', height: '120px', 
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
              <span className='text-soft' style={{ fontSize: '14px', textAlign:'center' }}>
                <div style={{fontSize:'28px'}}>
                <svg viewBox="0 0 24 24" style={{stroke: 'var(--white)'}}><g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"/><rect stroke-width="1.5" stroke-linecap="round" x="4" y="4" width="16" height="16" rx="2"/><circle stroke-width="2" stroke-linecap="round" cx="8.5" cy="8.5" r="1"/><path d="m5 19 5.249-6.123a1 1 0 0 1 1.511-.008L18 20m-4.5-5.5 2.297-2.68a1 1 0 0 1 1.467-.056L20 14.5" stroke-width="1.5" stroke-linecap="round"/></g></svg>
                </div> Upload Image
              </span>
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