// Store active whiteboard rooms and their participants
// Shared between socket.js and API controllers
const whiteboardRooms = new Map();

// Room state structure:
// {
//   roomId: {
//     participants: Set<socketId>,
//     strokes: [], 
//     lastActivity: timestamp
//   }
// }

const getRoomState = (roomId) => {
    if (!whiteboardRooms.has(roomId)) {
        whiteboardRooms.set(roomId, {
            // Map<socketId, { userId, username, color, cursor: {x, y} }>
            participants: new Map(),
            strokes: [],
            lastActivity: Date.now(),
        });
    }
    return whiteboardRooms.get(roomId);
};

module.exports = {
    whiteboardRooms,
    getRoomState,
};
