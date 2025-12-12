<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/auth'; // ✅ thêm
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const authStore = useAuthStore(); // ✅ tạo instance

function logout() {
    authStore.clearAuth();
}
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
<router-link to="/" class="layout-topbar-logo">
  <img src="@/assets/logo.png" alt="Logo" class="h-10 w-auto" />
  <span class="text-[#6e4e37]">MỘC HOME</span>
</router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- Nếu Đã Login -->
                    <template v-if="authStore.isAuthenticated">
                        <!-- <button type="button" class="layout-topbar-action">
                <i class="pi pi-user"></i>
                <span>{{ authStore.user?.name || 'Tài khoản' }}</span>
            </button> -->

                        <button type="button" class="layout-topbar-action" @click="logout">
                            <i class="pi pi-sign-out"></i>
                            <span>Đăng xuất</span>
                        </button>
                    </template>

                    <!-- Nếu Chưa Login -->
                    <template v-else>
                        <router-link to="/pages/auth/login" class="layout-topbar-action">
                            <i class="pi pi-sign-in"></i>
                            <span>Đăng nhập</span>
                        </router-link>
                        <router-link to="/pages/auth/register" class="layout-topbar-action">
                            <i class="pi pi-user-plus"></i>
                            <span>Đăng ký</span>
                        </router-link>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
