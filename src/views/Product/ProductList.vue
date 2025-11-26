<script setup>
import apiClient from '@/api/axios';
import { FilterMatchMode } from '@primevue/core/api';
import { onBeforeMount, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
const router = useRouter();

const products = ref([]);
const filters = ref(null);
const loading = ref(true);

const authStore = useAuthStore();

onBeforeMount(async () => {
    await loadProducts();
});

// Load sản phẩm
async function loadProducts() {
    loading.value = true;
    try {
        const response = await apiClient.get('/products');
        products.value = response.data.result.data || [];
    } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
        products.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Khởi tạo filter cho từng cột
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        product_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        stock_quantity: { value: null, matchMode: FilterMatchMode.EQUALS },
        sold: { value: null, matchMode: FilterMatchMode.EQUALS },
        view: { value: null, matchMode: FilterMatchMode.EQUALS },
        status: { value: [], matchMode: FilterMatchMode.IN }
    };
}

// Format số VN
function formatNumber(val) {
    return Number(val).toLocaleString('vi-VN');
}

// Xóa sản phẩm
async function deleteProduct(product) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.product_name}" không?`)) return;

    try {
        await apiClient.delete(`/products/${product.product_id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        products.value = products.value.filter(p => p.product_id !== product.product_id);
        alert('Xóa sản phẩm thành công!');
    } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err.response || err);
        alert('Xóa sản phẩm thất bại!');
    }
}
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
    :loading="loading"
    :globalFilterFields="['product_name']"
    showGridlines
    style="width: 100%"
    tableStyle="min-width: 60rem"
    scrollable
    scrollHeight="500px"
>
  <template #header>
    <div class="flex justify-between items-center gap-4">
        <!-- Dropdown lọc trạng thái -->
        <MultiSelect
            v-model="filters.status.value"
            :options="[
                { label: 'Hiển thị', value: '1' },
                { label: 'Ẩn', value: '0' }
            ]"
            optionLabel="label"
            optionValue="value"
            placeholder="Lọc trạng thái"
            display="chip"
            class="w-1/4"
        />

        <!-- Tìm kiếm global -->
        <InputText
            v-model="filters.global.value"
            placeholder="Tìm kiếm..."
            class="border p-1 rounded w-1/4"
        />
    </div>
</template>

    <template #empty> Không có sản phẩm nào. </template>
    <template #loading> Đang tải dữ liệu...</template>

    <!-- Hình ảnh -->
    <Column header="Hình ảnh" style="min-width: 8rem">
        <template #body="{ data }">
            <div class="w-16 h-16 flex items-center justify-center rounded shadow">
                <img :src="data.thumbnail" class="max-h-full max-w-full object-contain p-2" />
            </div>
        </template>
    </Column>

    <!-- Tên sản phẩm -->
    <Column field="product_name" header="Tên sản phẩm" sortable>
        <template #body="{ data }">{{ data.product_name }}</template>
        <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" placeholder="Tìm kiếm tên sản phẩm" />
        </template>
    </Column>

    <!-- Tồn kho -->
    <Column field="stock_quantity" header="Tồn kho" sortable>
        <template #body="{ data }">{{ formatNumber(data.stock_quantity) }}</template>
        <template #filter="{ filterModel }">
            <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Tồn kho" />
        </template>
    </Column>

    <!-- Đã bán -->
    <Column field="sold" header="Đã bán" sortable>
        <template #body="{ data }">{{ formatNumber(data.sold) }}</template>
        <template #filter="{ filterModel }">
            <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Đã bán" />
        </template>
    </Column>

    <!-- Lượt xem -->
    <Column field="view" header="Lượt xem" sortable>
        <template #body="{ data }">{{ formatNumber(data.view) }}</template>
        <template #filter="{ filterModel }">
            <InputNumber v-model="filterModel.value" mode="decimal" placeholder="Lượt xem" />
        </template>
    </Column>

    <!-- Trạng thái -->
    <Column field="status" header="Trạng thái" sortable>
        <template #body="{ data }">
            <Tag :value="Number(data.status) === 1 ? 'Hiển thị' : 'Ẩn'"
                 :severity="Number(data.status) === 1 ? 'success' : 'danger'" />
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
            />
        </template>
    </Column>

    <!-- Hành động -->
    <Column header="Hành động" style="min-width: 10rem">
        <template #body="{ data }">
            <div class="flex gap-2">
                <Button icon="pi pi-pencil" text severity="primary" @click="router.push(`/Product/Edit_Product/${data.product_id}`)" />
                <Button icon="pi pi-trash" text severity="danger" @click="deleteProduct(data)" />
            </div>
        </template>
    </Column>
</DataTable>


</div>
</template>

<style scoped lang="scss">
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
