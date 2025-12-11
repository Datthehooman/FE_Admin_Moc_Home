<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const productId = route.params.id;

// =========================
// STATE FORM
// =========================
const productForm = reactive({
  product_name: "",
  category_id: "",
  sku: "",
  brand: "",
  description: "",
  material: "",
  sizes: [],      // array cho nhiều size
  color: "",
  weight: "",
  price: "",
  price_down: "",
  quantity: "",
  status: "",
  thumbnail: null, // ảnh chính
  gallery: []     // ảnh phụ
});

const errors = reactive({});
const loading = ref(false);

// =========================
// CATEGORY
// =========================
const categories = ref([]);
const categoryLoading = ref(true);

const loadCategories = async () => {
  try {
    const res = await apiClient.get('/category/list', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    categories.value = res.data.result.data.map(c => ({ id: c.id, name: c.category_name }));
  } catch (err) {
    console.error(err);
    categories.value = [];
  } finally {
    categoryLoading.value = false;
  }
};

// =========================
// LOAD PRODUCT
// =========================
const loadProduct = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const p = res.data.result.data;

    productForm.product_name = p.product_name ?? "";
    productForm.category_id = p.category_id ?? "";
    productForm.sku = p.sku ?? "";
    productForm.brand = p.brand ?? "";
    productForm.description = p.description ?? "";
    productForm.material = p.material ?? "";
    productForm.sizes = p.sizes ?? [];
    productForm.color = p.color ?? "";
    productForm.weight = p.weight ?? "";
    productForm.price = p.price ?? "";
    productForm.price_down = p.price_down ?? "";
    productForm.quantity = p.quantity ?? "";
    productForm.status = p.status == 1 ? "Hiện" : "Ẩn";

    // thumbnail và gallery
    productForm.thumbnail = null;
    productForm.gallery = [];
    if(p.images && p.images.length > 0){
      // Ảnh đầu tiên là main image (thumbnail)
      productForm.thumbnail = null; // nếu muốn preview local thì khác
      productForm.gallery = p.images.map(f => ({ file: null, objectURL: f.url }));
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// =========================
// VALIDATE
// =========================
const validateForm = () => {
  Object.keys(productForm).forEach(k => errors[k] = '');

  if(!productForm.product_name.trim()) errors.product_name = 'Không được để trống';
  if(!productForm.category_id) errors.category_id = 'Chọn danh mục';
  if(!productForm.sku.trim()) errors.sku = 'Không được để trống';
  if(!productForm.price) errors.price = 'Không được để trống';
  if(!productForm.quantity) errors.quantity = 'Không được để trống';
  if(!productForm.thumbnail) errors.thumbnail = 'Chọn ít nhất 1 ảnh đại diện';

  return !Object.values(errors).some(e => e);
};

// =========================
// SUBMIT UPDATE
// =========================
const submitForm = async () => {
  if(!validateForm()) return;

  loading.value = true;
  try {
    const formData = new FormData();

    Object.keys(productForm).forEach(k => {
      if(k === "sizes"){
        productForm.sizes.forEach(s => formData.append("sizes[]", s));
      } else if(k === "gallery"){
        productForm.gallery.forEach((g,i) => g.file && formData.append(`gallery[${i}]`, g.file));
      } else if(k === "thumbnail"){
        if(productForm.thumbnail) formData.append("thumbnail", productForm.thumbnail);
      } else if(k === "status"){
        formData.append("status", productForm.status === "Hiện" ? 1 : 0);
      } else {
        formData.append(k, productForm[k]);
      }
    });

await apiClient.post(`/products/${productId}`, formData, {
  headers: {
    Authorization: `Bearer ${authStore.token}`,
    'Content-Type': 'multipart/form-data'
  }
});


    alert("Cập nhật thành công!");
    router.push('/Product/ProductList');

  } catch (err) {
    console.error(err);
    alert("Cập nhật thất bại!");
  } finally {
    loading.value = false;
  }
};

// =========================
// IMAGE HANDLING
// =========================
const mainUpload = ref(null);

// Chọn ảnh đại diện
const onSelectThumbnail = (e) => {
  if(e.files.length === 0) return;
  productForm.thumbnail = e.files[0];
  mainUpload.value.clear();
};

// Xóa ảnh đại diện
const removeThumbnail = () => {
  productForm.thumbnail = null;
  mainUpload.value.clear();
};

// Chọn ảnh gallery
const onSelectGallery = (e) => {
  const galleryObjs = e.files.map(f => ({ file: f, objectURL: URL.createObjectURL(f) }));
  productForm.gallery = [...productForm.gallery, ...galleryObjs];
};

// Xóa ảnh gallery
const removeGalleryImage = (i) => {
  productForm.gallery.splice(i, 1);
};

// Đặt ảnh gallery làm thumbnail
const setAsMainImage = (i) => {
  if(i < 0 || i >= productForm.gallery.length) return;
  const g = productForm.gallery[i];
  const oldThumb = productForm.thumbnail;
  if(g.file) productForm.thumbnail = g.file;
  else productForm.thumbnail = null;
  productForm.gallery[i] = { file: oldThumb, objectURL: g.objectURL };
};

// =========================
// MOUNT
// =========================
onMounted(() => {
  loadCategories();
  loadProduct();
});
</script>

<template>
<div class="flex gap-6">

  <!-- LEFT FORM -->
  <div class="flex-1 bg-white p-5 rounded-lg shadow">
    <h2 class="font-semibold text-xl mb-4">Chỉnh sửa sản phẩm</h2>

    <!-- NAME -->
    <div class="mb-4">
      <label>Tên sản phẩm</label>
      <InputText v-model="productForm.product_name" class="w-full"/>
      <p class="err" v-if="errors.product_name">{{ errors.product_name }}</p>
    </div>

    <!-- DESCRIPTION -->
    <div class="mb-4">
      <label>Mô tả</label>
      <textarea v-model="productForm.description" class="w-full p-2 border rounded" rows="5"></textarea>
    </div>

    <!-- CATEGORY + BRAND -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Danh mục</label>
        <Dropdown v-model="productForm.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Chọn danh mục" class="w-full"/>
        <p class="err" v-if="errors.category_id">{{ errors.category_id }}</p>
      </div>
      <div class="flex-1">
        <label>Thương hiệu</label>
        <InputText v-model="productForm.brand" class="w-full"/>
      </div>
    </div>

    <!-- PRICE + PRICE_DOWN -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Giá</label>
        <InputText type="number" v-model="productForm.price" class="w-full"/>
        <p class="err" v-if="errors.price">{{ errors.price }}</p>
      </div>
      <div class="flex-1">
        <label>Giá giảm</label>
        <InputText type="number" v-model="productForm.price_down" class="w-full"/>
      </div>
    </div>

    <!-- SKU + QUANTITY -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>SKU</label>
        <InputText v-model="productForm.sku" class="w-full"/>
        <p class="err" v-if="errors.sku">{{ errors.sku }}</p>
      </div>
      <div class="flex-1">
        <label>Số lượng</label>
        <InputText type="number" v-model="productForm.quantity" class="w-full"/>
        <p class="err" v-if="errors.quantity">{{ errors.quantity }}</p>
      </div>
    </div>
  </div>

  <!-- RIGHT SIDEBAR -->
  <div class="w-[330px] flex flex-col gap-6">

    <!-- THUMBNAIL -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Ảnh đại diện</h3>
      <FileUpload
        ref="mainUpload"
        accept="image/*"
        mode="basic"
        customUpload
        chooseLabel="Chọn ảnh"
        @select="onSelectThumbnail"
        class="w-full"
      >
        <template #content>
          <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded shadow transition duration-200">
            Chọn ảnh
          </button>
        </template>
      </FileUpload>

      <div v-if="productForm.thumbnail" class="mt-3 relative">
        <img :src="productForm.thumbnail ? URL.createObjectURL(productForm.thumbnail) : productForm.gallery[0]?.objectURL" class="w-full h-44 object-cover rounded shadow"/>
        <button @click="removeThumbnail" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded shadow transition duration-200">
          Xóa
        </button>
      </div>
      <p class="err mt-1 text-red-500 text-sm" v-if="errors.thumbnail">{{ errors.thumbnail }}</p>
    </div>

    <!-- GALLERY -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Ảnh thư viện</h3>
      <FileUpload
        multiple
        accept="image/*"
        mode="basic"
        customUpload
        chooseLabel="Chọn ảnh phụ"
        @select="onSelectGallery"
      >
        <template #content>
          <button class="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded shadow transition duration-200">
            Chọn ảnh phụ
          </button>
        </template>
      </FileUpload>

      <div class="flex mt-3 flex-wrap gap-2">
        <div v-for="(g,i) in productForm.gallery" :key="i" class="w-20 h-20 relative">
          <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow"/>
          <button @click="removeGalleryImage(i)" class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded shadow">Xóa</button>
          <button @click="setAsMainImage(i)" class="absolute bottom-1 left-1 bg-white text-xs px-1 rounded shadow">Ảnh chính</button>
        </div>
      </div>
    </div>

    <!-- STATUS + SUBMIT -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Trạng thái</h3>
      <Dropdown v-model="productForm.status" :options="['Hiện','Ẩn']" class="w-full"/>
      <Button label="Cập nhật sản phẩm" icon="pi pi-check" class="w-full mt-4" :loading="loading" @click="submitForm"/>
    </div>

  </div>
</div>
</template>

<style scoped>
.err { color: red; font-size: 13px; }
</style>
