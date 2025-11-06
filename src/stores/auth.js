import authApi from '@/api/auth';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => {
        const token = localStorage.getItem('token');
        return {
            token: token || null,
            isAuthenticated: !!token,
            user: null,
            userLoading: false
        };
    },
    actions: {
        setToken(token) {
            this.token = token;
            this.isAuthenticated = !!token;
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        },
        setUser(user) {
            this.user = user;
            if (user) {
                this.userPermissions = user.permissions || [];
                this.userRoles = user.roles ? user.roles.map((role) => role.name) : [];
            } else {
                this.userPermissions = [];
                this.userRoles = [];
            }
        },
        clearAuth() {
            this.token = null;
            this.isAuthenticated = false;
            this.user = null;
            this.userPermissions = null;
            this.userRoles = null;
            localStorage.removeItem('token');
        },
        async fetchUser() {
            if (this.userLoading) return;

            try {
                this.userLoading = true;
                const response = await authApi.getUser();
                this.setUser(response.data);
                return response.data;
            } catch (error) {
                console.error('Failed to fetch user:', error);
                this.clearAuth();
                throw error;
            } finally {
                this.userLoading = false;
            }
        }
    },
    // getters: {
    //     hasPermission: (state) => (permission) => {
    //         if (!state.userPermissions) return false;
    //         return state.userPermissions.includes(permission);
    //     },
    //     hasRole: (state) => (role) => {
    //         if (!state.userRoles) return false;
    //         return state.userRoles.includes(role);
    //     },
    //     isSuperAdmin: (state) => {
    //         if (!state.userRoles) return false;
    //         return state.userRoles.includes('SUPER_ADMIN');
    //     },
    //     isAdmin: (state) => {
    //         return state.user?.isAdministrator || false;
    //     }
    // },
    persist: {
        enabled: true,
        strategies: [
            {
                key: 'auth',
                storage: localStorage,
                paths: ['token', 'isAuthenticated']
            }
        ]
    }
});
