import { useNavigate } from "react-router-dom";
import { Users, Trash2, Copy, MessageSquare, Plus } from "lucide-react";

export default function TeamCard({ team, currentUserId, onInvite, onViewMembers, onDelete, isDark, colors }) {
    const isCreator = currentUserId && team.createdBy && (team.createdBy === currentUserId || team.createdBy._id === currentUserId);

    return (
        <div
            style={{
                backgroundColor: colors.cardBg,
                borderRadius: 24,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: `1px solid ${colors.border}`,
                minHeight: 200,
                position: "relative",
                transition: "all 0.2s ease-in-out",
                boxShadow: isDark ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 20px -8px ${isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
                e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isDark ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = colors.border;
            }}
        >
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: isDark ? "rgba(0, 212, 255, 0.1)" : "#e0f2fe",
                                color: colors.primary,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 20,
                                border: `1px solid ${isDark ? "rgba(0, 212, 255, 0.2)" : "#bae6fd"}`
                            }}
                        >
                            {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: colors.textMain }}>
                                {team.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                                ID: <span style={{ fontFamily: "monospace", color: colors.textMain, background: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{team.code}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    style={{ marginTop: 24, display: "flex", alignItems: "center", cursor: "pointer" }}
                    onClick={() => onViewMembers(team)}
                >
                    <div style={{ display: "flex", marginRight: 12 }}>
                        {team.members.slice(0, 4).map((m, i) => (
                            <div
                                key={m._id}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    backgroundColor: isDark ? "#374151" : "#e2e8f0",
                                    border: `2px solid ${isDark ? "#1e293b" : "#ffffff"}`,
                                    marginLeft: i > 0 ? -10 : 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    color: isDark ? "#e5e7eb" : "#475569",
                                    fontWeight: 700,
                                    title: m.username
                                }}
                            >
                                {m.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {team.members.length > 4 && (
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    backgroundColor: isDark ? "#374151" : "#e2e8f0",
                                    border: `2px solid ${isDark ? "#1e293b" : "#ffffff"}`,
                                    marginLeft: -10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    color: isDark ? "#e5e7eb" : "#475569",
                                    fontWeight: 700
                                }}
                            >
                                +{team.members.length - 4}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                    onClick={() => onViewMembers(team)}
                    style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: "transparent",
                        color: colors.textMain,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontWeight: 500,
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                    <Users size={16} /> Members
                </button>
                <button
                    onClick={() => onInvite(team)}
                    style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: "transparent",
                        color: colors.textMain,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontWeight: 500,
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                    <Copy size={16} /> Copy ID
                </button>
            </div>

            {isCreator && (
                <div style={{ marginTop: 12 }}>
                    <button
                        onClick={() => onDelete(team._id)}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: 10,
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontWeight: 600,
                            transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(239, 68, 68, 0.2)"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
                    >
                        <Trash2 size={16} /> Delete Team
                    </button>
                </div>
            )}

        </div>
    );
}
