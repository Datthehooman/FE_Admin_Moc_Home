<script setup>
import { ref, onMounted, watch } from "vue";
import apiClient from "@/api/axios";
import { useLayout } from "@/layout/composables/layout";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const { isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

const fromDate = ref("");
const toDate = ref("");

const labels = ref(["Miền Bắc", "Miền Trung", "Miền Nam"]);
const customers = ref([]);

// ==========================
// 🎯 GỌI API
// ==========================
async function fetchCustomerByRegion() {
    try {
        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/customer-by-region",
            {
                params: {
                    from_date: fromDate.value || undefined,
                    to_date: toDate.value || undefined
                },
                headers: { Authorization: `Bearer ${authStore.token}` }
            }
        );

        const byRegion = res.data.result.data.by_region;
        customers.value = [
            byRegion.north.provinces.reduce((sum, p) => sum + p.total_customers, 0),
            byRegion.central.provinces.reduce((sum, p) => sum + p.total_customers, 0),
            byRegion.south.provinces.reduce((sum, p) => sum + p.total_customers, 0),
        ];

        buildChart();
    } catch (err) {
        console.error("Customer By Region Error:", err);
    }
}

// ==========================
// 🎯 BUILD CHART
// ==========================
function buildChart() {
    const ctx = document.createElement("canvas").getContext("2d");

    const gradientGreen = ctx.createLinearGradient(0, 0, 0, 300);
    gradientGreen.addColorStop(0, "rgba(0,255,127,0.9)"); // xanh lá neon
    gradientGreen.addColorStop(1, "rgba(0,255,127,0.3)");

    const gradientPink = ctx.createLinearGradient(0, 0, 0, 300);
    gradientPink.addColorStop(0, "rgba(255,20,147,0.9)"); // hồng neon
    gradientPink.addColorStop(1, "rgba(255,20,147,0.3)");

    chartData.value = {
        labels: labels.value,
        datasets: [
            {
                label: "Số khách hàng",
                data: customers.value,
                backgroundColor: [gradientPink, gradientGreen, gradientPink],
                borderRadius: 12,
                barThickness: 40,
                hoverBackgroundColor: ["rgba(255,20,147,1)", "rgba(0,255,127,1)", "rgba(255,20,147,1)"],
            }
        ]
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ": " + context.parsed.y;
                    }
                }
            },
            legend: { display: false }
        },
        scales: {
            x: {
                ticks: { color: isDarkTheme.value ? "#fff" : "#333", font: { weight: "600" } },
                grid: { display: false }
            },
            y: {
                ticks: { color: isDarkTheme.value ? "#fff" : "#333" },
                grid: { color: isDarkTheme.value ? "rgba(255,255,255,0.1)" : "#eee" },
                beginAtZero: true
            }
        },
        animation: {
            duration: 1500,
            easing: "easeOutQuart"
        }
    };
}

watch([isDarkTheme], () => buildChart());
onMounted(() => fetchCustomerByRegion());
function applyFilter() { fetchCustomerByRegion(); }

</script>

<template>
<div class="card pb-4">
    <div class="font-semibold text-xl mb-4">Phân bổ khách hàng theo khu vực</div>

    <!-- BỘ LỌC -->
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
                <Button icon="pi pi-filter" class="p-button-rounded p-button-outlined" @click="applyFilter" />
            </div>
        </div>
    </div>

    <!-- BIỂU ĐỒ HẦM HỐ -->
    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
</div>
</template>
