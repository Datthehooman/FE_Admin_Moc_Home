<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import axios from 'axios';
import { ref } from 'vue';

const full_name = ref('');
const email = ref('');
const password = ref('');
const password_confirmation = ref('');
const active = ref(1);

const loading = ref(false);

const handleRegister = async () => {
    // Check confirm password
    if (password.value !== password_confirmation.value) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }

    loading.value = true;

    try {
        const response = await axios.post('http://api.mocfurni.shop/api/admin/register', {
            full_name: full_name.value,
            email: email.value,
            password: password.value,
            password_confirmation: password_confirmation.value,
            active: active.value
        });

        console.log('REGISTER SUCCESS:', response.data);
        alert(response.data.message || 'Đăng ký thành công!');

        // Nếu muốn lưu token tự login, có thể dùng:
        // localStorage.setItem("access_token", response.data.data.access_token);

        window.location.href = '/pages/auth/Register';
    } catch (error) {
        console.error('REGISTER FAILED:', error.response?.data || error);
        alert(error.response?.data?.message || 'Đăng ký thất bại!');
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
                        <h2 class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Create Account</h2>
                        <span class="text-muted-color font-medium">Register to get started</span>
                    </div>

                    <div>
                        <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Họ và tên</label>
                        <InputText placeholder="Họ và tên" class="w-full md:w-[30rem] mb-8" v-model="full_name" />

                        <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText type="email" placeholder="Email" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false" />

                        <label class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirm Password</label>
                        <Password v-model="password_confirmation" placeholder="Confirm Password" :toggleMask="true" class="mb-8" fluid :feedback="false" />

                        <Button :label="loading ? 'Đang xử lý...' : 'Register'" class="w-full" :disabled="loading" @click="handleRegister" />

                        <p class="text-center mt-4 text-sm">
                            Already have an account?
                            <router-link to="/login" class="text-primary font-medium cursor-pointer">Sign In</router-link>
                        </p>
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
