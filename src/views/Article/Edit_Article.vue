<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { onBeforeMount, reactive, ref } from 'vue'; // Đã loại bỏ 'watch'
import { useRouter } from 'vue-router'; 

const props = defineProps({
    id: {
        type: [String, Number],
        required: true
    }
});

const authStore = useAuthStore();
const router = useRouter(); 

const categories = ref([]); 
const editorRef = ref(null); 
// ĐÃ LOẠI BỎ: originalTitle và isSlugManuallyEdited

const articleForm = reactive({
    title: '',
    slug: '', // GIỮ LẠI: Hiển thị và cho phép chỉnh sửa
    category_id: null,
    status: 'Hiện',
    thumbnail_image: [], 
    existing_thumbnail_url: '', 
    content: '', 
});

const errors = reactive({
    title: '',
    // ĐÃ LOẠI BỎ: slug: '', // KHÔNG CẦN KIỂM TRA LỖI NẾU BỎ TRỐNG
    category_id: '',
    status: '',
    thumbnail_image: '',
    content: '',
});

const loading = ref(false);
const categoryLoading = ref(true);
const articleLoading = ref(true); 


const loadCategories = async () => {
    categoryLoading.value = true;
    try {
        const res = await apiClient.get('/article-categories/all', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = res.data.result.data.map((c) => ({
            id: c.id,
            name: c.category_name
        }));
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
    } finally {
        categoryLoading.value = false;
    }
};

const loadArticle = async (id) => {
    articleLoading.value = true;
    try {
        const res = await apiClient.get(`/articles/${id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        const articleData = res.data.result; 

        // Cập nhật form với dữ liệu hiện tại
        articleForm.title = articleData.title || '';
        // HIỂN THỊ SLUG HIỆN TẠI ĐỂ CÓ THỂ CHỈNH SỬA
        articleForm.slug = articleData.slug || ''; 
        articleForm.category_id = articleData.category_id || null;
        articleForm.status = articleData.status === 1 ? 'Hiện' : 'Ẩn';
        articleForm.content = articleData.content || '';
        articleForm.existing_thumbnail_url = articleData.image || ''; 

    } catch (err) {
        console.error(`Lỗi tải bài viết ID ${id}:`, err);
        alert('Lỗi: Không thể tải dữ liệu bài viết.');
        router.push('/Article/List_Article'); 
    } finally {
        articleLoading.value = false;
    }
};

onBeforeMount(() => {
    loadCategories();
    if (props.id) {
        loadArticle(props.id);
    }
});

const validateForm = () => {
    // Reset errors
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!articleForm.title.trim()) errors.title = 'Tiêu đề không được để trống.';
    // ĐÃ LOẠI BỎ: if (!articleForm.slug.trim()) errors.slug = 'Slug không được để trống.';
    if (!articleForm.category_id) errors.category_id = 'Vui lòng chọn danh mục.';
    if (!articleForm.status) errors.status = 'Vui lòng chọn trạng thái.';
    
    if (!articleForm.content.trim() || articleForm.content.length < 20) errors.content = 'Nội dung bài viết phải có ít nhất 20 ký tự.';

    return !Object.values(errors).some((e) => e);
};

const updateArticle = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        formData.append('title', articleForm.title);
        // GỬI SLUG: Nếu người dùng nhập, gửi giá trị đó. Nếu bỏ trống, gửi chuỗi rỗng để BE tự tạo.
        formData.append('slug', articleForm.slug.trim()); 
        formData.append('category_id', articleForm.category_id);
        formData.append('status', articleForm.status === 'Hiện' ? 1 : 0);
        formData.append('content', articleForm.content); 

        if (articleForm.thumbnail_image.length > 0) {
            formData.append('thumbnail', articleForm.thumbnail_image[0].file);
        }

        const response = await apiClient.post(`/articles/${props.id}`, formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Cập nhật bài viết thành công!', response.data);
        alert('Cập nhật bài viết thành công!');

        // Tải lại dữ liệu bài viết sau khi cập nhật
        loadArticle(props.id);

    } catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            alert('Cập nhật bài viết thất bại: ' + JSON.stringify(err.response.data));
        } else {
            console.error(err);
            alert('Cập nhật bài viết thất bại!');
        }
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Cập Nhật Bài Viết #{{ props.id }}</h2>

        <div v-if="articleLoading" class="text-center py-10">Đang tải dữ liệu bài viết...</div>

        <form v-else @submit.prevent="updateArticle" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1 w-full">
                <label for="title">Tiêu đề bài viết</label>
                <InputText id="title" v-model="articleForm.title" class="w-full" />
                <span v-if="errors.title" class="text-red-600 text-sm">{{ errors.title }}</span>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="slug">Slug (Đường dẫn)</label>
                <InputText id="slug" v-model="articleForm.slug" class="w-full" placeholder="Để trống để hệ thống tự động tạo slug từ tiêu đề..." />
                <p class="text-xs text-gray-500 mt-1">Để trống để hệ thống tự động tạo slug từ tiêu đề. Nếu bạn nhập, slug này sẽ được sử dụng.</p>
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

                <div v-if="articleForm.existing_thumbnail_url" class="mb-2">
                    <p class="text-sm text-gray-500">Ảnh hiện tại:</p>
                    <img :src="articleForm.existing_thumbnail_url" alt="Ảnh thumbnail hiện tại" class="max-h-48 object-contain border rounded" />
                    <p class="text-xs mt-1 text-gray-500">Chọn ảnh mới bên dưới để thay thế.</p>
                </div>

                <FileUpload id="thumbnail_image" v-model="articleForm.thumbnail_image" mode="basic" name="thumbnail" accept="image/*" :maxFileSize="1000000" :fileLimit="1" chooseLabel="Chọn ảnh mới" class="w-full" />
                <span v-if="errors.thumbnail_image" class="text-red-600 text-sm">{{ errors.thumbnail_image }}</span>
            </div>

            <div class="flex flex-col gap-1 w-full">
                <label for="content">Nội dung bài viết (Markdown)</label>
                <MdEditor ref="editorRef" v-model="articleForm.content" language="en" :height="500" class="mt-2" />
                <span v-if="errors.content" class="text-red-600 text-sm mt-1">{{ errors.content }}</span>
            </div>

            <Button label="Cập Nhật Bài Viết" icon="pi pi-save" class="mt-4" :loading="loading" type="submit" />
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