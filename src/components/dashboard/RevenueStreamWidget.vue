<script setup>
import { ref, onMounted, watch } from "vue";
import apiClient from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import { useLayout } from "@/layout/composables/layout";

const authStore = useAuthStore();
const { isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

const fromDate = ref("");
const toDate = ref("");

const labels = ref(["Doanh thu gộp", "Doanh thu thuần"]);
const values = ref([]);

// ==========================
// 🎯 GỌI API
// ==========================
async function fetchSummary() {
  try {
    const res = await apiClient.get(
      "https://api.mocfurni.shop/api/system/dashboard/summary",
      {
        params: {
          from_date: fromDate.value || undefined,
          to_date: toDate.value || undefined
        },
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );
    const data = res.data.result.data;
    values.value = [data.gross_revenue.value, data.net_revenue.value];

    buildChart();
  } catch (err) {
    console.error("Summary Chart Error:", err);
  }
}

// ==========================
// 🎯 BUILD BAR CHART NEON
// ==========================
function buildChart() {
//   const ctx = document.createElement("canvas").getContext("2d");

//   // 🌊 Gradient xanh dương — Doanh thu gộp
//   const gradientBlue = ctx.createLinearGradient(0, 0, 0, 300);
//   gradientBlue.addColorStop(0, "rgba(0,128,255,0.9)");
//   gradientBlue.addColorStop(1, "rgba(0,128,255,0.3)");

//   // 🔥 Gradient cam — Doanh thu thuần
//   const gradientOrange = ctx.createLinearGradient(0, 0, 0, 300);
//   gradientOrange.addColorStop(0, "rgba(255,140,0,0.9)");
//   gradientOrange.addColorStop(1, "rgba(255,140,0,0.3)");

  chartData.value = {
    labels: labels.value,
    datasets: [
  {
    label: "Doanh thu",
    data: values.value,
    backgroundColor: [
      "#1e88e5", // xanh dương
      "#fb8c00"  // cam
    ],
    hoverBackgroundColor: [
      "#1565c0",
      "#ef6c00"
    ],
    barThickness: 50,
    barPercentage: 0.6,
    borderRadius: 0,
    borderSkipped: false
  }
]

  };

  chartOptions.value = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) =>
            context.dataset.label + ": " + context.parsed.y.toLocaleString("vi-VN") + " ₫"
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
    animation: { duration: 1500, easing: "easeOutQuart" }
  };
}

watch([isDarkTheme], () => buildChart());
onMounted(() => fetchSummary());
function applyFilter() { fetchSummary(); }
</script>

<template>
<div class="card pb-4">
  <div class="font-semibold text-xl mb-4">Doanh thu tổng hợp</div>

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

  <!-- BIỂU ĐỒ CỘT NEON -->
  <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
</div>
</template>
