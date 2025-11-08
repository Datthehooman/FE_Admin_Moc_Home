<script setup>
import { ref, onBeforeMount } from "vue";
import { FilterMatchMode } from "@primevue/core/api";

import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";

import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

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
        const response = await axios.get("http://127.0.0.1:8000/api/system/category/list", {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = response.data.result.data || [];
    } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        categories.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Khởi tạo bộ lọc
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

// Xóa category
const deleteCategory = async (category) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.category_name}" không?`)) return;

    try {
        await axios.delete(`http://127.0.0.1:8000/api/system/category/${category.id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        categories.value = categories.value.filter(c => c.id !== category.id);

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
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['category_name','description']"
        showGridlines
        scrollable
        scrollHeight="500px"
        rowHover
        tableStyle="min-width: 60rem"
    >
        <template #header>
            <div class="flex justify-between items-center gap-4">
                <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="initFilters()" />
                <div class="flex items-center gap-2 border rounded px-2 py-1 bg-white shadow-sm">
                    <i class="pi pi-search text-gray-400"></i>
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm danh mục..." class="border-none outline-none" />
                </div>
            </div>
        </template>

        <template #empty> Không có danh mục nào. </template>
        <template #loading> Đang tải dữ liệu...</template>

        <Column header="Hình ảnh" style="min-width: 8rem">
            <template #body="{ data }">
                <img :src="data.full_image_url" class="w-16 h-16 object-cover rounded shadow" />
            </template>
        </Column>

        <Column field="category_name" header="Tên danh mục" style="min-width: 14rem"></Column>
        <Column field="description" header="Mô tả" style="min-width: 20rem"></Column>

        <Column header="Trạng thái" style="min-width: 10rem">
            <template #body="{ data }">
                <Tag
                    :value="data.is_active === 1 ? 'Hiện' : 'Ẩn'"
                    :severity="data.is_active === 1 ? 'success' : 'danger'"
                />
            </template>
        </Column>

        <Column header="Hành động" style="min-width: 10rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button
                        icon="pi pi-pencil"
                        text
                        severity="primary"
                        @click="router.push(`/Category/Edit_Category/${data.id}`)"
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        severity="danger"
                        @click="deleteCategory(data)"
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

/* Đảm bảo bảng co giãn theo container */
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
