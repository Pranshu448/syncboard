import api from "../utils/axios";

export const fetchUsers = () => api.get("/users");

