<script setup>
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

// GIẢ ĐỊNH: Import apiClient từ thư mục '@/api/axios'
import apiClient from '@/api/axios';

const router = useRouter();
const toast = useToast();

// Dữ liệu form
const categoryForm = reactive({
    name: '',
    slug: '',
    desc: '',
    status: 1 // Mặc định là Hiện
});

// Trạng thái tải
const loading = ref(false);

// GIẢ ĐỊNH cho trường status (tinyint)
const categoryStatuses = [
    { value: 1, label: 'Hiện' }, // ĐÃ SỬA
    { value: 0, label: 'Ẩn' } // ĐÃ SỬA
];

// Hàm chuyển đổi chuỗi thành slug đơn giản
const slugify = (str) => {
    str = str.toLowerCase();
    str = str.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ặ|ẵ|â|ấ|ầ|ẩ|ậ|ẫ/g, 'a');
    str = str.replace(/é|è|ẻ|ẹ|ẽ|ê|ế|ề|ể|ệ|ễ/g, 'e');
    str = str.replace(/í|ì|ỉ|ị|ĩ/g, 'i');
    str = str.replace(/ó|ò|ỏ|ọ|õ|ô|ố|ồ|ổ|ộ|ỗ|ơ|ớ|ờ|ở|ợ|ỡ/g, 'o');
    str = str.replace(/ú|ù|ủ|ụ|ũ|ư|ứ|ừ|ử|ự|ữ/g, 'u');
    str = str.replace(/ý|ỳ|ỷ|ỵ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/[^a-z0-9\s-]/g, '');
    str = str.replace(/[\s-]+/g, '-');
    return str.trim('-');
};

const updateSlug = () => {
    categoryForm.slug = slugify(categoryForm.name);
};

// Form hợp lệ (kiểm tra đơn giản)
const isFormValid = computed(() => {
    return categoryForm.name.trim() !== '' && categoryForm.slug.trim() !== '';
});

// Hàm gửi form
const handleSubmit = async () => {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng điền đầy đủ Tên và Slug.',
            life: 3000
        });
        return;
    }

    loading.value = true;
    try {
        // ENDPOINT: POST /article-categories
        await apiClient.post('/article-categories', categoryForm);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm danh mục bài viết thành công!',
            life: 3000
        });
        router.push('/Article_Category/List_Article_Category');
    } catch (err) {
        console.error('❌ Lỗi thêm danh mục bài viết:', err.response?.data || err);
        const errorMessage = err.response?.data?.message || 'Không thể thêm danh mục.';
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMessage,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card p-4">
        <h2 class="font-semibold text-xl mb-4 flex items-center"><i class="pi pi-plus mr-2 text-primary"></i> Thêm Danh Mục Bài Viết Mới</h2>
        <Card class="p-4 custom-card">
            <template #content>
                <form @submit.prevent="handleSubmit" class="p-fluid form-layout">
                    <div class="field-item">
                        <label for="name">Tên Danh Mục <span class="text-red-500">*</span></label>
                        <InputText id="name" v-model="categoryForm.name" required @input="updateSlug" class="custom-input-small" />
                    </div>

                    <div class="field-item">
                        <label for="slug">Slug (Đường dẫn) <span class="text-red-500">*</span></label>
                        <InputText id="slug" v-model="categoryForm.slug" placeholder="Tự động tạo từ tên..." required class="custom-input-small" />
                    </div>

                    <div class="field-item">
                        <label for="desc">Mô tả (Desc)</label>
                        <Textarea id="desc" v-model="categoryForm.desc" rows="4" />
                    </div>

                    <div class="field-item">
                        <label for="status">Trạng thái <span class="text-red-500">*</span></label>
                        <Dropdown id="status" v-model="categoryForm.status" :options="categoryStatuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" required class="custom-input-small" />
                    </div>

                    <div class="col-12 mt-4">
                        <Button type="submit" label="Lưu Danh Mục" icon="pi pi-check" :loading="loading" :disabled="!isFormValid || loading" class="update-button" />
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
/* CSS chung để điều chỉnh giao diện (giống Edit_Article_Category.vue) */
.custom-card {
    background-color: #f7f9fc;
    border: 1px solid #e0e0e0;
}
.form-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.field-item {
    display: flex;
    flex-direction: column;
}

.custom-input-small {
    max-width: 400px;
    width: 100%;
}
.update-button {
    max-width: 200px;
}
</style>
