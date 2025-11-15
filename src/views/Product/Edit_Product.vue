<script setup>
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const productId = route.params.id;

const categories = ref([]);
const loading = ref(false);
const categoryLoading = ref(true);

const productForm = reactive({
    product_name: '',
    category_id: null,
    price: 0,
    status: 0,
    sku: ''
});

const errors = reactive({
    product_name: '',
    category_id: '',
    price: '',
    status: '',
    sku: ''
});

// ---------------------- LOAD CATEGORIES ----------------------
const loadCategories = async () => {
    categoryLoading.value = true;
    try {
        const res = await axios.get('http://api.mocfurni.shop/api/system/category/list', { headers: { Authorization: `Bearer ${authStore.token}` } });
        // Ép kiểu id thành number để Dropdown nhận đúng
        categories.value = res.data.result.data.map((c) => ({
            id: Number(c.id),
            name: c.category_name
        }));
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
    } finally {
        categoryLoading.value = false;
    }
};

// ---------------------- LOAD PRODUCT ----------------------
const loadProduct = async () => {
    loading.value = true;
    try {
        const res = await axios.get(`http://api.mocfurni.shop/api/system/products/${productId}`, { headers: { Authorization: `Bearer ${authStore.token}` } });
        const p = res.data.result.data; // note: data chứ không phải result
        productForm.product_name = p.product_name ?? '';
        productForm.category_id = Number(p.category_id) || null;
        productForm.price = Number(p.price) || 0;
        productForm.status = Number(p.status) ?? 0;
        productForm.sku = p.sku ?? '';
    } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
    } finally {
        loading.value = false;
    }
};

// ---------------------- VALIDATE ----------------------
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!productForm.product_name.trim()) errors.product_name = 'Tên sản phẩm không được để trống.';
    if (!productForm.category_id) errors.category_id = 'Vui lòng chọn danh mục.';
    if (!productForm.price || Number(productForm.price) <= 0) errors.price = 'Giá sản phẩm phải lớn hơn 0.';
    if (productForm.status === null) errors.status = 'Vui lòng chọn trạng thái.';
    if (!productForm.sku.trim()) errors.sku = 'SKU không được để trống.';

    return !Object.values(errors).some((e) => e);
};

// ---------------------- SUBMIT ----------------------
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('product_name', productForm.product_name);
        formData.append('category_id', productForm.category_id);
        formData.append('price', productForm.price);
        formData.append('status', productForm.status);
        formData.append('sku', productForm.sku);

        await axios.post(`http://api.mocfurni.shop/api/system/products/${productId}?_method=PUT`, formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        alert('✅ Cập nhật thành công!');
        router.push('/Product/ProductList'); // Chuyển về list sau khi cập nhật
    } catch (err) {
        console.error('❌ Lỗi API:', err.response?.data);
        alert('❌ Cập nhật thất bại!');
    } finally {
        loading.value = false;
    }
};

// ---------------------- MOUNT ----------------------
onMounted(() => {
    loadCategories();
    loadProduct();
});
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Chỉnh sửa Sản Phẩm</h2>

        <div class="flex flex-col gap-4">
            <!-- Tên sản phẩm -->
            <div class="flex flex-col gap-1 w-full">
                <label>Tên sản phẩm</label>
                <InputText v-model="productForm.product_name" class="w-full" />
                <span v-if="errors.product_name" class="text-red-600 text-sm">{{ errors.product_name }}</span>
            </div>

            <!-- Danh mục -->
            <div class="flex flex-col gap-1 w-full">
                <label>Danh mục</label>
                <Dropdown v-model="productForm.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Chọn danh mục" class="w-full" :loading="categoryLoading" />
                <span v-if="errors.category_id" class="text-red-600 text-sm">{{ errors.category_id }}</span>
            </div>

            <!-- Giá -->
            <div class="flex flex-col gap-1 w-full">
                <label>Giá</label>
                <InputText v-model="productForm.price" type="number" class="w-full" />
                <span v-if="errors.price" class="text-red-600 text-sm">{{ errors.price }}</span>
            </div>

            <!-- Trạng thái -->
            <div class="flex flex-col gap-1 w-full">
                <label>Trạng thái</label>
                <Dropdown
                    v-model="productForm.status"
                    :options="[
                        { label: 'Hiện', value: 1 },
                        { label: 'Ẩn', value: 0 }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                />
                <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
            </div>

            <!-- SKU -->
            <div class="flex flex-col gap-1 w-full">
                <label>SKU</label>
                <InputText v-model="productForm.sku" class="w-full" />
                <span v-if="errors.sku" class="text-red-600 text-sm">{{ errors.sku }}</span>
            </div>

            <!-- Submit -->
            <Button label="Cập nhật sản phẩm" class="mt-4" :loading="loading" @click="submitForm" />
        </div>
    </div>
</template>

<style scoped>
.card.flex-1 {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}
</style>
