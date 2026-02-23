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

export const addTherapyType = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/therapy/add-type`, data, {
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

export const updateTherapyType = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/therapy/update/${id}`, data, {
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

export const deleteTherapyType = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/therapy/delete/${id}`, {
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
