import React, { useEffect, useRef, useState } from "react";
import { Track } from "../env";
import {
  formatDuration,
  formatTrackArtist,
} from "@renderer/utilities/formatting";

// Define the data this page needs to do its job
interface LibraryViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
  onSelectTrack: (track: Track) => void;
  onOpenTrackAlbum: (track: Track) => void;
  onOpenTrackArtist: (track: Track) => void;
  onTrackContextMenu: (
    e: React.MouseEvent,
    track: Track,
    index: number,
  ) => void;
  onImportFiles: () => Promise<number[]>;
  onImportFolder: () => Promise<number[]>;
}

export default function LibraryView({
  tracks,
  currentTrack,
  playTrack,
  onSelectTrack,
  onOpenTrackAlbum,
  onOpenTrackArtist,
  onTrackContextMenu,
  onImportFiles,
  onImportFolder,
}: LibraryViewProps) {
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = buttonRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setIsImportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="header">
        <h1>Library</h1>
        <div style={{ position: "relative" }}>
          <button
            ref={buttonRef}
            className="btn"
            onClick={() => setIsImportMenuOpen((prev) => !prev)}
          >
            + Add Songs
          </button>

          {isImportMenuOpen && (
            <div ref={menuRef} className="popup">
              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => {
                  void onImportFiles();
                  setIsImportMenuOpen(false);
                }}
              >
                Import File
              </button>
              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => {
                  void onImportFolder();
                  setIsImportMenuOpen(false);
                }}
              >
                Import Folder
              </button>
            </div>
          )}
        </div>
      </div>

      {tracks.length === 0 ? (
        <p style={{ color: "var(--text-3)" }}>
          You haven't imported any music yet.
        </p>
      ) : (
        <div>
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={`track-item ${
                currentTrack?.id === track.id ? "active" : ""
              }`}
              onClick={() => onSelectTrack(track)}
              onDoubleClick={() => playTrack(track)}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
                onTrackContextMenu(e, track, index)
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="text-soft track-item-index">
                {currentTrack?.id === track.id ? "▶" : index + 1}
              </span>
              <div className="track-album-art">
                {track.album_image_path ? (
                  <img
                    src={`local://stream?path=${encodeURIComponent(track.album_image_path.replace(/\\/g, "/"))}`}
                    alt={track.album || track.title || track.filename}
                  />
                ) : (
                  <span>🎵</span>
                )}
              </div>
              <span className="item-title" style={{ width: "20%" }}>
                {track.title || track.filename}
              </span>
              <span className="text-soft track-item-metadata">
                <button
                  type="button"
                  className="metadata-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTrackArtist(track);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  disabled={!track.artist}
                  title="Open artist page"
                >
                  {formatTrackArtist(track)}
                </button>
                <button
                  type="button"
                  className="metadata-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTrackAlbum(track);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  disabled={!track.album}
                  title="Open album page"
                >
                  {track.album || "Unknown Album"}
                </button>
                <span>{track.year}</span>
              </span>
              <span className="text-soft track-duration">
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
