<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const articleId = route.params.id;

const categories = ref([]);
const loading = ref(false);
const categoryLoading = ref(true);

const articleForm = reactive({
    title: '',
    slug: '',
    category_id: null,
    status: 'Hiện',
    thumbnail: '', // Store only filename
    thumbnail_image: [],
    content: ''
});

const errors = reactive({
    title: '',
    category_id: '',
    status: '',
    content: ''
});

// Extract filename from URL or path
const extractFilename = (path) => {
    if (!path) return '';
    if (path.includes('/')) {
        return path.split('/').pop();
    }
    return path;
};

// Map filename to full URL for display
const mapThumbnail = (thumbnail) => {
    if (!thumbnail) return null;
    return `https://api.mocfurni.shop/storage/system/articles/images/${thumbnail}`;
};

const loadCategories = async () => {
    try {
        const res = await apiClient.get('/article-categories/all', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        categories.value = res.data.result.data.map((c) => ({
            id: c.id,
            name: c.name
        }));
    } catch (e) {
        categories.value = [];
    } finally {
        categoryLoading.value = false;
    }
};

/* ---------------------------- LOAD ARTICLE DATA --------------------------- */
const loadArticle = async () => {
    loading.value = true;
    try {
        const res = await apiClient.get(`/articles/${articleId}`);
        const a = res.data.result.data;

        articleForm.title = a.title;
        articleForm.slug = a.slug ?? '';
        articleForm.category_id = a.category_id;
        articleForm.status = a.status === 1 ? 'Hiện' : 'Ẩn';
        // Store only the filename, not the full URL
        articleForm.thumbnail = a.thumbnail ?? '';
        articleForm.content = a.content;
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy bài viết!',
            life: 3000
        });
        router.push('/Article/List_Article');
    } finally {
        loading.value = false;
    }
};

/* ---------------------------- UPLOAD THUMBNAIL --------------------------- */
const onUploadThumbnail = async (event) => {
    const file = event.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('upload', file);

    try {
        const res = await apiClient.post('/articles/upload-image', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Extract filename if backend returns full URL
        articleForm.thumbnail = extractFilename(res.data.url);
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Upload thumbnail thất bại',
            life: 3000
        });
    }
};

/* ---------------------------- UPLOAD IMAGES IN EDITOR --------------------------- */
const onUploadImg = async (files, callback) => {
    const res = await Promise.all(
        files.map((file) => {
            const form = new FormData();
            form.append('upload', file);

            return apiClient.post('/articles/upload-image', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        })
    );

    callback(res.map((r) => r.data.url));
};

/* ---------------------------- VALIDATE FORM --------------------------- */
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!articleForm.title.trim()) errors.title = 'Tiêu đề không được để trống.';
    if (!articleForm.category_id) errors.category_id = 'Vui lòng chọn danh mục.';
    if (!articleForm.status) errors.status = 'Vui lòng chọn trạng thái.';
    if (!articleForm.content || articleForm.content.length < 20) errors.content = 'Nội dung phải có ít nhất 20 ký tự.';

    return !Object.values(errors).some((e) => e);
};

/* ---------------------------- SUBMIT UPDATE --------------------------- */
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const dataToSend = {
            title: articleForm.title,
            slug: articleForm.slug.trim(),
            category_id: articleForm.category_id,
            status: articleForm.status === 'Hiện' ? 1 : 0,
            content: articleForm.content,
            thumbnail: articleForm.thumbnail // Send only filename
        };

        await apiClient.post(`/articles/${articleId}`, dataToSend, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật bài viết thành công!',
            life: 3000
        });
        router.push('/Article/List_Article');
    } catch (err) {
        console.error('Update error:', err.response?.data);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật thất bại!',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadCategories();
    loadArticle();
});
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Chỉnh Sửa Bài Viết (ID: {{ articleId }})</h2>

        <form @submit.prevent="submitForm" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1 w-full">
                <label for="title">Tiêu đề</label>
                <InputText id="title" v-model="articleForm.title" />
                <span class="text-red-600 text-sm">{{ errors.title }}</span>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="slug">Slug</label>
                <InputText id="slug" v-model="articleForm.slug" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label>Danh mục</label>
                    <Dropdown v-model="articleForm.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Chọn danh mục" :loading="categoryLoading" />
                    <span class="text-red-600 text-sm">{{ errors.category_id }}</span>
                </div>

                <div class="flex flex-col gap-1">
                    <label>Trạng thái</label>
                    <Dropdown v-model="articleForm.status" :options="['Hiện', 'Ẩn']" />
                </div>
            </div>

            <div>
                <label>Thumbnail (hiện tại)</label>
                <img v-if="articleForm.thumbnail" :src="mapThumbnail(articleForm.thumbnail)" class="w-40 rounded mb-2" />

                <FileUpload mode="basic" chooseLabel="Đổi ảnh" accept="image/*" :maxFileSize="1000000" @select="onUploadThumbnail" />
            </div>

            <div>
                <label>Nội dung bài viết</label>
                <MdEditor v-model="articleForm.content" :height="500" @onUploadImg="onUploadImg" />
                <span class="text-red-600 text-sm">{{ errors.content }}</span>
            </div>

            <Button label="Cập Nhật" icon="pi pi-save" class="mt-4" :loading="loading" type="submit" />
        </form>
    </div>
</template>
