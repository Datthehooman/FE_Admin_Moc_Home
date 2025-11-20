<script setup>import { ref, onBeforeMount } from "vue";
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
import { useRouter } from 'vue-router';
const router = useRouter();

const vouchers = ref([]);
const filters = ref(null);
const loading = ref(true);

const authStore = useAuthStore();

// Load voucher trước khi mount
onBeforeMount(() => {
    loadVouchers(); // không await trực tiếp
});

// Load danh sách voucher
onBeforeMount(() => {
    loadVouchers(); // không await trực tiếp
});

async function loadVouchers() {
    loading.value = true;
    try {
        const response = await axios.get("http://127.0.0.1:8000/api/system/voucher", {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        vouchers.value = response.data?.result?.data || [];
    } catch (err) {
        console.error("Lỗi tải voucher:", err);
        vouchers.value = [];
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

// Format số
function formatNumber(val) {
return Number(val).toLocaleString("vi-VN");
}

// Xóa voucher
const deleteVoucher = async (voucher) => {
if (!confirm(`Bạn có chắc muốn xóa voucher "${voucher.code}" không?`)) return;

try {
await axios.delete(`http://127.0.0.1:8000/api/system/voucher/${voucher.id}`, {
headers: { Authorization: `Bearer ${authStore.token}` }
});

// Xóa voucher khỏi danh sách local ngay lập tức
vouchers.value = vouchers.value.filter(v => v.id !== voucher.id);

alert(`✅ Xóa voucher "${voucher.code}" thành công!`);

} catch (err) {
console.error("❌ Lỗi xóa voucher:", err.response?.data || err);
alert(`❌ Xóa voucher "${voucher.code}" thất bại!`);
}
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
    filterDisplay="menu"
    :loading="loading"
    :globalFilterFields="['code','description']"
    showGridlines
    scrollable
    scrollHeight="500px"
    rowHover
    tableStyle="min-width: 60rem"
>
    <template #header>
        <div class="flex justify-between items-center">
            <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="initFilters()" />
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters.global.value" placeholder="Tìm kiếm voucher..." />
            </IconField>
        </div>
    </template>

    <template #empty> Không có voucher nào. </template>
    <template #loading> Đang tải dữ liệu...</template>

    <Column field="code" header="Mã voucher" style="min-width: 12rem"></Column>
    <Column field="discount_value" header="Giá trị" style="min-width: 8rem">
        <template #body="{ data }">
            {{ data.discount_type === 'percent' ? data.discount_value + '%' : formatNumber(data.discount_value) + '₫' }}
        </template>
    </Column>
  <Column field="start_date" header="Bắt đầu" style="min-width: 8rem">
  <template #body="{ data }">
    {{ new Date(data.start_date).toLocaleDateString('vi-VN') }}
  </template>
</Column>

<Column field="end_date" header="Kết thúc" style="min-width: 8rem">
  <template #body="{ data }">
    {{ new Date(data.end_date).toLocaleDateString('vi-VN') }}
  </template>
</Column>

<Column header="Trạng thái" style="min-width: 10rem">
  <template #body="{ data }">
    <Tag
      :value="Number(data.status) === 1 ? 'Hiển thị' : 'Ẩn'"
      :severity="Number(data.status) === 1 ? 'success' : 'danger'"
    />
  </template>
</Column>
 <Column field="description" header="Mô tả" style="min-width: 20rem">
  <template #body="{ data }">
    <div style="white-space: normal; word-break: break-word;">
      {{ data.description }}
    </div>
  </template>
</Column>

    <Column header="Hành động" style="min-width: 10rem">
        <template #body="{ data }">
            <div class="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    text
                    severity="primary"
                    @click="router.push(`/Voucher/Edit_Voucher/${data.id}`)"
                />
                <Button
                    icon="pi pi-trash"
                    text
                    severity="danger"
                    @click="deleteVoucher(data)"
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

.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
