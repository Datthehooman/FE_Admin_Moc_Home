<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const lowStockItems = ref([]);
const filters = ref(null);
const loading = ref(true);

// Load danh sách tồn kho thấp
onBeforeMount(async () => {
    await loadLowStockAlert();
});

async function loadLowStockAlert() {
    loading.value = true;
    try {
        const response = await apiClient.get('/inventory/low-stock-alert');
        lowStockItems.value = response.data?.result?.data || response.data?.data || [];
    } catch (err) {
        console.error('Lỗi tải cảnh báo tồn kho thấp:', err);
        lowStockItems.value = [];
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
        sku: { value: null, matchMode: FilterMatchMode.CONTAINS },
        current_stock: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Lấy màu tag dựa vào mức tồn kho
function getStockSeverity(stock) {
    if (stock <= 0) return 'danger';
    if (stock <= 5) return 'danger';
    if (stock <= 10) return 'warn';
    return 'success';
}

function getStockLabel(stock) {
    if (stock <= 0) return 'Hết hàng';
    if (stock <= 5) return 'Rất thấp';
    if (stock <= 10) return 'Thấp';
    return 'Bình thường';
}

// Chuyển đến trang nhập kho
function goToImport(productId) {
    router.push({ name: 'Inventory_Import', query: { product_id: productId } });
}
</script>

<template>
    <div class="card flex-1">
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-xl">
                <i class="pi pi-exclamation-triangle text-yellow-500 mr-2"></i>
                Cảnh Báo Tồn Kho Thấp
            </h2>
            <Button label="Làm mới" icon="pi pi-refresh" severity="secondary" @click="loadLowStockAlert" />
        </div>

        <DataTable
            :value="lowStockItems"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['product_name', 'sku']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 50rem"
        >
            <template #header>
                <div class="flex justify-end">
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm sản phẩm..." class="border p-1 rounded w-1/4" />
                </div>
            </template>

            <template #empty>
                <div class="text-center py-4">
                    <i class="pi pi-check-circle text-green-500 text-4xl mb-2"></i>
                    <p>Không có sản phẩm nào tồn kho thấp!</p>
                </div>
            </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- ID -->
            <Column field="id" header="ID" sortable style="width: 80px">
                <template #body="{ data }">{{ data.id }}</template>
            </Column>

            <!-- Tên sản phẩm -->
            <Column field="product_name" header="Tên sản phẩm" sortable>
                <template #body="{ data }">
                    <span class="font-semibold">{{ data.product_name }}</span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm tên sản phẩm" />
                </template>
            </Column>

            <!-- SKU -->
            <Column field="sku" header="SKU" sortable>
                <template #body="{ data }">{{ data.sku }}</template>
            </Column>

            <!-- Tồn kho hiện tại -->
            <Column field="current_stock" header="Tồn kho hiện tại" sortable>
                <template #body="{ data }">
                    <Tag :value="formatNumber(data.current_stock)" :severity="getStockSeverity(data.current_stock)" />
                </template>
            </Column>

            <!-- Mức tồn kho tối thiểu -->
            <Column field="min_stock" header="Tồn kho tối thiểu" sortable>
                <template #body="{ data }">{{ formatNumber(data.min_stock || 10) }}</template>
            </Column>

            <!-- Trạng thái -->
            <Column field="status" header="Trạng thái" sortable style="width: 120px">
                <template #body="{ data }">
                    <Tag :value="getStockLabel(data.current_stock)" :severity="getStockSeverity(data.current_stock)" />
                </template>
            </Column>

            <!-- Hành động -->
            <Column header="Hành động" style="width: 150px">
                <template #body="{ data }">
                    <Button label="Nhập kho" icon="pi pi-file-import" severity="success" size="small" @click="goToImport(data.product_id || data.id)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped></style>
