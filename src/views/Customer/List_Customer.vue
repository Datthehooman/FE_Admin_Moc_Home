<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { onBeforeMount, ref } from 'vue';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const orders = ref([]);
const filters = ref(null);
const loading = ref(true);

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
const paymentStatuses = ['paid', 'unpaid'];

const orderStatusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
};

const paymentStatusLabels = {
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán'
};

onBeforeMount(() => {
    loadOrders();
});

async function loadOrders() {
    loading.value = true;
    try {
        const response = await apiClient.get('/order');
        orders.value = response.data?.result?.data?.data || [];
        // Convert date strings to Date objects
        orders.value.forEach((order) => {
            if (order.order_date) {
                order.order_date = new Date(order.order_date);
            }
        });
    } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
        orders.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

const updateOrderStatus = async (order, newStatus) => {
    if (!confirm(`Chuyển trạng thái đơn ${order.order_id} sang "${orderStatusLabels[newStatus]}"?`)) return;

    try {
        await apiClient.post(`/order/${order.order_id}/update-status`, {
            order_status: newStatus
        });

        order.order_status = newStatus;
        alert('✅ Cập nhật trạng thái thành công!');
    } catch (err) {
        console.error('❌ Lỗi cập nhật trạng thái:', err.response?.data || err);
        alert('❌ Không thể cập nhật trạng thái!');
    }
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        order_code: { value: null, matchMode: FilterMatchMode.CONTAINS },
        customer_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        order_date: { value: null, matchMode: FilterMatchMode.DATE_IS },
        total_amount: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
        order_status: { value: null, matchMode: FilterMatchMode.EQUALS },
        payment_status: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

function formatNumber(val) {
    if (!val) return '0';
    return Number(val).toLocaleString('vi-VN');
}

function formatDate(v) {
    return new Date(v).toLocaleDateString('vi-VN');
}

function clearFilter() {
    initFilters();
}

function getStatusLabel(status) {
    return orderStatusLabels[status] || status;
}

function getStatusSeverity(status) {
    const severityMap = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'help',
        shipping: 'primary',
        completed: 'success',
        cancelled: 'danger'
    };
    return severityMap[status] || 'secondary';
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
            :filters="filters"
            :globalFilterFields="['order_code', 'customer_name', 'customer_phone']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 70rem"
            sortMode="multiple"
            :removableSort="true"
        >
            <!-- HEADER -->
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm đơn hàng..." />
                    </IconField>
                </div>
            </template>

            <template #empty>Không có đơn hàng nào.</template>
            <template #loading>Đang tải dữ liệu...</template>

            <!-- Mã đơn -->
            <Column field="order_code" header="Mã Đơn" style="min-width: 10rem" sortable>
                <template #body="{ data }">
                    {{ data.order_code }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo mã..." />
                </template>
            </Column>

            <!-- Khách hàng -->
            <Column header="Khách hàng" style="min-width: 14rem" sortable sortField="customer_name" filterField="customer_name">
                <template #body="{ data }">
                    <div>
                        <div class="font-semibold">{{ data.customer_name }}</div>
                        <div class="text-sm opacity-70">{{ data.customer_phone }}</div>
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm tên khách..." />
                </template>
                <template #filterclear="{ filterCallback }">
                    <Button type="button" icon="pi pi-times" @click="filterCallback()" severity="secondary" />
                </template>
                <template #filterapply="{ filterCallback }">
                    <Button type="button" icon="pi pi-check" @click="filterCallback()" severity="success" />
                </template>
            </Column>

            <!-- Ngày đặt -->
            <Column header="Ngày đặt" style="min-width: 10rem" field="order_date" sortable dataType="date" filterField="order_date">
                <template #body="{ data }">
                    {{ formatDate(data.order_date) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
                </template>
            </Column>

            <!-- Tổng tiền -->
            <Column header="Tổng tiền" style="min-width: 10rem" field="total_amount" sortable dataType="numeric" filterField="total_amount">
                <template #body="{ data }"> {{ formatNumber(data.total_amount) }}₫ </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="decimal" :useGrouping="false" placeholder="Tìm theo tiền" />
                </template>
            </Column>

            <!-- Trạng thái -->
            <Column header="Trạng thái" style="min-width: 12rem" field="order_status" sortable filterField="order_status">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.order_status)" :severity="getStatusSeverity(data.order_status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="orderStatuses" placeholder="Chọn trạng thái" showClear>
                        <template #value="{ value }">
                            <span v-if="value">{{ getStatusLabel(value) }}</span>
                            <span v-else class="text-gray-400">Chọn trạng thái</span>
                        </template>
                        <template #option="{ option }">
                            {{ getStatusLabel(option) }}
                        </template>
                    </Dropdown>
                </template>
            </Column>

            <!-- Thanh toán -->
            <Column header="Thanh toán" style="min-width: 12rem" field="payment_status" sortable filterField="payment_status">
                <template #body="{ data }">
                    <Tag :value="paymentStatusLabels[data.payment_status]" :severity="data.payment_status === 'paid' ? 'success' : 'danger'" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="paymentStatuses" placeholder="Chọn trạng thái" showClear>
                        <template #value="{ value }">
                            <span v-if="value">{{ paymentStatusLabels[value] }}</span>
                            <span v-else class="text-gray-400">Chọn trạng thái</span>
                        </template>
                        <template #option="{ option }">
                            {{ paymentStatusLabels[option] }}
                        </template>
                    </Dropdown>
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
            <Column header="Hành động" style="min-width: 12rem" :sortable="false">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-eye" text severity="info" @click="router.push(`/Order/Detail_Order/${data.order_id}`)" />
                        <Dropdown :options="orderStatuses" v-model="data.order_status" @change="updateOrderStatus(data, data.order_status)" class="w-full">
                            <template #value="{ value }">
                                <span>{{ getStatusLabel(value) }}</span>
                            </template>
                            <template #option="{ option }">
                                {{ getStatusLabel(option) }}
                            </template>
                        </Dropdown>
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
