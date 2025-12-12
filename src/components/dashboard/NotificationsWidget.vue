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

const labels = ref([]);
const dataCounts = ref([]);
const statusLabels = ref([]);

// 🎯 GỌI API
async function fetchOrderStatusDistribution() {
    try {
        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/order-status-distribution",
            {
                params: {
                    from_date: fromDate.value || undefined,
                    to_date: toDate.value || undefined
                },
                headers: { Authorization: `Bearer ${authStore.token}` }
            }
        );

        const distribution = res.data.result.data.distribution || [];
        const statusVN = {
            pending: "Chờ xử lý",
            processing: "Đang xử lý",
            completed: "Hoàn tất",
            cancelled: "Đã hủy",
            failed: "Thất bại",
            rejected: "Bị từ chối"
        };

        labels.value = distribution.map(i => statusVN[i.status] || i.label);
        statusLabels.value = labels.value;
        dataCounts.value = distribution.map(i => i.count);

        buildChart();
    } catch (err) {
        console.error("Order Status Distribution Error:", err);
    }
}

// 🎯 BUILD PIE CHART HẦM HỐ
function buildChart() {
    const style = getComputedStyle(document.documentElement);

    // Gradient Neon Colors
    const colors = [
        "rgba(255,215,0,0.9)",    // vàng neon
        "rgba(255,140,0,0.9)",   // cam neon
        "rgba(0,255,127,0.9)",   // xanh lá neon
        "rgba(255,0,0,0.9)",  // đỏ neon
        "rgba(255,20,147,0.9)",  // hồng neon
        "rgba(30,144,255,0.9)",  // xanh dương neon
    ];

    const gradients = dataCounts.value.map((_, i) => colors[i % colors.length]);

    chartData.value = {
        labels: labels.value,
        datasets: [
            {
                label: "Số đơn hàng",
                data: dataCounts.value,
                backgroundColor: gradients,
                borderColor: "#fff",
                borderWidth: 2,
                hoverOffset: 20, // slice pop-out
                hoverBorderColor: "#fff",
                hoverBorderWidth: 3,
            }
        ]
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        responsive: true,
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: "easeOutQuart"
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const total = dataCounts.value.reduce((a, b) => a + b, 0);
                        const count = context.raw;
                        const percentage = total ? ((count / total) * 100).toFixed(1) : 0;
                        const status = statusLabels.value[context.dataIndex];
                        return `${status}: ${count} đơn - ${percentage}%`;
                    }
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    color: style.getPropertyValue("--text-color-secondary"),
                    boxWidth: 18,
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            }
        }
    };
}

// Watch theme
watch([isDarkTheme], () => buildChart());
onMounted(() => fetchOrderStatusDistribution());
function applyFilter() { fetchOrderStatusDistribution(); }
</script>

<template>
<div class="card pb-4">
    <div class="font-semibold text-xl mb-4">Tỉ lệ trạng thái đơn hàng</div>

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

    <!-- PIE CHART HẦM HỐ -->
    <Chart type="pie" :data="chartData" :options="chartOptions" class="h-80" />
</div>
</template>
