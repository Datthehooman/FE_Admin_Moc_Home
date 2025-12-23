<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

const router = useRouter();

const transactions = ref([]);
const filters = ref(null);
const loading = ref(true);

// Filter states
const selectedType = ref(null);
const fromDate = ref(null);
const toDate = ref(null);

const transactionTypes = ref([
    { label: 'Tất cả', value: null },
    { label: 'Nhập kho', value: 'import' },
    { label: 'Xuất kho', value: 'export' },
    { label: 'Điều chỉnh', value: 'adjust' }
]);

// Load lịch sử giao dịch kho
onBeforeMount(async () => {
    await loadTransactions();
});

async function loadTransactions() {
    loading.value = true;
    try {
        const params = {};
        if (selectedType.value) params.type = selectedType.value;
        if (fromDate.value) params.from_date = formatDateForApi(fromDate.value);
        if (toDate.value) params.to_date = formatDateForApi(toDate.value);

        const response = await apiClient.get('/inventory/transactions', { params });
        transactions.value = response.data?.result?.data || response.data?.data || [];
    } catch (err) {
        console.error('Lỗi tải lịch sử kho:', err);
        transactions.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Format date for API (YYYY-MM-DD)
function formatDateForApi(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Khởi tạo filter cho từng cột
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        product_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        type: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Format ngày giờ
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
}

// Lấy màu tag dựa vào loại giao dịch
function getTypeSeverity(type) {
    switch (type) {
        case 'import':
            return 'success';
        case 'export':
            return 'danger';
        case 'adjust':
            return 'warn';
        default:
            return 'secondary';
    }
}

function getTypeLabel(type) {
    switch (type) {
        case 'import':
            return 'Nhập kho';
        case 'export':
            return 'Xuất kho';
        case 'adjust':
            return 'Điều chỉnh';
        default:
            return type;
    }
}

// Lọc theo loại giao dịch
function applyFilter() {
    loadTransactions();
}

// Xóa bộ lọc
function clearFilters() {
    selectedType.value = null;
    fromDate.value = null;
    toDate.value = null;
    loadTransactions();
}

// Xem chi tiết giao dịch
function viewDetail(id) {
    router.push({ name: 'Detail_Inventory_History', params: { id } });
}
</script>

<template>
    <div class="card flex-1">
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-xl">
                <i class="pi pi-history mr-2"></i>
                Lịch Sử Giao Dịch Kho
            </h2>
        </div>

        <!-- Bộ lọc -->
        <div class="flex flex-wrap gap-4 mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Loại giao dịch</label>
                <Dropdown v-model="selectedType" :options="transactionTypes" optionLabel="label" optionValue="value" placeholder="Chọn loại" class="w-48" />
            </div>

            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Từ ngày</label>
                <Calendar v-model="fromDate" dateFormat="dd/mm/yy" placeholder="Chọn ngày bắt đầu" showIcon class="w-48" />
            </div>

            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Đến ngày</label>
                <Calendar v-model="toDate" dateFormat="dd/mm/yy" placeholder="Chọn ngày kết thúc" showIcon class="w-48" />
            </div>

            <div class="flex items-end gap-2">
                <Button label="Lọc" icon="pi pi-filter" @click="applyFilter" />
                <Button label="Xóa lọc" icon="pi pi-times" severity="secondary" @click="clearFilters" />
            </div>
        </div>

        <DataTable
            :value="transactions"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['product_name', 'type']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 70rem"
        >
            <template #header>
                <div class="flex justify-end">
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm..." class="border p-1 rounded w-1/4" />
                </div>
            </template>

            <template #empty> Không có lịch sử giao dịch nào. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- ID -->
            <Column field="id" header="ID" sortable style="width: 80px">
                <template #body="{ data }">{{ data.id }}</template>
            </Column>

            <!-- Ngày giao dịch -->
            <Column field="created_at" header="Ngày giao dịch" sortable style="width: 180px">
                <template #body="{ data }">{{ formatDateTime(data.created_at) }}</template>
            </Column>

            <!-- Loại giao dịch -->
            <Column field="type" header="Loại" sortable style="width: 120px">
                <template #body="{ data }">
                    <Tag :value="getTypeLabel(data.type)" :severity="getTypeSeverity(data.type)" />
                </template>
            </Column>

            <!-- Tên sản phẩm -->
            <Column field="product_name" header="Sản phẩm" sortable>
                <template #body="{ data }">{{ data.product_name }}</template>
            </Column>

            <!-- Số lượng -->
            <Column field="quantity" header="Số lượng" sortable style="width: 120px">
                <template #body="{ data }">
                    <span :class="{ 'text-green-600': data.type === 'import', 'text-red-600': data.type === 'export' }"> {{ data.type === 'import' ? '+' : data.type === 'export' ? '-' : '' }}{{ formatNumber(data.quantity) }} </span>
                </template>
            </Column>

            <!-- Tồn kho trước -->
            <Column field="before_stock" header="Tồn trước" sortable style="width: 120px">
                <template #body="{ data }">{{ formatNumber(data.before_stock || 0) }}</template>
            </Column>

            <!-- Tồn kho sau -->
            <Column field="after_stock" header="Tồn sau" sortable style="width: 120px">
                <template #body="{ data }">{{ formatNumber(data.after_stock || 0) }}</template>
            </Column>

            <!-- Người thực hiện -->
            <Column field="created_by" header="Người thực hiện" sortable>
                <template #body="{ data }">{{ data.created_by || '-' }}</template>
            </Column>

            <!-- Hành động -->
            <Column header="Hành động" style="width: 100px" frozen alignFrozen="right">
                <template #body="{ data }">
                    <div class="flex gap-2 justify-center">
                        <Button icon="pi pi-eye" severity="info" text rounded @click="viewDetail(data.id)" v-tooltip.top="'Xem chi tiết'" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped></style>
