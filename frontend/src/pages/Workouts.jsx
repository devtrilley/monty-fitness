import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import {
  getRoutines,
  startWorkout,
  startEmptyWorkout,
  deleteRoutine,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveRoutineToFolder,
} from "../utils/api";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";
import ChamferButton from "../components/ChamferButton";
import {
  FolderPlus,
  FilePlus2,
  Folder,
  CornerUpLeft,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function WorkoutsSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar title="My Routines" />
      <div className="px-6 py-6 pb-24 animate-pulse">
        <div className="h-14 bg-surface rounded-xl border border-border mb-4" />

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-14 bg-surface rounded-xl border border-border" />
          <div className="flex-1 h-14 bg-surface rounded-xl border border-border" />
        </div>
        {/* Section header */}
        <div className="h-3 w-24 bg-surface rounded mb-4 mt-2" />
        {/* Routine cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl mb-3 p-4 space-y-3"
          >
            <div className="h-4 w-2/3 bg-surface-raised rounded" />
            <div className="h-3 w-1/2 bg-surface-raised rounded" />
            <div className="h-10 bg-surface-raised rounded-lg mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Workouts() {
  const [routines, setRoutines] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [closedFolders, setClosedFolders] = useState(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("closed_folders") || "[]")
      );
    } catch {
      return new Set();
    }
  });
  const [myRoutinesCollapsed, setMyRoutinesCollapsed] = useState(true);
  const [foldersInitialized, setFoldersInitialized] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [movingRoutineId, setMovingRoutineId] = useState(null);
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const stored = localStorage.getItem("section_order");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();
  const { openSession, isOpen, discard } = useWorkout();
  const [showActiveWarning, setShowActiveWarning] = useState(false);
  const [pendingRoutineId, setPendingRoutineId] = useState(null);
  const [pendingEmpty, setPendingEmpty] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen !== null) setMenuOpen(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (foldersInitialized) return;
    if (folders.length === 0) {
      setMyRoutinesCollapsed(false);
      setFoldersInitialized(true);
      return;
    }

    const currentFolderIds = folders.map((f) => String(f.id));

    // Build a clean, validated section order
    let order = sectionOrder
      ? sectionOrder.filter(
          (id) => id === "my_routines" || currentFolderIds.includes(id)
        )
      : null;

    // Add any new folder IDs not yet in order (append before my_routines)
    const missingIds = currentFolderIds.filter(
      (id) => !order || !order.includes(id)
    );
    if (!order) {
      order = [...currentFolderIds, "my_routines"];
    } else if (missingIds.length > 0) {
      const myRoutinesIdx = order.indexOf("my_routines");
      order = [...order.slice(0, myRoutinesIdx), ...missingIds, "my_routines"];
    }
    // Ensure my_routines is always present
    if (!order.includes("my_routines")) order.push("my_routines");

    setSectionOrder(order);
    localStorage.setItem("section_order", JSON.stringify(order));

    // Only apply position-based defaults if user has never set their own prefs
    const hasClosedFoldersPref =
      localStorage.getItem("closed_folders") !== null;
    const hasMyRoutinesPref =
      localStorage.getItem("my_routines_collapsed") !== null;

    if (!hasClosedFoldersPref) {
      const firstId = order[0];
      const toClose = new Set(
        order
          .slice(1)
          .filter((id) => id !== "my_routines")
          .map((id) => Number(id))
      );
      setClosedFolders(toClose);
      localStorage.setItem("closed_folders", JSON.stringify([...toClose]));
    }

    if (!hasMyRoutinesPref) {
      const firstId = order[0];
      setMyRoutinesCollapsed(firstId !== "my_routines");
    } else {
      setMyRoutinesCollapsed(
        localStorage.getItem("my_routines_collapsed") !== "false"
      );
    }

    setFoldersInitialized(true);
  }, [folders]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async () => {
    try {
      const [routinesData, foldersData] = await Promise.all([
        getRoutines(),
        getFolders(),
      ]);
      setRoutines(routinesData.routines || []);
      setFolders(foldersData.folders || []);
    } catch {
      toast.error("Failed to load routines");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (e, routineId) => {
    e.stopPropagation();
    if (isOpen) {
      setPendingRoutineId(routineId);
      setPendingEmpty(false);
      setShowActiveWarning(true);
      return;
    }
    try {
      const { session } = await startWorkout(routineId);
      openSession(session.id);
    } catch {
      toast.error("Failed to start workout");
    }
  };
  const handleStartEmptyWorkout = async () => {
    if (isOpen) {
      setPendingEmpty(true);
      setPendingRoutineId(null);
      setShowActiveWarning(true);
      return;
    }
    try {
      const { session } = await startEmptyWorkout();
      openSession(session.id);
    } catch {
      toast.error("Failed to start empty workout");
    }
  };
  const handleDiscardAndStart = async () => {
    setDiscarding(true);
    const ok = await discard();
    if (!ok) {
      setDiscarding(false);
      return;
    }
    setShowActiveWarning(false);
    setDiscarding(false);
    try {
      if (pendingEmpty) {
        const { session } = await startEmptyWorkout();
        openSession(session.id);
      } else if (pendingRoutineId) {
        const { session } = await startWorkout(pendingRoutineId);
        openSession(session.id);
      }
    } catch {
      toast.error("Failed to start workout");
    }
    setPendingRoutineId(null);
    setPendingEmpty(false);
  };

  const handleDeleteRoutine = async (e, routineId, routineName) => {
    e.stopPropagation();
    if (!confirm(`Delete "${routineName}"?`)) return;
    try {
      await deleteRoutine(routineId);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      toast.success("Routine deleted");
      setMenuOpen(null);
    } catch {
      toast.error("Failed to delete routine");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const data = await createFolder(newFolderName.trim());
      setFolders((prev) => [...prev, data.folder]);
      setNewFolderName("");
      setShowCreateFolder(false);
      toast.success("Folder created");
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const handleRenameFolder = async (folderId) => {
    if (!renameFolderName.trim()) return;
    try {
      const data = await renameFolder(folderId, renameFolderName.trim());
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderId ? { ...f, name: data.folder.name } : f
        )
      );
      setRenamingFolderId(null);
      toast.success("Folder renamed");
    } catch {
      toast.error("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folderId, folderName) => {
    const count = routines.filter((r) => r.folder_id === folderId).length;
    const msg =
      count > 0
        ? `Delete "${folderName}"? ${count} routine(s) will move to My Routines.`
        : `Delete "${folderName}"?`;
    if (!confirm(msg)) return;
    try {
      await deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setRoutines((prev) =>
        prev.map((r) =>
          r.folder_id === folderId ? { ...r, folder_id: null } : r
        )
      );
      toast.success("Folder deleted");
      setMenuOpen(null);
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const handleMoveRoutine = async (routineId, folderId) => {
    try {
      await moveRoutineToFolder(routineId, folderId);
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId ? { ...r, folder_id: folderId } : r
        )
      );
      setMovingRoutineId(null);
      toast.success(folderId ? "Moved to folder" : "Moved to My Routines");
    } catch {
      toast.error("Failed to move routine");
    }
  };

  const toggleFolder = (folderId) => {
    setClosedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      localStorage.setItem("closed_folders", JSON.stringify([...next]));
      return next;
    });
  };

  const handleSectionDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(sectionOrder || []);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setSectionOrder(newOrder);
    localStorage.setItem("section_order", JSON.stringify(newOrder));
    // Open only the first section
    const firstId = newOrder[0];
    setMyRoutinesCollapsed(firstId !== "my_routines");
    const toClose = new Set(
      newOrder
        .slice(1)
        .filter((id) => id !== "my_routines")
        .map((id) => Number(id))
    );
    setClosedFolders(toClose);
    localStorage.setItem("closed_folders", JSON.stringify([...toClose]));
  };

  const unfiledRoutines = routines.filter((r) => !r.folder_id);
  const movingRoutine = routines.find((r) => r.id === movingRoutineId);

  // Compute valid display order synchronously — filters stale IDs so nothing disappears
  const currentFolderIds = folders.map((f) => String(f.id));
  const displayOrder = (() => {
    if (!sectionOrder) return [...currentFolderIds, "my_routines"];
    const valid = sectionOrder.filter(
      (id) => id === "my_routines" || currentFolderIds.includes(id)
    );
    const missing = currentFolderIds.filter((id) => !valid.includes(id));
    if (!valid.includes("my_routines")) valid.push("my_routines");
    const myIdx = valid.indexOf("my_routines");
    valid.splice(myIdx, 0, ...missing);
    return valid;
  })();

  if (loading) return <WorkoutsSkeleton />;

  const RoutineCard = ({ routine }) => (
    <div className="relative">
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          clipPath:
            "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
        }}
      >
        <div
          onClick={() => navigate(`/workouts/${routine.id}`)}
          className="w-full flex items-center justify-between p-4 transition-colors cursor-pointer"
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-surface-raised)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div className="flex-1 min-w-0 pr-2">
            <p className="font-semibold text-text">{routine.name}</p>
            {routine.exercise_preview && (
              <p className="text-xs text-muted mt-0.5 truncate">
                {routine.exercise_preview}
              </p>
            )}
            {routine.exercise_images?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {routine.exercise_images.map((url, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-md overflow-hidden bg-surface-raised flex-shrink-0"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(
                menuOpen?.id === routine.id
                  ? null
                  : { type: "routine", id: routine.id }
              );
            }}
            className="p-2 hover:bg-surface-raised rounded-lg flex-shrink-0"
          >
            <span className="text-muted">•••</span>
          </button>
        </div>
        <div className="px-4 pb-4">
          <ChamferButton
            onClick={(e) => handleStartWorkout(e, routine.id)}
            size="sm"
          >
            Start Routine
          </ChamferButton>
        </div>
      </div>
      {menuOpen?.type === "routine" && menuOpen?.id === routine.id && (
        <div
          className="absolute right-0 shadow-lg z-[9999]"
          style={{
            top: "8px",
            width: "11rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-bright)",
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/workouts/${routine.id}/edit`);
              setMenuOpen(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMovingRoutineId(routine.id);
              setMenuOpen(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised"
          >
            Move to Folder
          </button>
          <button
            onClick={(e) => handleDeleteRoutine(e, routine.id, routine.name)}
            className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-raised"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const FolderSection = ({ folder, dragHandleProps }) => {
    const folderRoutines = routines.filter((r) => r.folder_id === folder.id);
    const isCollapsed = closedFolders.has(folder.id);
    return (
      <div className="mb-2">
        <div className="flex items-center py-2 gap-2">
          <div {...dragHandleProps} className="cursor-grab p-1">
            <GripVertical
              size={14}
              style={{ color: "var(--color-border-bright)" }}
            />
          </div>
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <svg
              className={`w-3 h-3 text-muted transition-transform flex-shrink-0 ${
                isCollapsed ? "-rotate-90" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
            {renamingFolderId === folder.id ? (
              <input
                type="text"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameFolder(folder.id);
                  if (e.key === "Escape") setRenamingFolderId(null);
                }}
                onBlur={() => handleRenameFolder(folder.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 border border-accent rounded text-sm font-semibold bg-surface-raised text-text focus:outline-none"
              />
            ) : (
              <span className="font-semibold text-text">
                {folder.name}{" "}
                <span className="font-normal text-muted">
                  ({folderRoutines.length})
                </span>
              </span>
            )}
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(
                  menuOpen?.id === folder.id
                    ? null
                    : { type: "folder", id: folder.id }
                );
              }}
              className="p-1.5 hover:bg-surface-raised rounded-lg"
            >
              <span className="text-muted text-sm">•••</span>
            </button>
            {menuOpen?.type === "folder" && menuOpen?.id === folder.id && (
              <div
                className="absolute right-0 shadow-lg z-[9999]"
                style={{
                  top: "calc(100% + 4px)",
                  width: "10rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-bright)",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameFolderName(folder.name);
                    setRenamingFolderId(folder.id);
                    setMenuOpen(null);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id, folder.name);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-raised"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <div className="space-y-3 mb-2">
            {folderRoutines.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl py-6 text-center">
                <p className="text-sm text-muted">
                  No routines — move one here
                </p>
              </div>
            ) : (
              folderRoutines.map((routine) => (
                <RoutineCard key={routine.id} routine={routine} />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar title="My Routines" />
      <div className="px-6 py-6 pb-24">
        <ChamferButton onClick={handleStartEmptyWorkout} className="mb-4">
          Empty Workout
        </ChamferButton>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setNewFolderName("");
              setShowCreateFolder(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-medium text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "monospace",
            }}
          >
            <FolderPlus size={15} />
            New Folder
          </button>
          <button
            onClick={() => navigate("/workouts/create")}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-medium text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={{
              background: "var(--color-accent-subtle)",
              border: "1px solid var(--color-accent-35)",
              color: "var(--color-accent)",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "monospace",
            }}
          >
            <FilePlus2 size={15} />
            New Routine
          </button>
        </div>

        {/* Create Folder Input */}
        {showCreateFolder && (
          <div className="bg-surface border border-border rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-text mb-2">Folder Name</p>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="e.g. PPL, Upper Lower, Bulk"
              autoFocus
              className="w-full px-3 py-2 border border-border bg-surface-raised text-text rounded-lg text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 py-2 border border-border rounded-lg text-sm text-muted hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Drag-and-drop section list */}
        <DragDropContext onDragEnd={handleSectionDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {displayOrder.map((sectionId, idx) => {
                  if (sectionId === "my_routines") {
                    return (
                      <Draggable
                        key="my_routines"
                        draggableId="my_routines"
                        index={idx}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="mt-2"
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.85 : 1,
                            }}
                          >
                            <div className="flex items-center py-2 gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab p-1"
                              >
                                <GripVertical
                                  size={14}
                                  style={{
                                    color: "var(--color-border-bright)",
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setMyRoutinesCollapsed((p) => {
                                    localStorage.setItem(
                                      "my_routines_collapsed",
                                      String(!p)
                                    );
                                    return !p;
                                  });
                                }}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                <svg
                                  className={`w-3 h-3 text-muted transition-transform flex-shrink-0 ${
                                    myRoutinesCollapsed ? "-rotate-90" : ""
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M7 10l5 5 5-5z" />
                                </svg>
                                <span className="font-semibold text-text">
                                  My Routines{" "}
                                  <span className="font-normal text-muted">
                                    ({unfiledRoutines.length})
                                  </span>
                                </span>
                              </button>
                            </div>
                            {!myRoutinesCollapsed && (
                              <div className="space-y-3">
                                {unfiledRoutines.length === 0 ? (
                                  <div className="border-2 border-dashed border-border rounded-xl py-6 text-center">
                                    <p className="text-sm text-muted">
                                      {routines.length === 0
                                        ? "No routines yet — create one above"
                                        : "All routines are in folders"}
                                    </p>
                                  </div>
                                ) : (
                                  unfiledRoutines.map((routine) => (
                                    <RoutineCard
                                      key={routine.id}
                                      routine={routine}
                                    />
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                  const folder = folders.find(
                    (f) => String(f.id) === sectionId
                  );
                  if (!folder) return null;
                  return (
                    <Draggable
                      key={sectionId}
                      draggableId={sectionId}
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.85 : 1,
                          }}
                        >
                          <FolderSection
                            folder={folder}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      {showActiveWarning && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[999] px-4 fade-in"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={() => setShowActiveWarning(false)}
        >
          <div
            className="w-full max-w-sm p-6 modal-slide-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-bright)",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              boxShadow:
                "0 0 48px rgba(0,0,0,0.95), 0 0 24px var(--color-accent-15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-sm font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "var(--color-text)", fontFamily: "monospace" }}
            >
              Workout In Progress
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
              You have an active workout. Go back to finish it, or discard it to
              start a new one.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowActiveWarning(false)}
                className="w-full py-2.5 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
                style={{
                  background: "var(--color-accent)",
                  color: "#000",
                  clipPath:
                    "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                  fontFamily: "monospace",
                }}
              >
                Continue Workout
              </button>
              <button
                onClick={handleDiscardAndStart}
                disabled={discarding}
                className="w-full py-2.5 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid var(--color-danger)",
                  color: "var(--color-danger)",
                  clipPath:
                    "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                  fontFamily: "monospace",
                }}
              >
                {discarding ? "Discarding..." : "Discard & Start New"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Bottom Sheet */}
      {movingRoutineId && (
        <div
          className="fixed inset-0 flex items-end"
          style={{ background: "rgba(0,0,0,0.85)", zIndex: 200 }}
          onClick={() => setMovingRoutineId(null)}
        >
          <div
            className="w-full p-6 modal-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border-bright)",
              borderLeft: "1px solid var(--color-border)",
              borderRight: "1px solid var(--color-border)",
              clipPath:
                "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 0% 100%, 0% 12px)",
              boxShadow:
                "0 -8px 48px rgba(0,0,0,0.95), 0 0 24px var(--color-accent-15)",
            }}
          >
            <h3 className="font-semibold text-text mb-1">Move to Folder</h3>
            <p className="text-sm text-muted mb-4">{movingRoutine?.name}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveRoutine(movingRoutineId, folder.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
                  style={
                    movingRoutine?.folder_id === folder.id
                      ? {
                          background: "var(--color-accent-subtle)",
                          border: "1px solid var(--color-accent-35)",
                          color: "var(--color-accent)",
                          clipPath:
                            "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text)",
                          clipPath:
                            "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                        }
                  }
                >
                  <Folder size={15} style={{ color: "var(--color-muted)" }} />
                  <span className="font-medium">{folder.name}</span>
                  {movingRoutine?.folder_id === folder.id && (
                    <span className="ml-auto text-accent">✓</span>
                  )}
                </button>
              ))}
              {movingRoutine?.folder_id && (
                <button
                  onClick={() => handleMoveRoutine(movingRoutineId, null)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-muted transition-all active:scale-[0.99]"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    clipPath:
                      "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                  }}
                >
                  <CornerUpLeft
                    size={15}
                    style={{ color: "var(--color-muted)" }}
                  />
                  <span>Move back to My Routines</span>
                </button>
              )}
              {folders.length === 0 && (
                <p className="text-sm text-muted text-center py-4">
                  No folders yet — create one first
                </p>
              )}
            </div>
            <button
              onClick={() => setMovingRoutineId(null)}
              className="w-full mt-4 py-3 text-muted font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                clipPath:
                  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                fontFamily: "monospace",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
