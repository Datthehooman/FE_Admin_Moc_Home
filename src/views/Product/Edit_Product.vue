<script setup>
import { ref, onBeforeMount, reactive } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

const authStore = useAuthStore();

const productId = 42; // product cần edit

const categories = ref([]);

const productForm = reactive({
  product_name: '',
  category_id: null,
  price: '',
  status: '',
  sku: ''
});

const errors = reactive({
  product_name: '',
  category_id: '',
  price: '',
  status: '',
  sku: ''
});

const loading = ref(false);
const categoryLoading = ref(true);

// Load categories
const loadCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/system/category/list', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    categories.value = res.data.result.data.map(c => ({
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

// Load dữ liệu sản phẩm hiện tại
const loadProduct = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`http://127.0.0.1:8000/api/system/products/${productId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const p = res.data.result;
    productForm.product_name = p.product_name;
    productForm.category_id = p.category_id;
    productForm.price = p.price;
    productForm.status = p.status === 1 ? 'Hiện' : 'Ẩn';
    productForm.sku = p.sku;
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  } finally {
    loading.value = false;
  }
};

onBeforeMount(() => {
  loadCategories();
  loadProduct();
});

// Validate
const validateForm = () => {
  Object.keys(errors).forEach(key => errors[key] = '');
  if (!productForm.product_name.trim()) errors.product_name = "Tên sản phẩm không được để trống.";
  if (!productForm.category_id) errors.category_id = "Vui lòng chọn danh mục.";
  if (!productForm.price || isNaN(productForm.price) || Number(productForm.price) <= 0) errors.price = "Giá sản phẩm phải lớn hơn 0.";
  if (!productForm.status) errors.status = "Vui lòng chọn trạng thái.";
  if (!productForm.sku.trim()) errors.sku = "SKU không được để trống.";
  return !Object.values(errors).some(e => e);
};

// Submit form (PUT)
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

    await axios.post(
      `http://127.0.0.1:8000/api/system/products/${productId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    alert('Cập nhật sản phẩm thành công!');
  } catch (err) {
    if (err.response) {
      console.error('Response data:', err.response.data);
      alert('Cập nhật thất bại: ' + JSON.stringify(err.response.data));
    } else {
      console.error(err);
      alert('Cập nhật thất bại!');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
<div class="card flex-1">
  <h2 class="font-semibold text-xl mb-4">Chỉnh sửa Sản Phẩm</h2>

  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1 w-full">
      <label for="product_name">Tên sản phẩm</label>
      <InputText id="product_name" v-model="productForm.product_name" class="w-full"/>
      <span v-if="errors.product_name" class="text-red-600 text-sm">{{ errors.product_name }}</span>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col gap-1 w-full">
        <label for="category">Danh mục</label>
        <Dropdown
          id="category"
          v-model="productForm.category_id"
          :options="categories"
          optionLabel="name"
          optionValue="id"
          placeholder="Chọn danh mục"
          class="w-full"
          :loading="categoryLoading"
        />
        <span v-if="errors.category_id" class="text-red-600 text-sm">{{ errors.category_id }}</span>
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="price">Giá</label>
        <InputText id="price" v-model="productForm.price" type="number" class="w-full"/>
        <span v-if="errors.price" class="text-red-600 text-sm">{{ errors.price }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col gap-1 w-full">
        <label for="status">Trạng thái</label>
        <Dropdown
          id="status"
          v-model="productForm.status"
          :options="['Hiện','Ẩn']"
          placeholder="Chọn trạng thái"
          class="w-full"
        />
        <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="sku">SKU</label>
        <InputText id="sku" v-model="productForm.sku" class="w-full"/>
        <span v-if="errors.sku" class="text-red-600 text-sm">{{ errors.sku }}</span>
      </div>
    </div>

    <Button
      label="Cập nhật sản phẩm"
      icon="pi pi-check"
      class="mt-4"
      :loading="loading"
      @click="submitForm"
    />
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
