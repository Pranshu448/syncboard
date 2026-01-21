import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTeams, createTeam } from "../api/teams";
import api from "../utils/axios";
import TeamCard from "../components/TeamCard";

// Simple Modal Component
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#1e293b", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400,
        border: "1px solid #334155", color: "#f8fafc"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingMembers, setViewingMembers] = useState(null); // team object
  const [newTeamName, setNewTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const res = await getMyTeams();
      setTeams(res.data || []);
    } catch (err) {
      console.error("Failed to load teams", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsLoading(true);
    try {
      await createTeam({ name: newTeamName });
      setIsCreateOpen(false);
      setNewTeamName("");
      loadTeams();
    } catch (err) {
      console.error("Failed to create team", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = (team) => {
    const link = `${window.location.origin}/invite/${team.code}`;
    navigator.clipboard.writeText(link);
    alert(`Invite link copied: ${link}`);
  };

  const handleMessage = async (memberId) => {
    try {
      const res = await api.post("/chats/create", {
        otherUserId: memberId,
      });
      const chat = res.data;
      navigate("/workspace/chat", { state: { openChatId: chat._id } });
    } catch (err) {
      console.error("Failed to open chat", err);
      navigate("/workspace/chat");
    }
  };

  return (
    <div style={{ padding: 32, height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#f8fafc" }}>Teams</h1>
          <p style={{ margin: 0, color: "#94a3b8" }}>Manage your teams and collaborate with members</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              backgroundColor: "#22d3ee", color: "#0f172a", fontWeight: 600, cursor: "pointer"
            }}
          >
            + Create Team
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {teams.map(team => (
          <TeamCard
            key={team._id}
            team={team}
            onInvite={handleInvite}
            onViewMembers={setViewingMembers}
          />
        ))}

        {/* Create New Team Card Placeholder */}
        <div
          onClick={() => setIsCreateOpen(true)}
          style={{
            border: "1px dashed #334155", borderRadius: 16, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", minHeight: 180, cursor: "pointer",
            backgroundColor: "rgba(15, 23, 42, 0.5)", color: "#94a3b8", transition: "all 0.2s"
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 99, backgroundColor: "#1e293b",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24
          }}>+</div>
          <span style={{ fontWeight: 500 }}>Create New Team</span>
          <span style={{ fontSize: 12, marginTop: 4 }}>Start collaborating today</span>
        </div>
      </div>

      {isCreateOpen && (
        <Modal title="Create New Team" onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#cbd5e1" }}>Team Name</label>
            <input
              autoFocus
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="e.g. Engineering"
              style={{
                width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #475569",
                backgroundColor: "#0f172a", color: "#fff", marginBottom: 20, boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid #475569", color: "#cbd5e1", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTeamName.trim() || isLoading}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#22d3ee", border: "none", color: "#0f172a", fontWeight: 600, cursor: "pointer" }}
              >
                {isLoading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewingMembers && (
        <Modal title={`Members of ${viewingMembers.name}`} onClose={() => setViewingMembers(null)}>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {viewingMembers.members.map(member => (
              <div key={member._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 99, background: "#475569",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, marginRight: 12
                  }}>
                    {member.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{member.username}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{member.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleMessage(member._id)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, border: "1px solid #475569",
                    backgroundColor: "transparent", color: "#e5e7eb", cursor: "pointer", fontSize: 12
                  }}
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

