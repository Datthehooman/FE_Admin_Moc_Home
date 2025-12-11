<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, reactive, ref } from 'vue';

const authStore = useAuthStore();
const toast = useToast();

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
  size: "",
  color: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  price: "",
  price_down: "",
  rating: "",
  badge: "",
  quantity: "",
  slug: "",
  status: "",
  images: [] // all images
});

// VALIDATION ERROR
const errors = reactive({});

// LOADING
const loading = ref(false);

// ======================================
// LOAD CATEGORY
// ======================================
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

onBeforeMount(() => loadCategories());

// ======================================
// VALIDATE FORM
// ======================================
const validateForm = () => {
    Object.keys(productForm).forEach(k => (errors[k] = ''));

    if (!productForm.product_name.trim()) errors.product_name = 'Không được để trống';
    if (!productForm.category_id) errors.category_id = 'Chọn danh mục';
    if (!productForm.sku.trim()) errors.sku = 'Không được để trống';
    if (!productForm.price) errors.price = 'Không được để trống';
    if (!productForm.quantity) errors.quantity = 'Không được để trống';

    if (productForm.images.length === 0 || !productForm.images[0]?.file) {
        errors.images = 'Chọn ít nhất 1 ảnh chính';
    }

    return !Object.values(errors).some(e => e);
};
// ======================================
// SUBMIT FORM
// ======================================
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();

        // ========== SEND ALL REQUIRED FIELDS ==========
        for (const key of Object.keys(productForm)) {
            if (key === 'images') continue;
            formData.append(key, productForm[key]);
        }
        formData.append('price_down', productForm.price_down ? productForm.price_down : productForm.price);
        formData.append('status', productForm.status === 'Hiện' ? 1 : 0);

        // ========== IMAGES ==========
        productForm.images.forEach((img, i) => {
            formData.append(`images[${i}]`, img.file);
        });

        const res = await apiClient.post('/products', formData, {
            headers: {
                Authorization: `Bearer ${authStore.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm sản phẩm thành công!',
            life: 3000
        });
        console.log('Response:', res.data);

        // Reset form
        Object.keys(productForm).forEach((key) => {
            if (Array.isArray(productForm[key])) productForm[key] = [];
            else productForm[key] = '';
        });
    } catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Thêm sản phẩm thất bại: ' + JSON.stringify(err.response.data),
                life: 3000
            });
        } else {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Thêm sản phẩm thất bại!',
                life: 3000
            });
        }
    } finally {
        loading.value = false;
    }
};

// ======================================
// HANDLE IMAGE SELECT
// ======================================
const onSelectImages = (event) => {
    productForm.images = event.files.map(f => ({
        file: f,
        objectURL: URL.createObjectURL(f)
    }));
};

// ======================================
// SET IMAGE AS MAIN
// ======================================
// ================= HANDLE IMAGE SELECT =================
// Chọn ảnh đại diện
const mainUpload = ref(null);

const onSelectMainImage = (event) => {
    if (event.files.length === 0) return;

    if (productForm.images.length > 0 && productForm.images[0]?.file) {
        errors.images = 'Đã có ảnh chính, vui lòng xóa ảnh cũ trước khi thêm ảnh mới';
        mainUpload.value.clear(); // xóa file vừa chọn trong UI
        return;
    }

    const mainFile = event.files[0];
    const mainObj = { file: mainFile, objectURL: URL.createObjectURL(mainFile) };
    productForm.images = [mainObj]; // chỉ giữ 1 ảnh duy nhất

    mainUpload.value.clear();
    mainUpload.value.files = [mainFile];

    errors.images = '';
};


const removeMainImage = () => {
    productForm.images = [];
    mainUpload.value.clear(); // xóa file khỏi FileUpload UI
    errors.images = '';
};


// Chọn ảnh phụ (thêm vào mảng từ vị trí 1 trở đi)
const onSelectGalleryImages = (event) => {
    const galleryObjs = event.files.map(f => ({
        file: f,
        objectURL: URL.createObjectURL(f)
    }));

    // Nếu chưa có main image thì thêm 1 dummy vào đầu để giữ index 0
    if (productForm.images.length === 0) {
        productForm.images.push({ file: null, objectURL: '' });
    }

    productForm.images = [
        productForm.images[0],
        ...galleryObjs
    ];
};

// Set ảnh chính khi bấm "Ảnh chính" ở gallery
const setAsMainImage = (index) => {
    if (index <= 0) return;
    const temp = productForm.images[0];
    productForm.images[0] = productForm.images[index];
    productForm.images[index] = temp;
};

</script>

<template>
  <div class="flex gap-6">

    <!-- LEFT FORM -->
    <div class="left-form flex-1 bg-white p-5 rounded-lg shadow">
      <h2 class="font-semibold text-xl mb-4">Thêm sản phẩm mới</h2>

      <!-- NAME -->
      <div class="mb-4">
        <label class="font-medium">Tên sản phẩm</label>
        <InputText v-model="productForm.product_name" class="w-full" />
        <p class="err" v-if="errors.product_name">{{ errors.product_name }}</p>
      </div>

      <!-- DESCRIPTION -->
      <div class="mb-4">
        <label class="font-medium">Mô tả</label>
        <textarea v-model="productForm.description" class="w-full p-2 border rounded" rows="5"></textarea>
      </div>

      <!-- CATEGORY + BRAND -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">Danh mục</label>
          <Dropdown
            v-model="productForm.category_id"
            :options="categories"
            optionLabel="name"
            optionValue="id"
            placeholder="Chọn danh mục"
            class="w-full"
          />
          <p class="err" v-if="errors.category_id">{{ errors.category_id }}</p>
        </div>
        <div class="flex-1">
          <label class="font-medium">Thương hiệu</label>
          <InputText v-model="productForm.brand" class="w-full" />
        </div>
      </div>

      <!-- PRICE -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">Giá</label>
          <InputText type="number" v-model="productForm.price" class="w-full" />
          <p class="err" v-if="errors.price">{{ errors.price }}</p>
        </div>
        <div class="flex-1">
          <label class="font-medium">Giá giảm</label>
          <InputText type="number" v-model="productForm.price_down" class="w-full" />
        </div>
      </div>

      <!-- SKU + QUANTITY -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">SKU</label>
          <InputText v-model="productForm.sku" class="w-full" />
          <p class="err" v-if="errors.sku">{{ errors.sku }}</p>
        </div>
        <div class="flex-1">
          <label class="font-medium">Số lượng</label>
          <InputText type="number" v-model="productForm.quantity" class="w-full" />
          <p class="err" v-if="errors.quantity">{{ errors.quantity }}</p>
        </div>
      </div>

      <!-- MATERIAL + SIZE -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">Chất liệu</label>
          <InputText v-model="productForm.material" class="w-full" />
        </div>
        <div class="flex-1">
          <label class="font-medium">Kích thước</label>
          <InputText v-model="productForm.size" class="w-full" />
        </div>
      </div>

      <!-- COLOR + WEIGHT -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">Màu sắc</label>
          <InputText v-model="productForm.color" class="w-full" />
        </div>
        <div class="flex-1">
          <label class="font-medium">Khối lượng</label>
          <InputText v-model="productForm.weight" class="w-full" />
        </div>
      </div>

      <!-- LENGTH + WIDTH + HEIGHT -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <label class="font-medium">Chiều dài</label>
          <InputText v-model="productForm.length" class="w-full" />
        </div>
        <div class="flex-1">
          <label class="font-medium">Chiều rộng</label>
          <InputText v-model="productForm.width" class="w-full" />
        </div>
        <div class="flex-1">
          <label class="font-medium">Chiều cao</label>
          <InputText v-model="productForm.height" class="w-full" />
        </div>
      </div>

    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="right-sidebar w-[330px] flex flex-col gap-6">

      <!-- FEATURED IMAGE -->
     <!-- DIV ẢNH CHÍNH -->
<div class="bg-white p-4 rounded-lg shadow mb-4">
  <h3 class="font-semibold mb-2">Ảnh đại diện</h3>

  <!-- MAIN IMAGE UPLOAD -->
  <FileUpload
    ref="mainUpload"
    accept="image/*"
    mode="basic"
    customUpload
    chooseLabel="Chọn ảnh đại diện"
    @select="onSelectMainImage"
    class="w-full"
  >
    <!-- Tùy chỉnh slot để thêm style giống advanced -->
    <template #content>
      <button
        type="button"
        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded shadow transition duration-200"
      >
        Chọn ảnh đại diện
      </button>
    </template>
  </FileUpload>

  <!-- HIỂN THỊ ẢNH CHÍNH -->
  <div v-if="productForm.images.length > 0 && productForm.images[0]?.file" class="mt-3 relative">
    <img
      :src="productForm.images[0].objectURL"
      class="w-full h-44 object-cover rounded shadow"
    />
    <button
      @click="removeMainImage"
      class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded shadow transition duration-200"
    >
      Xóa
    </button>
  </div>

  <!-- ERROR -->
  <p class="err mt-1 text-red-500 text-sm" v-if="errors.images">{{ errors.images }}</p>
</div>


<!-- DIV ẢNH PHỤ (GALLERY) -->
<div class="bg-white p-4 rounded-lg shadow">
  <h3 class="font-semibold mb-2">Ảnh phụ</h3>

  <!-- GALLERY UPLOAD -->
  <FileUpload
    accept="image/*"
    mode="advanced"
    customUpload
    chooseLabel="Chọn ảnh phụ"
    @select="onSelectGalleryImages"
  />

  <!-- HIỂN THỊ GALLERY -->
  <!-- <div class="flex mt-3 flex-wrap gap-2">
    <div
      v-for="(g, i) in productForm.images"
      v-if="i > 0"
      :key="i"
      class="w-20 h-20 relative"
    >
      <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow" />
      <button
        @click="removeGalleryImage(i)"
        class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded shadow"
      >
        Xóa
      </button>
      <button
        @click="setAsMainImage(i)"
        class="absolute bottom-1 left-1 bg-white text-xs px-1 rounded shadow"
      >
        Ảnh chính
      </button>
    </div>
  </div> -->
</div>



      <!-- GALLERY -->
      <!-- <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="font-semibold mb-2">Ảnh thư viện</h3>
        <div class="flex mt-3 flex-wrap gap-2">
          <div
            v-for="(g, i) in productForm.images"
            v-if="i > 0"
            :key="i"
            class="w-20 h-20 relative"
          >
            <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow" />
            <button
              @click="setAsMainImage(i)"
              class="absolute bottom-1 left-1 bg-white text-xs px-1 rounded shadow"
            >
              Ảnh chính
            </button>
          </div>
        </div>
      </div> -->

      <!-- STATUS -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="font-semibold mb-2">Trạng thái</h3>
        <Dropdown v-model="productForm.status" :options="['Hiện','Ẩn']" class="w-full" />
        <Button
          label="Đăng sản phẩm"
          icon="pi pi-check"
          class="w-full mt-4"
          :loading="loading"
          @click="submitForm"
        />
      </div>

    </div>

  </div>
</template>

<style scoped>
.err {
  color: red;
  font-size: 13px;
}

.right-sidebar {
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  overflow-y: auto;
  scrollbar-width: none;
}
.right-sidebar::-webkit-scrollbar {
  display: none;
}
</style>
