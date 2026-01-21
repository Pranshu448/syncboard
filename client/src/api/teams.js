import api from "../utils/axios";

export const createTeam = (payload) => api.post("/teams/create", payload);
export const joinTeam = (payload) => api.post("/teams/join", payload);
export const deleteTeam = (id) => api.delete(`/teams/${id}`);
export const getMyTeams = () => api.get("/teams/me");

