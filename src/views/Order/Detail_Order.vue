<script setup>
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Column from 'primevue/column';
import ConfirmPopup from 'primevue/confirmpopup';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

// TOAST
const toast = useToast();
const confirm = useConfirm();

// ROUTER
const route = useRoute();
const orderId = route.params.id;

// DATA
const order = ref(null);
const loading = ref(true);

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];

// Order Status Labels
const orderStatusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ'
};

// Payment Status Labels
const paymentStatusLabels = {
    unpaid: 'Chưa thanh toán',
    pending: 'Đang chờ thanh toán',
    paid: 'Đã thanh toán',
    partially_paid: 'Thanh toán một phần',
    refunded: 'Đã hoàn tiền',
    awaiting_deposit: 'Đang đợi xử lý đặt cọc',
    awaiting_vnpay_response: 'Chờ phản hồi VNPay'
};

// Get order status label
function getOrderStatusLabel(status) {
    return orderStatusLabels[status] || status;
}

// Get payment status label
function getPaymentStatusLabel(status) {
    return paymentStatusLabels[status] || status;
}

// Get order status severity
function getOrderStatusSeverity(status) {
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

// Get payment status severity
function getPaymentStatusSeverity(status) {
    const severityMap = {
        unpaid: 'danger',
        pending: 'warning',
        paid: 'success',
        partially_paid: 'info',
        refunded: 'warning',
        awaiting_deposit: 'warning',
        awaiting_vnpay_response: 'info'
    };
    return severityMap[status] || 'secondary';
}

// LOAD ORDER DETAIL
async function loadOrderDetail() {
    try {
        const res = await apiClient.get(`/order/${orderId}`);
        order.value = res.data?.result?.data;
    } catch (e) {
        console.error('Lỗi load order:', e);
    } finally {
        loading.value = false;
    }
}

onMounted(() => loadOrderDetail());

// FORMAT NUMBER
const formatNumber = (n) => Number(n).toLocaleString('vi-VN');

// UPDATE STATUS
const updateStatus = async (newStatus, event) => {
    confirm.require({
        target: event.currentTarget,
        message: `Chuyển trạng thái sang "${getOrderStatusLabel(newStatus)}"?`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Huỷ',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Xác nhận'
        },
        accept: async () => {
            try {
                await apiClient.post(`/order/${orderId}/update-status`, {
                    order_status: newStatus
                });

                order.value.order_status = newStatus;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật trạng thái thành công!',
                    life: 3000
                });
            } catch (err) {
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Lỗi cập nhật trạng thái!',
                    life: 3000
                });
            }
        },
        reject: () => {
            // User rejected, do nothing
        }
    });
};
</script>

<template>
    <div class="p-4" v-if="order">
        <ConfirmPopup></ConfirmPopup>
        <h2 class="text-2xl font-semibold mb-4">Chi tiết đơn hàng #{{ order.order_id }}</h2>

        <!-- ORDER STATUS + DROPDOWN -->
        <Card class="mb-4">
            <template #title>Trạng thái đơn hàng</template>
            <template #content>
                <div class="flex items-center gap-4">
                    <Tag :value="getOrderStatusLabel(order.order_status)" :severity="getOrderStatusSeverity(order.order_status)" />

                    <Dropdown :options="orderStatuses" v-model="order.order_status" class="capitalize w-56" @change="(e) => updateStatus(order.order_status, e)">
                        <template #value="{ value }">
                            <span>{{ getOrderStatusLabel(value) }}</span>
                        </template>
                        <template #option="{ option }">
                            {{ getOrderStatusLabel(option) }}
                        </template>
                    </Dropdown>
                </div>
            </template>
        </Card>

        <!-- CUSTOMER INFO -->
        <Card class="mb-4">
            <template #title>Thông tin khách hàng</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div><strong>Tên khách:</strong> {{ order.customer_name }}</div>
                    <div><strong>SĐT:</strong> {{ order.customer_phone }}</div>
                    <div><strong>Email:</strong> {{ order.customer_email }}</div>
                    <div><strong>Địa chỉ giao:</strong> {{ order.shipping_address }}</div>
                </div>
            </template>
        </Card>

        <!-- ORDER INFO -->
        <Card class="mb-4">
            <template #title>Thông tin đơn hàng</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Ngày đặt:</strong>
                        {{ new Date(order.order_date).toLocaleDateString('vi-VN') }}
                    </div>
                    <div><strong>Ghi chú:</strong> {{ order.note || 'Không có' }}</div>
                    <div>
                        <strong>Thanh toán:</strong>
                        <Tag :value="getPaymentStatusLabel(order.payment_status)" :severity="getPaymentStatusSeverity(order.payment_status)" class="ml-2" />
                    </div>
                    <div><strong>Voucher:</strong> {{ order.voucher_id ?? 'Không sử dụng' }}</div>
                </div>
            </template>
        </Card>

        <!-- PRODUCT TABLE -->
        <Card>
            <template #title>Sản phẩm</template>
            <template #content>
                <DataTable :value="order.system_order_detail" showGridlines tableStyle="min-width: 50rem">
                    <Column header="Ảnh" style="width: 90px">
                        <template #body="{ data }">
                            <img :src="data.product.thumbnail" class="w-16 h-16 object-cover rounded" />
                        </template>
                    </Column>

                    <Column header="Sản phẩm">
                        <template #body="{ data }">
                            <div class="font-semibold">
                                {{ data.product.product_name }}
                            </div>
                            <div class="text-sm text-gray-500">SKU: {{ data.product.sku }}</div>
                        </template>
                    </Column>

                    <Column header="Số lượng" field="quantity" style="width: 100px"></Column>

                    <Column header="Giá" style="width: 140px">
                        <template #body="{ data }"> {{ formatNumber(data.price) }}₫ </template>
                    </Column>

                    <Column header="Tổng" style="width: 160px">
                        <template #body="{ data }">
                            <strong>{{ formatNumber(data.subtotal) }}₫</strong>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- TOTAL SUMMARY -->
        <div class="text-right mt-6 text-xl font-semibold">Tổng tiền: {{ formatNumber(order.total_amount) }}₫</div>
    </div>

    <div v-else class="p-4 text-center">Đang tải...</div>
</template>

<style scoped>
.capitalize {
    text-transform: capitalize;
}
</style>
