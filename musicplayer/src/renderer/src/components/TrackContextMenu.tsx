import { useEffect, useState } from "react";
import { Track, Playlist } from "../env";

export interface TrackContextMenuData {
  x: number;
  y: number;
  track: Track;
  queueIndex?: number;
  source: "library" | "playlist" | "queue";
}

interface TrackContextMenuProps {
  menuData: TrackContextMenuData | null;
  onClose: () => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlist: Playlist, trackId: number) => void;
  onRemoveFromQueue?: (index: number) => void;
  onRemoveFromPlaylist?: (trackId: number) => void;
  onDeleteFromLibrary?: (trackId: number) => void;
  onOpenArtist?: (track: Track) => void;
  onOpenAlbum?: (track: Track) => void;
}

export default function TrackContextMenu({
  menuData,
  onClose,
  onPlayNext,
  onAddToQueue,
  playlists = [],
  onAddToPlaylist,
  onRemoveFromQueue,
  onRemoveFromPlaylist,
  onDeleteFromLibrary,
  onOpenArtist,
  onOpenAlbum,
}: TrackContextMenuProps) {
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);

  // Automatically close the menu if the user clicks ANYWHERE else on the screen
  useEffect(() => {
    const handleClickOutside = () => onClose();
    if (menuData) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuData, onClose]);

  if (!menuData) return null;

  const safeX = Math.min(menuData.x, window.innerWidth - 200);
  const safeY = Math.min(menuData.y, window.innerHeight - 200);

  return (
    <div
      className="context-menu"
      style={{ top: safeY, left: safeX, overflow: "visible" }}
      onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
        e.preventDefault()
      }
    >
      <div
        className="context-menu-item"
        onClick={() => onPlayNext(menuData.track)}
      >
        Play Next
      </div>
      <div
        className="context-menu-item"
        onClick={() => onAddToQueue(menuData.track)}
      >
        Add to Queue
      </div>
      {(onOpenArtist || onOpenAlbum) && (
        <>
          <div className="context-menu-divider"></div>
          {onOpenArtist && (
            <div
              className="context-menu-item"
              onClick={() => {
                onOpenArtist(menuData.track);
                onClose();
              }}
            >
              Go to Artist
            </div>
          )}
          {onOpenAlbum && (
            <div
              className="context-menu-item"
              onClick={() => {
                onOpenAlbum(menuData.track);
                onClose();
              }}
            >
              Go to Album
            </div>
          )}
        </>
      )}

      <div className="context-menu-divider"></div>

      <div
        className="context-menu-item"
        onMouseEnter={() => setShowPlaylistSubmenu(true)}
        onMouseLeave={() => setShowPlaylistSubmenu(false)}
        style={{ position: "relative" }}
      >
        Add to Playlist
        {showPlaylistSubmenu && playlists.length > 0 && (
          <div
            className="context-menu"
            style={{
              position: "absolute",
              top: 0,
              left: "100%",
              minWidth: "180px",
              zIndex: 1000,
              marginLeft: "2px",
              overflow: "hidden",
            }}
            onMouseEnter={() => setShowPlaylistSubmenu(true)}
            onMouseLeave={() => setShowPlaylistSubmenu(false)}
          >
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="context-menu-item"
                onClick={() => {
                  if (onAddToPlaylist) {
                    onAddToPlaylist(playlist, menuData.track.id);
                  }
                  onClose();
                  setShowPlaylistSubmenu(false);
                }}
              >
                <div
                  className="sidebar-thumb"
                  style={{ backgroundColor: "var(--neutral-background-dark" }}
                >
                  {playlist.cover_image_path ? (
                    <img
                      src={`local://stream?path=${encodeURIComponent(playlist.cover_image_path.replace(/\\/g, "/"))}`}
                      alt="cover"
                    />
                  ) : (
                    <span style={{ fontSize: "10px" }}>🎵</span>
                  )}
                </div>
                <div className="item-title">{playlist.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Only show "Remove" if we right-clicked inside the queue! */}
      {menuData.source === "queue" && onRemoveFromQueue && (
        <>
          <div className="context-menu-divider"></div>
          <div
            className="context-menu-item danger"
            onClick={() => {
              if (menuData.queueIndex !== undefined) {
                onRemoveFromQueue(menuData.queueIndex);
              }
            }}
          >
            Remove from Queue
          </div>
        </>
      )}

      {/* Only show "Remove from Playlist" if we right-clicked inside a playlist */}
      {menuData.source === "playlist" && onRemoveFromPlaylist && (
        <>
          {/* <div className="context-menu-divider"></div> */}
          <div
            className="context-menu-item danger"
            onClick={() => onRemoveFromPlaylist(menuData.track.id)}
          >
            Remove from Playlist
          </div>
        </>
      )}

      {/* Show "Remove from Library" option for all sources */}
      {onDeleteFromLibrary && (
        <>
          <div className="context-menu-divider"></div>
          <div
            className="context-menu-item danger"
            onClick={() => onDeleteFromLibrary(menuData.track.id)}
          >
            Remove from Library
          </div>
        </>
      )}
    </div>
  );
}
