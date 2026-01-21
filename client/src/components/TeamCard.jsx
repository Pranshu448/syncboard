import { useNavigate } from "react-router-dom";

export default function TeamCard({ team, onInvite, onViewMembers }) {
    const navigate = useNavigate();

    return (
        <div
            style={{
                backgroundColor: "#111827",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid #1f2937",
                minHeight: 180,
            }}
        >
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                backgroundColor: "#1e293b",
                                color: "#60a5fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                marginBottom: 12,
                                fontSize: 14
                            }}
                        >
                            {team.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#f3f4f6" }}>
                            {team.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                            Team ID: <span style={{ fontFamily: "monospace", color: "#e5e7eb" }}>{team.code}</span>
                        </p>
                    </div>
                    <div style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 99,
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        color: "#4ade80",
                        border: "1px solid rgba(34, 197, 94, 0.2)"
                    }}>
                        Active
                    </div>
                </div>

                <div
                    style={{ marginTop: 24, display: "flex", alignItems: "center", cursor: "pointer" }}
                    onClick={() => onViewMembers(team)}
                >
                    <div style={{ display: "flex", marginRight: 8 }}>
                        {team.members.slice(0, 4).map((m, i) => (
                            <div
                                key={m._id}
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 99,
                                    backgroundColor: "#374151",
                                    border: "2px solid #111827",
                                    marginLeft: i > 0 ? -8 : 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    color: "#e5e7eb",
                                    fontWeight: 600,
                                    title: m.username
                                }}
                            >
                                {m.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {team.members.length > 4 && (
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 99,
                                    backgroundColor: "#374151",
                                    border: "2px solid #111827",
                                    marginLeft: -8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    color: "#e5e7eb",
                                    fontWeight: 600
                                }}
                            >
                                +{team.members.length - 4}
                            </div>
                        )}
                    </div>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                    onClick={() => onViewMembers(team)}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                    }}
                >
                    <span>👥</span> Members
                </button>
                <button
                    onClick={() => onInvite(team)}
                    style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid #374151",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                    }}
                >
                    <span>👤</span> Invite
                </button>
            </div>
        </div>
    );
}
