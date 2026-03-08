import { useState } from "react";

export default function ExerciseImage({ imageUrl, name, size = "md" }) {
  const [failed, setFailed] = useState(false);

  const sizeClass = size === "sm" ? "w-7 h-7" : "w-12 h-12";

  return (
    <div
      className={`${sizeClass} rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center`}
      style={{
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border)",
      }}
    >
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-lg">🏋️</span>
      )}
    </div>
  );
}
