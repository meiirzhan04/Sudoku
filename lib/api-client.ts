"use client";

import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("sudokumind-access-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.localStorage.removeItem("sudokumind-access-token");
      window.localStorage.removeItem("sudokumind-refresh-token");
      document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
      if (window.location.pathname !== "/login") {
        window.location.href = `/login?next=${window.location.pathname}`;
      }
    }
    return Promise.reject(error);
  }
);

export function hasAuthToken() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("sudokumind-access-token"));
}
