<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import ConfirmPopup from 'primevue/confirmpopup';
import DataTable from 'primevue/datatable';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const vouchers = ref([]);
const filters = ref(null);
const loading = ref(true);

// Load danh sách voucher
onBeforeMount(async () => {
    await loadVouchers();
});

async function loadVouchers() {
    loading.value = true;
    try {
        const response = await apiClient.get('/voucher');
        vouchers.value = response.data?.result?.data || [];
    } catch (err) {
        console.error('Lỗi tải voucher:', err);
        vouchers.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Khởi tạo filter cho từng cột
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        code: { value: null, matchMode: FilterMatchMode.CONTAINS },
        discount_value: { value: null, matchMode: FilterMatchMode.EQUALS },
        start_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
        end_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: [], matchMode: FilterMatchMode.IN },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

// Format số
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Xóa voucher
const deleteVoucher = async (voucher, event) => {
    confirm.require({
        target: event.currentTarget,
        message: `Bạn có chắc muốn xóa voucher "${voucher.code}" không?`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Huỷ',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Xóa',
            severity: 'danger'
        },
        accept: async () => {
            try {
                await apiClient.delete(`/voucher/${voucher.id}`);
                vouchers.value = vouchers.value.filter((v) => v.id !== voucher.id);
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Xóa voucher "${voucher.code}" thành công!`,
                    life: 3000
                });
            } catch (err) {
                console.error('❌ Lỗi xóa voucher:', err.response?.data || err);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: `Xóa voucher "${voucher.code}" thất bại!`,
                    life: 3000
                });
            }
        }
    });
};
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Voucher</h2>

        <DataTable
            :value="vouchers"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['code', 'description', 'status']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 60rem"
        >
            <template #header>
                <div class="flex justify-between items-center gap-4">
                    <!-- Dropdown lọc trạng thái -->
                    <MultiSelect
                        v-model="filters.status.value"
                        :options="[
                            { label: 'Hoạt động', value: 'active' },
                            { label: 'Ngưng hoạt động', value: 'inactive' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Lọc trạng thái"
                        display="chip"
                        class="w-1/4"
                    />

                    <!-- Tìm kiếm global -->
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm voucher..." class="border p-1 rounded w-1/4" />
                </div>
            </template>

            <template #empty> Không có voucher nào. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <!-- Mã voucher -->
            <Column field="code" header="Mã voucher" sortable>
                <template #body="{ data }">{{ data.code }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm mã voucher" />
                </template>
            </Column>

            <!-- Giá trị -->
            <Column field="discount_value" header="Giá trị" sortable>
                <template #body="{ data }">
                    {{ data.discount_type === 'percent' ? data.discount_value + '%' : formatNumber(data.discount_value) + '₫' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Giá trị" />
                </template>
            </Column>

            <!-- Bắt đầu -->
            <Column field="start_date" header="Bắt đầu" sortable>
                <template #body="{ data }">{{ new Date(data.start_date).toLocaleDateString('vi-VN') }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Bắt đầu" />
                </template>
            </Column>

            <!-- Kết thúc -->
            <Column field="end_date" header="Kết thúc" sortable>
                <template #body="{ data }">{{ new Date(data.end_date).toLocaleDateString('vi-VN') }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Kết thúc" />
                </template>
            </Column>

            <!-- Trạng thái -->
            <Column field="status" header="Trạng thái" sortable>
                <template #body="{ data }">
                    <Tag :value="data.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'" :severity="data.status === 'active' ? 'success' : 'danger'" />
                </template>
                <template #filter="{ filterModel }">
                    <MultiSelect
                        v-model="filterModel.value"
                        :options="[
                            { label: 'Hoạt động', value: 'active' },
                            { label: 'Ngưng hoạt động', value: 'inactive' }
                        ]"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Chọn trạng thái"
                        display="chip"
                        class="w-full"
                    />
                </template>
            </Column>

            <!-- Mô tả -->
            <Column field="description" header="Mô tả" sortable>
                <template #body="{ data }">
                    <div style="white-space: normal; word-break: break-word">{{ data.description }}</div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" placeholder="Tìm kiếm mô tả" />
                </template>
            </Column>

            <!-- Hành động -->
            <Column header="Hành động" style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" text severity="primary" @click="router.push(`/Voucher/Edit_Voucher/${data.id}`)" />
                        <Button icon="pi pi-trash" text severity="danger" @click="deleteVoucher(data, $event)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <ConfirmPopup />
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
