<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref, computed } from 'vue';
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
  status: "Hiện",
  images: [] // ảnh[0] = ảnh chính, images[1..] = gallery
});

// Danh sách ID ảnh cũ cần xóa
const removedImageIds = ref([]);

// VALIDATION
const errors = reactive({});
const loading = ref(false);

// categories
const categories = ref([]);
const categoryLoading = ref(true);

const loadCategories = async () => {
  try {
    const res = await apiClient.get('/category/list', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    categories.value = res.data.result.data.map(c => ({
      id: c.id,
      name: c.category_name
    }));
  } catch (err) {
    console.error(err);
    categories.value = [];
  } finally {
    categoryLoading.value = false;
  }
};

// LOAD PRODUCT
const loadProduct = async () => {
  loading.value = true;
  try {
    const res = await apiClient.get(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

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
        status: typeof p.status !== "undefined"
        ? (p.status === 1 ? "Hiện" : "Ẩn")
        : productForm.status
    });

    // Load images (giữ nguyên cấu trúc)
    productForm.images = (p.images || []).map(img => ({
      id: img.id,
      file: null,
      objectURL: img.full_image_url,
      isOld: true
    }));

    // If there is no main image, ensure we have placeholder main so UI behaves predictably
    if (!productForm.images.length) {
      productForm.images = [{
        id: null, file: null, objectURL: "", isOld: false
      }];
    }

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// NORMALIZE
const normalizeImages = () => {
  productForm.images = productForm.images.filter(i => i !== null && i !== undefined);
};

// VALIDATE
const validateForm = () => {
  Object.keys(errors).forEach(k => errors[k] = "");

  if (!productForm.product_name.trim()) errors.product_name = "Không được để trống";
  if (!productForm.category_id) errors.category_id = "Chọn danh mục";
  if (!productForm.sku.trim()) errors.sku = "Không được để trống";
  if (!productForm.price) errors.price = "Không được để trống";
  if (!productForm.quantity) errors.quantity = "Không được để trống";
  if (!productForm.images.length || !productForm.images[0] || (!productForm.images[0].objectURL && !productForm.images[0].file))
    errors.images = "Ảnh chính không được để trống";

  return !Object.values(errors).some(e => e);
};

// SUBMIT
const submitForm = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    const formData = new FormData();

    const fields = [
      'product_name', 'category_id', 'sku', 'brand',
      'description', 'material', 'color', 'weight',
      'length', 'width', 'height', 'price', 'price_down',
      'badge', 'slug', 'quantity'
    ];

    fields.forEach(key => formData.append(key, productForm[key]));
    formData.append("status", productForm.status === "Hiện" ? 1 : 0);

    // Ảnh cần xóa (IDs)
    removedImageIds.value.forEach(id => {
      formData.append("remove_images[]", id);
    });

    // Ảnh mới: gửi file nếu có, đúng index
    productForm.images.forEach((img, index) => {
      if (img.file) {
        // gửi file cho server; index giữ thứ tự (main = 0)
        formData.append(`images[${index}]`, img.file);
      } else if (img.isOld && img.id) {
        // nếu là ảnh cũ, có thể server ko cần file, chỉ giữ id (tùy backend)
        // nếu backend cần giữ order bằng id, bạn có thể thêm param ảnh như sau:
        formData.append(`old_images[${index}]`, img.id);
      }
    });

    await apiClient.post(`/products/${productId}`, formData, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Cập nhật sản phẩm thành công',
      life: 3000
    });

    router.push("/Product/ProductList");

  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Cập nhật thất bại',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// ===========================
// IMAGE HANDLING (ĐÃ FIX CHUẨN)
// ===========================

// Khi chọn ảnh chính mới: quy trình theo đúng yêu cầu của m
const onSelectMainImage = (e) => {
  const file = e?.files?.[0];
  if (!file) return;

  // Tạo ảnh đại diện mới
  const newMain = {
    id: null,
    file,
    objectURL: URL.createObjectURL(file),
    isOld: false
  };

  // Lưu toàn bộ ảnh phụ cũ để render lại
  const oldGallery = productForm.images.slice(1);

  // Đánh dấu ảnh chính cũ cần xóa
  const oldMain = productForm.images[0];
  if (oldMain && oldMain.isOld && oldMain.id) {
    removedImageIds.value.push(oldMain.id);
  }

  // GÁN MẢNG MỚI → ẢNH MỚI Ở INDEX 0, ẢNH PHỤ Ở INDEX 1
  productForm.images = [
    newMain,
    ...oldGallery
  ];

  normalizeImages();

  toast.add({
    severity: "success",
    summary: "Đã chọn ảnh đại diện",
    detail: "Ảnh mới được đặt làm ảnh chính",
    life: 1200
  });
};


// Remove main image (khi user nhấn Xóa main)
const removeMainImage = () => {
  const main = productForm.images[0];
  if (!main) return;

  // nếu main là ảnh cũ, lưu id để xóa trên server
  if (main.isOld && main.id) removedImageIds.value.push(main.id);

  // xóa index 0
  productForm.images.splice(0, 1);

  // nếu sau khi xóa mà mảng trống -> thêm placeholder main để tránh lỗi UI
  if (!productForm.images.length) {
    productForm.images.push({ id: null, file: null, objectURL: "", isOld: false });
  }

  normalizeImages();

  toast.add({
    severity: 'info',
    summary: 'Đã xóa ảnh đại diện',
    detail: 'Ảnh đại diện sẽ bị xóa khi lưu',
    life: 1800
  });
};

// Thêm gallery images (giữ main ở index 0)
const onSelectGalleryImages = (e) => {
  const files = e?.files;
  if (!files?.length) return;

  const imgs = files.map(f => ({
    id: null,
    file: f,
    objectURL: URL.createObjectURL(f),
    isOld: false
  }));

  // Nếu hiện tại không có main (mảng rỗng), thêm placeholder main trước
  if (!productForm.images.length) {
    productForm.images.push({ id: null, file: null, objectURL: "", isOld: false });
  }

  // Push gallery vào sau main
  productForm.images.push(...imgs);

  normalizeImages();

  toast.add({
    severity: 'success',
    summary: 'Đã thêm ảnh phụ',
    detail: `Thêm ${imgs.length} ảnh phụ (chưa lưu)`,
    life: 1500
  });
};

// Xóa 1 ảnh gallery theo index (index là index trong productForm.images)
const removeGalleryImage = (index) => {
  const img = productForm.images[index];
  if (!img) return;

  // nếu là ảnh cũ - add id vào removed list
  if (img.isOld && img.id) removedImageIds.value.push(img.id);

  productForm.images.splice(index, 1);

  // đảm bảo luôn có main placeholder nếu mảng rỗng
  if (!productForm.images.length) {
    productForm.images.push({ id: null, file: null, objectURL: "", isOld: false });
  }

  normalizeImages();
};

// Hàm giúp set ảnh gallery thành ảnh chính (nếu cần)
const setAsMainImage = (index) => {
  if (!productForm.images[index]) return;

  // Lấy ảnh tại index, tách ra
  const selected = { ...productForm.images[index] };

  // Nếu selected là ảnh cũ -> đánh dấu xóa id cũ của main (nếu main cũ là old)
  const currentMain = productForm.images[0];
  if (currentMain && currentMain.isOld && currentMain.id) {
    removedImageIds.value.push(currentMain.id);
  }

  // Tạo new gallery by removing selected from its current pos
  const newGallery = productForm.images.filter((_, i) => i !== index && i !== 0).map(i => ({ ...i }));

  // Đặt selected làm main (nếu selected là file rỗng nhưng isOld true thì giữ id)
  const newMain = {
    id: selected.id ?? null,
    file: selected.file ?? null,
    objectURL: selected.objectURL ?? "",
    isOld: selected.isOld ?? false
  };

  // Reset images: main + rest gallery
  productForm.images.splice(0);
  productForm.images.push(newMain, ...newGallery);

  normalizeImages();

  toast.add({
    severity: 'success',
    summary: 'Đã đặt ảnh làm đại diện',
    detail: 'Ảnh đã được đặt làm ảnh chính (chưa lưu)',
    life: 1500
  });
};

// ==========================
// COMPUTED FOR DISPLAY
// ==========================
const mainImage = computed(() => {
  return productForm.images.length ? productForm.images[0] : null;
});



// INIT
onMounted(() => {
  loadCategories();

  if (productId) {
    loadProduct(); // ✅ CHỈ LOAD KHI EDIT
  }
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

      <!-- MAIN SHOW -->
      <div v-if="mainImage" class="mt-3 relative">
        <img :src="mainImage.objectURL" class="w-full h-44 object-cover rounded"/>
        <div class="absolute top-1 right-1">
          <button @click="removeMainImage" class="bg-red-500 text-white text-xs px-2 py-1 rounded">Xóa</button>
        </div>
      </div>

      <div v-else class="mt-3 text-sm text-gray-500">
        Chưa có ảnh đại diện
      </div>

      <p class="err" v-if="errors.images">{{ errors.images }}</p>
    </div>

    <!-- GALLERY -->
<!-- GALLERY -->
<div class="bg-white p-4 rounded-lg shadow">
  <h3 class="font-semibold mb-2">Ảnh phụ</h3>

  <FileUpload multiple accept="image/*" mode="advanced" customUpload @select="onSelectGalleryImages">
    <template #content>
      <button class="w-full bg-gray-500 text-white py-2 px-4 rounded">Chọn ảnh phụ</button>
    </template>
  </FileUpload>

  <div class="flex mt-3 flex-wrap gap-2">

    <!-- FIXED V-FOR: index chuẩn trong gallery -->
    <div
      v-for="(img, index) in productForm.images.slice(1)"
      :key="img.id ?? img.objectURL"
      class="w-20 h-20 relative"
    >
      <img :src="img.objectURL" class="w-full h-full object-cover rounded shadow"/>

      <div class="absolute top-0 left-0 flex gap-1 p-1">
        <!-- index + 1 = vị trí thật trong productForm.images -->
        <button
          @click="setAsMainImage(index + 1)"
          class="bg-blue-500 text-white text-xs px-1 rounded"
        >
          Làm chính
        </button>
      </div>

      <button
        @click="removeGalleryImage(index + 1)"
        class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
      >
        Xóa
      </button>
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
