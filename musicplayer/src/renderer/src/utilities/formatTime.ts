export const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatPlaylistDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds)) return ''
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hours, ${mins} minutes`
  }
  return `${mins} minutes`
}