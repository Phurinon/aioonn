import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const createRoutine = async (routineData) => {
    try {
        const response = await axios.post(`${API_URL}/routines/create`, routineData);
        return response.data;
    } catch (error) {
        console.error("Error creating routine:", error);
        throw error;
    }
}

export const getRoutineById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/routines/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error getting routine:", error);
        throw error;
    }
}

export const updateRoutine = async (id, routineData) => {
    try {
        const response = await axios.put(`${API_URL}/routines/update/${id}`, routineData);
        return response.data;
    } catch (error) {
        console.error("Error updating routine:", error);
        throw error;
    }
}

export const deleteRoutine = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/routines/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting routine:", error);
        throw error;
    }
}

export const getRoutineByUserId = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/routines/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error getting routine:", error);
        throw error;
    }
}