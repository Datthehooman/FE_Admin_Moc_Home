<script setup>
import { ref, onMounted } from "vue";
import apiClient from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const products = ref([]);

const fromDate = ref("");
const toDate = ref("");

function formatCurrency(value) {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

async function fetchDefault() {
    try {
        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/top-selling-product",
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        products.value = res.data.result.data.products;
    } catch (err) {
        console.error("Top Selling Error:", err);
    }
}

async function applyFilter() {
    try {
        const params = {};
        if (fromDate.value) params.from_date = fromDate.value;
        if (toDate.value) params.to_date = toDate.value;

        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/top-selling-product",
            { params, headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        products.value = res.data.result.data.products;
    } catch (err) {
        console.error("Filter Error:", err);
    }
}

onMounted(() => fetchDefault());
</script>

<template>
<div class="card pb-4">
    <div class="flex justify-between items-center mb-3">
        <h3 class="font-semibold text-xl">Sản phẩm bán chạy</h3>
    </div>

    <!-- BỘ LỌC GỌN -->
    <div class="p-3 bg-gray-50 rounded-lg mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div class="md:col-span-2">
                <label class="text-sm font-medium block mb-1">Từ ngày</label>
                <input type="date" v-model="fromDate" class="w-full p-inputtext" />
            </div>
            <div class="md:col-span-2">
                <label class="text-sm font-medium block mb-1">Đến ngày</label>
                <input type="date" v-model="toDate" class="w-full p-inputtext" />
            </div>
            <div class="flex justify-start md:justify-end">
                <Button icon="pi pi-filter"
                        class="p-button-rounded p-button-outlined"
                        @click="applyFilter" />
            </div>
        </div>
    </div>

    <!-- BẢNG -->
    <DataTable :value="products" :rows="5" :paginator="true" responsiveLayout="scroll">
        <Column header="Ảnh" style="width: 15%">
            <template #body="slotProps">
                <img
                    :src="slotProps.data.product_image"
                    width="50"
                    class="rounded transition-transform duration-300 ease-out hover:scale-125 hover:-rotate-3 "
                />
            </template>
        </Column>

        <Column field="product_name" header="Tên sản phẩm" style="width: 35%" sortable />

        <Column field="price" header="Giá" style="width: 20%">
            <template #body="slotProps">
                {{ formatCurrency(slotProps.data.price) }}
            </template>
        </Column>

        <Column field="total_quantity_sold" header="Đã bán" style="width: 10%" />

        <Column header="Xem" style="width: 10%">
            <template #body="slotProps">
                <Button
                    icon="pi pi-search"
                    class="p-button-text"
                    @click="$router.push(`/Product/Detail/${slotProps.data.product_id}`)"
                />
            </template>
        </Column>
    </DataTable>
</div>
</template>
