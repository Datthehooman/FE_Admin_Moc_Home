<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload'; // Giữ import FileUpload nhưng không dùng logic gửi file
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const categories = ref([]);
const editorRef = ref(null);
const thumbnailPreview = ref(null);

const articleForm = reactive({
    title: '',
    slug: '',
    category_id: null,
    status: 'Hiện', // Mặc định là 'Hiện' (tương ứng với 1)
    thumbnail_image: [], // Giữ lại cho component FileUpload
    thumbnail: '',
    content: '## Tiêu đề bài viết\n\nViết nội dung bài viết bằng Markdown tại đây.'
});

const errors = reactive({
    title: '',
    category_id: '',
    status: '',
    content: ''
    // Không cần errors.thumbnail_image nếu không bắt buộc
});

const slugify = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD') // break accents
        .replace(/[\u0300-\u036f]/g, '') // remove tone marks
        .replace(/đ/g, 'd') // special Vietnamese letter
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // spaces -> dash
        .replace(/-+/g, '-'); // collapse multiple dashes
};

const loading = ref(false);
const categoryLoading = ref(true);

const loadCategories = async () => {
    categoryLoading.value = true;
    try {
        // Endpoint lấy tất cả danh mục
        const res = await apiClient.get('/article-categories/all', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        // SỬA: Lấy key 'name' từ API
        categories.value = res.data.result.data.map((c) => ({
            id: c.id,
            name: c.name
        }));
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        categories.value = [];
    } finally {
        categoryLoading.value = false;
    }
};

onBeforeMount(() => {
    loadCategories();
});

const validateForm = () => {
    // Reset errors
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!articleForm.title.trim()) errors.title = 'Tiêu đề không được để trống.';
    if (!articleForm.category_id) errors.category_id = 'Vui lòng chọn danh mục.';
    if (!articleForm.status) errors.status = 'Vui lòng chọn trạng thái.';

    if (!articleForm.content.trim() || articleForm.content.length < 20) errors.content = 'Nội dung bài viết phải có ít nhất 20 ký tự.';

    return !Object.values(errors).some((e) => e);
};

const onUploadImg = async (files, callback) => {
    const res = await Promise.all(
        files.map((file) => {
            return new Promise((rev, rej) => {
                const form = new FormData();
                form.append('upload', file);

                apiClient
                    .post('/articles/upload-image', form, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then((res) => rev(res))
                    .catch((error) => rej(error));
            });
        })
    );

    // Approach 1
    callback(res.map((item) => item.data.url));

    // Approach 2
    // callback(
    //   res.map((item: any) => ({
    //     url: item.data.url,
    //     alt: 'alt',
    //     title: 'title'
    //   }))
    // );
};

const onUploadThumbnail = async (event) => {
    const file = event.files[0];
    if (!file) return;

    // --- Generate preview locally ---
    thumbnailPreview.value = URL.createObjectURL(file);

    // --- Upload to server ---
    const form = new FormData();
    form.append('upload', file);

    try {
        const res = await apiClient.post('/articles/upload-image', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        articleForm.thumbnail = res.data.url;
        console.log('Thumbnail URL:', articleForm.thumbnail);
    } catch (err) {
        console.error('Upload thumbnail lỗi:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Upload thumbnail thất bại!',
            life: 3000
        });
    }
};

const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        // CHUYỂN SANG GỬI DỮ LIỆU JSON
        const dataToSend = {
            title: articleForm.title,
            // Đảm bảo trim và gửi chuỗi rỗng nếu không có gì
            slug: articleForm.slug.trim(),
            category_id: articleForm.category_id,
            status: articleForm.status === 'Hiện' ? 1 : 0,
            content: articleForm.content,
            thumbnail: articleForm.thumbnail || ''
            // THÊM TRƯỜNG THUMBNAIL GIẢ (Nếu BE bắt buộc phải có key này)
            // Nếu lỗi 400 vẫn xảy ra, hãy thử thêm dòng này
            // thumbnail: ''
        };

        // DEBUG LOGGING
        console.log('--- Dữ liệu JSON gửi đi (KHÔNG CÓ FILE ẢNH) ---');
        console.log(dataToSend);
        console.log('-----------------------------------------------------------');

        // GỬI REQUEST VỚI JSON (Axios tự động set Content-Type: application/json)
        const response = await apiClient.post('/articles', dataToSend, {
            headers: {
                Authorization: `Bearer ${authStore.token}`
                // Loại bỏ Content-Type, Axios sẽ tự set
            }
        });

        console.log('Thêm bài viết thành công!', response.data);
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm bài viết thành công!',
            life: 3000
        });

        router.push('/Article/List_Article');

        // Reset form...
        // ... (phần reset form không đổi)
    } catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Thêm bài viết thất bại: ' + JSON.stringify(err.response.data),
                life: 5000
            });

            // Xử lý và hiển thị chi tiết lỗi Validation
            if (err.response.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat().join(', ');
                console.log('Lỗi Validation chi tiết từ Server:', errorMessages);
                toast.add({
                    severity: 'warn',
                    summary: 'Lỗi Validation',
                    detail: errorMessages,
                    life: 5000
                });
            }
        } else {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Thêm bài viết thất bại!',
                life: 3000
            });
        }
    } finally {
        loading.value = false;
    }
};

watch(
    () => articleForm.title,
    (newTitle) => {
        if (!articleForm.slug || articleForm.slug === slugify(articleForm.oldTitle || '')) {
            articleForm.slug = slugify(newTitle);
        }
        articleForm.oldTitle = newTitle; // track previous title
    }
);
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Thêm Bài Viết Mới</h2>

        <form @submit.prevent="submitForm" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1 w-full">
                <label for="title">Tiêu đề bài viết</label>
                <InputText id="title" v-model="articleForm.title" class="w-full" />
                <span v-if="errors.title" class="text-red-600 text-sm">{{ errors.title }}</span>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="slug">Slug (Đường dẫn)</label>
                <InputText id="slug" v-model="articleForm.slug" class="w-full" placeholder="Để trống để hệ thống tự động tạo slug từ tiêu đề..." />
                <p class="text-xs text-gray-500 mt-1">Để trống để hệ thống tự động tạo slug từ tiêu đề.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label for="category">Danh mục</label>
                    <Dropdown id="category" v-model="articleForm.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Chọn danh mục" class="w-full" :loading="categoryLoading" />
                    <span v-if="errors.category_id" class="text-red-600 text-sm">{{ errors.category_id }}</span>
                </div>

                <div class="flex flex-col gap-1">
                    <label for="status">Trạng thái</label>
                    <Dropdown id="status" v-model="articleForm.status" :options="['Hiện', 'Ẩn']" placeholder="Chọn trạng thái" class="w-full" />
                    <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
                </div>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="thumbnail_image">Hình ảnh Thumbnail (Đại diện)</label>

                <FileUpload id="thumbnail_image" v-model="articleForm.thumbnail_image" mode="basic" name="thumbnail" accept="image/*" :maxFileSize="1000000" :fileLimit="1" chooseLabel="Chọn ảnh" class="w-full" @select="onUploadThumbnail" />

                <!-- PREVIEW -->
                <div v-if="thumbnailPreview" class="mt-3">
                    <img :src="thumbnailPreview" alt="Preview" class="w-40 h-40 object-cover rounded-md border" />
                </div>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="content">Nội dung bài viết (Markdown)</label>
                <MdEditor ref="editorRef" v-model="articleForm.content" language="en" :height="500" class="mt-2" @onUploadImg="onUploadImg" />
                <span v-if="errors.content" class="text-red-600 text-sm mt-1">{{ errors.content }}</span>
            </div>

            <Button label="Thêm Bài Viết" icon="pi pi-check" class="mt-4" :loading="loading" type="submit" />
        </form>
    </div>
</template>

<style scoped>
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
