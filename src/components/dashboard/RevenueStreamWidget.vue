<script setup>
import { ref, onMounted, watch } from "vue";
import apiClient from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import { useLayout } from "@/layout/composables/layout";

const authStore = useAuthStore();
const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

// ==========================
// 🎯 BỘ LỌC
// ==========================
const fromDate = ref("");
const toDate   = ref("");

// ==========================
// 🎯 DỮ LIỆU
// ==========================
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
// 🎯 BUILD HẦM HỐ LINE CHART
// ==========================
function buildChart() {
  const style = getComputedStyle(document.documentElement);

  // Gradient cho line
  const ctx = document.createElement("canvas").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(30,144,255,0.5)");
  gradient.addColorStop(1, "rgba(30,144,255,0)");

  chartData.value = {
    labels: labels.value,
    datasets: [
      {
        label: "Doanh thu",
        data: values.value,
        borderColor: "#1E90FF",
        backgroundColor: gradient,
        tension: 0.6,           // đường uốn mềm
        fill: true,
        pointRadius: 10,        // điểm nổi bật
        pointHoverRadius: 14,   // hover lớn
        pointBackgroundColor: "#1E90FF",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#1E90FF",
        borderWidth: 3,
        cubicInterpolationMode: 'monotone', // smooth
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: "rgba(0,0,0,0.2)"
      }
    ]
  };

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: "easeOutQuart" },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.dataset.label + ": " + context.parsed.y.toLocaleString("vi-VN") + " ₫";
          }
        }
      },
      legend: {
        labels: { color: style.getPropertyValue("--text-color-secondary") }
      }
    },
    scales: {
      x: {
        ticks: { color: style.getPropertyValue("--text-color-secondary"), font:{weight:'500'} },
        grid: { display: false }
      },
      y: {
        ticks: { color: style.getPropertyValue("--text-color-secondary") },
        grid: { color: style.getPropertyValue("--surface-border") },
        beginAtZero: true
      }
    }
  };
}

// ==========================
// 🎯 WATCH THEME
// ==========================
watch([getPrimary, getSurface, isDarkTheme], () => buildChart());

// ==========================
// 🎯 AUTO LOAD
// ==========================
onMounted(() => fetchSummary());

// ==========================
// 🎯 APPLY FILTER
// ==========================
function applyFilter() {
  fetchSummary();
}
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

    <!-- BIỂU ĐỒ LINE HẦM HỐ -->
    <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
  </div>
</template>
