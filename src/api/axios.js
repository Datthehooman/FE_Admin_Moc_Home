import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000
});

// helper to get token from cookie
function getTokenFromCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// attach token automatically
apiClient.interceptors.request.use((config) => {
    const token = getTokenFromCookie('token');
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
        };
    }
    return config;
});

export default apiClient;
