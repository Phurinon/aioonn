import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const addTherapyHistory = async (data) => {
  try {
    const response = await axios.post(
      `${API_URL}/therapy/history/create`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTherapyType = async () => {
  try {
    const response = await axios.get(`${API_URL}/therapy/list`, {
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

export const getTherapyHistoryByUserId = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/therapy/history/user/${userId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
