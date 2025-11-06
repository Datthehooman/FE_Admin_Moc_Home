import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000
});

// // Interceptor cho request
// apiClient.interceptors.request.use(
//     (config) => {
//         const authStore = useAuthStore();
//         if (authStore.token) {
//             config.headers.Authorization = `Bearer ${authStore.token}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// // Interceptor cho response
// apiClient.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const authStore = useAuthStore();

//         // If 401, clear auth and redirect to login
//         if (error.response && error.response.status === 401) {
//             authStore.clearAuth();
//             if (window.location.pathname !== '/auth/login') {
//                 window.location.href = '/auth/login';
//             }
//         }

//         return Promise.reject(error);
//     }
// );

export default apiClient;
