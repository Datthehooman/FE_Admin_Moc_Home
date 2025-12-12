<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { reactive, ref } from 'vue';

const authStore = useAuthStore();
const toast = useToast();

const categoryForm = reactive({
    category_name: '',
    is_active: 'Hiện',
    sort_order: '',
    description: ''
});

const errors = reactive({
    category_name: '',
    is_active: '',
    sort_order: '',
    description: ''
});

const loading = ref(false);

// ---------------------- VALIDATE FORM ----------------------
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!categoryForm.category_name.trim()) errors.category_name = 'Tên danh mục không được để trống.';
    if (!categoryForm.description.trim()) errors.description = 'Mô tả không được để trống.';
    if (!categoryForm.sort_order || isNaN(categoryForm.sort_order) || Number(categoryForm.sort_order) <= 0)
        errors.sort_order = 'Thứ tự phải là số lớn hơn 0.';
    if (!categoryForm.is_active) errors.is_active = 'Vui lòng chọn trạng thái.';

    return !Object.values(errors).some((e) => e);
};

// ---------------------- SUBMIT FORM ----------------------
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('category_name', categoryForm.category_name.trim());
        formData.append('description', categoryForm.description.trim());
        formData.append('is_active', categoryForm.is_active === 'Hiện' ? 1 : 0);
        formData.append('sort_order', categoryForm.sort_order);

        await apiClient.post('/category', formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Tạo danh mục thành công!',
            life: 3000
        });

        // Reset form
        Object.keys(categoryForm).forEach((key) => {
            categoryForm[key] = key === 'is_active' ? 'Hiện' : '';
        });

    } catch (err) {
        console.error(err.response?.data || err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Tạo danh mục thất bại!',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Thêm Danh Mục</h2>

        <div class="flex flex-col gap-4">
            <!-- Tên danh mục -->
            <div class="flex flex-col gap-1 w-full">
                <label for="category_name">Tên danh mục</label>
                <InputText id="category_name" v-model="categoryForm.category_name" class="w-full" />
                <span v-if="errors.category_name" class="text-red-600 text-sm">{{ errors.category_name }}</span>
            </div>

            <!-- Thứ tự và Trạng thái -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="sort_order">Thứ tự</label>
                    <InputText id="sort_order" v-model="categoryForm.sort_order" type="number" class="w-full" />
                    <span v-if="errors.sort_order" class="text-red-600 text-sm">{{ errors.sort_order }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="is_active">Trạng thái</label>
                    <Dropdown id="is_active" v-model="categoryForm.is_active" :options="['Hiện', 'Ẩn']" placeholder="Chọn trạng thái" class="w-full" />
                    <span v-if="errors.is_active" class="text-red-600 text-sm">{{ errors.is_active }}</span>
                </div>
            </div>

            <!-- Mô tả -->
            <div class="flex flex-col gap-1 w-full">
                <label for="description">Mô tả</label>
                <InputText id="description" v-model="categoryForm.description" class="w-full" />
                <span v-if="errors.description" class="text-red-600 text-sm">{{ errors.description }}</span>
            </div>

            <!-- Submit -->
            <Button label="Tạo danh mục" icon="pi pi-check" class="mt-4" :loading="loading" @click="submitForm" />
        </div>
    </div>
</template>

<style scoped>
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
