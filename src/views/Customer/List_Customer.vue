<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, ref } from 'vue';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const customers = ref([]);
const filters = ref(null);
const loading = ref(true);
const updatingRoles = ref({});
const toast = useToast();

const userStatuses = ['0', '1'];

const userStatusLabels = {
    0: 'Inactive',
    1: 'Active'
};

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

onBeforeMount(() => {
    loadCustomers();
});

async function loadCustomers() {
    loading.value = true;
    try {
        const response = await apiClient.get('/customer/list');
        customers.value = response.data?.result?.data || [];
        customers.value.forEach((customer) => {
            if (customer.created_at) {
                customer.created_at = new Date(customer.created_at);
            }
        });
    } catch (err) {
        console.error('Lỗi tải danh sách khách hàng:', err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách khách hàng', life: 3000 });
        customers.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        full_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
        created_at: { value: null, matchMode: FilterMatchMode.DATE_IS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        role: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

function clearFilter() {
    initFilters();
}

function getStatusLabel(status) {
    return userStatusLabels[status] || status;
}

function getStatusSeverity(status) {
    const severityMap = {
        0: 'danger',
        1: 'success'
    };
    return severityMap[status] || 'secondary';
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

async function updateUserRole(userId, newRole) {
    updatingRoles.value[userId] = true;
    try {
        const response = await apiClient.post(`/customer/${userId}/update-role`, {
            new_role: parseInt(newRole)
        });

        if (response.data?.status) {
            const customer = customers.value.find((c) => c.user_id === userId);
            if (customer) {
                customer.role = newRole;
            }
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật vai trò thành công', life: 3000 });
        }
    } catch (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật vai trò', life: 3000 });
    } finally {
        updatingRoles.value[userId] = false;
    }
}
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Khách Hàng</h2>

        <DataTable
            :value="customers"
            :paginator="true"
            :rows="10"
            dataKey="user_id"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :filters="filters"
            :globalFilterFields="['full_name', 'email', 'phone']"
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
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm khách hàng..." />
                    </IconField>
                </div>
            </template>

            <template #empty>Không có khách hàng nào.</template>
            <template #loading>Đang tải dữ liệu...</template>

            <!-- Tên khách hàng -->
            <Column header="Tên khách hàng" style="min-width: 14rem" sortable sortField="full_name" filterField="full_name">
                <template #body="{ data }">
                    <div>
                        <div class="font-semibold">{{ data.full_name }}</div>
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

            <!-- Điện thoại -->
            <Column header="Điện thoại" style="min-width: 12rem" field="phone" sortable filterField="phone">
                <template #body="{ data }">
                    {{ data.phone || 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo số điện thoại..." />
                </template>
            </Column>

            <!-- Role -->
            <Column header="Vai trò" style="min-width: 10rem" field="role" sortable filterField="role">
                <template #body="{ data }">
                    <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="['0', '1', '2']" placeholder="Chọn vai trò" showClear optionLabel="" optionValue="">
                        <template #value="{ value }">
                            <span v-if="value">{{ getRoleLabel(value) }}</span>
                            <span v-else class="text-gray-400">Chọn vai trò</span>
                        </template>
                        <template #option="{ option }">
                            {{ getRoleLabel(option) }}
                        </template>
                    </Select>
                </template>
            </Column>

            <!-- Trạng thái -->
            <Column header="Trạng thái" style="min-width: 10rem" field="status" sortable filterField="status">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="userStatuses" placeholder="Chọn trạng thái" showClear optionLabel="" optionValue="">
                        <template #value="{ value }">
                            <span v-if="value">{{ getStatusLabel(value) }}</span>
                            <span v-else class="text-gray-400">Chọn trạng thái</span>
                        </template>
                        <template #option="{ option }">
                            {{ getStatusLabel(option) }}
                        </template>
                    </Select>
                </template>
            </Column>

            <!-- Hành động -->
            <Column header="Hành động" style="min-width: 18rem" :sortable="false">
                <template #body="{ data }">
                    <div class="flex gap-2 items-center">
                        <Select
                            :modelValue="data.role"
                            :options="userRoleOptions"
                            optionLabel="label"
                            optionValue="value"
                            @update:modelValue="updateUserRole(data.user_id, $event)"
                            :loading="updatingRoles[data.user_id]"
                            placeholder="Đổi vai trò"
                            style="min-width: 12rem"
                        />
                        <Button icon="pi pi-eye" text severity="info" @click="router.push(`/Customers/Detail_Customer/${data.user_id}`)" />
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

:deep(.p-dropdown) {
    width: 100%;
}
</style>
