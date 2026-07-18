import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("im_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      console.warn("Unauthorized — clearing token and requesting login.");
      localStorage.removeItem("im_token");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  },
);

export const registerUser = (name, email, password) =>
  API.post("/api/auth/register", { name, email, password });

export const loginUser = (email, password) =>
  API.post("/api/auth/login", { email, password });

export const getMe = () => API.get("/api/auth/me");

export const uploadAudio = (file, { meetingTitle, meetingType }) => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("meetingTitle", meetingTitle);
  formData.append("meetingType", meetingType);

  return API.post("/api/meetings/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMyMeetings = () => API.get("/api/meetings");

export const getMeeting = (id) => API.get(`/api/meetings/${id}`);

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const activateSubscription = (plan) =>
  API.post("/api/subscription/activate", { plan });

// ---------------------------------------------------------------------------
// Admin
// ------------------------------------------------------------------------

export const getAdminUsers = () => API.get("/api/admin/users");

export const getAdminUserMeetings = (userId) =>
  API.get(`/api/admin/users/${userId}/meetings`);

export const updateAdminUser = (id, data) =>
  API.put(`/api/admin/users/${id}`, data);

export const deleteAdminUser = (id) => API.delete(`/api/admin/users/${id}`);

export const healthCheck = () => API.get("/api/health");

const DEMO_API = axios.create({
  baseURL: "http://localhost:5000",
});

export const uploadAudioDemo = (file, { meetingTitle, meetingType }) => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("meetingTitle", meetingTitle);
  formData.append("meetingType", meetingType);

  return DEMO_API.post("/api/meetings/upload-demo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export default API;
