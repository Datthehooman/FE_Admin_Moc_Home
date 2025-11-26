<script setup>
import apiClient from '@/api/axios';
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import MultiSelect from 'primevue/multiselect';

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const categories = ref([]);
const filters = ref(null);
const loading = ref(true);

// Load danh sách categories trước khi mount
onBeforeMount(async () => {
    await loadCategories();
});

// Load categories
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

// Khởi tạo filter cho từng cột
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        category_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS },
        is_active: { value: [], matchMode: FilterMatchMode.IN }
    };
}

// Xóa category
const deleteCategory = async (category) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.category_name}" không?`)) return;

    try {
        await apiClient.delete(`/category/${category.id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        categories.value = categories.value.filter((c) => c.id !== category.id);

        alert('Xóa danh mục thành công!');
    } catch (err) {
        console.error('Lỗi xóa danh mục:', err.response || err);
        alert('Xóa danh mục thất bại!');
    }
};
</script>

<template>
<div class="card flex-1">
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
        <!-- HEADER với MultiSelect filter trạng thái + global search -->
        <template #header>
            <div class="flex justify-between items-center gap-4">
                <!-- Filter trạng thái -->
                <MultiSelect
                    v-model="filters.is_active.value"
                    :options="[ { label: 'Hiển thị', value: 1 }, { label: 'Ẩn', value: 0 } ]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Lọc trạng thái"
                    display="chip"
                    class="w-1/4"
                    :showSelectAll="true"
                    metaKeySelection="false"
                />

                <!-- Global search -->
                <InputText
                    v-model="filters.global.value"
                    placeholder="Tìm kiếm danh mục..."
                    class="border p-1 rounded w-1/4"
                />
            </div>
        </template>

        <template #empty> Không có danh mục nào. </template>
        <template #loading> Đang tải dữ liệu...</template>

        <!-- Tên danh mục -->
        <Column field="category_name" header="Tên danh mục" sortable>
            <template #body="{ data }">{{ data.category_name }}</template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" placeholder="Tìm kiếm tên danh mục" />
            </template>
        </Column>

        <!-- Mô tả -->
        <Column field="description" header="Mô tả" sortable>
            <template #body="{ data }">{{ data.description }}</template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" placeholder="Tìm kiếm mô tả" />
            </template>
        </Column>

        <!-- Trạng thái -->
        <Column field="is_active" header="Trạng thái" sortable>
            <template #body="{ data }">
                <Tag
                    :value="Number(data.is_active) === 1 ? 'Hiển thị' : 'Ẩn'"
                    :severity="Number(data.is_active) === 1 ? 'success' : 'danger'"
                />
            </template>
            <template #filter="{ filterModel }">
                <MultiSelect
                    v-model="filterModel.value"
                    :options="[ { label: 'Hiển thị', value: 1 }, { label: 'Ẩn', value: 0 } ]"
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

        <!-- Hành động -->
        <Column header="Hành động" style="min-width: 10rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button icon="pi pi-pencil" text severity="primary" @click="router.push(`/Category/Edit_Category/${data.id}`)" />
                    <Button icon="pi pi-trash" text severity="danger" @click="deleteCategory(data)" />
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
