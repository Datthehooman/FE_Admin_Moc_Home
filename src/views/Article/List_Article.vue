<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { onBeforeMount, ref } from 'vue';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const articles = ref([]);
const filters = ref(null);
const loading = ref(true);

const articleStatuses = [
    { label: 'Hiển thị', value: 1 },
    { label: 'Ẩn', value: 0 }
];

onBeforeMount(() => {
    // Khởi tạo bộ lọc trước khi tải dữ liệu
    initFilters();
    // Tải dữ liệu ban đầu
    loadArticles();
});

/**
 * Tải danh sách bài viết từ API
 */
async function loadArticles() {
    loading.value = true;
    try {
        // Sử dụng apiClient.get('/articles') tương tự như List_Order.vue
        const response = await apiClient.get('/articles');

        // Cấu trúc dữ liệu API trả về: response.data.result.data
        articles.value = response.data?.result?.data || [];

        // Chuyển đổi chuỗi ngày thành đối tượng Date để PrimeVue có thể sắp xếp/lọc Date
        articles.value.forEach((article) => {
            if (article.created_at) {
                // Thêm 'Z' để đảm bảo Date() hiểu đây là UTC/GMT, tránh sai lệch múi giờ
                article.created_at = new Date(article.created_at.endsWith('Z') ? article.created_at : article.created_at + 'Z');
            }
        });
    } catch (err) {
        console.error('Lỗi tải bài viết:', err);
        articles.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * Khởi tạo/Thiết lập lại bộ lọc
 */
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        title: { value: null, matchMode: FilterMatchMode.CONTAINS },
        admin_id: { value: null, matchMode: FilterMatchMode.EQUALS }, // Giả sử admin_id là tìm kiếm chính xác
        created_at: { value: null, matchMode: FilterMatchMode.DATE_IS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS } // Dùng EQUALS cho lọc 1 giá trị hoặc IN cho MultiSelect
    };
}

/**
 * Xóa tất cả bộ lọc
 */
function clearFilter() {
    initFilters();
}

/**
 * Format ngày tháng năm
 */
function formatDate(date) {
    if (!date) return '';
    if (!(date instanceof Date) || isNaN(date)) return '';
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
        // Không dùng giờ/phút để đồng bộ với cách hiển thị trong List_Order (chỉ ngày)
    });
}

/**
 * Xóa bài viết
 */
async function deleteArticle(article) {
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${article.title}" không?`)) return;

    try {
        // Cần thay thế bằng endpoint DELETE thực tế nếu có
        // Giả lập call API DELETE
        await apiClient.delete(`/articles/${article.id}`);

        // Xóa khỏi danh sách client-side sau khi xóa thành công trên server
        articles.value = articles.value.filter((a) => a.id !== article.id);
        alert('✅ Xóa bài viết thành công!');
    } catch (err) {
        console.error('❌ Lỗi xóa bài viết:', err.response?.data || err);
        alert('❌ Xóa bài viết thất bại!');
    }
}
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Bài Viết</h2>

        <DataTable
            :value="articles"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :globalFilterFields="['title']"
            showGridlines
            scrollable
            scrollHeight="500px"
            rowHover
            tableStyle="min-width: 70rem"
            sortMode="multiple"
            :removableSort="true"
        >
            <template #header>
                <div class="flex justify-between">
                    <div class="flex gap-2">
                        <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="clearFilter()" />
                    </div>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm bài viết..." />
                    </IconField>
                </div>
            </template>

            <template #empty>Không có bài viết nào.</template>
            <template #loading>Đang tải dữ liệu...</template>

            <Column header="Hình ảnh" style="min-width: 8rem" class="text-center">
                <template #body="{ data }">
                    <div class="w-16 h-16 mx-auto flex items-center justify-center rounded-lg shadow-md overflow-hidden bg-gray-100">
                        <img
                            :src="data.image || 'https://placehold.co/100x100/94a3b8/ffffff?text=No+Img'"
                            class="w-full h-full object-cover"
                            :alt="data.title"
                            onerror="this.onerror=null;this.src='https://placehold.co/100x100/94a3b8/ffffff?text=No+Img';"
                        />
                    </div>
                </template>
            </Column>

            <Column field="title" header="Tiêu đề" sortable style="min-width: 20rem">
                <template #body="{ data }">
                    <span class="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer" @click="router.push(`/Article/Edit_Article/${data.id}`)">{{ data.title }}</span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm kiếm tiêu đề" />
                </template>
            </Column>

            <Column field="admin_id" header="Người đăng (ID)" sortable style="min-width: 8rem" class="text-center">
                <template #body="{ data }">ID: {{ data.admin_id }}</template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo ID" />
                </template>
            </Column>

            <Column field="created_at" header="Ngày đăng" sortable style="min-width: 12rem" dataType="date" filterField="created_at">
                <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" />
                </template>
            </Column>

            <Column field="status" header="Trạng thái" sortable style="min-width: 10rem" class="text-center" filterField="status">
                <template #body="{ data }">
                    <Tag :value="Number(data.status) === 1 ? 'Hiển thị' : 'Ẩn'" :severity="Number(data.status) === 1 ? 'success' : 'danger'" class="font-semibold text-sm" />
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="articleStatuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" showClear />
                </template>
            </Column>

            <Column header="Hành động" style="min-width: 10rem" class="text-center" :sortable="false">
                <template #body="{ data }">
                    <div class="flex gap-2 justify-center">
                        <Button icon="pi pi-pencil" label="Sửa" text severity="primary" @click="router.push(`/Article/Edit_Article/${data.id}`)" />
                        <Button icon="pi pi-trash" label="Xóa" text severity="danger" @click="deleteArticle(data)" />
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
