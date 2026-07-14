import { useState, useEffect, type KeyboardEvent } from 'react'

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, desc: string, tag: string, image: string | null) => void
  initialName: string
  initialDesc: string
  initialTag: string
  initialImage: string | null
  availableTags?: string[]
}

export default function EditPlaylistModal({ 
  isOpen, onClose, onSave, initialName, initialDesc, initialTag, initialImage, availableTags = [] 
}: EditPlaylistModalProps) {
  
  const [name, setName] = useState(initialName)
  const [desc, setDesc] = useState(initialDesc)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [imagePath, setImagePath] = useState<string | null>(initialImage)

  // Pre-fill the data whenever the modal opens!
  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setDesc(initialDesc)
      setTagInput('')
      setTags(initialTag.split(',').map((tag) => tag.trim()).filter(Boolean))
      setIsTagDropdownOpen(false)
      setImagePath(initialImage)
    }
  }, [isOpen, initialName, initialDesc, initialTag, initialImage])

  if (!isOpen) return null

  const handleSelectImage = async () => {
    const path = await window.api.selectImage()
    if (path) setImagePath(path)
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), desc.trim(), tags.join(', '), imagePath)
    }
  }

  const addTag = (tag: string) => {
    const cleanTag = tag.trim()
    if (!cleanTag || tags.some((existingTag) => existingTag.toLowerCase() === cleanTag.toLowerCase())) return

    setTags((prev) => [...prev, cleanTag])
    setTagInput('')
    setIsTagDropdownOpen(false)
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const tagSuggestions = availableTags.filter((tag) => (
    tag.toLowerCase().includes(tagInput.trim().toLowerCase()) &&
    !tags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase())
  ))

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginBottom: '8px' }}>Edit Details</h2>
        
        <div className="modal-body">
          <div style={{ textAlign: 'center' }}>
            <div 
              onClick={handleSelectImage}
              className="card-image editable"
            >
              {imagePath ? (
                <img 
                  src={`local://stream?path=${encodeURIComponent(imagePath.replace(/\\/g, '/'))}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt="Preview" 
                />
              ) : (
                <span
                  className="text-soft"
                  style={{ fontSize: '14px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '28px' }}>
                    <svg viewBox="0 0 24 24">
                      <g fill="none" fillRule="evenodd">
                        <path d="M0 0h24v24H0z" />
                        <rect
                          stroke="var(--white)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          x="4"
                          y="4"
                          width="16"
                          height="16"
                          rx="2"
                        />
                        <circle
                          stroke="var(--white)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          cx="8.5"
                          cy="8.5"
                          r="1"
                        />
                        <path
                          stroke="var(--white)"
                          d="m5 19 5.249-6.123a1 1 0 0 1 1.511-.008L18 20m-4.5-5.5 2.297-2.68a1 1 0 0 1 1.467-.056L20 14.5"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </g>
                    </svg>
                  </div>{' '}
                  Upload Image
                </span>
              )}
            </div>
            {imagePath && (
              <button className="btn-light" onClick={() => setImagePath(null)}>
                Remove Image
              </button>
            )}
          </div>

          <div className="edit-artist-fields">
            <input 
              autoFocus 
              className="title-input"
              type="text" 
              placeholder="Playlist Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea 
              className="search-input edit-artist-description"
              placeholder="Description (Optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="tag-picker">
              <div className="tag-list">
                {tags.map((tag) => (
                  <button key={tag} type="button" className="tag-chip editable" onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}>
                    {tag} ×
                  </button>
                ))}
              </div>
              <input 
                className="search-input"
                type="text" 
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onFocus={() => setIsTagDropdownOpen(true)}
                style={{ marginBottom: 0, width: '100%' }}
              />
              {isTagDropdownOpen && tagSuggestions.length > 0 && (
                <div className="tag-suggestions">
                  {tagSuggestions.map((tag) => (
                    <button key={tag} type="button" className="context-menu-item" onMouseDown={(e) => { e.preventDefault(); addTag(tag) }}>
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
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