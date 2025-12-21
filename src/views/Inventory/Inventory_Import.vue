<script setup>
import { onBeforeMount, ref } from 'vue';
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
    import_price: null,
    supplier_name: '',
    import_type: 'purchase',
    note: ''
});

const importTypes = ref([
    { label: 'Mua hàng', value: 'purchase' },
    { label: 'Trả hàng', value: 'return' },
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

// Submit nhập kho
async function submitImport() {
    submitting.value = true;
    try {
        const payload = {
            product_id: selectedProduct.value.product_id,
            quantity: formData.value.quantity
        };

        // Chỉ gửi các trường có giá trị
        if (formData.value.import_price) payload.import_price = formData.value.import_price;
        if (formData.value.supplier_name) payload.supplier_name = formData.value.supplier_name;
        if (formData.value.import_type) payload.import_type = formData.value.import_type;
        if (formData.value.note) payload.note = formData.value.note;

        await apiClient.post('/inventory/import', payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã nhập kho ${formData.value.quantity} sản phẩm thành công!`,
            life: 3000
        });

        // Reset form
        resetForm();
    } catch (err) {
        console.error('Lỗi nhập kho:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.response?.data?.message || 'Có lỗi xảy ra khi nhập kho',
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
        import_price: null,
        supplier_name: '',
        import_type: 'purchase',
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
                <i class="pi pi-file-import text-green-500 mr-2"></i>
                Nhập Kho
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
                <label for="quantity" class="font-medium">Số lượng nhập <span class="text-red-500">*</span></label>
                <InputNumber id="quantity" v-model="formData.quantity" :min="1" placeholder="Nhập số lượng" class="w-full" showButtons />
            </div>

            <!-- Giá nhập -->
            <div class="flex flex-col gap-2">
                <label for="import_price" class="font-medium">Giá nhập (VNĐ)</label>
                <InputNumber id="import_price" v-model="formData.import_price" :min="0" mode="currency" currency="VND" locale="vi-VN" placeholder="Nhập giá nhập" class="w-full" />
            </div>

            <!-- Nhà cung cấp -->
            <div class="flex flex-col gap-2">
                <label for="supplier_name" class="font-medium">Nhà cung cấp</label>
                <InputText id="supplier_name" v-model="formData.supplier_name" placeholder="Nhập tên nhà cung cấp" class="w-full" />
            </div>

            <!-- Loại nhập kho -->
            <div class="flex flex-col gap-2">
                <label for="import_type" class="font-medium">Loại nhập kho</label>
                <Dropdown id="import_type" v-model="formData.import_type" :options="importTypes" optionLabel="label" optionValue="value" placeholder="Chọn loại" class="w-full" />
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
                    <span class="text-sm text-gray-500">Sau khi nhập:</span>
                    <p class="font-medium text-green-600">{{ formatNumber((parseInt(selectedProduct.stock_quantity) || 0) + formData.quantity) }}</p>
                </div>
            </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 mt-6">
            <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
            <Button label="Nhập kho" icon="pi pi-check" :loading="submitting" @click="submitImport" />
        </div>
    </div>
</template>

<style scoped></style>
