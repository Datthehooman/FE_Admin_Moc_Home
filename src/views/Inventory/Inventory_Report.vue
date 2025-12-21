<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

const inventoryReport = ref([]);
const filters = ref(null);
const loading = ref(true);

// Load báo cáo tồn kho
onBeforeMount(async () => {
    await loadInventoryReport();
});

async function loadInventoryReport(status = null) {
    loading.value = true;
    try {
        const params = status ? { status } : {};
        const response = await apiClient.get('/inventory/report', { params });
        inventoryReport.value = response.data?.result?.data || response.data?.data || [];
    } catch (err) {
        console.error('Lỗi tải báo cáo kho:', err);
        inventoryReport.value = [];
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
        stock: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Lấy màu tag dựa vào trạng thái
function getStatusSeverity(status) {
    switch (status) {
        case 'out_of_stock':
            return 'danger';
        case 'low_stock':
            return 'warn';
        case 'normal':
            return 'success';
        default:
            return 'secondary';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'out_of_stock':
            return 'Hết hàng';
        case 'low_stock':
            return 'Tồn kho thấp';
        case 'normal':
            return 'Bình thường';
        default:
            return status;
    }
}

// Xem báo cáo tồn kho thấp
function filterLowStock() {
    loadInventoryReport('low_stock');
}

// Xem toàn bộ báo cáo
function clearFilter() {
    loadInventoryReport();
}
</script>

<template>
    <div class="card flex-1">
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-xl">Báo Cáo Tồn Kho</h2>
            <div class="flex gap-2">
                <Button label="Tồn kho thấp" icon="pi pi-exclamation-triangle" severity="warn" @click="filterLowStock" />
                <Button label="Xem tất cả" icon="pi pi-list" severity="secondary" @click="clearFilter" />
            </div>
        </div>

        <DataTable
            :value="inventoryReport"
            :paginator="true"
            :rows="10"
            dataKey="product_id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['product_name', 'sku']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 60rem"
        >
            <template #header>
                <div class="flex justify-end">
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm sản phẩm..." class="border p-1 rounded w-1/4" />
                </div>
            </template>

            <template #empty> Không có dữ liệu tồn kho. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- ID -->
            <Column field="product_id" header="ID" sortable style="width: 80px">
                <template #body="{ data }">{{ data.product_id }}</template>
            </Column>

            <!-- Tên sản phẩm -->
            <Column field="product_name" header="Tên sản phẩm" sortable>
                <template #body="{ data }">{{ data.product_name }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm tên sản phẩm" />
                </template>
            </Column>

            <!-- SKU -->
            <Column field="sku" header="SKU" sortable>
                <template #body="{ data }">{{ data.sku }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm SKU" />
                </template>
            </Column>

            <!-- Tồn kho -->
            <Column field="stock" header="Tồn kho" sortable style="width: 120px">
                <template #body="{ data }">
                    <span class="font-semibold">{{ formatNumber(data.stock) }}</span>
                </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" placeholder="Số lượng" />
                </template>
            </Column>

            <!-- Khả dụng -->
            <Column field="available" header="Khả dụng" sortable style="width: 120px">
                <template #body="{ data }">
                    <span class="font-semibold text-green-600">{{ formatNumber(data.available) }}</span>
                </template>
            </Column>

            <!-- Đã đặt -->
            <Column field="reserved_stock" header="Đã đặt" sortable style="width: 120px">
                <template #body="{ data }">
                    <span class="font-semibold text-orange-600">{{ formatNumber(data.reserved_stock) }}</span>
                </template>
            </Column>

            <!-- Tồn kho tối thiểu -->
            <Column field="min_stock" header="Tồn tối thiểu" sortable style="width: 120px">
                <template #body="{ data }">{{ formatNumber(data.min_stock) }}</template>
            </Column>

            <!-- Trạng thái -->
            <Column field="status" header="Trạng thái" sortable style="width: 150px">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped></style>
