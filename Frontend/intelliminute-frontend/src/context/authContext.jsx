import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const BASE_URL = "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ central fetch with token
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem("im_token");

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (res.status === 401) {
      console.warn("401 detected");
      logout();
      throw new Error("Unauthorized");
    }
    return res;
  };

  useEffect(() => {
    const token = localStorage.getItem("im_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authFetch("/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem("im_token", data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem("im_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("im_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        authFetch,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
