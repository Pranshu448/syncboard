import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinTeam } from "../api/teams";

export default function InviteHandler() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const handleInvite = async () => {
            if (!code) return;

            if (!user) {
                // Not logged in -> go to register with code
                navigate(`/register?inviteCode=${code}`);
                return;
            }

            // Logged in -> try to join
            try {
                await joinTeam({ code });
                navigate("/workspace/teams");
            } catch (err) {
                console.error("Failed to join via invite:", err);
                // Even if failed (maybe already joined), go to teams
                navigate("/workspace/teams");
            }
        };

        handleInvite();
    }, [code, user, navigate]);

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            color: "#fff"
        }}>
            Processing invite...
        </div>
    );
}
