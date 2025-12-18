<script setup>
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Button from 'primevue/button';
import Card from 'primevue/card';
import ConfirmPopup from 'primevue/confirmpopup';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

import apiClient from '@/api/axios';

// TOAST & CONFIRM
const toast = useToast();
const confirm = useConfirm();

// ROUTER
const route = useRoute();
const userId = route.params.id;

// DATA
const customer = ref(null);
const loading = ref(true);
const updatingRole = ref(false);

// ROLE OPTIONS
const userRoleLabels = {
    0: 'Customer',
    1: 'Admin',
    2: 'Potential Customer',
    3: 'VIP'
};

const userRoleOptions = [
    { label: 'Customer', value: '0' },
    { label: 'Admin', value: '1' },
    { label: 'Potential Customer', value: '2' },
    { label: 'VIP', value: '3' }
];

// LOAD CUSTOMER DETAIL
async function loadCustomerDetail() {
    try {
        const res = await apiClient.get(`/customer/${userId}`);
        customer.value = res.data?.result?.data;
    } catch (e) {
        console.error('Lỗi load khách hàng:', e);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin khách hàng', life: 3000 });
    } finally {
        loading.value = false;
    }
}

onMounted(() => loadCustomerDetail());

// FORMAT NUMBER
const formatNumber = (n) => Number(n).toLocaleString('vi-VN');

function formatDate(v) {
    return new Date(v).toLocaleDateString('vi-VN');
}

function getRoleLabel(role) {
    return userRoleLabels[role] || role;
}

function getRoleSeverity(role) {
    const severityMap = {
        0: 'info',
        1: 'danger',
        2: 'warning',
        3: 'success'
    };
    return severityMap[role] || 'secondary';
}

// UPDATE ROLE
async function updateRole(newRole) {
    updatingRole.value = true;
    try {
        const response = await apiClient.post(`/customer/${userId}/update-role`, {
            new_role: parseInt(newRole)
        });

        if (response.data?.status) {
            customer.value.role = newRole;
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật vai trò thành công', life: 3000 });
        }
    } catch (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật vai trò', life: 3000 });
    } finally {
        updatingRole.value = false;
    }
}

// BLACKLIST ACTIONS
const toggleBlacklist = (event) => {
    const endpoint = customer.value.is_blacklisted ? `/customer/${userId}/unblacklist` : `/customer/${userId}/blacklist`;
    const actionText = customer.value.is_blacklisted ? 'xoá khỏi' : 'thêm vào';

    confirm.require({
        target: event.currentTarget,
        message: `Bạn chắc chắn muốn ${actionText} danh sách đen khách hàng này?`,
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
                await apiClient.post(endpoint);
                customer.value.is_blacklisted = !customer.value.is_blacklisted;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `${actionText === 'xoá khỏi' ? 'Xoá khỏi' : 'Thêm vào'} danh sách đen thành công!`,
                    life: 3000
                });
            } catch (err) {
                console.error('❌ Lỗi cập nhật danh sách đen:', err.response?.data || err);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Lỗi cập nhật danh sách đen!',
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
    <div class="p-4" v-if="customer">
        <ConfirmPopup></ConfirmPopup>
        <h2 class="text-2xl font-semibold mb-4">Chi tiết khách hàng #{{ customer.user_id }}</h2>

        <!-- CUSTOMER INFO -->
        <Card class="mb-4">
            <template #title>Thông tin khách hàng</template>
            <template #content>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <strong>Tên khách:</strong> <span class="ml-2">{{ customer.full_name }}</span>
                    </div>
                    <div>
                        <strong>SĐT:</strong> <span class="ml-2">{{ customer.phone || 'Chưa cập nhật' }}</span>
                    </div>
                    <div>
                        <strong>Email:</strong> <span class="ml-2">{{ customer.email }}</span>
                    </div>
                    <div>
                        <strong>Địa chỉ:</strong> <span class="ml-2">{{ customer.address || 'Chưa cập nhật' }}</span>
                    </div>
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
                        <span class="ml-2">{{ formatDate(customer.created_at) }}</span>
                    </div>
                    <div>
                        <strong>Vai trò:</strong>
                        <div class="mt-2 flex items-center gap-2">
                            <Tag :value="getRoleLabel(customer.role)" :severity="getRoleSeverity(customer.role)" />
                            <Select :modelValue="customer.role" :options="userRoleOptions" optionLabel="label" optionValue="value" @update:modelValue="updateRole" :loading="updatingRole" placeholder="Đổi vai trò" style="min-width: 10rem" />
                        </div>
                    </div>
                    <div>
                        <strong>Google ID:</strong> <span class="ml-2">{{ customer.google_id || 'N/A' }}</span>
                    </div>
                    <div>
                        <strong>Cập nhật lần cuối:</strong> <span class="ml-2">{{ formatDate(customer.updated_at) }}</span>
                    </div>
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
                        <span class="text-xl font-semibold text-primary ml-2">{{ customer.total_orders }}</span>
                    </div>
                    <div>
                        <strong>Đơn hàng thành công:</strong>
                        <span class="text-xl font-semibold text-success ml-2">{{ customer.success_orders_count }}</span>
                    </div>
                    <div>
                        <strong>Đơn hàng thất bại:</strong>
                        <span class="text-xl font-semibold text-danger ml-2">{{ customer.failed_orders_count }}</span>
                    </div>
                    <div>
                        <strong>Tỷ lệ thành công:</strong>
                        <span class="text-xl font-semibold text-info ml-2">{{ (customer.success_rate * 100).toFixed(2) }}%</span>
                    </div>
                    <div>
                        <strong>Tổng giá trị:</strong>
                        <span class="text-xl font-semibold text-primary ml-2">{{ customer.lifetime_value ? formatNumber(customer.lifetime_value) + '₫' : 'N/A' }}</span>
                    </div>
                    <div>
                        <strong>Cấp độ khách hàng:</strong>
                        <span class="ml-2"><Tag :value="'Level ' + customer.customer_level" severity="info" /></span>
                    </div>
                    <div>
                        <strong>Cảnh báo rủi ro:</strong>
                        <span class="ml-2"><Tag v-if="customer.risk_flag" value="FLAGGED" severity="danger" /> <Tag v-else value="Bình thường" severity="success" /></span>
                    </div>
                    <div>
                        <strong>Danh sách đen:</strong>
                        <span class="ml-2"><Tag :value="customer.is_blacklisted ? 'Có' : 'Không'" :severity="customer.is_blacklisted ? 'danger' : 'success'" /></span>
                    </div>
                </div>
            </template>
        </Card>

        <!-- BLACKLIST ACTION -->
        <Card>
            <template #title>Quản lý danh sách đen</template>
            <template #content>
                <div class="flex items-center gap-4">
                    <div>
                        <strong>Trạng thái danh sách đen:</strong>
                        <Tag :value="customer.is_blacklisted ? 'Đã bị chặn' : 'Bình thường'" :severity="customer.is_blacklisted ? 'danger' : 'success'" class="ml-2" />
                    </div>
                    <Button :label="customer.is_blacklisted ? 'Xoá khỏi danh sách đen' : 'Thêm vào danh sách đen'" :severity="customer.is_blacklisted ? 'success' : 'danger'" @click="toggleBlacklist" />
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
