import React, { useState } from "react";
import { Track } from "../env";
import { formatDuration } from "@renderer/utilities/formatting";

interface QueueSidebarProps {
  isOpen: boolean;
  queue: Track[];
  historyQueue: Track[];
  currentTrack: Track | null;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onSelectTrack: (track: Track) => void;
  onPlayTrack: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, track: Track, index: number) => void;
  onClear: (target: "queue" | "history") => void;
}

export default function QueueSidebar({
  isOpen,
  queue,
  historyQueue,
  currentTrack,
  onReorderQueue,
  onSelectTrack,
  onPlayTrack,
  onContextMenu: onTrackContextMenu,
  onClear,
}: QueueSidebarProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  let list: Track[] = queue;
  if (!isOpen) return null;
  if (activeTab === "queue") {
    list = queue;
  } else {
    list = historyQueue;
  }

  const emptyText =
    activeTab === "queue" ? "Your queue is empty." : "No history available.";
  const getDropClass = (index: number) => {
    if (draggedIndex === null || dropIndex === null) return "";
    if (dropIndex === draggedIndex || dropIndex === draggedIndex + 1) return "";
    if (dropIndex === list.length && index === list.length - 1)
      return "drop-after";
    if (dropIndex === index) return "drop-before";
    return "";
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div className="tab-select">
          <label>
            {" "}
            Queue
            <input
              type="radio"
              name="Queue"
              value="queue"
              checked={activeTab === "queue"}
              onChange={() => setActiveTab("queue")}
            />
          </label>
          <label>
            {" "}
            History
            <input
              type="radio"
              name="Queue"
              value="history"
              checked={activeTab === "history"}
              onChange={() => setActiveTab("history")}
            />
          </label>
        </div>

        {list.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <div className="queue-list">
            {list.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className={`queue-item ${currentTrack?.id === track.id ? "playing" : ""} ${draggedIndex === i ? "dragging" : ""} ${getDropClass(i)}`}
                draggable={activeTab === "queue"}
                onDragStart={(e) => {
                  if (activeTab !== "queue") return;
                  setDraggedIndex(i);
                  setDropIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                }}
                onDragOver={(e) => {
                  if (activeTab === "queue") {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const rect = e.currentTarget.getBoundingClientRect();
                    const isAfterMidpoint =
                      e.clientY > rect.top + rect.height / 2;
                    setDropIndex(isAfterMidpoint ? i + 1 : i);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (activeTab !== "queue") return;

                  const fromIndex =
                    draggedIndex ??
                    Number(e.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(fromIndex)) {
                    onReorderQueue(fromIndex, dropIndex ?? i);
                  }
                  setDraggedIndex(null);
                  setDropIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDropIndex(null);
                }}
                onClick={() => onSelectTrack(track)}
                onDoubleClick={() => {
                  if (activeTab === "queue") {
                    onPlayTrack(i);
                  }
                }}
                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
                  onTrackContextMenu(e, track, i)
                }
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="item-title">
                  <span>{track.title || track.filename}</span>
                  <div
                    className="text-soft"
                    style={{ fontSize: "12px", textAlign: "left" }}
                  >
                    {track?.artist ? track?.artist : "Unknown Artist"}
                    {" — "}
                    {track?.album ? track.album : "Unknown Album"}
                  </div>
                </div>
                <span
                  className="text-soft"
                  style={{ marginLeft: "10px", overflow: "clip" }}
                >
                  {formatDuration(track.duration)}
                </span>
                {/* <hr style={{alignSelf: 'end', width: '100%', zIndex: '500'}}/> */}
              </div>
            ))}
          </div>
        )}
        <button
          className="btn-light"
          style={{ marginTop: "auto" }}
          onClick={() => onClear(activeTab)}
        >
          Clear
        </button>
      </div>
    </>
  );
}
