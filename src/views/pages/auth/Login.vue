<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password_hash = ref('');
const checked = ref(false);
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
    if (!email.value || !password_hash.value) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    loading.value = true;

    try {
        const response = await axios.post('http://127.0.0.1:8000/api/system/login', {
            email: email.value,
            password_hash: password_hash.value
        });

        console.log('LOGIN SUCCESS:', response.data);

        // Lưu token vào store
        authStore.setToken(response.data.data.access_token);
        authStore.setUser(response.data.data.user);

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
                    <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                    <InputText id="email" placeholder="Email" class="w-full md:w-[30rem] mb-8" v-model="email" />

                    <label for="password_hash" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                    <Password id="password_hash" v-model="password_hash" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

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


