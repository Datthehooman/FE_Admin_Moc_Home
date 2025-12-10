<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

// Khai báo state
const { getPrimary, getSurface, isDarkTheme } = useLayout();
const chartData = ref(null);
const chartOptions = ref(null);
const loading = ref(true); 

// --- Biến trạng thái cho tham số API ---
const fromDate = ref('2025-11-01'); 
const toDate = ref('2025-11-30');   
const groupBy = ref('day');        

// Đường dẫn API của bạn
const API_URL = 'http://127.0.0.1:8000/api/system/dashboard/revenue-by-period';
/**
 * Hàm lấy dữ liệu từ API và xử lý
 */
async function fetchRevenueData() {
    loading.value = true;
    try {
        const params = new URLSearchParams({
            from_date: fromDate.value,
            to_date: toDate.value,
            group_by: groupBy.value
        }).toString();
        
        // --- KHẮC PHỤC LỖI: Lấy token ngay tại đây ---
        const authToken = localStorage.getItem('authToken'); 
        // ---------------------------------------------

        const headers = {
            'Content-Type': 'application/json',
        };

        // Chỉ thêm header Authorization nếu token tồn tại
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}?${params}`, {
            method: 'GET',
            headers: headers
        });

        // Xử lý lỗi HTTP (ví dụ: 401, 500)
        if (!response.ok) {
            const errorText = await response.text(); 
            console.error(`HTTP Error! Status: ${response.status}`, errorText);
            throw new Error(`Server returned status ${response.status}. Please check authentication or server logs.`);
        }

        const result = await response.json();
        
        if (result.status && result.result && result.result.data) {
            const apiData = result.result.data;
            
            const labels = apiData.map(item => item.period); 
            // Chia cho 1M để dễ đọc
            const netRevenueData = apiData.map(item => item.net_revenue / 1000000); 
            const totalOrdersData = apiData.map(item => item.total_orders); 

            // Thiết lập dữ liệu biểu đồ
            setChartData(labels, netRevenueData, totalOrdersData);
        } else {
            console.error('API returned an error or missing data:', result.message);
            setChartData([], [], []);
        }
    } catch (error) {
        // Bắt lỗi ReferenceError, SyntaxError (invalid JSON) và lỗi throw từ HTTP check
        console.error('Error fetching revenue data:', error.message);
        setChartData([], [], []); // Đảm bảo biểu đồ trống khi có lỗi
    } finally {
        loading.value = false;
    }
}

/**
 * Thiết lập dữ liệu cho biểu đồ (Dạng Line Chart)
 */
function setChartData(labels, netRevenueData, totalOrdersData) {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500');
    // Chọn màu thứ cấp khác cho đường thứ hai để phân biệt
    const secondaryColor = documentStyle.getPropertyValue('--p-cyan-500'); 

    chartData.value = {
        labels: labels,
        datasets: [
            {
                // --- CẬP NHẬT: Type là 'line' cho cả hai datasets ---
                type: 'line',
                label: 'Doanh thu thuần (Triệu VND)',
                borderColor: primaryColor,
                borderWidth: 3, // Đường dày hơn
                fill: false,
                data: netRevenueData,
                tension: 0.4,
                yAxisID: 'y' // Trục Y bên trái (Doanh thu)
            },
            {
                type: 'line', 
                label: 'Tổng đơn hàng',
                borderColor: secondaryColor,
                borderWidth: 3,
                borderDash: [5, 5], // Thêm nét đứt để dễ phân biệt
                fill: false,
                data: totalOrdersData,
                tension: 0.4,
                yAxisID: 'y1' // Trục Y bên phải (Đơn hàng)
            }
        ]
    };
}

/**
 * Thiết lập tùy chọn cho biểu đồ (giữ nguyên cấu hình hai trục Y)
 */
function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    color: textMutedColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: { // Trục Y cho Doanh thu thuần
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Doanh thu (Triệu VND)',
                    color: textMutedColor
                },
                ticks: {
                    color: textMutedColor,
                    callback: function(value) {
                        return value.toLocaleString('vi-VN'); 
                    }
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            },
            y1: { // Trục Y phụ cho Tổng đơn hàng
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Tổng đơn hàng',
                    color: textMutedColor
                },
                ticks: {
                    color: textMutedColor,
                    stepSize: 1 
                },
                grid: {
                    drawOnChartArea: false // Không vẽ lưới cho trục Y phụ
                }
            }
        }
    };
}

// Watch theme change to re-render chart styles
watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = setChartOptions(); 
    if (chartData.value) {
        setChartData(
            chartData.value.labels, 
            chartData.value.datasets[0].data, 
            chartData.value.datasets[1].data
        );
    }
});

// Watcher để gọi lại API khi các biến tham số thay đổi
watch([fromDate, toDate, groupBy], () => {
    fetchRevenueData();
});

// Khi component được mount, gọi API lần đầu
onMounted(() => {
    fetchRevenueData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">📈 Xu hướng Doanh thu & Đơn hàng theo Thời gian</div>
        
        <div class="p-field p-grid mb-4">
            <div class="p-col">
                <label for="fromDate">Từ ngày</label>
                <input id="fromDate" type="date" v-model="fromDate" class="p-inputtext p-component p-2 w-full" />
            </div>
            <div class="p-col">
                <label for="toDate">Đến ngày</label>
                <input id="toDate" type="date" v-model="toDate" class="p-inputtext p-component p-2 w-full" />
            </div>
            <div class="p-col">
                <label for="groupBy">Nhóm theo</label>
                <select id="groupBy" v-model="groupBy" class="p-inputtext p-component p-2 w-full">
                    <option value="day">Ngày</option>
                    <option value="month">Tháng</option>
                    <option value="year">Năm</option>
                </select>
            </div>
        </div>

        <template v-if="!loading">
            <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
        </template>
        
        <template v-else>
            <div class="h-80 flex align-items-center justify-content-center">
                <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                <span class="ml-3">Đang tải dữ liệu...</span>
            </div>
        </template>
    </div>
</template>