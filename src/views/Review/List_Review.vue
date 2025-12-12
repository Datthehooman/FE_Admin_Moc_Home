<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import ConfirmPopup from 'primevue/confirmpopup';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, ref } from 'vue';

import apiClient from '@/api/axios';

const toast = useToast();
const confirm = useConfirm();

const reviews = ref([]);
const filters = ref(null);
const loading = ref(true);
const multiSortMeta = ref([{ field: 'created_at', order: -1 }]);

const reviewStatuses = ['1', '0'];

const statusLabels = {
    1: 'Hiển thị',
    0: 'Ẩn'
};

onBeforeMount(() => {
    loadReviews();
});

async function loadReviews() {
    loading.value = true;
    try {
        const response = await apiClient.get('/reviews');
        reviews.value = response.data?.result?.data || [];
        // Convert date strings to Date objects
        reviews.value.forEach((review) => {
            if (review.created_at) {
                review.created_at = new Date(review.created_at);
            }
        });
    } catch (err) {
        console.error('Lỗi tải đánh giá:', err);
        reviews.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

const updateReviewStatus = async (review, newStatus, event) => {
    confirm.require({
        target: event.currentTarget,
        message: `Thay đổi trạng thái đánh giá sang "${statusLabels[newStatus]}"?`,
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
                await apiClient.put(`/reviews/${review.id}?status=${newStatus}`);

                review.status = newStatus;
                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật trạng thái thành công!',
                    life: 3000
                });
            } catch (err) {
                console.error('❌ Lỗi cập nhật trạng thái:', err.response?.data || err);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể cập nhật trạng thái!',
                    life: 3000
                });
            }
        },
        reject: () => {
            // User rejected, do nothing
        }
    });
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.EQUALS },
        rating: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
        comment: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        created_at: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
}

function formatDate(v) {
    return new Date(v).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function clearFilter() {
    initFilters();
}

function getStatusLabel(status) {
    return statusLabels[status] || status;
}

function getStatusSeverity(status) {
    return status === '1' ? 'success' : 'danger';
}
</script>

<template>
    <div class="card flex-1">
        <ConfirmPopup></ConfirmPopup>
        <h2 class="font-semibold text-xl mb-4">Danh Sách Đánh Giá</h2>

        <DataTable
            :value="reviews"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :filters="filters"
            :globalFilterFields="['comment', 'id']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 70rem"
            sortMode="multiple"
            :removableSort="true"
            v-model:multiSortMeta="multiSortMeta"
        >
            <!-- HEADER -->
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm đánh giá..." />
                    </IconField>
                </div>
            </template>

            <template #empty>Không có đánh giá nào.</template>
            <template #loading>Đang tải dữ liệu...</template>

            <!-- Đánh giá -->
            <Column field="rating" header="Đánh Giá" style="min-width: 10rem" sortable dataType="numeric" filterField="rating">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-star-fill text-yellow-500"></i>
                        {{ parseFloat(data.rating).toFixed(2) }}/5.00
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo đánh giá..." />
                </template>
            </Column>

            <!-- Bình luận -->
            <Column header="Bình luận" style="min-width: 20rem" field="comment" sortable filterField="comment">
                <template #body="{ data }">
                    <div style="white-space: normal; word-break: break-word">
                        {{ data.comment }}
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm bình luận..." />
                </template>
            </Column>

            <!-- Ngày tạo -->
            <Column header="Ngày tạo" style="min-width: 14rem" field="created_at" sortable dataType="date" filterField="created_at">
                <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                </template>
            </Column>

            <!-- Trạng thái -->
            <Column header="Trạng thái" style="min-width: 10rem" field="status" sortable filterField="status">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="reviewStatuses" placeholder="Chọn trạng thái" showClear>
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

            <!-- Hành động -->
            <Column header="Hành động" style="min-width: 12rem" :sortable="false">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Dropdown :options="reviewStatuses" v-model="data.status" @change="(e) => updateReviewStatus(data, data.status, e.originalEvent)" class="w-full">
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
