import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BaseModal from "./BaseModal";
import ExerciseImage from "./ExerciseImage";

export default function ReorderExercisesModal({
  isOpen,
  onClose,
  exercises,
  onSave,
}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setItems([...exercises]);
    }
  }, [isOpen, exercises]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Reorder Exercises">
      <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
        <p className="px-6 py-2 text-xs text-muted">
          Drag exercises to reorder them
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="reorder-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 overflow-y-auto px-4 pb-4"
              >
                {items.map((ex, index) => {
                  const name =
                    ex.exercise_name || ex.exercise?.name || "Exercise";
                  const imageUrl = ex.image_url || ex.exercise?.image_url;
                  const setCount = ex.sets?.length || 0;

                  return (
                    <Draggable
                      key={`reorder-${index}`}
                      draggableId={`reorder-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center gap-3 p-3 mb-2 rounded-lg transition-all select-none"
                          style={{
                            background: snapshot.isDragging
                              ? "var(--color-accent-subtle)"
                              : "var(--color-surface-raised)",
                            border: snapshot.isDragging
                              ? "2px solid var(--color-accent)"
                              : "1px solid var(--color-border)",
                            boxShadow: snapshot.isDragging
                              ? "0 8px 32px rgba(0,200,255,0.3), 0 0 0 1px var(--color-accent)"
                              : "none",
                            transform: snapshot.isDragging
                              ? "scale(1.02)"
                              : "scale(1)",
                            cursor: snapshot.isDragging ? "grabbing" : "grab",
                            ...provided.draggableProps.style,
                          }}
                        >
                          {/* Drag indicator */}
                          <div className="flex flex-col gap-0.5 opacity-40">
                            <div className="flex gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-current" />
                              <div className="w-1 h-1 rounded-full bg-current" />
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-current" />
                              <div className="w-1 h-1 rounded-full bg-current" />
                            </div>
                            <div className="flex gap-0.5">
                              <div className="w-1 h-1 rounded-full bg-current" />
                              <div className="w-1 h-1 rounded-full bg-current" />
                            </div>
                          </div>

                          <ExerciseImage
                            imageUrl={imageUrl}
                            name={name}
                            size="sm"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text text-sm truncate">
                              {name}
                            </p>
                            <p className="text-xs text-muted">
                              {setCount} set{setCount !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <span className="text-xs text-muted font-mono">
                            #{index + 1}
                          </span>
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

        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "monospace",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "var(--color-accent)",
              color: "#000",
              border: "1px solid var(--color-accent-80)",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "monospace",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
