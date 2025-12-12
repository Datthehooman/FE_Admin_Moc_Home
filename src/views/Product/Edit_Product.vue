<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const productId = route.params.id;

// ======================================
// FORM DATA
// ======================================
const productForm = reactive({
  product_name: "",
  category_id: "",
  sku: "",
  brand: "",
  description: "",
  material: "",
  color: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  price: "",
  price_down: "",
  badge: "",
  quantity: "",
  slug: "",
  status: "",
  images: [] // images[0] = main, images[1...] = gallery
});

// VALIDATION ERROR
const errors = reactive({});
const loading = ref(false);

// CATEGORIES
const categories = ref([]);
const categoryLoading = ref(true);

const loadCategories = async () => {
  try {
    const res = await apiClient.get('/category/list', { headers: { Authorization: `Bearer ${authStore.token}` } });
    categories.value = res.data.result.data.map(c => ({ id: c.id, name: c.category_name }));
  } catch (err) {
    console.error(err);
    categories.value = [];
  } finally { categoryLoading.value = false; }
};

// LOAD PRODUCT
const loadProduct = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get(`/products/${productId}`, { headers: { Authorization: `Bearer ${authStore.token}` } });
    const p = res.data.result.data;
    Object.assign(productForm, {
      product_name: p.product_name ?? "",
      category_id: p.category_id ?? "",
      sku: p.sku ?? "",
      brand: p.brand ?? "",
      description: p.description ?? "",
      material: p.material ?? "",
      color: p.color ?? "",
      weight: p.weight ?? "",
      length: p.length ?? "",
      width: p.width ?? "",
      height: p.height ?? "",
      price: p.price ?? "",
      price_down: p.price_down ?? "",
      badge: p.badge ?? "",
      slug: p.slug ?? "",
      quantity: p.quantity ?? "",
      status: p.status == 1 ? "Hiện" : "Ẩn"
    });
    productForm.images = p.images.map(img => ({
      id: img.id,
      file: null,
      objectURL: img.full_image_url,
      isOld: true,
      remove: false
    }));
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
};

// VALIDATE
const validateForm = () => {
  Object.keys(errors).forEach(k => errors[k] = "");
  if (!productForm.product_name.trim()) errors.product_name = "Không được để trống";
  if (!productForm.category_id) errors.category_id = "Chọn danh mục";
  if (!productForm.sku.trim()) errors.sku = "Không được để trống";
  if (!productForm.price) errors.price = "Không được để trống";
  if (!productForm.quantity) errors.quantity = "Không được để trống";
  if (!productForm.images.length || productForm.images[0].remove) errors.images = "Ảnh chính không được để trống";
  return !Object.values(errors).some(e => e);
};

// SUBMIT
const submitForm = async () => {
  if (!validateForm()) return;
  loading.value = true;
  try {
    const formData = new FormData();
    const fields = ['product_name','category_id','sku','brand','description','material','color','weight','length','width','height','price','price_down','badge','slug','quantity'];
    fields.forEach(key => formData.append(key, productForm[key]));
    formData.append("status", productForm.status === "Hiện" ? 1 : 0);

    // Xử lý ảnh cũ bị xóa
    const removedIds = productForm.images.filter(img => img.isOld && img.remove).map(img => img.id);
    removedIds.forEach(id => formData.append("remove_images[]", id));

    // Xử lý ảnh mới
    productForm.images.forEach((img,i) => {
      if (!img.isOld && img.file) formData.append(`images[${i}]`, img.file);
    });

    await apiClient.post(`/products/${productId}`, formData, {
      headers: { Authorization: `Bearer ${authStore.token}`, 'Content-Type': 'multipart/form-data' }
    });

    toast.add({ severity:'success', summary:'Thành công', detail:'Cập nhật sản phẩm thành công', life:3000 });
    router.push("/Product/ProductList");

  } catch (err) {
    console.error(err);
    toast.add({ severity:'error', summary:'Lỗi', detail:'Cập nhật thất bại', life:3000 });
  } finally { loading.value = false; }
};

// IMAGE HANDLING
const mainUpload = ref(null);

const onSelectMainImage = (e) => {
  if (!e.files.length) return;
  if (productForm.images.length && !productForm.images[0].remove) {
    toast.add({ severity:'warn', summary:'Chú ý', detail:'Vui lòng xóa ảnh chính cũ trước khi thêm ảnh mới', life:3000 });
    return;
  }
  const main = { file: e.files[0], objectURL: URL.createObjectURL(e.files[0]), isOld:false, remove:false };
  productForm.images.unshift(main);
};

const removeMainImage = () => {
  if (!productForm.images.length) return;
  if (productForm.images[0].isOld) productForm.images[0].remove = true;
  else productForm.images.splice(0,1);
};

const onSelectGalleryImages = (e) => {
  const imgs = e.files.map(f => ({ id:null, file:f, objectURL: URL.createObjectURL(f), isOld:false, remove:false }));
  if (!productForm.images.length) productForm.images.push({ file:null, objectURL:'', isOld:false });
  productForm.images = [productForm.images[0], ...imgs];
};

const removeGalleryImage = (i) => {
  if (i === 0) return;
  const img = productForm.images[i];
  if (img.isOld) img.remove = true;
  else productForm.images.splice(i,1);
};

const setAsMainImage = (index) => {
  if (index <= 0) return;
  const temp = productForm.images[0];
  productForm.images[0] = productForm.images[index];
  productForm.images[index] = temp;
};

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
    <div class="mb-4">
      <label>Tên sản phẩm</label>
      <InputText v-model="productForm.product_name" class="w-full"/>
      <p class="err" v-if="errors.product_name">{{ errors.product_name }}</p>
    </div>

    <div class="mb-4">
      <label>Mô tả</label>
      <textarea v-model="productForm.description" class="w-full p-2 border rounded" rows="5"></textarea>
    </div>

    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Danh mục</label>
        <Dropdown v-model="productForm.category_id" :options="categories" optionLabel="name" optionValue="id" class="w-full"/>
        <p class="err" v-if="errors.category_id">{{ errors.category_id }}</p>
      </div>
      <div class="flex-1">
        <label>Thương hiệu</label>
        <InputText v-model="productForm.brand" class="w-full"/>
      </div>
    </div>

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

    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>SKU</label>
        <InputText v-model="productForm.sku" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Số lượng</label>
        <InputText type="number" v-model="productForm.quantity" class="w-full"/>
      </div>
    </div>

    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Chất liệu</label>
        <InputText v-model="productForm.material" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Màu sắc</label>
        <InputText v-model="productForm.color" class="w-full"/>
      </div>
    </div>

    <div class="flex gap-4 mb-4">
      <div class="flex-1">
        <label>Chiều dài</label>
        <InputText v-model="productForm.length" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Chiều rộng</label>
        <InputText v-model="productForm.width" class="w-full"/>
      </div>
      <div class="flex-1">
        <label>Chiều cao</label>
        <InputText v-model="productForm.height" class="w-full"/>
      </div>
    </div>

    <div class="mb-4">
      <label>Khối lượng</label>
      <InputText v-model="productForm.weight" class="w-full"/>
    </div>



    <div class="mb-4">
      <label>Slug</label>
      <InputText v-model="productForm.slug" class="w-full"/>
    </div>

  </div>

  <!-- RIGHT SIDEBAR -->
  <div class="right-sidebar w-[330px] flex flex-col gap-6">

    <!-- MAIN IMAGE -->
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h3 class="font-semibold mb-2">Ảnh đại diện</h3>
      <FileUpload ref="mainUpload" accept="image/*" mode="basic" customUpload @select="onSelectMainImage">
        <template #content>
          <button class="w-full bg-blue-500 text-white py-2 px-4 rounded">Chọn ảnh đại diện</button>
        </template>
      </FileUpload>
      <div class="mt-3 relative" v-if="productForm.images[0] && !productForm.images[0].remove">
        <img :src="productForm.images[0].objectURL" class="w-full h-44 object-cover rounded"/>
        <button @click="removeMainImage" class="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded">Xóa</button>
      </div>
      <p class="err" v-if="errors.images">{{ errors.images }}</p>
    </div>

    <!-- GALLERY -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Ảnh phụ</h3>
      <FileUpload multiple accept="image/*" mode="advanced" customUpload @select="onSelectGalleryImages">
        <template #content>
          <button class="w-full bg-gray-500 text-white py-2 px-4 rounded">Chọn ảnh phụ</button>
        </template>
      </FileUpload>
      <div class="flex mt-3 flex-wrap gap-2">
        <div v-for="(g,i) in productForm.images.slice(1).filter(img => !img.remove)" :key="i" class="w-20 h-20 relative">
          <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow"/>
          <button @click="removeGalleryImage(i+1)" class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">Xóa</button>
        </div>
      </div>
    </div>

    <!-- STATUS -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold mb-2">Trạng thái</h3>
      <Dropdown v-model="productForm.status" :options="['Hiện','Ẩn']" class="w-full"/>
      <Button label="Cập nhật sản phẩm" class="w-full mt-4" :loading="loading" @click="submitForm"/>
    </div>

  </div>
</div>
</template>

<style scoped>
.err { color: red; font-size: 13px; }
.right-sidebar { position: sticky; top: 20px; height: calc(100vh - 40px); overflow-y: auto; scrollbar-width: none; }
.right-sidebar::-webkit-scrollbar { display: none; }
</style>
