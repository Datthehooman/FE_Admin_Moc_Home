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
  thumbnail: null,
  gallery: []     // multiple images
});

const errors = reactive({});
const loading = ref(false);

// =========================
// LOAD CATEGORY
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
      productForm.gallery = p.images.map(f => ({ file: null, objectURL: f.url }));
      productForm.thumbnail = null; // preview khác nếu muốn
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

    // append tất cả fields
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
      },
      params: { _method: "PUT" }
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
// HANDLE SELECT IMAGE
// =========================
const onSelectThumbnail = (e) => {
  if(e.files.length) productForm.thumbnail = e.files[0];
};

const onSelectGallery = (e) => {
  productForm.gallery = e.files.map(f => ({ file: f, objectURL: URL.createObjectURL(f) }));
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

  <!-- LEFT COLUMN -->
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

    <!-- MATERIAL + SIZE -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Chất liệu</label>
        <InputText v-model="productForm.material" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Size</label>
        <div class="flex gap-2 flex-wrap">
          <div v-for="s in ['S','M','L','XL','XXL']" :key="s" class="flex items-center gap-1">
            <input type="checkbox" :value="s" v-model="productForm.sizes" class="w-4 h-4"/>
            <span>{{s}}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- COLOR + WEIGHT -->
    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Màu sắc</label>
        <InputText v-model="productForm.color" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Khối lượng</label>
        <InputText v-model="productForm.weight" class="w-full"/>
      </div>
    </div>

  </div>

  <!-- RIGHT SIDEBAR -->
  <div class="w-[330px] flex flex-col gap-6">

    <!-- THUMBNAIL -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Ảnh đại diện</h3>
      <FileUpload accept="image/*" mode="advanced" customUpload chooseLabel="Chọn ảnh" @select="onSelectThumbnail"/>
      <div v-if="productForm.thumbnail" class="mt-3">
        <img :src="URL.createObjectURL(productForm.thumbnail)" class="w-full h-44 object-cover rounded shadow"/>
      </div>
    </div>

    <!-- GALLERY -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Ảnh thư viện</h3>
      <FileUpload multiple accept="image/*" mode="advanced" customUpload chooseLabel="Chọn nhiều ảnh" @select="onSelectGallery"/>
      <div class="flex mt-3 flex-wrap gap-2">
        <div v-for="(g,i) in productForm.gallery" :key="i" class="w-20 h-20">
          <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow"/>
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
.err {
  color: red;
  font-size: 13px;
}
</style>
