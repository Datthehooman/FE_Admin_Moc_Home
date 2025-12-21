<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import apiClient from '@/api/axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const submitting = ref(false);
const products = ref([]);
const selectedProduct = ref(null);

// Form data
const formData = ref({
    product_id: null,
    after_stock: 0,
    reason: ''
});

const reasonOptions = ref([
    { label: 'Kiểm kê định kỳ', value: 'Kiểm kê định kỳ' },
    { label: 'Sai số liệu', value: 'Sai số liệu' },
    { label: 'Hàng hư hỏng', value: 'Hàng hư hỏng' },
    { label: 'Hàng thất lạc', value: 'Hàng thất lạc' },
    { label: 'Điều chỉnh hệ thống', value: 'Điều chỉnh hệ thống' },
    { label: 'Khác', value: 'Khác' }
]);

// Load danh sách sản phẩm
onBeforeMount(async () => {
    await loadProducts();

    // Nếu có product_id từ query params
    if (route.query.product_id) {
        formData.value.product_id = parseInt(route.query.product_id);
        selectedProduct.value = products.value.find((p) => p.product_id === formData.value.product_id);
        if (selectedProduct.value) {
            formData.value.after_stock = parseInt(selectedProduct.value.stock_quantity) || 0;
        }
    }
});

async function loadProducts() {
    loading.value = true;
    try {
        const response = await apiClient.get('/products');
        products.value = response.data?.result?.data || response.data?.data || [];
    } catch (err) {
        console.error('Lỗi tải danh sách sản phẩm:', err);
        products.value = [];
    } finally {
        loading.value = false;
    }
}

// Khi chọn sản phẩm
function onProductChange(event) {
    formData.value.product_id = event.value?.product_id || null;
    selectedProduct.value = event.value;
    // Set giá trị mặc định là tồn kho hiện tại
    formData.value.after_stock = parseInt(event.value?.stock_quantity) || 0;
}

// Tính sự thay đổi
const stockDifference = computed(() => {
    if (!selectedProduct.value) return 0;
    return formData.value.after_stock - (parseInt(selectedProduct.value.stock_quantity) || 0);
});

// Submit điều chỉnh kho
async function submitAdjust() {
    submitting.value = true;
    try {
        const payload = {
            product_id: selectedProduct.value.product_id,
            after_stock: formData.value.after_stock,
            reason: formData.value.reason
        };

        await apiClient.post('/inventory/adjust', payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã điều chỉnh tồn kho thành công!`,
            life: 3000
        });

        // Reset form
        resetForm();
        // Reload products để cập nhật tồn kho
        await loadProducts();
    } catch (err) {
        console.error('Lỗi điều chỉnh kho:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.response?.data?.message || 'Có lỗi xảy ra khi điều chỉnh kho',
            life: 3000
        });
    } finally {
        submitting.value = false;
    }
}

// Reset form
function resetForm() {
    formData.value = {
        product_id: null,
        after_stock: 0,
        reason: ''
    };
    selectedProduct.value = null;
}

// Quay lại
function goBack() {
    router.back();
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}
</script>

<template>
    <Toast />
    <div class="card flex-1">
        <div class="flex justify-between items-center mb-6">
            <h2 class="font-semibold text-xl">
                <i class="pi pi-file-edit text-yellow-500 mr-2"></i>
                Điều Chỉnh Kho
            </h2>
            <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Chọn sản phẩm -->
            <div class="flex flex-col gap-2">
                <label for="product" class="font-medium">Sản phẩm <span class="text-red-500">*</span></label>
                <Dropdown id="product" v-model="selectedProduct" :options="products" optionLabel="product_name" placeholder="Chọn sản phẩm" filter filterPlaceholder="Tìm kiếm sản phẩm..." class="w-full" :loading="loading" @change="onProductChange">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <span>{{ slotProps.option.product_name }}</span>
                            <span class="text-sm text-gray-500">(Tồn: {{ slotProps.option.stock_quantity || 0 }})</span>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <!-- Số lượng sau điều chỉnh -->
            <div class="flex flex-col gap-2">
                <label for="after_stock" class="font-medium">Số lượng tồn kho mới <span class="text-red-500">*</span></label>
                <InputNumber id="after_stock" v-model="formData.after_stock" :min="0" placeholder="Nhập số lượng sau điều chỉnh" class="w-full" showButtons />
            </div>

            <!-- Lý do điều chỉnh -->
            <div class="flex flex-col gap-2 md:col-span-2">
                <label for="reason" class="font-medium">Lý do điều chỉnh <span class="text-red-500">*</span></label>
                <InputText id="reason" v-model="formData.reason" placeholder="Nhập lý do điều chỉnh (VD: Kiểm kê định kỳ, Sai số liệu, Hàng hư hỏng...)" class="w-full" />
            </div>
        </div>

        <!-- Thông tin sản phẩm đã chọn -->
        <div v-if="selectedProduct" class="mt-6 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <h3 class="font-semibold mb-4">Thông tin điều chỉnh:</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <span class="text-sm text-gray-500">Tên sản phẩm:</span>
                    <p class="font-medium">{{ selectedProduct.product_name }}</p>
                </div>
                <div>
                    <span class="text-sm text-gray-500">SKU:</span>
                    <p class="font-medium">{{ selectedProduct.sku || '-' }}</p>
                </div>
                <div>
                    <span class="text-sm text-gray-500">Tồn kho hiện tại:</span>
                    <p class="font-medium">{{ formatNumber(selectedProduct.stock_quantity || 0) }}</p>
                </div>
                <div>
                    <span class="text-sm text-gray-500">Tồn kho sau điều chỉnh:</span>
                    <p class="font-medium" :class="formData.after_stock < (parseInt(selectedProduct.stock_quantity) || 0) ? 'text-red-600' : 'text-green-600'">
                        {{ formatNumber(formData.after_stock) }}
                    </p>
                </div>
            </div>

            <!-- Hiển thị sự thay đổi -->
            <div class="mt-4 p-3 rounded-lg" :class="stockDifference >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
                <div class="flex items-center gap-2">
                    <i :class="stockDifference >= 0 ? 'pi pi-arrow-up text-green-600' : 'pi pi-arrow-down text-red-600'"></i>
                    <span class="font-medium">
                        Thay đổi:
                        <Tag :value="(stockDifference >= 0 ? '+' : '') + formatNumber(stockDifference)" :severity="stockDifference >= 0 ? 'success' : 'danger'" />
                    </span>
                </div>
            </div>
        </div>

        <!-- Cảnh báo -->
        <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div class="flex items-start gap-2">
                <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                <div>
                    <p class="font-medium text-yellow-800 dark:text-yellow-200">Lưu ý quan trọng:</p>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300">Việc điều chỉnh kho sẽ thay đổi trực tiếp số lượng tồn kho và được ghi nhận vào lịch sử. Vui lòng kiểm tra kỹ trước khi xác nhận.</p>
                </div>
            </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 mt-6">
            <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
            <Button label="Điều chỉnh" icon="pi pi-check" severity="warn" :loading="submitting" @click="submitAdjust" />
        </div>
    </div>
</template>

<style scoped></style>
