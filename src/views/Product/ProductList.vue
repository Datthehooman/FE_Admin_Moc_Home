<script setup>
import { ref, onBeforeMount } from "vue";
import { FilterMatchMode } from "@primevue/core/api";

import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";

import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const products = ref([]);
const filters = ref(null);
const loading = ref(true);

const authStore = useAuthStore();

// Load sản phẩm trước khi mount
onBeforeMount(async () => {
    await loadProducts();
});

// Load danh sách sản phẩm
async function loadProducts() {
    loading.value = true;
    try {
        const response = await axios.get("http://127.0.0.1:8000/api/system/products", {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        products.value = response.data.result.data || [];
    } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        products.value = [];
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

// Format số theo định dạng Việt Nam
function formatNumber(val) {
    return Number(val).toLocaleString("vi-VN");
}

// Xóa sản phẩm thật sự
const deleteProduct = async (product) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.product_name}" không?`)) return;

    try {
        await axios.delete(`http://127.0.0.1:8000/api/system/products/${product.product_id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        // Cập nhật table
        products.value = products.value.filter(p => p.product_id !== product.product_id);

        alert('Xóa sản phẩm thành công!');
    } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err.response || err);
        alert('Xóa sản phẩm thất bại!');
    }
};
</script>

<template>
<div class="card flex-1">
    <h2 class="font-semibold text-xl mb-4">Danh Sách Sản Phẩm</h2>

    <DataTable
        :value="products"
        :paginator="true"
        :rows="10"
        dataKey="product_id"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['product_name']"
        showGridlines
        style="width: 100%"
        tableStyle="min-width: 60rem"
        scrollable
        scrollHeight="500px"
    >
        <template #header>
            <div class="flex justify-between items-center">
                <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="initFilters()" />
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters.global.value" placeholder="Tìm kiếm sản phẩm..." />
                </IconField>
            </div>
        </template>

        <template #empty> Không có sản phẩm nào. </template>
        <template #loading> Đang tải dữ liệu...</template>

        <Column header="Hình ảnh" style="min-width: 8rem">
            <template #body="{ data }">
                <img :src="data.thumbnail" class="w-16 h-16 object-cover rounded shadow" />
            </template>
        </Column>

        <Column field="product_name" header="Tên sản phẩm" style="min-width: 14rem"></Column>

        <Column field="stock" header="Tồn kho" style="min-width: 8rem">
            <template #body="{ data }">
                {{ formatNumber(data.stock_quantity) }}
            </template>
        </Column>

        <Column field="views" header="Lượt xem" style="min-width: 8rem">
            <template #body="{ data }">
                {{ formatNumber(data.view) }}
            </template>
        </Column>

        <Column header="Trạng thái" style="min-width: 10rem">
            <template #body="{ data }">
                <Tag
                    :value="data.status === 1 ? 'Hiển thị' : 'Ẩn'"
                    :severity="data.status === 1 ? 'success' : 'danger'"
                />
            </template>
        </Column>

        <Column header="Hành động" style="min-width: 10rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button icon="pi pi-pencil" text severity="primary" />
                    <Button
                        icon="pi pi-trash"
                        text
                        severity="danger"
                        @click="deleteProduct(data)"
                    />
                </div>
            </template>
        </Column>
    </DataTable>
</div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}

/* Đảm bảo bảng co giãn theo container */
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
