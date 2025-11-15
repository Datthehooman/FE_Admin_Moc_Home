<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const full_name = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
    if (!full_name.value || !password.value) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    loading.value = true;

    try {
        const response = await axios.post('http://api.mocfurni.shop/api/admin/login', {
            full_name: full_name.value,
            password: password.value
        });

        console.log('LOGIN SUCCESS:', response.data);

        // Lưu token vào store
        authStore.setToken(response.data.data.access_token);
        authStore.setUser(response.data.data.admin);

        alert(response.data.message || 'Đăng nhập thành công!');
        router.push('/'); // điều hướng đến trang chính
    } catch (error) {
        console.error('LOGIN FAILED:', error.response?.data || error);
        alert(error.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to PrimeLand!</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <div>
                        <label for="full_name" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Full Name</label>
                        <InputText id="full_name" placeholder="Full Name" class="w-full md:w-[30rem] mb-8" v-model="full_name" />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme" binary class="mr-2"></Checkbox>
                                <label for="rememberme">Remember me</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                        </div>

                        <Button :label="loading ? 'Đang xử lý...' : 'Sign In'" class="w-full" :disabled="loading" @click="handleLogin" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye,
.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
