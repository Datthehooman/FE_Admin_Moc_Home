<script setup>
import apiClient from '@/api/axios';
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
const router = useRouter();

const toast = useToast();
const products = ref([]);
const filters = ref(null);
const loading = ref(true);

const authStore = useAuthStore();

// Import/Export Dialog states
const showImportDialog = ref(false);
const showExportDialog = ref(false);
const selectedProductForAction = ref(null);
const submitting = ref(false);

// Orders for export
const orders = ref([]);
const confirmedOrders = ref([]);
const loadingOrders = ref(false);

// Import form data
const importFormData = ref({
    quantity: 1,
    import_price: null,
    supplier_name: '',
    import_type: 'purchase'
});

// Export form data
const exportFormData = ref({
    quantity: 1,
    export_type: 'sale',
    order_code: null
});

const importTypes = ref([
    { label: 'Mua hàng', value: 'purchase' },
    { label: 'Trả hàng', value: 'return' },
    { label: 'Chuyển kho', value: 'transfer' },
    { label: 'Khác', value: 'other' }
]);

const exportTypes = ref([
    { label: 'Bán hàng', value: 'sale' },
    { label: 'Trả nhà cung cấp', value: 'return' },
    { label: 'Hư hỏng', value: 'damaged' },
    { label: 'Chuyển kho', value: 'transfer' },
    { label: 'Khác', value: 'other' }
]);

onBeforeMount(async () => {
    await loadProducts();
    await loadOrders();
});

// Load sản phẩm
async function loadProducts() {
    loading.value = true;
    try {
        const response = await apiClient.get('/products', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        products.value = response.data.result.data || [];
    } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
        products.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Khởi tạo filter cho từng cột
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        product_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        stock_quantity: { value: null, matchMode: FilterMatchMode.EQUALS },
        sold: { value: null, matchMode: FilterMatchMode.EQUALS },
        view: { value: null, matchMode: FilterMatchMode.EQUALS },
        status: { value: [], matchMode: FilterMatchMode.IN }
    };
}

// Format số VN
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Format currency
function formatCurrency(val) {
    if (!val) return '-';
    return Number(val).toLocaleString('vi-VN') + ' ₫';
}

// Load orders for export
async function loadOrders() {
    loadingOrders.value = true;
    try {
        const response = await apiClient.get('/order', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
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

// Xóa sản phẩm với toast
async function deleteProduct(product) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.product_name}" không?`)) return;

    try {
        await apiClient.delete(`/products/${product.product_id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        products.value = products.value.filter((p) => p.product_id !== product.product_id);

        // Thông báo success
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Xóa sản phẩm "${product.product_name}" thành công!`,
            life: 3000
        });
    } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err.response || err);
        // Thông báo error
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Xóa sản phẩm "${product.product_name}" thất bại!`,
            life: 3000
        });
    }
}

// Open Import Dialog
function openImportDialog(product) {
    selectedProductForAction.value = product;
    importFormData.value = {
        quantity: 1,
        import_price: null,
        supplier_name: '',
        import_type: 'purchase'
    };
    showImportDialog.value = true;
}

// Open Export Dialog
function openExportDialog(product) {
    selectedProductForAction.value = product;
    exportFormData.value = {
        quantity: 1,
        export_type: 'sale',
        order_code: null
    };
    showExportDialog.value = true;
}

// Submit Import
async function submitImport() {
    if (!selectedProductForAction.value) return;

    submitting.value = true;
    try {
        const payload = {
            product_id: selectedProductForAction.value.product_id,
            quantity: importFormData.value.quantity
        };

        if (importFormData.value.import_price) payload.import_price = importFormData.value.import_price;
        if (importFormData.value.supplier_name) payload.supplier_name = importFormData.value.supplier_name;
        if (importFormData.value.import_type) payload.import_type = importFormData.value.import_type;

        await apiClient.post('/inventory/import', payload, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã nhập kho ${importFormData.value.quantity} sản phẩm "${selectedProductForAction.value.product_name}" thành công!`,
            life: 3000
        });

        showImportDialog.value = false;
        await loadProducts(); // Reload to update stock
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

// Submit Export
async function submitExport() {
    if (!selectedProductForAction.value) return;

    const currentStock = parseInt(selectedProductForAction.value.stock_quantity) || 0;
    if (exportFormData.value.quantity > currentStock) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Số lượng xuất vượt quá tồn kho hiện có (${currentStock})`,
            life: 3000
        });
        return;
    }

    submitting.value = true;
    try {
        const payload = {
            product_id: selectedProductForAction.value.product_id,
            quantity: exportFormData.value.quantity
        };

        if (exportFormData.value.export_type) payload.export_type = exportFormData.value.export_type;
        if (exportFormData.value.order_code) payload.order_code = exportFormData.value.order_code;

        await apiClient.post('/inventory/export', payload, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã xuất kho ${exportFormData.value.quantity} sản phẩm "${selectedProductForAction.value.product_name}" thành công!`,
            life: 3000
        });

        showExportDialog.value = false;
        await loadProducts(); // Reload to update stock
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
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Sản Phẩm</h2>

        <DataTable
            :value="products"
            :paginator="true"
            :rows="10"
            dataKey="product_id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['product_name']"
            showGridlines
            style="width: 100%"
            tableStyle="min-width: 60rem"
            scrollable
            scrollHeight="500px"
        >
            <template #header>
                <div class="flex justify-between items-center gap-4">
                    <!-- Dropdown lọc trạng thái -->
                    <MultiSelect
                        v-model="filters.status.value"
                        :options="[
                            { label: 'Hiển thị', value: '1' },
                            { label: 'Ẩn', value: '0' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Lọc trạng thái"
                        display="chip"
                        class="w-1/4"
                    />

                    <!-- Tìm kiếm global -->
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm..." class="border p-1 rounded w-1/4" />
                </div>
            </template>

            <template #empty> Không có sản phẩm nào. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- Hình ảnh -->
            <Column header="Hình ảnh" style="min-width: 8rem">
                <template #body="{ data }">
                    <div class="w-16 h-16 flex items-center justify-center rounded shadow">
                        <img :src="data.thumbnail" class="max-h-full max-w-full object-contain p-2" />
                    </div>
                </template>
            </Column>

            <!-- Tên sản phẩm -->
            <Column field="product_name" header="Tên sản phẩm" sortable>
                <template #body="{ data }">{{ data.product_name }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm tên sản phẩm" />
                </template>
            </Column>

            <!-- Tồn kho -->
            <Column field="stock_quantity" header="Tồn kho" sortable>
                <template #body="{ data }">{{ formatNumber(data.stock_quantity) }}</template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Tồn kho" />
                </template>
            </Column>

            <!-- Đã bán -->
            <Column field="sold" header="Đã bán" sortable>
                <template #body="{ data }">{{ formatNumber(data.sold) }}</template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Đã bán" />
                </template>
            </Column>

            <!-- Lượt xem -->
            <Column field="view" header="Lượt xem" sortable>
                <template #body="{ data }">{{ formatNumber(data.view) }}</template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Lượt xem" />
                </template>
            </Column>

            <!-- Trạng thái -->
            <Column field="status" header="Trạng thái" sortable>
                <template #body="{ data }">
                    <Tag :value="Number(data.status) === 1 ? 'Hiển thị' : 'Ẩn'" :severity="Number(data.status) === 1 ? 'success' : 'danger'" />
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect
                        v-model="filterModel.value"
                        :options="[
                            { label: 'Hiển thị', value: 1 },
                            { label: 'Ẩn', value: 0 }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn trạng thái"
                        display="chip"
                        class="w-full"
                    />
                </template>
            </Column>

            <!-- Hành động -->
            <!-- Hành động -->
            <Column header="Hành động" style="min-width: 16rem">
                <template #body="{ data }">
                    <div class="flex gap-1">
                        <!-- Chi tiết -->
                        <Button icon="pi pi-search" text severity="info" v-tooltip.top="'Chi tiết'" @click="router.push(`/Product/Detail/${data.product_id}`)" />
                        <!-- Sửa -->
                        <Button icon="pi pi-pencil" text severity="primary" v-tooltip.top="'Sửa'" @click="router.push(`/Product/Edit_Product/${data.product_id}`)" />
                        <!-- Nhập kho -->
                        <Button icon="pi pi-download" text severity="success" v-tooltip.top="'Nhập kho'" @click="openImportDialog(data)" />
                        <!-- Xuất kho -->
                        <Button icon="pi pi-upload" text severity="warning" v-tooltip.top="'Xuất kho'" @click="openExportDialog(data)" />
                        <!-- Xóa -->
                        <Button icon="pi pi-trash" text severity="danger" v-tooltip.top="'Xóa'" @click="deleteProduct(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Import Dialog -->
        <Dialog v-model:visible="showImportDialog" modal header="Nhập Kho" :style="{ width: '500px' }">
            <div v-if="selectedProductForAction" class="flex flex-col gap-4">
                <!-- Product Info -->
                <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <div class="flex items-center gap-3">
                        <img :src="selectedProductForAction.thumbnail" class="w-16 h-16 object-contain rounded border" />
                        <div>
                            <p class="font-semibold">{{ selectedProductForAction.product_name }}</p>
                            <p class="text-sm text-gray-500">SKU: {{ selectedProductForAction.sku || '-' }}</p>
                            <p class="text-sm">
                                Tồn kho hiện tại: <span class="font-semibold">{{ formatNumber(selectedProductForAction.stock_quantity || 0) }}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Quantity -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Số lượng nhập <span class="text-red-500">*</span></label>
                    <InputNumber v-model="importFormData.quantity" :min="1" showButtons class="w-full" />
                </div>

                <!-- Import Price -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Giá nhập (VNĐ)</label>
                    <InputNumber v-model="importFormData.import_price" :min="0" mode="currency" currency="VND" locale="vi-VN" class="w-full" />
                </div>

                <!-- Supplier -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Nhà cung cấp</label>
                    <InputText v-model="importFormData.supplier_name" placeholder="Nhập tên nhà cung cấp" class="w-full" />
                </div>

                <!-- Import Type -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Loại nhập kho</label>
                    <Dropdown v-model="importFormData.import_type" :options="importTypes" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <!-- After import preview -->
                <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p class="text-sm">
                        Sau khi nhập: <span class="font-semibold text-green-600">{{ formatNumber((parseInt(selectedProductForAction.stock_quantity) || 0) + importFormData.quantity) }}</span>
                    </p>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" severity="secondary" @click="showImportDialog = false" />
                <Button label="Nhập kho" icon="pi pi-check" :loading="submitting" @click="submitImport" />
            </template>
        </Dialog>

        <!-- Export Dialog -->
        <Dialog v-model:visible="showExportDialog" modal header="Xuất Kho" :style="{ width: '500px' }">
            <div v-if="selectedProductForAction" class="flex flex-col gap-4">
                <!-- Product Info -->
                <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <div class="flex items-center gap-3">
                        <img :src="selectedProductForAction.thumbnail" class="w-16 h-16 object-contain rounded border" />
                        <div>
                            <p class="font-semibold">{{ selectedProductForAction.product_name }}</p>
                            <p class="text-sm text-gray-500">SKU: {{ selectedProductForAction.sku || '-' }}</p>
                            <p class="text-sm">
                                Tồn kho hiện tại: <span class="font-semibold">{{ formatNumber(selectedProductForAction.stock_quantity || 0) }}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Quantity -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Số lượng xuất <span class="text-red-500">*</span></label>
                    <InputNumber v-model="exportFormData.quantity" :min="1" :max="parseInt(selectedProductForAction.stock_quantity) || 9999" showButtons class="w-full" />
                    <small v-if="exportFormData.quantity > (parseInt(selectedProductForAction.stock_quantity) || 0)" class="text-red-500"> Số lượng xuất vượt quá tồn kho hiện có! </small>
                </div>

                <!-- Export Type -->
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Loại xuất kho</label>
                    <Dropdown v-model="exportFormData.export_type" :options="exportTypes" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <!-- Reference ID - Only show for sale type -->
                <div v-if="exportFormData.export_type === 'sale'" class="flex flex-col gap-2">
                    <label class="font-medium">Mã đơn hàng</label>
                    <Dropdown
                        v-model="exportFormData.order_code"
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

                <!-- After export preview -->
                <div class="p-3 rounded-lg" :class="(parseInt(selectedProductForAction.stock_quantity) || 0) - exportFormData.quantity <= 10 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'">
                    <p class="text-sm">
                        Sau khi xuất:
                        <span class="font-semibold" :class="(parseInt(selectedProductForAction.stock_quantity) || 0) - exportFormData.quantity <= 10 ? 'text-red-600' : 'text-green-600'">
                            {{ formatNumber(Math.max(0, (parseInt(selectedProductForAction.stock_quantity) || 0) - exportFormData.quantity)) }}
                        </span>
                    </p>
                </div>
            </div>

            <template #footer>
                <Button label="Hủy" severity="secondary" @click="showExportDialog = false" />
                <Button label="Xuất kho" icon="pi pi-check" severity="danger" :loading="submitting" @click="submitExport" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped lang="scss">
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
