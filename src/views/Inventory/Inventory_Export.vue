<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
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
    quantity: 1,
    export_type: 'sale',
    reference_id: '',
    note: ''
});

const exportTypes = ref([
    { label: 'Bán hàng', value: 'sale' },
    { label: 'Trả nhà cung cấp', value: 'return' },
    { label: 'Hư hỏng', value: 'damaged' },
    { label: 'Chuyển kho', value: 'transfer' },
    { label: 'Khác', value: 'other' }
]);

// Load danh sách sản phẩm
onBeforeMount(async () => {
    await loadProducts();

    // Nếu có product_id từ query params
    if (route.query.product_id) {
        formData.value.product_id = parseInt(route.query.product_id);
        selectedProduct.value = products.value.find((p) => p.product_id === formData.value.product_id);
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
}

// Số lượng còn lại sau khi xuất
const remainingStock = computed(() => {
    if (!selectedProduct.value) return 0;
    return Math.max(0, (parseInt(selectedProduct.value.stock_quantity) || 0) - formData.value.quantity);
});

// Submit xuất kho
async function submitExport() {
    submitting.value = true;
    try {
        const payload = {
            product_id: selectedProduct.value.product_id,
            quantity: formData.value.quantity
        };

        // Chỉ gửi các trường có giá trị
        if (formData.value.export_type) payload.export_type = formData.value.export_type;
        if (formData.value.reference_id) payload.reference_id = formData.value.reference_id;
        if (formData.value.note) payload.note = formData.value.note;

        await apiClient.post('/inventory/export', payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất kho ${formData.value.quantity} sản phẩm thành công!`,
            life: 3000
        });

        // Reset form
        resetForm();
        // Reload products để cập nhật tồn kho
        await loadProducts();
    } catch (err) {
        console.error('Lỗi xuất kho:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.response?.data?.message || 'Có lỗi xảy ra khi xuất kho',
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
        quantity: 1,
        export_type: 'sale',
        reference_id: '',
        note: ''
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
                <i class="pi pi-file-export text-red-500 mr-2"></i>
                Xuất Kho
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

            <!-- Số lượng -->
            <div class="flex flex-col gap-2">
                <label for="quantity" class="font-medium">Số lượng xuất <span class="text-red-500">*</span></label>
                <InputNumber id="quantity" v-model="formData.quantity" :min="1" :max="parseInt(selectedProduct?.stock_quantity) || 9999" placeholder="Nhập số lượng" class="w-full" showButtons />
                <small v-if="selectedProduct && formData.quantity > (parseInt(selectedProduct.stock_quantity) || 0)" class="text-red-500"> Số lượng xuất vượt quá tồn kho hiện có! </small>
            </div>

            <!-- Loại xuất kho -->
            <div class="flex flex-col gap-2">
                <label for="export_type" class="font-medium">Loại xuất kho</label>
                <Dropdown id="export_type" v-model="formData.export_type" :options="exportTypes" optionLabel="label" optionValue="value" placeholder="Chọn loại" class="w-full" />
            </div>

            <!-- Mã tham chiếu -->
            <div class="flex flex-col gap-2">
                <label for="reference_id" class="font-medium">Mã tham chiếu</label>
                <InputText id="reference_id" v-model="formData.reference_id" placeholder="Nhập mã đơn hàng, phiếu xuất..." class="w-full" />
            </div>

            <!-- Ghi chú -->
            <div class="flex flex-col gap-2 md:col-span-2">
                <label for="note" class="font-medium">Ghi chú</label>
                <Textarea id="note" v-model="formData.note" rows="3" placeholder="Nhập ghi chú (nếu có)" class="w-full" />
            </div>
        </div>

        <!-- Thông tin sản phẩm đã chọn -->
        <div v-if="selectedProduct" class="mt-6 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <h3 class="font-semibold mb-2">Thông tin sản phẩm đã chọn:</h3>
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
                    <span class="text-sm text-gray-500">Sau khi xuất:</span>
                    <p class="font-medium" :class="remainingStock <= 10 ? 'text-red-600' : 'text-green-600'">
                        {{ formatNumber(remainingStock) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 mt-6">
            <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
            <Button label="Xuất kho" icon="pi pi-check" severity="danger" :loading="submitting" @click="submitExport" />
        </div>
    </div>
</template>

<style scoped></style>
