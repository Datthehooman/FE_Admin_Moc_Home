import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.mocfurni.shop/api/system',
    timeout: 10000,
    withCredentials: true
});

// Utility: read cookie by name
function readCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

apiClient.interceptors.request.use((config) => {
    const hostname = window.location.hostname;

    // Detect local dev or production
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.test');

    // Get correct token
    const token = isLocal ? readCookie('tokenLocal') : readCookie('token');

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default apiClient;
