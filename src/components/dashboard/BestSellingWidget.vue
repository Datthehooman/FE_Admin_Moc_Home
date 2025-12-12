<script setup>
import { ref, onMounted } from "vue";
import apiClient from "@/api/axios";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const menu = ref(null);
const products = ref([]);

const fromDate = ref("");
const toDate = ref("");

// ==========================
// CALL API LOW STOCK PRODUCT
// ==========================
async function fetchLowStock() {
    try {
        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/low-stock-product",
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        const data = res.data.result.data;
        products.value = [...data.critical_products, ...data.low_stock_products];
    } catch (err) {
        console.error("Low Stock Product Error:", err);
    }
}

onMounted(() => fetchLowStock());

const menuItems = [
    { label: "Làm mới", icon: "pi pi-refresh", command: () => fetchLowStock() }
];

function formatCurrency(value) {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

function applyFilter() {
    fetchLowStock();
}
</script>

<template>
<div class="card pb-4">
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-6">
        <div class="font-semibold text-xl">Sản phẩm tồn kho thấp</div>

        <div>
            <Button
                icon="pi pi-ellipsis-v"
                class="p-button-text p-button-plain p-button-rounded"
                @click="$refs.menu.toggle($event)"
            />
            <Menu ref="menu" popup :model="menuItems" class="!min-w-40" />
        </div>
    </div>

    <!-- FILTER -->
    <div class="p-3 bg-gray-50 rounded-lg mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div class="md:col-span-2">
                <label class="text-sm font-medium block mb-1">Từ ngày</label>
                <input
                    type="date"
                    v-model="fromDate"
                    class="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
            </div>

            <div class="md:col-span-2">
                <label class="text-sm font-medium block mb-1">Đến ngày</label>
                <input
                    type="date"
                    v-model="toDate"
                    class="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
            </div>

            <div class="flex justify-start md:justify-end">
                <Button
                    icon="pi pi-filter"
                    class="p-button-rounded p-button-outlined"
                    @click="applyFilter"
                />
            </div>
        </div>
    </div>

    <!-- LIST -->
    <ul class="list-none p-0 m-0">
        <li v-for="item in products" :key="item.product_id"
            class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

            <!-- LEFT -->
            <div class="flex items-center space-x-3">
                <img
                    :src="item.product_image"
                    class="w-12 h-12 object-cover rounded transition-transform duration-300 ease-out hover:scale-125 hover:-rotate-3 "
                />

                <div>
                    <span class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ item.product_name }}
                    </span>
                    <div class="mt-1 text-muted-color">
                        {{ formatCurrency(item.price) }}
                    </div>
                    <div class="text-sm text-red-500 mt-1">
                        Tồn kho: {{ item.stock_quantity }}
                    </div>
                </div>
            </div>
        </li>

        <li v-if="products.length === 0" class="text-center text-gray-500 py-4">
            Không có dữ liệu
        </li>
    </ul>
</div>
</template>
