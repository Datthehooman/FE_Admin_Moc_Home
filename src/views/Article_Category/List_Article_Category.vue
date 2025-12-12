<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { onBeforeMount, ref } from 'vue';

import apiClient from '@/api/axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const categories = ref([]);
const filters = ref(null);
const loading = ref(true);

// GIẢ ĐỊNH cho trường status (tinyint): 1 là Hiện, 0 là Ẩn
const categoryStatuses = [
    { value: 1, label: 'Hiện' },
    { value: 0, label: 'Ẩn' }
];

onBeforeMount(() => {
    loadCategories();
});

// Hàm tải danh sách danh mục
async function loadCategories() {
    loading.value = true;
    try {
        const response = await apiClient.get('/article-categories');

        // CẬP NHẬT CẤU TRÚC DỮ LIỆU: response.data.result.data
        categories.value = response.data?.result?.data || [];

        // Convert date strings to Date objects và đảm bảo status là number
        categories.value.forEach((category) => {
            category.status = Number(category.status);
            if (category.created_at) {
                category.created_at = new Date(category.created_at);
            }
        });
    } catch (err) {
        console.error('Lỗi tải danh mục bài viết:', err);
        categories.value = [];
    } finally {
        loading.value = false;
        initFilters();
    }
}

// Hàm cập nhật trạng thái
const updateCategoryStatus = async (category, newStatus) => {
    // Ép kiểu newStatus thành số
    newStatus = Number(newStatus);
    const statusLabel = categoryStatuses.find((s) => s.value === newStatus)?.label || 'Không xác định';
    if (!confirm(`Chuyển trạng thái danh mục ${category.name} sang "${statusLabel}"?`)) {
        // Nếu hủy, khôi phục lại trạng thái cũ
        await loadCategories();
        return;
    }

    try {
        // 🎉 FIX LỖI: Gửi TOÀN BỘ dữ liệu danh mục hiện tại (bao gồm name, slug, desc,...)
        // Sau đó ghi đè trường status bằng giá trị mới.
        await apiClient.put(`/article-categories/${category.id}`, {
            ...category,
            status: newStatus
        });

        // Cập nhật trạng thái trên giao diện sau khi gọi API thành công
        category.status = newStatus;
        alert('✅ Cập nhật trạng thái thành công!');
    } catch (err) {
        // Phục hồi lại trạng thái cũ nếu lỗi
        console.error('❌ Lỗi cập nhật trạng thái:', err.response?.data || err);
        alert('❌ Không thể cập nhật trạng thái! Vui lòng kiểm tra console.');
        await loadCategories(); // Tải lại danh sách để đảm bảo dữ liệu đúng
    }
};

/**
 * Xóa danh mục
 */
async function deleteCategory(category) {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.name}" không? Thao tác này không thể hoàn tác.`)) return;

    try {
        // Gọi API DELETE tới endpoint /article-categories/{id}
        await apiClient.delete(`/article-categories/${category.id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` } // Truyền token xác thực
        });

        // Xóa danh mục khỏi danh sách trên giao diện
        categories.value = categories.value.filter((c) => c.id !== category.id);
        alert('✅ Xóa danh mục thành công!');
    } catch (err) {
        console.error('❌ Lỗi xóa danh mục:', err.response?.data || err);
        
        // --- BẮT LỖI 409 CỤ THỂ ---
        if (err.response && err.response.status === 409) {
            alert(`❌ KHÔNG THỂ XÓA DANH MỤC! \n\nDanh mục "${category.name}" hiện đang chứa bài viết. \n\nVui lòng xóa hết các bài viết thuộc danh mục này trước khi thực hiện xóa danh mục.`);
        } else {
            alert('❌ Xóa danh mục thất bại! Vui lòng kiểm tra quyền hoặc kết nối.');
        }
        // -----------------------------
    }
}



// Khởi tạo bộ lọc (Không đổi)
function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.EQUALS },
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        slug: { value: null, matchMode: FilterMatchMode.CONTAINS },
        desc: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        created_at: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
}

// Hàm định dạng ngày (Không đổi)
function formatDate(v) {
    if (!v) return '';
    return new Date(v).toLocaleDateString('vi-VN');
}

// Xóa bộ lọc (Không đổi)
function clearFilter() {
    initFilters();
}

// Lấy nhãn trạng thái
function getStatusLabel(status) {
    return categoryStatuses.find((s) => s.value === status)?.label || 'Không xác định';
}

// Lấy mức độ nghiêm trọng cho Tag
function getStatusSeverity(status) {
    return status === 1 ? 'success' : 'danger'; // 1: Hiện (Success), 0: Ẩn (Danger)
}

// Hàm chuyển hướng đến trang chi tiết/sửa
function navigateToEdit(id) {
    router.push(`/Article_Category/Edit_Article_Category/${id}`);
}
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Danh Sách Danh Mục Bài Viết</h2>

        <DataTable
            :value="categories"
            :paginator="true"
            :rows="10"
            dataKey="id"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :globalFilterFields="['id', 'name', 'slug']"
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
                    <Button type="button" icon="pi pi-filter-slash" label="Xoá lọc" outlined @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters.global.value" placeholder="Tìm kiếm danh mục..." />
                    </IconField>
                </div>
            </template>

            <template #empty>Không có danh mục nào.</template>
            <template #loading>Đang tải dữ liệu...</template>

            <Column field="id" header="ID" style="min-width: 5rem" sortable filterField="id">
                <template #body="{ data }">
                    {{ data.id }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo ID" />
                </template>
            </Column>

            <Column field="name" header="Name" style="min-width: 12rem" sortable>
                <template #body="{ data }">
                    {{ data.name }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo tên..." />
                </template>
            </Column>

            <Column field="slug" header="Slug" style="min-width: 12rem" sortable>
                <template #body="{ data }">
                    {{ data.slug }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo slug..." />
                </template>
            </Column>

            <Column field="desc" header="Mô tả" style="min-width: 18rem">
                <template #body="{ data }">
                    <div style="white-space: normal; word-break: break-word; max-height: 4em; overflow: hidden; text-overflow: ellipsis">
                        {{ data.desc }}
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Tìm theo mô tả..." />
                </template>
            </Column>

            <Column header="Trạng thái" style="min-width: 10rem" field="status" sortable filterField="status">
                <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="categoryStatuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" showClear />
                </template>
            </Column>

            <Column header="Ngày tạo" style="min-width: 10rem" field="created_at" sortable dataType="date" filterField="created_at">
                <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="dd/mm/yyyy" />
                </template>
            </Column>

            <Column header="Cập nhật" style="min-width: 10rem" field="updated_at" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.updated_at) }}
                </template>
            </Column>

            <Column header="Hành động" style="min-width: 15rem" :sortable="false"> <template #body="{ data }">
                    <div class="flex gap-2 items-center">
                        <Button icon="pi pi-pencil" text severity="warning" @click="navigateToEdit(data.id)" />
                        <Button icon="pi pi-trash" text severity="danger" @click="deleteCategory(data)" /> 

                        <Select :options="categoryStatuses" optionLabel="label" optionValue="value" v-model="data.status" @change="updateCategoryStatus(data, data.status)" class="w-full">
                            <template #value="{ value }">
                                <span>{{ getStatusLabel(value) }}</span>
                            </template>
                            <template #option="{ option }">
                                {{ getStatusLabel(option.value) }}
                            </template>
                        </Select>
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
