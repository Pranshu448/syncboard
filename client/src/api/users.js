import api from "../utils/axios";

export const fetchUsers = () => api.get("/users");

export const uploadProfilePicture = (formData) =>
    api.post("/users/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
