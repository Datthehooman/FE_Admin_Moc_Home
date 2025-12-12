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
const toDate   = ref("");

const labels = ref([]);
const gross  = ref([]);
const net    = ref([]);

async function fetchRevenuePeriod() {
    try {
        const res = await apiClient.get(
            "https://api.mocfurni.shop/api/system/dashboard/revenue-by-period",
            {
                params: { from_date: fromDate.value || undefined, to_date: toDate.value || undefined },
                headers: { Authorization: `Bearer ${authStore.token}` }
            }
        );

        const data = res.data.result.data;

        labels.value = data.map(i => i.period);
        gross.value  = data.map(i => i.gross_revenue);
        net.value    = data.map(i => i.net_revenue);

        buildChart();
    } catch (err) {
        console.error("Revenue Period Error:", err);
    }
}

function buildChart() {
    // tạo gradient màu neon
    const ctx = document.createElement("canvas").getContext("2d");

    const gradientGross = ctx.createLinearGradient(0,0,0,300);
    gradientGross.addColorStop(0, "rgba(0, 206, 209, 0.8)"); // xanh ngọc neon
    gradientGross.addColorStop(1, "rgba(0, 206, 209, 0.3)");

    const gradientNet = ctx.createLinearGradient(0,0,0,300);
    gradientNet.addColorStop(0, "rgba(138, 43, 226, 0.8)"); // tím neon
    gradientNet.addColorStop(1, "rgba(138, 43, 226, 0.3)");

    const gradientLine = ctx.createLinearGradient(0,0,0,300);
    gradientLine.addColorStop(0, "rgba(255, 215, 0, 0.8)"); // vàng neon
    gradientLine.addColorStop(1, "rgba(255, 215, 0, 0.3)");

    chartData.value = {
        labels: labels.value,
        datasets: [
            {
                type: "bar",
                label: "Doanh thu gộp",
                data: gross.value,
                backgroundColor: gradientGross,
                borderRadius: 12,
                barThickness: 28,
                hoverBackgroundColor: "rgba(0, 206, 209, 1)",
                shadowOffsetX: 2,
                shadowOffsetY: 4,
                shadowBlur: 10,
                shadowColor: "rgba(0,206,209,0.5)"
            },
            {
                type: "bar",
                label: "Doanh thu thuần",
                data: net.value,
                backgroundColor: gradientNet,
                borderRadius: 12,
                barThickness: 28,
                hoverBackgroundColor: "rgba(138,43,226,1)",
                shadowOffsetX: 2,
                shadowOffsetY: 4,
                shadowBlur: 10,
                shadowColor: "rgba(138,43,226,0.5)"
            },
         {
    type: "line",
    label: "Tăng trưởng %",
    data: gross.value.map((v,i)=>((v-net.value[i])/v*100)),
    borderColor: "#7CFC00",          // xanh lá tươi nhẹ
    backgroundColor: "rgba(124,252,0,0.2)", // fill nhẹ xanh lá tươi
    fill: true,
    tension: 0.4,
    pointRadius: 8,
    pointHoverRadius: 10,
    pointBackgroundColor: "#7CFC00",
    pointBorderColor: "#fff",
    pointHoverBorderColor: "#7CFC00",
    cubicInterpolationMode: "monotone",
    yAxisID: "y1"
}


        ]
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        if(context.dataset.type === "line") {
                            return context.dataset.label + ": " + context.parsed.y.toFixed(2) + " %";
                        }
                        return context.dataset.label + ": " + context.parsed.y.toLocaleString("vi-VN") + " ₫";
                    }
                }
            },
            legend: {
                labels: { color: isDarkTheme.value ? "#fff" : "#333", font:{weight:'600'} }
            }
        },
        scales: {
            x: {
                ticks: { color: isDarkTheme.value ? "#fff" : "#333", font:{weight:'500'} },
                grid: { display: false }
            },
            y: {
                type: "linear",
                position: "left",
                ticks: { color: isDarkTheme.value ? "#fff" : "#333" },
                grid: { color: isDarkTheme.value ? "rgba(255,255,255,0.1)" : "#eee" }
            },
            y1: {
                type: "linear",
                position: "right",
                ticks: {
                    color: "#32CD32",          // chữ xanh lá đậm hơn
                    callback: val => val.toFixed(2)+"%"
                },
                grid: { drawOnChartArea: false }
            }

        },
        animation: { duration: 1800, easing: "easeOutQuart" }
    };
}

watch([isDarkTheme], () => buildChart());

onMounted(() => fetchRevenuePeriod());

function applyFilter() { fetchRevenuePeriod(); }

</script>

<template>
<div class="card pb-4">
    <div class="font-semibold text-xl mb-4">Doanh thu theo thời gian</div>

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

    <!-- BIỂU ĐỒ NEON HẦM HỐ -->
    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
</div>
</template>
