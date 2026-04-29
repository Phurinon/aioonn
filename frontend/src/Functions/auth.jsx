import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (token) {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }
  return {};
};

export const register = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const login = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const verifyPassword = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-password`, {
      username,
      password,
    }, getAuthHeaders());
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return error.response.data; // Return { valid: false, message: ... }
    }
    throw error;
  }
};

export const changePassword = async (data) => {
  try {
    const response = await axios.put(`${API_URL}/auth/change-password`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
