import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Add token to headers if available
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

// ... existing user.jsx methods ...
export const verifyAdmin = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/verify-admin`, getAuthHeaders());
    return response;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return false; // Forbidden (Not admin)
    }
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/user/listBy/${id}`, getAuthHeaders());
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/user/update/${id}`, data, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/list`, getAuthHeaders());
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/user/delete/${id}`, getAuthHeaders());
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
