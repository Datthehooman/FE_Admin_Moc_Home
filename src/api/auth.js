import apiClient from './axios';

const authApi = {
    login: async (credentials) => {
        const response = await apiClient.post('/login', credentials);
        return response.data;
    },

    loginGoogle: async (accessToken) => {
        const response = await apiClient.post('/login/google', { accessToken });
        return response.data;
    },

    getUser: async () => {
        const response = await apiClient.get('/profile');
        return response.data;
    }
};

export default authApi;
