import { useTheme } from "../context/ThemeContext";

export default function Session() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        height: "100%",
        padding: "24px 32px",
        backgroundColor: isDark ? "#020617" : "#f3f4f6",
        color: isDark ? "#e5e7eb" : "#0f172a",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          marginBottom: 12,
        }}
      >
        Session overview
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#9ca3af",
          maxWidth: 520,
        }}
      >
        This area can show upcoming working sessions, recent whiteboard rooms or
        quick links into active projects. For now it is a simple placeholder.
      </p>
    </div>
  );
}

