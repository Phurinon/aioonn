import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getSymptom = async () => {
  try {
    const response = await axios.get(`${API_URL}/symptom/list`, {
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
