// Theme types and utilities
export const theme = {
  colors: {
    background: "#f8f7f4",
    surface: "#ffffff",
    primary: "#6b7280",
    primaryHover: "#5a6673",
    text: "#374151",
    textMuted: "#6b7280",
    border: "#e5e5e5",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.04)",
    md: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    lg: "0 4px 12px rgba(0,0,0,0.06)",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
};

export type Theme = typeof theme;