<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
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

// List of items to import
const importItems = ref([]);

// Form data for single item
const formData = ref({
    product_id: null,
    quantity: 1,
    import_price: null,
    supplier_name: '',
    import_type: 'purchase'
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

// Check if product already in list
function isProductInList(productId) {
    return importItems.value.some((item) => item.product_id === productId);
}

// Add item to import list
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
        current_stock: selectedProduct.value.stock_quantity || 0,
        quantity: formData.value.quantity,
        import_price: formData.value.import_price,
        supplier_name: formData.value.supplier_name,
        import_type: formData.value.import_type
    };

    importItems.value.push(item);

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
    const removedItem = importItems.value[index];
    importItems.value.splice(index, 1);
    toast.add({
        severity: 'info',
        summary: 'Đã xóa',
        detail: `Đã xóa ${removedItem.product_name} khỏi danh sách`,
        life: 2000
    });
}

// Edit item in list - load back to form
function editItem(index) {
    const item = importItems.value[index];
    selectedProduct.value = products.value.find((p) => p.product_id === item.product_id);
    formData.value = {
        product_id: item.product_id,
        quantity: item.quantity,
        import_price: item.import_price,
        supplier_name: item.supplier_name,
        import_type: item.import_type
    };
    // Remove from list so it can be re-added
    importItems.value.splice(index, 1);
}

// Submit all imports
async function submitImport() {
    if (importItems.value.length === 0) {
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
            items: importItems.value.map((item) => {
                const importItem = {
                    product_id: item.product_id,
                    quantity: item.quantity
                };
                if (item.import_price) importItem.import_price = item.import_price;
                if (item.supplier_name) importItem.supplier_name = item.supplier_name;
                if (item.import_type) importItem.import_type = item.import_type;
                return importItem;
            })
        };

        await apiClient.post('/inventory/import', payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã nhập kho ${importItems.value.length} sản phẩm thành công!`,
            life: 3000
        });

        // Clear all
        importItems.value = [];
        resetForm();
        // Reload products to update stock
        await loadProducts();
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
        import_type: 'purchase'
    };
    selectedProduct.value = null;
}

// Clear all items
function clearAll() {
    importItems.value = [];
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

// Format currency
function formatCurrency(val) {
    if (!val) return '-';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
}

// Get import type label
function getImportTypeLabel(value) {
    const type = importTypes.value.find((t) => t.value === value);
    return type ? type.label : value;
}

// Total quantity
const totalQuantity = computed(() => {
    return importItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

// Total value
const totalValue = computed(() => {
    return importItems.value.reduce((sum, item) => {
        return sum + (item.import_price || 0) * item.quantity;
    }, 0);
});
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

        <!-- Product Selection Form -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 mb-6">
            <h3 class="font-semibold mb-4 text-lg">Thêm sản phẩm nhập kho</h3>

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
                        <span class="text-sm text-gray-500">Sau khi nhập:</span>
                        <p class="font-medium text-green-600">{{ formatNumber((parseInt(selectedProduct.stock_quantity) || 0) + formData.quantity) }}</p>
                    </div>
                </div>
            </div>

            <!-- Other Form Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <!-- Add Button -->
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
                <Button label="Thêm vào danh sách" icon="pi pi-plus" severity="success" @click="addToList" :disabled="!selectedProduct" />
            </div>
        </div>

        <!-- Import Items List -->
        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">
                    Danh sách sản phẩm nhập kho
                    <span class="text-sm font-normal text-gray-500">({{ importItems.length }} sản phẩm)</span>
                </h3>
                <Button v-if="importItems.length > 0" label="Xóa tất cả" icon="pi pi-trash" severity="danger" text @click="clearAll" />
            </div>

            <DataTable :value="importItems" class="mb-4" stripedRows showGridlines emptyMessage="Chưa có sản phẩm nào trong danh sách">
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
                <Column field="quantity" header="SL nhập" style="width: 80px">
                    <template #body="slotProps">
                        <span class="font-semibold text-green-600">+{{ formatNumber(slotProps.data.quantity) }}</span>
                    </template>
                </Column>
                <Column field="import_price" header="Giá nhập" style="width: 120px">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.import_price) }}
                    </template>
                </Column>
                <Column field="import_type" header="Loại" style="width: 100px">
                    <template #body="slotProps">
                        {{ getImportTypeLabel(slotProps.data.import_type) }}
                    </template>
                </Column>
                <Column field="supplier_name" header="Nhà cung cấp" style="width: 150px">
                    <template #body="slotProps">
                        {{ slotProps.data.supplier_name || '-' }}
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
            <div v-if="importItems.length > 0" class="flex justify-between items-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg mb-4">
                <div class="flex gap-8">
                    <div>
                        <span class="text-sm text-gray-500">Tổng số lượng:</span>
                        <p class="font-semibold text-lg text-green-600">{{ formatNumber(totalQuantity) }}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">Tổng giá trị:</span>
                        <p class="font-semibold text-lg">{{ formatCurrency(totalValue) }}</p>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
                <Button label="Nhập kho" icon="pi pi-check" :loading="submitting" :disabled="importItems.length === 0" size="large" @click="submitImport" />
            </div>
        </div>
    </div>
</template>

<style scoped></style>
