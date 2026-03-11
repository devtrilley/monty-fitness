const chamfer = (size = 10) =>
  `polygon(${size}px 0%, 100% 0%, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0% 100%, 0% ${size}px)`;

export default function ChamferButton({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  className = "",
  size = "md",
}) {
  const padding = size === "sm" ? "py-2.5" : "py-4";

  const styles = {
    primary: {
      background: "var(--color-accent)",
      color: "#fff",
      clipPath: chamfer(10),
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "var(--color-muted)",
      border: "1px solid var(--color-border)",
      clipPath: chamfer(8),
    },
    ghost: {
      background: "var(--color-accent-subtle)",
      color: "var(--color-accent)",
      border: "1px solid var(--color-accent-30)",
      clipPath: chamfer(8),
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full font-bold text-sm uppercase tracking-[0.2em] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${padding} ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}
