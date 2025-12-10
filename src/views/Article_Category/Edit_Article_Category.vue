<script setup>
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// GIẢ ĐỊNH: Import apiClient từ thư mục '@/api/axios'
import apiClient from '@/api/axios';

const route = useRoute();
const router = useRouter();
const categoryId = route.params.id; // Lấy ID từ URL

// Dữ liệu form
const categoryForm = reactive({
    name: '',
    slug: '',
    desc: '',
    // Đặt là null để tránh xung đột với giá trị 0 sau khi tải
    status: null
});

// 🎉 FIX MỚI: Key để buộc component Dropdown re-render sau khi tải dữ liệu
const dataLoadedKey = ref(0);

// Trạng thái tải dữ liệu/gửi form
const loading = ref(true);
const submitting = ref(false);

// GIẢ ĐỊNH cho trường status (tinyint)
const categoryStatuses = [
    { value: 1, label: 'Hiện' },
    { value: 0, label: 'Ẩn' }
];

// Hàm tải dữ liệu danh mục hiện tại
const loadCategory = async () => {
    loading.value = true;
    try {
        const response = await apiClient.get(`/article-categories/${categoryId}`);
        const categoryData = response.data?.result?.data;

        if (categoryData) {
            categoryForm.name = categoryData.name || '';
            categoryForm.slug = categoryData.slug || '';
            categoryForm.desc = categoryData.desc || '';

            // Ép kiểu thành Number và gán giá trị
            categoryForm.status = categoryData.status !== undefined ? Number(categoryData.status) : 1;
        } else {
            throw new Error('Không tìm thấy dữ liệu danh mục.');
        }
    } catch (err) {
        console.error('❌ Lỗi tải danh mục bài viết:', err.response?.data || err);
        alert('❌ Lỗi: Không thể tải dữ liệu danh mục này!');
        router.push('/Article_Category/List_Article_Category');
    } finally {
        loading.value = false;
        // 🎉 FIX MỚI: Tăng key để force Dropdown re-render
        dataLoadedKey.value++;
    }
};

// Hàm chuyển đổi chuỗi thành slug đơn giản (Không đổi)
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
    // Thêm kiểm tra status không phải null
    return categoryForm.name.trim() !== '' && categoryForm.slug.trim() !== '' && categoryForm.status !== null;
});

// Hàm gửi form cập nhật
const handleSubmit = async () => {
    if (!isFormValid.value) {
        alert('Vui lòng điền đầy đủ Tên, Slug và Trạng thái.');
        return;
    }

    submitting.value = true;
    try {
        await apiClient.put(`/article-categories/${categoryId}`, categoryForm);
        alert('✅ Cập nhật danh mục bài viết thành công!');
        router.push('/Article_Category/List_Article_Category');
    } catch (err) {
        console.error('❌ Lỗi cập nhật danh mục bài viết:', err.response?.data || err);
        const errorMessage = err.response?.data?.message || 'Không thể cập nhật danh mục.';
        alert(`❌ ${errorMessage}`);
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    if (categoryId) {
        loadCategory();
    } else {
        alert('❌ Không có ID danh mục để chỉnh sửa.');
        router.push('/Article_Category/List_Article_Category');
    }
});
</script>

<template>
    <div class="card p-4">
        <h2 class="font-semibold text-xl mb-4 flex items-center"><i class="pi pi-pencil mr-2 text-warning"></i> Chỉnh Sửa Danh Mục Bài Viết (ID: {{ categoryId }})</h2>

        <Card class="p-4 custom-card">
            <template #content>
                <div v-if="loading" class="text-center p-5"><i class="pi pi-spin pi-spinner text-xl"></i> Đang tải dữ liệu...</div>

                <form v-else @submit.prevent="handleSubmit" class="p-fluid form-layout">
                    <div class="field-item">
                        <label for="name">Tên Danh Mục <span class="text-red-500">*</span></label>
                        <InputText id="name" v-model="categoryForm.name" required @input="updateSlug" class="custom-input-small" />
                    </div>

                    <div class="field-item">
                        <label for="slug">Slug (Đường dẫn) <span class="text-red-500">*</span></label>
                        <InputText id="slug" v-model="categoryForm.slug" required class="custom-input-small" />
                    </div>

                    <div class="field-item">
                        <label for="desc">Mô tả (Desc)</label>
                        <Textarea id="desc" v-model="categoryForm.desc" rows="4" />
                    </div>

                    <div class="field-item">
                        <label for="status">Trạng thái <span class="text-red-500">*</span></label>
                        <Dropdown :key="dataLoadedKey" id="status" v-model="categoryForm.status" :options="categoryStatuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" required class="custom-input-small" />
                    </div>

                    <div class="col-12 mt-4">
                        <Button type="submit" label="Cập Nhật Danh Mục" icon="pi pi-save" :loading="submitting" :disabled="!isFormValid || submitting" severity="success" class="update-button" />
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
/* CSS (Không thay đổi) */
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
