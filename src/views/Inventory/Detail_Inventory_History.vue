<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

// TOAST
const toast = useToast();

// ROUTER
const route = useRoute();
const router = useRouter();
const transactionId = route.params.id;

// DATA
const transaction = ref(null);
const loading = ref(true);

// LOAD TRANSACTION DETAIL
async function loadTransactionDetail() {
    try {
        const res = await apiClient.get(`/inventory/transactions/detail/${transactionId}`);
        transaction.value = res.data?.result?.data;
    } catch (e) {
        console.error('Lỗi load chi tiết giao dịch:', e);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin giao dịch', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(() => loadTransactionDetail());

// FORMAT NUMBER
const formatNumber = (n) => Number(n).toLocaleString('vi-VN');

// FORMAT DATETIME
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
}

// FORMAT CURRENCY
function formatCurrency(value) {
    if (!value) return '-';
    return Number(value).toLocaleString('vi-VN') + ' ₫';
}

// GET TYPE LABEL
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

// GET TYPE SEVERITY
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

// GET REFERENCE TYPE LABEL
function getReferenceTypeLabel(type) {
    switch (type) {
        case 'sale':
            return 'Đơn hàng bán';
        case 'purchase':
            return 'Đơn hàng mua';
        case 'adjustment':
            return 'Điều chỉnh';
        case 'return':
            return 'Hoàn trả';
        default:
            return type || '-';
    }
}

// BACK TO LIST
function goBack() {
    router.push({ name: 'Inventory_History' });
}
</script>

<template>
    <div class="p-4">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl"></i>
        </div>

        <!-- Content -->
        <div v-else-if="transaction">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold">
                    <i class="pi pi-history mr-2"></i>
                    Chi tiết giao dịch kho #{{ transaction.id }}
                </h2>
                <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
            </div>

            <!-- Transaction Info -->
            <Card class="mb-4">
                <template #title>
                    <div class="flex items-center gap-2">
                        <span>Thông tin giao dịch</span>
                        <Tag :value="getTypeLabel(transaction.type)" :severity="getTypeSeverity(transaction.type)" />
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Mã giao dịch:</strong>
                            <span class="ml-2">#{{ transaction.id }}</span>
                        </div>
                        <div>
                            <strong>Loại giao dịch:</strong>
                            <Tag :value="getTypeLabel(transaction.type)" :severity="getTypeSeverity(transaction.type)" class="ml-2" />
                        </div>
                        <div>
                            <strong>Loại tham chiếu:</strong>
                            <span class="ml-2">{{ getReferenceTypeLabel(transaction.reference_type) }}</span>
                        </div>
                        <div>
                            <strong>Ngày tạo:</strong>
                            <span class="ml-2">{{ formatDateTime(transaction.created_at) }}</span>
                        </div>
                        <div>
                            <strong>Người thực hiện:</strong>
                            <span class="ml-2">{{ transaction.created_by || '-' }}</span>
                        </div>
                        <div>
                            <strong>Lý do:</strong>
                            <span class="ml-2">{{ transaction.reason || '-' }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Product Info -->
            <Card class="mb-4" v-if="transaction.product">
                <template #title>Thông tin sản phẩm</template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Mã sản phẩm:</strong>
                            <span class="ml-2">#{{ transaction.product.id }}</span>
                        </div>
                        <div>
                            <strong>Tên sản phẩm:</strong>
                            <span class="ml-2">{{ transaction.product.name }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Stock Change Info -->
            <Card class="mb-4">
                <template #title>Thay đổi tồn kho</template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="text-center p-4 bg-surface-100 dark:bg-surface-700 rounded-lg">
                            <div class="text-sm text-surface-500 mb-1">Tồn kho trước</div>
                            <div class="text-2xl font-bold">{{ formatNumber(transaction.before_stock || 0) }}</div>
                        </div>
                        <div class="text-center p-4 rounded-lg" :class="transaction.type === 'import' ? 'bg-green-100 dark:bg-green-900' : transaction.type === 'export' ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'">
                            <div class="text-sm mb-1" :class="transaction.type === 'import' ? 'text-green-600' : transaction.type === 'export' ? 'text-red-600' : 'text-yellow-600'">Số lượng {{ getTypeLabel(transaction.type) }}</div>
                            <div class="text-2xl font-bold" :class="transaction.type === 'import' ? 'text-green-600' : transaction.type === 'export' ? 'text-red-600' : 'text-yellow-600'">
                                {{ transaction.type === 'import' ? '+' : transaction.type === 'export' ? '-' : '' }}{{ formatNumber(transaction.quantity) }}
                            </div>
                        </div>
                        <div class="text-center p-4 bg-surface-100 dark:bg-surface-700 rounded-lg">
                            <div class="text-sm text-surface-500 mb-1">Tồn kho sau</div>
                            <div class="text-2xl font-bold">{{ formatNumber(transaction.after_stock || 0) }}</div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Order Info (if export type = sale) -->
            <Card class="mb-4" v-if="transaction.order">
                <template #title>
                    <i class="pi pi-shopping-cart mr-2"></i>
                    Thông tin đơn hàng
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Mã đơn hàng:</strong>
                            <span class="ml-2">#{{ transaction.order.order_id }}</span>
                        </div>
                        <div>
                            <strong>Mã đơn:</strong>
                            <span class="ml-2 text-primary font-medium">{{ transaction.order.order_code }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Import Info (if type = import) -->
            <Card class="mb-4" v-if="transaction.import">
                <template #title>
                    <i class="pi pi-download mr-2"></i>
                    Thông tin nhập kho
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Mã nhập kho:</strong>
                            <span class="ml-2">#{{ transaction.import.id }}</span>
                        </div>
                        <div>
                            <strong>Nhà cung cấp:</strong>
                            <span class="ml-2">{{ transaction.import.supplier || '-' }}</span>
                        </div>
                        <div>
                            <strong>Giá nhập:</strong>
                            <span class="ml-2 text-primary font-medium">{{ formatCurrency(transaction.import.price) }}</span>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Export Info (if type = export) -->
            <Card class="mb-4" v-if="transaction.export">
                <template #title>
                    <i class="pi pi-upload mr-2"></i>
                    Thông tin xuất kho
                </template>
                <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <strong>Mã xuất kho:</strong>
                            <span class="ml-2">#{{ transaction.export.id }}</span>
                        </div>
                        <div>
                            <strong>Loại xuất:</strong>
                            <span class="ml-2">{{ getReferenceTypeLabel(transaction.export.export_type) }}</span>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Not Found -->
        <div v-else class="text-center py-20">
            <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
            <p class="text-lg">Không tìm thấy thông tin giao dịch</p>
            <Button label="Quay lại danh sách" icon="pi pi-arrow-left" class="mt-4" @click="goBack" />
        </div>
    </div>
</template>

<style scoped></style>
