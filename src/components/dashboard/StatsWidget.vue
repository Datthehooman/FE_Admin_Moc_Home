<script setup>
import { ref, onMounted } from "vue";
import apiClient from "@/api/axios";
import { useAuthStore } from "@/stores/auth";
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, BarElement } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, BarElement);

const authStore = useAuthStore();

// ---- STATE ----
const orders = ref(0);
const revenue = ref(0);
const revenueGrowth = ref(0);
const customers = ref(0);
const successRate = ref(0);

const newOrders = ref(0);
const newCustomers = ref(0);
const responded = ref(0);

// helper: tạo mảng ngày từ from → to
function generateDates(from, to) {
  const dates = [];
  let current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    dates.push(current.getDate()); // chỉ lấy ngày để hiển thị trên chart
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---- LOAD DATA ----
onMounted(async () => {
  await fetchSummary();
  await fetchCustomerRegion();
});

// ---- FETCH SUMMARY ----
async function fetchSummary() {
  try {
    const res = await apiClient.get(
      "https://api.mocfurni.shop/api/system/dashboard/summary",
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    const result = res.data.result;
    const d = result.data;

    orders.value = d.total_orders.value;
    revenue.value = d.gross_revenue.value;
    revenueGrowth.value = d.gross_revenue.growth;
    successRate.value = d.order_status_rate.success_percent;
    responded.value = d.order_status_rate.success_count;
    newOrders.value = orders.value;

  } catch (err) {
    console.error("Summary Error:", err);
  }
}

// ---- FETCH CUSTOMERS ----
async function fetchCustomerRegion() {
  try {
    const res = await apiClient.get(
      "https://api.mocfurni.shop/api/system/dashboard/customer-by-region",
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    const result = res.data.result;
    customers.value = result.data.summary.total_customers ?? 0;
    newCustomers.value = customers.value;

  } catch (err) {
    console.error("Customer Region Error:", err);
  }
}
</script>

<template>
  <!-- CARD 1 - Orders -->
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4">Tổng số đơn hàng</span>
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ orders }}</div>
        </div>
        <div class="flex items-center justify-center bg-blue-100 rounded-border" style="width:2.5rem;height:2.5rem">
          <i class="pi pi-shopping-cart text-blue-500 !text-xl"></i>
        </div>
      </div>
      <span class="text-primary font-medium">{{ newOrders }}</span>
      <span class="text-muted-color"> Đơn mới so với tháng trước</span>
      <!-- <div class="mt-2 h-12"> -->
        <!-- <Chart v-if="miniOrdersChart" type="line" :data="miniOrdersChart"
          :options="{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}}}"
          class="w-full h-12"/> -->
      <!-- </div> -->
    </div>
  </div>

  <!-- CARD 2 - Revenue -->
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4">Doanh thu</span>
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ revenue.toLocaleString() }}₫</div>
        </div>
        <div class="flex items-center justify-center bg-orange-100 rounded" style="width:2.5rem;height:2.5rem">
          <i class="pi pi-dollar text-orange-500 !text-xl"></i>
        </div>
      </div>
      <span class="text-primary font-medium">%{{ revenueGrowth }}</span>
      <span class="text-muted-color"> so với tháng trước</span>
      <!-- <div class="mt-2 h-12"> -->
        <!-- <Chart v-if="miniRevenueChart" type="line" :data="miniRevenueChart"
          :options="{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}}}"
          class="w-full h-12"/> -->
      <!-- </div> -->
    </div>
  </div>

  <!-- CARD 3 - Customers -->
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4">Khách hàng</span>
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ customers }}</div>
        </div>
        <div class="flex items-center justify-center bg-cyan-100 rounded-border" style="width:2.5rem;height:2.5rem">
          <i class="pi pi-users text-cyan-500 !text-xl"></i>
        </div>
      </div>
      <span class="text-primary font-medium">{{ newCustomers }}</span>
      <span class="text-muted-color">Khách mới</span>
      <!-- <div class="mt-2 h-12"> -->
        <!-- <Chart v-if="miniCustomersChart" type="line" :data="miniCustomersChart"
          :options="{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}}}"
          class="w-full h-12"/> -->
      <!-- </div> -->
    </div>
  </div>

  <!-- CARD 4 - Success Rate -->
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4">Tỉ lệ đơn thành công</span>
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ successRate }}%</div>
        </div>
        <div class="flex items-center justify-center bg-purple-100 rounded-border" style="width:2.5rem;height:2.5rem">
          <i class="pi pi-check-circle text-purple-500 !text-xl"></i>
        </div>
      </div>
      <span class="text-primary font-medium">{{ responded }}</span>
      <span class="text-muted-color">Đơn xử lý</span>
      <!-- <div class="mt-2 h-12"> -->
        <!-- <Chart v-if="miniSuccessChart" type="bar" :data="miniSuccessChart"
          :options="{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}}}"
          class="w-full h-12"/> -->
      <!-- </div> -->
    </div>
  </div>
</template>
