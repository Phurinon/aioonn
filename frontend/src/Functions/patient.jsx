import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const addPatient = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/patient/create`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error; // แนะนำให้โยนต่อเพื่อให้ UI handle ได้
  }
};

export const addPatientSymptom = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/patient/add-symptom`, data, {
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

export const getPatients = async (userId) => {
  try {
    const url = userId
      ? `${API_URL}/patient/list?userId=${userId}`
      : `${API_URL}/patient/list`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getPatientById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/patient/listBy/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getPatientSymptoms = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/patient/symptoms/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
