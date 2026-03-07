import { useState } from "react";
import { Menu } from "lucide-react";
import SideNav from "./SideNav";

export default function TopBar({ title, onRefresh, onBack }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-50 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-muted hover:text-text text-xl transition-colors"
          >
            ←
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted hover:text-text transition-colors"
          >
            <Menu size={22} />
          </button>
        )}

        <h1 className="text-lg font-semibold text-text">{title}</h1>

        {onRefresh ? (
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1 bg-surface-raised hover:bg-border text-muted font-medium rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>
      <SideNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
