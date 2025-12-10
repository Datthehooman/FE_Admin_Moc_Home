<script setup>
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import { onBeforeMount, reactive, ref } from 'vue';

const authStore = useAuthStore();

// ======================================
// FORM DATA
// ======================================
const productForm = reactive({
  "product_name": "",
  "category_id": "",
  "sku": "",
  "brand": "",
  "description": "",
  "material": "",
  "size": "",
  "color": "",
  "weight": "",
  "price": "",
  "price_down": "",
  "rating": "",
  "badge": "",
  "quantity": "",
  "slug": "",
  "status": "",
  "images": []
}
);

// VALIDATION ERROR
const errors = reactive({});

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
    if (productForm.images.length === 0) errors.images = 'Chọn ít nhất 1 ảnh';

    return !Object.values(errors).some(e => e);
};

// ======================================
// SUBMIT
// ======================================
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();

        // ========== SEND ALL REQUIRED FIELDS ==========
        formData.append('product_name', productForm.product_name);
        formData.append('category_id', productForm.category_id);
        formData.append('sku', productForm.sku);
        formData.append('brand', productForm.brand);
        formData.append('description', productForm.description);
        formData.append('material', productForm.material);
        formData.append('size', productForm.size);
        formData.append('color', productForm.color);
        formData.append('weight', productForm.weight);
        formData.append('price', productForm.price);
       formData.append('price_down', productForm.price_down ? productForm.price_down : productForm.price);
        formData.append('quantity', productForm.quantity);
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

        alert('Thêm sản phẩm thành công!');
        console.log(res.data);
    } catch (err) {
        console.error(err);
        alert('Thêm thất bại!');
    } finally {
        loading.value = false;
    }
};

// ======================================
// HANDLE SELECT IMAGE
// ======================================
const onSelectImages = (event) => {
    productForm.images = event.files.map(f => ({
        file: f,
        objectURL: URL.createObjectURL(f)
    }));
};
</script>
<template>
  <div class="flex gap-6">

    <!-- ===================== LEFT COLUMN ===================== -->
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
        <textarea
          v-model="productForm.description"
          class="w-full p-2 border rounded"
          rows="5"
        ></textarea>
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

    </div>

    <!-- ===================== RIGHT COLUMN ===================== -->
    <div class="right-sidebar w-[330px] flex flex-col gap-6">

      <!-- FEATURED IMAGE -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="font-semibold mb-2">Ảnh đại diện</h3>

        <FileUpload
          accept="image/*"
          mode="advanced"
          customUpload
          chooseLabel="Chọn ảnh"
          @select="onSelectImages"
        />

        <!-- PREVIEW -->
        <div v-if="productForm.images.length > 0" class="mt-3">
          <img
            :src="productForm.images[0].objectURL"
            class="w-full h-44 object-cover rounded shadow"
          />
        </div>
      </div>

      <!-- GALLERY -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="font-semibold mb-2">Ảnh thư viện</h3>

        <div class="flex mt-3 flex-wrap gap-2">
          <div
            v-for="(g,i) in productForm.images"
            v-if="i > 0"
            :key="i"
            class="w-20 h-20"
          >
            <img :src="g.objectURL" class="w-full h-full object-cover rounded shadow" />
          </div>
        </div>
      </div>

      <!-- STATUS -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="font-semibold mb-2">Trạng thái</h3>

        <Dropdown
          v-model="productForm.status"
          :options="['Hiện','Ẩn']"
          class="w-full"
        />

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

