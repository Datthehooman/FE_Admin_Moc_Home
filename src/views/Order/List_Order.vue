<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const orders = ref([]);
const filters = ref(null);
const loading = ref(true);

onBeforeMount(() => {
    loadOrders();
});

async function loadOrders() {
    loading.value = true;
    try {
        const response = await apiClient.get('/order');
        orders.value = response.data?.result?.data || [];
    } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
        orders.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

function formatNumber(val) {
    if (!val) return '0';
    return Number(val).toLocaleString('vi-VN');
}

function formatDate(v) {
    return new Date(v).toLocaleDateString('vi-VN');
}
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Đơn Hàng</h2>

        <DataTable
            :value="orders"
            :paginator="true"
            :rows="10"
            dataKey="order_id"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :globalFilterFields="['order_code', 'customer_name', 'customer_phone']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 70rem"
        >
            <!-- HEADER -->
            <template #header>
                <div class="flex justify-between items-center">
                    <Button label="Xoá lọc" icon="pi pi-filter-slash" outlined @click="initFilters()" />
                    <IconField>
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm đơn hàng..." />
                    </IconField>
                </div>
            </template>

            <template #empty> Không có đơn hàng nào. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- Mã đơn -->
            <Column field="order_code" header="Mã Đơn" style="min-width: 10rem" />

            <!-- Khách hàng -->
            <Column header="Khách hàng" style="min-width: 12rem">
                <template #body="{ data }">
                    <div>
                        <div class="font-semibold">{{ data.customer_name }}</div>
                        <div class="text-sm opacity-70">{{ data.customer_phone }}</div>
                    </div>
                </template>
            </Column>

            <!-- Ngày đặt -->
            <Column header="Ngày đặt" style="min-width: 8rem">
                <template #body="{ data }">
                    {{ formatDate(data.order_date) }}
                </template>
            </Column>

            <!-- Tổng tiền -->
            <Column header="Tổng tiền" style="min-width: 10rem">
                <template #body="{ data }"> {{ formatNumber(data.total_amount) }}₫ </template>
            </Column>

            <!-- Trạng thái -->
            <Column header="Trạng thái" style="min-width: 10rem">
                <template #body="{ data }">
                    <Tag :value="data.order_status" :severity="data.order_status === 'pending' ? 'warning' : data.order_status === 'completed' ? 'success' : 'danger'" />
                </template>
            </Column>

            <!-- Thanh toán -->
            <Column header="Thanh toán" style="min-width: 10rem">
                <template #body="{ data }">
                    <Tag :value="data.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'" :severity="data.payment_status === 'paid' ? 'success' : 'danger'" />
                </template>
            </Column>

            <!-- Địa chỉ -->
            <Column header="Địa chỉ giao hàng" style="min-width: 18rem">
                <template #body="{ data }">
                    <div style="white-space: normal; word-break: break-word">
                        {{ data.shipping_address }}
                    </div>
                </template>
            </Column>

            <!-- Hành động -->
            <Column header="Hành động" style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" text severity="info" @click="router.push(`/Order/Order_Detail/${data.order_id}`)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-scrollable .p-datatable-thead > tr > th),
:deep(.p-datatable-scrollable .p-datatable-tbody > tr > td) {
    white-space: nowrap;
}

.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
