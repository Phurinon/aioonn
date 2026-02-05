import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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
