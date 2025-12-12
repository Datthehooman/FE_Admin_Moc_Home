<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const categoryId = route.params.id;

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

// ---------------------- LOAD CATEGORY ----------------------
const loadCategory = async () => {
    loading.value = true;
    try {
        const res = await apiClient.get(`/category/${categoryId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        const c = res.data.result.data;

        categoryForm.category_name = c.category_name ?? '';
        categoryForm.is_active = Number(c.is_active) === 1 ? 'Hiện' : 'Ẩn';
        categoryForm.sort_order = c.sort_order ?? '';
        categoryForm.description = c.description ?? '';
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Tải danh mục thất bại!', life: 3000 });
    } finally {
        loading.value = false;
    }
};

// ---------------------- VALIDATE ----------------------
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!categoryForm.category_name.trim()) errors.category_name = 'Tên danh mục không được để trống.';
    if (!categoryForm.description.trim()) errors.description = 'Mô tả không được để trống.';
    if (!categoryForm.sort_order || isNaN(categoryForm.sort_order) || Number(categoryForm.sort_order) <= 0)
        errors.sort_order = 'Thứ tự phải là số lớn hơn 0.';
    if (!categoryForm.is_active) errors.is_active = 'Vui lòng chọn trạng thái.';

    return !Object.values(errors).some((e) => e);
};

// ---------------------- SUBMIT ----------------------
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('category_name', categoryForm.category_name.trim());
        formData.append('description', categoryForm.description.trim());
        formData.append('is_active', categoryForm.is_active === 'Hiện' ? 1 : 0);
        formData.append('sort_order', categoryForm.sort_order);

        await apiClient.post(`/category/${categoryId}`, formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật danh mục thành công!', life: 3000 });
        router.push('/Category/Categories');
    } catch (err) {
        console.error('❌ Lỗi API:', err.response?.data || err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Cập nhật thất bại!', life: 3000 });
    } finally {
        loading.value = false;
    }
};

// ---------------------- MOUNT ----------------------
onMounted(() => {
    loadCategory();
});
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Chỉnh sửa Danh Mục</h2>

        <div class="flex flex-col gap-4">
            <!-- Tên danh mục -->
            <div class="flex flex-col gap-1 w-full">
                <label>Tên danh mục</label>
                <InputText v-model="categoryForm.category_name" class="w-full" />
                <span v-if="errors.category_name" class="text-red-600 text-sm">{{ errors.category_name }}</span>
            </div>

            <!-- Sort Order và Trạng thái -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label>Thứ tự</label>
                    <InputText v-model="categoryForm.sort_order" type="number" class="w-full" />
                    <span v-if="errors.sort_order" class="text-red-600 text-sm">{{ errors.sort_order }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label>Trạng thái</label>
                    <Dropdown v-model="categoryForm.is_active" :options="['Hiện', 'Ẩn']" placeholder="Chọn trạng thái" class="w-full" />
                    <span v-if="errors.is_active" class="text-red-600 text-sm">{{ errors.is_active }}</span>
                </div>
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-1 w-full">
                <label>Mô tả</label>
                <InputText v-model="categoryForm.description" class="w-full" />
                <span v-if="errors.description" class="text-red-600 text-sm">{{ errors.description }}</span>
            </div>

            <!-- Submit -->
            <Button label="Cập nhật danh mục" icon="pi pi-check" class="mt-4" :loading="loading" @click="submitForm" />
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
