<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

// ROUTER
const route = useRoute();
const userId = route.params.id;

// DATA
const customer = ref(null);
const loading = ref(true);

const userStatuses = ['0', '1'];

const userStatusLabels = {
    '0': 'Inactive',
    '1': 'Active'
};

// LOAD CUSTOMER DETAIL
async function loadCustomerDetail() {
    try {
        const res = await apiClient.get(`/customer/${userId}`);
        customer.value = res.data?.result?.data;
    } catch (e) {
        console.error('Lỗi load khách hàng:', e);
    } finally {
        loading.value = false;
    }
}

onMounted(() => loadCustomerDetail());

// FORMAT NUMBER
const formatNumber = (n) => Number(n).toLocaleString('vi-VN');

// UPDATE STATUS
const updateStatus = async (newStatus) => {
    if (!confirm(`Thay đổi trạng thái khách hàng sang "${userStatusLabels[newStatus]}"?`)) return;

    try {
        await apiClient.post(`/customer/${userId}/update-status`, {
            status: newStatus
        });

        customer.value.status = newStatus;
        alert('✅ Cập nhật trạng thái thành công!');
    } catch (err) {
        alert('❌ Lỗi cập nhật trạng thái!');
    }
};

function formatDate(v) {
    return new Date(v).toLocaleDateString('vi-VN');
}

function getStatusLabel(status) {
    return userStatusLabels[status] || status;
}

function getStatusSeverity(status) {
    const severityMap = {
        '0': 'danger',
        '1': 'success'
    };
    return severityMap[status] || 'secondary';
}
</script>

<template>
    <div class="p-4" v-if="customer">
        <h2 class="text-2xl font-semibold mb-4">Chi tiết khách hàng #{{ customer.user_id }}</h2>

        <!-- STATUS + DROPDOWN -->
        <Card class="mb-4">
            <template #title>Trạng thái khách hàng</template>
            <template #content>
                <div class="flex items-center gap-4">
                    <Tag :value="getStatusLabel(customer.status)" :severity="getStatusSeverity(customer.status)" class="capitalize" />

                    <Dropdown :options="userStatuses" v-model="customer.status" class="capitalize w-56" @change="updateStatus(customer.status)" />
                </div>
            </template>
        </Card>

        <!-- CUSTOMER INFO -->
        <Card class="mb-4">
            <template #title>Thông tin khách hàng</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div><strong>Tên khách:</strong> {{ customer.full_name }}</div>
                    <div><strong>SĐT:</strong> {{ customer.phone || 'Chưa cập nhật' }}</div>
                    <div><strong>Email:</strong> {{ customer.email }}</div>
                    <div><strong>Địa chỉ:</strong> {{ customer.address || 'Chưa cập nhật' }}</div>
                </div>
            </template>
        </Card>

        <!-- ACCOUNT INFO -->
        <Card class="mb-4">
            <template #title>Thông tin tài khoản</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Ngày tạo:</strong>
                        {{ formatDate(customer.created_at) }}
                    </div>
                    <div><strong>Vai trò:</strong> {{ customer.role }}</div>
                    <div><strong>Google ID:</strong> {{ customer.google_id || 'N/A' }}</div>
                    <div><strong>Cập nhật lần cuối:</strong> {{ formatDate(customer.updated_at) }}</div>
                </div>
            </template>
        </Card>

        <!-- STATISTICS -->
        <Card class="mb-4">
            <template #title>Thống kê</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Tổng đơn hàng:</strong>
                        <span class="text-xl font-semibold text-primary">{{ customer.total_orders }}</span>
                    </div>
                    <div>
                        <strong>Đơn hàng thành công:</strong>
                        <span class="text-xl font-semibold text-success">{{ customer.success_orders_count }}</span>
                    </div>
                    <div>
                        <strong>Đơn hàng thất bại:</strong>
                        <span class="text-xl font-semibold text-danger">{{ customer.failed_orders_count }}</span>
                    </div>
                    <div>
                        <strong>Tỷ lệ thành công:</strong>
                        <span class="text-xl font-semibold text-info">{{ (customer.success_rate * 100).toFixed(2) }}%</span>
                    </div>
                    <div>
                        <strong>Tổng giá trị:</strong>
                        <span class="text-xl font-semibold text-primary">{{ customer.lifetime_value ? formatNumber(customer.lifetime_value) + '₫' : 'N/A' }}</span>
                    </div>
                    <div>
                        <strong>Cấp độ khách hàng:</strong>
                        <Tag :value="'Level ' + customer.customer_level" severity="info" />
                    </div>
                    <div>
                        <strong>Cảnh báo rủi ro:</strong>
                        <Tag :value="customer.risk_flag ? 'Có' : 'Không'" :severity="customer.risk_flag ? 'danger' : 'success'" />
                    </div>
                    <div>
                        <strong>Danh sách đen:</strong>
                        <Tag :value="customer.is_blacklisted ? 'Có' : 'Không'" :severity="customer.is_blacklisted ? 'danger' : 'success'" />
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <div v-else class="p-4 text-center">Đang tải...</div>
</template>

<style scoped>
.capitalize {
    text-transform: capitalize;
}

:deep(.p-tag) {
    margin-right: 0.5rem;
}

:deep(.text-primary) {
    color: #3b82f6;
}

:deep(.text-success) {
    color: #10b981;
}

:deep(.text-danger) {
    color: #ef4444;
}

:deep(.text-info) {
    color: #0ea5e9;
}
</style>
