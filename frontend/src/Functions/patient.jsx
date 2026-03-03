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

export const addPatient = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/patient/create`, data, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
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

export const getPatients = async (userId) => {
  try {
    const url = userId
      ? `${API_URL}/patient/list?userId=${userId}`
      : `${API_URL}/patient/list`;

    const response = await axios.get(url, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
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
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
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
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deletePatient = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/patient/delete/${id}`, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
