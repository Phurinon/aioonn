import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/user/listBy/${id}`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/user/update/${id}`, data, {
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
