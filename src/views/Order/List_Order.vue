<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const orders = ref([]);
const filters = ref(null);
const loading = ref(true);

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];

onBeforeMount(() => {
    loadOrders();
});

async function loadOrders() {
    loading.value = true;
    try {
        const response = await apiClient.get('/order');
        orders.value = response.data?.result?.data?.data || [];
    } catch (err) {
        console.error('Lỗi tải đơn hàng:', err);
        orders.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

const updateOrderStatus = async (order, newStatus) => {
    if (!confirm(`Chuyển trạng thái đơn ${order.order_id} sang "${newStatus}"?`)) return;

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
        order_status: { value: [], matchMode: FilterMatchMode.IN }
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
        :loading="loading"
        :globalFilterFields="['order_code','customer_name','customer_phone']"
        showGridlines
        scrollable
        scrollHeight="500px"
        rowHover
        tableStyle="min-width: 70rem"
    >
        <!-- Header với MultiSelect lọc trạng thái -->
        <template #header>
            <div class="flex justify-between items-center gap-4">
                <MultiSelect
                    v-model="filters.order_status.value"
                    :options="orderStatuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Lọc trạng thái"
                    display="chip"
                    class="w-1/4"
                    :showSelectAll="true"
                    metaKeySelection="false"
                />

                <InputText
                    v-model="filters.global.value"
                    placeholder="Tìm kiếm đơn hàng..."
                    class="border p-1 rounded w-1/4"
                />
            </div>
        </template>

        <template #empty> Không có đơn hàng nào. </template>
        <template #loading> Đang tải dữ liệu...</template>

        <!-- Mã đơn -->
        <Column field="order_code" header="Mã Đơn" style="min-width: 10rem" sortable>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" placeholder="Tìm kiếm mã đơn" />
            </template>
        </Column>

        <!-- Khách hàng -->
        <Column field="customer_name" header="Khách hàng" style="min-width: 12rem" sortable>
            <template #body="{ data }">
                <div>
                    <div class="font-semibold">{{ data.customer_name }}</div>
                    <div class="text-sm opacity-70">{{ data.customer_phone }}</div>
                </div>
            </template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" placeholder="Tìm theo tên" />
            </template>
        </Column>

        <!-- Ngày đặt -->
        <Column field="order_date" header="Ngày đặt" style="min-width: 8rem" sortable>
            <template #body="{ data }">{{ formatDate(data.order_date) }}</template>
        </Column>

        <!-- Tổng tiền -->
        <Column field="total_amount" header="Tổng tiền" style="min-width: 10rem" sortable>
            <template #body="{ data }">{{ formatNumber(data.total_amount) }}₫</template>
        </Column>

        <!-- Trạng thái -->
        <Column field="order_status" header="Trạng thái" style="min-width: 10rem" sortable>
            <template #body="{ data }">
                <Tag
                    :value="data.order_status"
                    :severity="
                        data.order_status === 'pending'
                            ? 'warning'
                            : data.order_status === 'confirmed'
                              ? 'info'
                              : data.order_status === 'processing'
                                ? 'help'
                                : data.order_status === 'shipping'
                                  ? 'primary'
                                  : data.order_status === 'completed'
                                    ? 'success'
                                    : 'danger'
                    "
                    class="capitalize"
                />
            </template>
            <template #filter="{ filterModel }">
                <MultiSelect
                    v-model="filterModel.value"
                    :options="orderStatuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Chọn trạng thái"
                    display="chip"
                    class="w-full"
                    :showSelectAll="true"
                    metaKeySelection="false"
                />
            </template>
        </Column>

        <!-- Thanh toán -->
        <Column field="payment_status" header="Thanh toán" style="min-width: 10rem" sortable>
            <template #body="{ data }">
                <Tag :value="data.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'"
                     :severity="data.payment_status === 'paid' ? 'success' : 'danger'" />
            </template>
            <template #filter="{ filterModel }">
                <MultiSelect
                    v-model="filterModel.value"
                    :options="[ { label: 'Đã thanh toán', value: 'paid' }, { label: 'Chưa thanh toán', value: 'unpaid' } ]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Chọn trạng thái thanh toán"
                    display="chip"
                    class="w-full"
                    :showSelectAll="true"
                    metaKeySelection="false"
                />
            </template>
        </Column>

        <!-- Địa chỉ -->
        <Column field="shipping_address" header="Địa chỉ giao hàng" style="min-width: 18rem" sortable>
            <template #body="{ data }">
                <div style="white-space: normal; word-break: break-word">
                    {{ data.shipping_address }}
                </div>
            </template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" placeholder="Tìm theo địa chỉ" />
            </template>
        </Column>

        <!-- Hành động -->
        <Column header="Hành động" style="min-width: 12rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button icon="pi pi-eye" text severity="info" @click="router.push(`/Order/Detail_Order/${data.order_id}`)" />
                    <MultiSelect
                        v-model="data.order_status"
                        :options="orderStatuses.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))"
                        @change="updateOrderStatus(data, data.order_status)"
                        class="w-full"
                        display="chip"
                        :showSelectAll="false"
                        metaKeySelection="false"
                    />
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
