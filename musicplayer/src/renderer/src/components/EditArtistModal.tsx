import { useEffect, useState } from 'react'

interface EditArtistModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string, imagePath: string | null) => void
  initialName: string
  initialDescription: string
  initialImage: string | null
}

export default function EditArtistModal({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialDescription,
  initialImage
}: EditArtistModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [imagePath, setImagePath] = useState<string | null>(initialImage)

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setDescription(initialDescription)
      setImagePath(initialImage)
    }
  }, [isOpen, initialName, initialDescription, initialImage])

  if (!isOpen) return null

  const handleSelectImage = async () => {
    const path = await window.api.selectImage()
    if (path) setImagePath(path)
  }

  const handleClearImage = () => {
    setImagePath(null)
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim(), imagePath)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginBottom: '8px' }}>Edit Artist</h2>

        <div className="edit-modal-body">
            <div
              onClick={handleSelectImage}
              className="card-image artist-image editable"
              title="Select artist image"
            >
              {imagePath ? (
                <img
                  src={`local://stream?path=${encodeURIComponent(imagePath.replace(/\\/g, '/'))}`}
                  alt="Artist preview"
                />
              ) : (
                <span>📷</span>
              )}
            </div>
            {imagePath && (
              <button className="btn-light" onClick={handleClearImage}>Remove Image</button>
            )}

          <div className="edit-artist-fields">
            <input
              autoFocus
              className="title-input edit-artist-input"
              type="text"
              placeholder="Artist Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="search-input edit-artist-description"
              placeholder="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
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
