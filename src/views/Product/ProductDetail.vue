<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const productId = route.params.id;

const product = ref(null);
const loading = ref(true);
const selectedImage = ref('');

// Load chi tiết sản phẩm
async function loadProduct() {
  loading.value = true;
  try {
    const res = await apiClient.get(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    product.value = res.data.result.data;
    selectedImage.value = product.value.thumbnail || (product.value.images.length ? product.value.images[0].full_image_url : '');
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
    product.value = null;
  } finally {
    loading.value = false;
  }
}

// Format số VN
function formatCurrency(val) {
  return Number(val).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}
function formatNumber(val) {
  return Number(val).toLocaleString('vi-VN');
}

// Xóa sản phẩm
async function deleteProduct() {
  if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.value.product_name}" không?`)) return;
  try {
    await apiClient.delete(`/products/${product.value.product_id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: `Xóa sản phẩm "${product.value.product_name}" thành công!`,
      life: 3000
    });
    router.push('/Product/ProductList'); // về list
  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: `Xóa sản phẩm thất bại!`,
      life: 3000
    });
  }
}

onMounted(loadProduct);
</script>

<template>
<div class="p-6 bg-white rounded shadow" v-if="!loading && product">
  <!-- Nút Quay lại -->
  <div class="mb-4">
    <Button
      label="Quay lại"
      icon="pi pi-arrow-left"
      severity="secondary"
      text
      @click="router.push('/Product/ProductList')"
    />
  </div>

  <div class="flex flex-col lg:flex-row gap-8">

    <!-- Ảnh sản phẩm -->
    <div class="lg:w-1/2 flex flex-col items-center">
      <div class="w-full h-96 flex items-center justify-center border rounded shadow overflow-hidden">
        <img :src="selectedImage" class="max-h-full max-w-full object-contain transform transition-transform duration-300 hover:scale-105" />
      </div>

      <!-- Ảnh phụ -->
      <div class="mt-4 w-full flex gap-2 overflow-x-auto hide-scrollbar">
        <img
          v-for="img in product.images"
          :key="img.id"
          :src="img.full_image_url"
          class="w-20 h-20 object-cover rounded cursor-pointer border hover:border-blue-400 transform transition-transform duration-300 hover:scale-105"
          @click="selectedImage = img.full_image_url"
        />
      </div>
    </div>

    <!-- Thông tin sản phẩm -->
    <div class="lg:w-1/2 flex flex-col gap-4">
      <h2 class="text-2xl font-bold">{{ product.product_name }}</h2>
      <div class="flex items-center gap-2">
        <span class="text-xl font-semibold text-red-600">{{ formatCurrency(product.price_down) }}</span>
        <span v-if="product.price_down < product.price" class="line-through text-gray-400">{{ formatCurrency(product.price) }}</span>
        <Tag v-if="product.discount_percentage > 0" :value="`-${product.discount_percentage}%`" severity="danger"/>
      </div>

      <div class="flex gap-4 mt-2">
        <Tag :value="product.quantity > 0 ? 'Còn hàng' : 'Hết hàng'" :severity="product.quantity > 0 ? 'success' : 'danger'"/>
        <Tag :value="`Đã bán: ${formatNumber(product.sold)}`" severity="info"/>
        <Tag :value="`Lượt xem: ${formatNumber(product.view)}`" severity="warning"/>
      </div>

      <div class="mt-4 space-y-1">
        <p><strong>SKU:</strong> {{ product.sku }}</p>
        <p><strong>Thương hiệu:</strong> {{ product.brand }}</p>
        <p><strong>Màu sắc:</strong> {{ product.color }}</p>
        <p><strong>Chất liệu:</strong> {{ product.material }}</p>
        <p><strong>Kích thước:</strong> {{ product.length }} x {{ product.width }} x {{ product.height }} cm</p>
        <p><strong>Trọng lượng:</strong> {{ product.weight }} kg</p>
      </div>

      <div class="mt-4">
        <h3 class="font-semibold text-lg mb-2">Mô tả sản phẩm</h3>
        <p class="whitespace-pre-line">{{ product.description }}</p>
      </div>

      <!-- Nút Sửa / Xóa -->
      <div class="mt-6 flex gap-2">
        <Button label="Sửa sản phẩm" icon="pi pi-pencil" severity="primary" text @click="router.push(`/Product/Edit_Product/${product.product_id}`)" />
        <Button label="Xóa sản phẩm" icon="pi pi-trash" severity="danger" text @click="deleteProduct" />
      </div>
    </div>
  </div>
</div>

<div v-else-if="loading" class="text-center py-10">Đang tải sản phẩm...</div>
<div v-else class="text-center py-10 text-red-600">Không tìm thấy sản phẩm!</div>
</template>

<style scoped>
img { transition: all 0.3s; }
img:hover { transform: scale(1.05); }

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
