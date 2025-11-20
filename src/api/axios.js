import axios from 'axios';

// Create Axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.mocfurni.shop/api/system',
    timeout: 10000,
    withCredentials: true // send cookies automatically if API supports it
});

// Interceptor to attach token from cookie set by client
apiClient.interceptors.request.use((config) => {
    // Read token from cookie
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    const token = match ? decodeURIComponent(match[2]) : null;

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default apiClient;
