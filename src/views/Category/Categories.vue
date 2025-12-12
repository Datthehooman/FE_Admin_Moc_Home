<script setup>
import apiClient from '@/api/axios';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import ConfirmPopup from 'primevue/confirmpopup';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const categories = ref([]);
const filters = ref(null);
const loading = ref(true);

onBeforeMount(async () => {
    await loadCategories();
});

async function loadCategories() {
    loading.value = true;
    try {
        const response = await apiClient.get('/category/list', {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = response.data.result.data || [];
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
        categories.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        category_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS },
        is_active: { value: [], matchMode: FilterMatchMode.IN }
    };
}

const deleteCategory = async (category, event) => {
    confirm.require({
        target: event.currentTarget,
        message: `Bạn có chắc muốn xóa danh mục "${category.category_name}" không?`,
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
                await apiClient.delete(`/category/${category.id}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });

                categories.value = categories.value.filter((c) => c.id !== category.id);

                toast.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Xóa danh mục thành công!',
                    life: 3000
                });
            } catch (err) {
                console.error('Lỗi xóa danh mục:', err.response || err);
                toast.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Xóa danh mục thất bại!',
                    life: 3000
                });
            }
        }
    });
};
</script>

<template>
    <div class="card flex-1">
        <ConfirmPopup />

        <h2 class="font-semibold text-xl mb-4">Danh Sách Danh Mục</h2>

        <DataTable
            :value="categories"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            :loading="loading"
            :globalFilterFields="['category_name', 'description']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 60rem"
        >
            <template #header>
                <div class="flex justify-between items-center gap-4">
                    <MultiSelect
                        v-model="filters.is_active.value"
                        :options="[
                            { label: 'Hiển thị', value: 1 },
                            { label: 'Ẩn', value: 0 }
                        ]"
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
                        placeholder="Tìm kiếm danh mục..."
                        class="border p-1 rounded w-1/4"
                    />
                </div>
            </template>

            <template #empty> Không có danh mục nào. </template>
            <template #loading> Đang tải dữ liệu...</template>

            <Column field="category_name" header="Tên danh mục" sortable>
                <template #body="{ data }">{{ data.category_name }}</template>
            </Column>

            <!-- MÔ TẢ (đã thu gọn ...) -->
            <Column field="description" header="Mô tả" sortable>
                <template #body="{ data }">{{ data.description }}</template>
            </Column>

            <Column field="is_active" header="Trạng thái" sortable>
                <template #body="{ data }">
                    <Tag :value="Number(data.is_active) === 1 ? 'Hiển thị' : 'Ẩn'"
                         :severity="Number(data.is_active) === 1 ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Hành động" style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" text severity="primary"
                                @click="router.push(`/Category/Edit_Category/${data.id}`)" />

                        <Button icon="pi pi-trash" text severity="danger"
                                @click="(e) => deleteCategory(data, e)" />
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

/* THU GỌN CỘT MÔ TẢ (CỘT THỨ 2) */
:deep(.p-datatable-tbody > tr > td:nth-child(2)) {
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
