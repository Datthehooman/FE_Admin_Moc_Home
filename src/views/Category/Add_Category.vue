<script setup>
import { ref, reactive } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';

const authStore = useAuthStore();

const categoryForm = reactive({
  category_name: '',
  is_active: 'Hiện',
  sort_order: '',
  description: '',
  image: null
});

const errors = reactive({
  category_name: '',
  is_active: '',
  sort_order: '',
  description: '',
  image: ''
});

const loading = ref(false);

// Validate form
const validateForm = () => {
  Object.keys(errors).forEach(key => errors[key] = '');

  if (!categoryForm.category_name.trim()) errors.category_name = "Tên danh mục không được để trống.";
  if (!categoryForm.sort_order || isNaN(categoryForm.sort_order) || Number(categoryForm.sort_order) <= 0) errors.sort_order = "Thứ tự phải lớn hơn 0.";
  if (!categoryForm.is_active) errors.is_active = "Vui lòng chọn trạng thái.";

  return !Object.values(errors).some(e => e);
};

// Submit form
const submitForm = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('category_name', categoryForm.category_name);
    formData.append('is_active', categoryForm.is_active === 'Hiện' ? 1 : 0);
    formData.append('sort_order', categoryForm.sort_order);
    formData.append('description', categoryForm.description || '');
    if (categoryForm.image) {
      formData.append('image', categoryForm.image.file);
    }

    const response = await axios.post(
      'http://127.0.0.1:8000/api/system/category',
      formData,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    alert('Tạo danh mục thành công!');
    console.log('Response:', response.data);

    // Reset form
    Object.keys(categoryForm).forEach(key => {
      if (key === 'image') categoryForm[key] = null;
      else categoryForm[key] = '';
    });
    categoryForm.is_active = 'Hiện';
  } catch (err) {
    if (err.response) {
      console.error('Response data:', err.response.data);
      alert('Tạo danh mục thất bại: ' + JSON.stringify(err.response.data));
    } else {
      console.error(err);
      alert('Tạo danh mục thất bại!');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
<div class="card flex-1">
  <h2 class="font-semibold text-xl mb-4">Thêm Danh Mục</h2>

  <div class="flex flex-col gap-4">
    <!-- Category Name -->
    <div class="flex flex-col gap-1 w-full">
      <label for="category_name">Tên danh mục</label>
      <InputText id="category_name" v-model="categoryForm.category_name" class="w-full"/>
      <span v-if="errors.category_name" class="text-red-600 text-sm">{{ errors.category_name }}</span>
    </div>

    <!-- Sort Order and Status -->
    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col gap-1 w-full">
        <label for="sort_order">Thứ tự</label>
        <InputText id="sort_order" v-model="categoryForm.sort_order" type="number" class="w-full"/>
        <span v-if="errors.sort_order" class="text-red-600 text-sm">{{ errors.sort_order }}</span>
      </div>

      <div class="flex flex-col gap-1 w-full">
        <label for="is_active">Trạng thái</label>
        <Dropdown
          id="is_active"
          v-model="categoryForm.is_active"
          :options="['Hiện','Ẩn']"
          placeholder="Chọn trạng thái"
          class="w-full"
        />
        <span v-if="errors.is_active" class="text-red-600 text-sm">{{ errors.is_active }}</span>
      </div>
    </div>

    <!-- Description -->
    <div class="flex flex-col gap-1 w-full">
      <label for="description">Mô tả</label>
      <InputText id="description" v-model="categoryForm.description" class="w-full"/>
    </div>

    <!-- Image -->
    <div class="flex flex-col gap-1 w-full">
      <label for="image">Hình ảnh</label>
      <FileUpload
        id="image"
        v-model="categoryForm.image"
        mode="basic"
        name="image"
        accept="image/*"
        auto
        class="w-full"
      />
    </div>

    <!-- Submit -->
    <Button
      label="Tạo danh mục"
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
  display: flex;
  flex-direction: column;
}
</style>
