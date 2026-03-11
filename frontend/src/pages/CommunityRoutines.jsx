import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTemplateRoutines, saveTemplateRoutine, saveTemplateFolder } from "../utils/api";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";
import { ChevronDown, BookmarkPlus, FolderDown } from "lucide-react";

const chamfer = (size = 10) =>
  `polygon(${size}px 0%, 100% 0%, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0% 100%, 0% ${size}px)`;

export default function CommunityRoutines() {
  const [templates, setTemplates] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    getTemplateRoutines()
      .then(({ templates, creator }) => {
        setTemplates(templates);
        setCreator(creator);
        // Expand first folder by default
        if (templates.length > 0) {
          setExpanded({ [templates[0].folder_id]: true });
        }
      })
      .catch(() => toast.error("Failed to load routines"))
      .finally(() => setLoading(false));
  }, []);

  const toggleFolder = (folderId) =>
    setExpanded((prev) => ({ ...prev, [folderId]: !prev[folderId] }));

  const handleSaveRoutine = async (routineId, routineName) => {
    setSaving((prev) => ({ ...prev, [routineId]: true }));
    try {
      await saveTemplateRoutine(routineId);
      toast.success(`"${routineName}" saved to My Routines`);
    } catch {
      toast.error("Failed to save routine");
    } finally {
      setSaving((prev) => ({ ...prev, [routineId]: false }));
    }
  };

  const handleSaveFolder = async (folderId, folderName) => {
    setSaving((prev) => ({ ...prev, [`folder_${folderId}`]: true }));
    try {
      await saveTemplateFolder(folderId);
      toast.success(`"${folderName}" folder saved to your account`);
    } catch {
      toast.error("Failed to save folder");
    } finally {
      setSaving((prev) => ({ ...prev, [`folder_${folderId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <TopBar title="Browse Routines" showBack />
        <div className="px-5 pt-5 pb-28 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="Browse Routines" showBack />
      <div className="px-5 pt-5 pb-28">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: "var(--color-accent)", fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em" }}>
              //
            </span>
            <span style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase" }}>
              Curated by {creator?.username ?? "admin"}
            </span>
          </div>
          <p style={{ color: "var(--color-text)", fontSize: "13px", lineHeight: 1.6, marginTop: "6px" }}>
            Not sure where to start? Pick a proven split, save it to your account, and start training today.
          </p>
        </div>

        {/* Folder sections */}
        {templates.map((folder) => {
          const isOpen = !!expanded[folder.folder_id];
          const folderSaving = saving[`folder_${folder.folder_id}`];

          return (
            <div key={folder.folder_id} className="mb-4">
              {/* Folder header */}
              <div
                className="flex items-center justify-between px-4 py-4 cursor-pointer"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  clipPath: isOpen ? chamfer(10) : chamfer(10),
                  borderBottom: isOpen ? "1px solid var(--color-border)" : "1px solid var(--color-border)",
                }}
                onClick={() => toggleFolder(folder.folder_id)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--color-accent)",
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ color: "var(--color-text)", fontWeight: 600, fontSize: "14px" }}>
                      {folder.folder_name}
                    </p>
                    <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "2px" }}>
                      {folder.routines.length} routines
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveFolder(folder.folder_id, folder.folder_name);
                  }}
                  disabled={folderSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase"
                  style={{
                    background: "var(--color-accent-subtle)",
                    border: "1px solid var(--color-accent-35)",
                    color: "var(--color-accent)",
                    clipPath: chamfer(5),
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    opacity: folderSaving ? 0.5 : 1,
                  }}
                >
                  <FolderDown size={12} />
                  {folderSaving ? "Saving..." : "Save All"}
                </button>
              </div>

              {/* Routines */}
              {isOpen && (
                <div className="mt-2 space-y-3 pl-2">
                  {folder.routines.map((routine) => {
                    const isSaving = saving[routine.id];
                    return (
                      <div
                        key={routine.id}
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          clipPath: chamfer(10),
                        }}
                      >
                        <div className="px-4 pt-4 pb-3">
                          {/* Routine header */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {routine.icon && (
                                  <span style={{ fontSize: "14px" }}>{routine.icon}</span>
                                )}
                                <p style={{ color: "var(--color-text)", fontWeight: 600, fontSize: "14px" }}>
                                  {routine.name}
                                </p>
                              </div>
                              {routine.description && (
                                <p style={{ color: "var(--color-muted)", fontSize: "12px", marginTop: "4px", lineHeight: 1.5 }}>
                                  {routine.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Exercise images */}
                          {routine.exercise_images?.length > 0 && (
                            <div className="flex gap-1.5 mb-3">
                              {routine.exercise_images.map((url, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 overflow-hidden flex-shrink-0"
                                  style={{ background: "var(--color-surface-raised)", clipPath: chamfer(4) }}
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                                </div>
                              ))}
                              {routine.exercise_count > 4 && (
                                <div
                                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                                  style={{ background: "var(--color-surface-raised)", clipPath: chamfer(4) }}
                                >
                                  <span style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "9px" }}>
                                    +{routine.exercise_count - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Exercise list */}
                          <div className="mb-4">
                            {routine.exercises?.map((ex) => (
                              <div
                                key={ex.id}
                                className="flex items-center justify-between py-1.5"
                                style={{ borderBottom: "1px solid var(--color-border)" }}
                              >
                                <span style={{ color: "var(--color-text)", fontSize: "12px" }}>
                                  {ex.exercise_name}
                                </span>
                                <span style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.1em" }}>
                                  {ex.sets?.length ?? ex.planned_sets} sets
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Save button */}
                          <button
                            onClick={() => handleSaveRoutine(routine.id, routine.name)}
                            disabled={isSaving}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase"
                            style={{
                              background: "var(--color-accent)",
                              color: "#000",
                              clipPath: chamfer(7),
                              letterSpacing: "0.2em",
                              opacity: isSaving ? 0.6 : 1,
                            }}
                          >
                            <BookmarkPlus size={13} />
                            {isSaving ? "Saving..." : "Save Routine"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {templates.length === 0 && (
          <div
            className="p-8 text-center mt-4"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", clipPath: chamfer(10) }}
          >
            <p className="text-3xl mb-3">📋</p>
            <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              No templates available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}