import { useState } from "react";
import { Menu } from "lucide-react";
import SideNav from "./SideNav";

export default function TopBar({ title, onRefresh, onBack }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "var(--color-bg)",
          borderBottom: "1px solid #00c8ffcc",
        }}
      >
        {onBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-accent transition-colors cursor-pointer"
            style={{
              border: "1px solid var(--color-border)",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-accent transition-all cursor-pointer"
            style={{
              border: "1px solid var(--color-border)",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <h1
          className="text-base font-semibold tracking-widest uppercase"
          style={{
            color: "var(--color-text)",
            letterSpacing: "0.15em",
            textShadow: "none",
          }}
        >
          {title}
        </h1>

        {onRefresh ? (
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1.5 text-accent font-medium rounded-lg transition-all hover:glow-sm cursor-pointer"
            style={{
              border: "1px solid var(--color-accent-40)",
              background: "var(--color-accent-subtle)",
            }}
          >
            ↻
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>
      <SideNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
