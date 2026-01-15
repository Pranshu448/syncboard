import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

      socketRef.current = io(serverUrl, {
        auth: {
          token: localStorage.getItem("token"),
        },
        // Optimize for real-time performance
        transports: ["websocket", "polling"], // Prefer WebSocket
        upgrade: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        timeout: 20000,
        // Enable compression
        forceNew: false,
        multiplex: true,
      });

      // Connection event handlers
      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected:", socketRef.current.id);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setIsConnected(false);

        // Handle different disconnect reasons
        if (reason === "io server disconnect") {
          // Server forcefully disconnected, attempt manual reconnect
          socketRef.current.connect();
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        reconnectAttemptsRef.current++;

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error("❌ Max reconnection attempts reached");
          // Could notify user here
        }
      });

      socketRef.current.on("reconnect", (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      });

      socketRef.current.on("reconnect_error", (error) => {
        console.error("❌ Reconnection error:", error.message);
      });

      socketRef.current.on("reconnect_failed", () => {
        console.error("❌ Reconnection failed after all attempts");
        // Could show user notification to refresh page
      });

      // Handle server errors
      socketRef.current.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });

      console.log("🔌 Socket initialization complete");
    }

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        console.log("🔌 Cleaning up socket connection");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user]);

  // Provide both socket and connection status
  const contextValue = {
    socket: socketRef.current,
    isConnected,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Updated hook to return both socket and connection status
export const useSocket = () => {
  const context = useContext(SocketContext);

  // For backwards compatibility, return just the socket if accessed directly
  // But allow destructuring { socket, isConnected }
  if (!context) {
    return null;
  }

  // Return socket directly for backwards compatibility
  // Users can destructure const { socket, isConnected } = useSocket() if needed
  return context.socket;
};

// Additional hook for connection status
export const useSocketStatus = () => {
  const context = useContext(SocketContext);
  return context?.isConnected ?? false;
};
