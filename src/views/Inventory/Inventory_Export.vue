<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
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

// Orders for export
const orders = ref([]);
const confirmedOrders = ref([]);
const loadingOrders = ref(false);

// List of items to export
const exportItems = ref([]);

// Form data for single item
const formData = ref({
    product_id: null,
    quantity: 1,
    export_type: 'sale',
    order_code: null
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
    await loadOrders();

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

// Load orders for export
async function loadOrders() {
    loadingOrders.value = true;
    try {
        const response = await apiClient.get('/order');
        const orderData = response.data?.result?.data?.data || response.data?.result?.data || response.data?.data || [];
        orders.value = Array.isArray(orderData) ? orderData : [];
        // Filter only confirmed orders
        confirmedOrders.value = orders.value.filter((order) => order.order_status === 'confirmed');
    } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
        orders.value = [];
        confirmedOrders.value = [];
    } finally {
        loadingOrders.value = false;
    }
}

// Khi chọn sản phẩm
function onProductChange(event) {
    formData.value.product_id = event.value?.product_id || null;
    selectedProduct.value = event.value;
}

// Số lượng còn lại sau khi xuất (considering items already in list)
const remainingStock = computed(() => {
    if (!selectedProduct.value) return 0;
    const currentStock = parseInt(selectedProduct.value.stock_quantity) || 0;
    // Check if product already in list
    const existingItem = exportItems.value.find((item) => item.product_id === selectedProduct.value.product_id);
    const alreadyExporting = existingItem ? existingItem.quantity : 0;
    return Math.max(0, currentStock - alreadyExporting - formData.value.quantity);
});

// Check if product already in list
function isProductInList(productId) {
    return exportItems.value.some((item) => item.product_id === productId);
}

// Get total export quantity for a product (including what's already in list)
function getTotalExportForProduct(productId) {
    return exportItems.value.filter((item) => item.product_id === productId).reduce((sum, item) => sum + item.quantity, 0);
}

// Add item to export list
function addToList() {
    if (!selectedProduct.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng chọn sản phẩm',
            life: 3000
        });
        return;
    }

    if (formData.value.quantity < 1) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Số lượng phải lớn hơn 0',
            life: 3000
        });
        return;
    }

    const currentStock = parseInt(selectedProduct.value.stock_quantity) || 0;
    const alreadyInList = getTotalExportForProduct(selectedProduct.value.product_id);

    if (formData.value.quantity + alreadyInList > currentStock) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Số lượng xuất vượt quá tồn kho. Tồn kho: ${currentStock}, Đã trong danh sách: ${alreadyInList}`,
            life: 4000
        });
        return;
    }

    // Check if product already exists in list
    if (isProductInList(selectedProduct.value.product_id)) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Sản phẩm đã có trong danh sách',
            life: 3000
        });
        return;
    }

    const item = {
        product_id: selectedProduct.value.product_id,
        product_name: selectedProduct.value.product_name,
        sku: selectedProduct.value.sku,
        current_stock: currentStock,
        quantity: formData.value.quantity,
        export_type: formData.value.export_type,
        order_code: formData.value.order_code
    };

    exportItems.value.push(item);

    toast.add({
        severity: 'success',
        summary: 'Đã thêm',
        detail: `Đã thêm ${selectedProduct.value.product_name} vào danh sách`,
        life: 2000
    });

    // Reset form for next item
    resetForm();
}

// Remove item from list
function removeFromList(index) {
    const removedItem = exportItems.value[index];
    exportItems.value.splice(index, 1);
    toast.add({
        severity: 'info',
        summary: 'Đã xóa',
        detail: `Đã xóa ${removedItem.product_name} khỏi danh sách`,
        life: 2000
    });
}

// Edit item in list - load back to form
function editItem(index) {
    const item = exportItems.value[index];
    selectedProduct.value = products.value.find((p) => p.product_id === item.product_id);
    formData.value = {
        product_id: item.product_id,
        quantity: item.quantity,
        export_type: item.export_type,
        order_code: item.order_code
    };
    // Remove from list so it can be re-added
    exportItems.value.splice(index, 1);
}

// Submit all exports
async function submitExport() {
    if (exportItems.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: 'Vui lòng thêm ít nhất một sản phẩm vào danh sách',
            life: 3000
        });
        return;
    }

    submitting.value = true;
    try {
        const payload = {
            items: exportItems.value.map((item) => {
                const exportItem = {
                    product_id: item.product_id,
                    quantity: item.quantity
                };
                if (item.export_type) exportItem.export_type = item.export_type;
                if (item.order_code) exportItem.order_code = item.order_code;
                return exportItem;
            })
        };

        await apiClient.post('/inventory/export', payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất kho ${exportItems.value.length} sản phẩm thành công!`,
            life: 3000
        });

        // Clear all
        exportItems.value = [];
        resetForm();
        // Reload products to update stock
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
        order_code: null
    };
    selectedProduct.value = null;
}

// Format currency
function formatCurrency(val) {
    if (!val) return '-';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
}

// Clear all items
function clearAll() {
    exportItems.value = [];
    resetForm();
}

// Quay lại
function goBack() {
    router.back();
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Get export type label
function getExportTypeLabel(value) {
    const type = exportTypes.value.find((t) => t.value === value);
    return type ? type.label : value;
}

// Total quantity
const totalQuantity = computed(() => {
    return exportItems.value.reduce((sum, item) => sum + item.quantity, 0);
});
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

        <!-- Product Selection Form -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 mb-6">
            <h3 class="font-semibold mb-4 text-lg">Thêm sản phẩm xuất kho</h3>

            <!-- Product Select - Full Width -->
            <div class="flex flex-col gap-2 mb-4">
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

            <!-- Product Info when selected -->
            <div v-if="selectedProduct" class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h4 class="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">Thông tin sản phẩm:</h4>
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

            <!-- Other Form Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <!-- Mã đơn hàng - Only show for sale type -->
                <div v-if="formData.export_type === 'sale'" class="flex flex-col gap-2">
                    <label for="order_code" class="font-medium">Mã đơn hàng</label>
                    <Dropdown
                        id="order_code"
                        v-model="formData.order_code"
                        :options="confirmedOrders"
                        optionLabel="order_code"
                        optionValue="order_code"
                        placeholder="Chọn đơn hàng đã xác nhận..."
                        filter
                        filterPlaceholder="Tìm mã đơn hàng..."
                        :loading="loadingOrders"
                        class="w-full"
                        showClear
                    >
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ slotProps.option.order_code }}</span>
                                <span class="text-sm text-gray-500">{{ formatCurrency(slotProps.option.total_amount) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <small v-if="confirmedOrders.length === 0 && !loadingOrders" class="text-orange-500"> Không có đơn hàng "Đã xác nhận" nào </small>
                </div>
            </div>

            <!-- Add Button -->
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
                <Button label="Thêm vào danh sách" icon="pi pi-plus" severity="success" @click="addToList" :disabled="!selectedProduct" />
            </div>
        </div>

        <!-- Export Items List -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">
                    Danh sách sản phẩm xuất kho
                    <span class="text-sm font-normal text-gray-500">({{ exportItems.length }} sản phẩm)</span>
                </h3>
                <Button v-if="exportItems.length > 0" label="Xóa tất cả" icon="pi pi-trash" severity="danger" text @click="clearAll" />
            </div>

            <DataTable :value="exportItems" class="mb-4" stripedRows showGridlines emptyMessage="Chưa có sản phẩm nào trong danh sách">
                <Column field="product_name" header="Sản phẩm">
                    <template #body="slotProps">
                        <div>
                            <p class="font-medium">{{ slotProps.data.product_name }}</p>
                            <p class="text-sm text-gray-500">SKU: {{ slotProps.data.sku || '-' }}</p>
                        </div>
                    </template>
                </Column>
                <Column field="current_stock" header="Tồn hiện tại" style="width: 100px">
                    <template #body="slotProps">
                        {{ formatNumber(slotProps.data.current_stock) }}
                    </template>
                </Column>
                <Column field="quantity" header="SL xuất" style="width: 80px">
                    <template #body="slotProps">
                        <span class="font-semibold text-red-600">-{{ formatNumber(slotProps.data.quantity) }}</span>
                    </template>
                </Column>
                <Column field="export_type" header="Loại" style="width: 120px">
                    <template #body="slotProps">
                        {{ getExportTypeLabel(slotProps.data.export_type) }}
                    </template>
                </Column>
                <Column field="order_code" header="Mã đơn hàng" style="width: 150px">
                    <template #body="slotProps">
                        {{ slotProps.data.order_code || '-' }}
                    </template>
                </Column>
                <Column header="Thao tác" style="width: 100px">
                    <template #body="slotProps">
                        <div class="flex gap-1">
                            <Button icon="pi pi-pencil" severity="info" text rounded @click="editItem(slotProps.index)" v-tooltip.top="'Sửa'" />
                            <Button icon="pi pi-trash" severity="danger" text rounded @click="removeFromList(slotProps.index)" v-tooltip.top="'Xóa'" />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <!-- Summary -->
            <div v-if="exportItems.length > 0" class="flex justify-between items-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg mb-4">
                <div>
                    <span class="text-sm text-gray-500">Tổng số lượng xuất:</span>
                    <p class="font-semibold text-lg text-red-600">{{ formatNumber(totalQuantity) }}</p>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
                <Button label="Xuất kho" icon="pi pi-check" severity="danger" :loading="submitting" :disabled="exportItems.length === 0" size="large" @click="submitExport" />
            </div>
        </div>
    </div>
</template>

<style scoped></style>
