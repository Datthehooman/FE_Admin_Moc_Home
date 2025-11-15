<script setup>
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { onBeforeMount, reactive, ref } from 'vue';

const authStore = useAuthStore();

const categories = ref([]); // categories lấy từ API

const productForm = reactive({
    product_name: '',
    category_id: null,
    price: '',
    status: '',
    sku: '',
    images: []
});

const errors = reactive({
    product_name: '',
    category_id: '',
    price: '',
    status: '',
    sku: '',
    images: ''
});

const loading = ref(false);
const categoryLoading = ref(true);

// Load categories từ API
const loadCategories = async () => {
    categoryLoading.value = true;
    try {
        const res = await axios.get('http://api.mocfurni.shop/api/system/category/list', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = res.data.result.data.map((c) => ({
            id: c.id,
            name: c.category_name
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

// Validate thủ công và lưu vào reactive errors
const validateForm = () => {
    // Reset errors
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!productForm.product_name.trim()) errors.product_name = 'Tên sản phẩm không được để trống.';
    if (!productForm.category_id) errors.category_id = 'Vui lòng chọn danh mục.';
    if (!productForm.price || isNaN(productForm.price) || Number(productForm.price) <= 0) errors.price = 'Giá sản phẩm phải lớn hơn 0.';
    if (!productForm.status) errors.status = 'Vui lòng chọn trạng thái.';
    if (!productForm.sku.trim()) errors.sku = 'SKU không được để trống.';

    // Nếu có bất cứ lỗi nào, return false
    return !Object.values(errors).some((e) => e);
};

const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('product_name', productForm.product_name);
        formData.append('category_id', productForm.category_id);
        formData.append('price', productForm.price);
        formData.append('status', productForm.status === 'Hiện' ? 1 : 0);
        formData.append('sku', productForm.sku);

        if (productForm.images.length > 0) {
            formData.append('images[0]', productForm.images[0].file);
        }

        const response = await axios.post('http://api.mocfurni.shop/api/system/products', formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        alert('Thêm sản phẩm thành công!');
        console.log('Response:', response.data);

        // Reset form sau khi thêm
        Object.keys(productForm).forEach((key) => {
            if (Array.isArray(productForm[key])) productForm[key] = [];
            else productForm[key] = '';
        });
    } catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            alert('Thêm sản phẩm thất bại: ' + JSON.stringify(err.response.data));
        } else {
            console.error(err);
            alert('Thêm sản phẩm thất bại!');
        }
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Thêm Sản Phẩm</h2>

        <div class="flex flex-col gap-4">
            <!-- Product Name -->
            <div class="flex flex-col gap-1 w-full">
                <label for="product_name">Tên sản phẩm</label>
                <InputText id="product_name" v-model="productForm.product_name" class="w-full" />
                <span v-if="errors.product_name" class="text-red-600 text-sm">{{ errors.product_name }}</span>
            </div>

            <!-- Category and Price -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="category">Danh mục</label>
                    <Dropdown id="category" v-model="productForm.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Chọn danh mục" class="w-full" :loading="categoryLoading" />
                    <span v-if="errors.category_id" class="text-red-600 text-sm">{{ errors.category_id }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="price">Giá</label>
                    <InputText id="price" v-model="productForm.price" type="number" class="w-full" />
                    <span v-if="errors.price" class="text-red-600 text-sm">{{ errors.price }}</span>
                </div>
            </div>

            <!-- Status and SKU -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="status">Trạng thái</label>
                    <Dropdown id="status" v-model="productForm.status" :options="['Hiện', 'Ẩn']" placeholder="Chọn trạng thái" class="w-full" />
                    <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="sku">SKU</label>
                    <InputText id="sku" v-model="productForm.sku" class="w-full" />
                    <span v-if="errors.sku" class="text-red-600 text-sm">{{ errors.sku }}</span>
                </div>
            </div>

            <!-- Images -->
            <div class="flex flex-col gap-1 w-full">
                <label for="images">Hình ảnh</label>
                <FileUpload id="images" v-model="productForm.images" mode="basic" name="images[]" accept="image/*" auto class="w-full" />
                <span v-if="errors.images" class="text-red-600 text-sm">{{ errors.images }}</span>
            </div>

            <!-- Submit -->
            <Button label="Thêm sản phẩm" icon="pi pi-check" class="mt-4" :loading="loading" @click="submitForm" />
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
