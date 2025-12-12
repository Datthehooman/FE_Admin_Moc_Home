<script setup>
import apiClient from '@/api/axios';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const voucherId = route.params.id;

const code = ref('');
const description = ref('');

const voucherForm = reactive({
    discount_type: null,
    discount_value: null,
    start_date: null,
    end_date: null,
    usage_limit: null,
    min_order_value: null,
    max_discount_amount: null,
    status: null
});

const errors = reactive({
    code: '',
    discount_type: '',
    discount_value: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    min_order_value: '',
    max_discount_amount: '',
    description: '',
    status: ''
});

const loading = ref(false);

// ---------------------- LOAD VOUCHER ----------------------
const loadVoucher = async () => {
    loading.value = true;
    try {
        const res = await apiClient.get(`/voucher/${voucherId}`);
        const v = res.data.result.data;

        code.value = v.code ?? '';
        description.value = v.description ?? '';
        voucherForm.discount_type = v.discount_type ?? null;
        voucherForm.discount_value = v.discount_value ?? null;
        voucherForm.start_date = v.start_date ? new Date(v.start_date) : null;
        voucherForm.end_date = v.end_date ? new Date(v.end_date) : null;
        voucherForm.usage_limit = v.usage_limit ?? null;
        voucherForm.min_order_value = v.min_order_value ?? null;
        voucherForm.max_discount_amount = v.max_discount_amount ?? null;
        voucherForm.status = v.status ?? null;
    } catch (err) {
        console.error('Lỗi tải voucher:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tải được voucher!',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// ---------------------- VALIDATE CƠ BẢN ----------------------
const validateForm = () => {
    Object.keys(errors).forEach((k) => (errors[k] = ''));

    if (!code.value.trim()) errors.code = 'Mã voucher không được để trống.';
    if (!voucherForm.discount_type) errors.discount_type = 'Chọn loại giảm giá.';
    if (voucherForm.discount_value === null || voucherForm.discount_value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0.';
    if (!voucherForm.start_date) errors.start_date = 'Chọn ngày bắt đầu.';
    if (!voucherForm.end_date) errors.end_date = 'Chọn ngày kết thúc.';
    if (voucherForm.start_date && voucherForm.end_date && new Date(voucherForm.start_date) > new Date(voucherForm.end_date)) errors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu.';
    if (!voucherForm.status) errors.status = 'Chọn trạng thái.';

    return !Object.values(errors).some((e) => e);
};

// ---------------------- SUBMIT FORM ----------------------
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const payload = {
            code: code.value,
            discount_type: voucherForm.discount_type,
            discount_value: voucherForm.discount_value,
            start_date: voucherForm.start_date ? voucherForm.start_date.toISOString() : null,
            end_date: voucherForm.end_date ? voucherForm.end_date.toISOString() : null,
            usage_limit: voucherForm.usage_limit,
            min_order_value: voucherForm.min_order_value,
            max_discount_amount: voucherForm.max_discount_amount,
            description: description.value,
            status: voucherForm.status
        };

        await apiClient.post(`/voucher/${voucherId}`, payload);

        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật voucher thành công!',
            life: 3000
        });

        router.push('/Voucher/List_Voucher');
    } catch (err) {
        console.error(err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật voucher thất bại!',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadVoucher();
});
</script>

<template>
<div class="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
    <h2 class="text-2xl font-semibold mb-6 text-gray-800">Chỉnh sửa Voucher</h2>
    <form class="space-y-6">
        <div>
            <label class="block text-gray-700 font-medium mb-1">Mã voucher</label>
            <InputText v-model="code" class="w-full" />
            <span v-if="errors.code" class="text-red-600 text-sm">{{ errors.code }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-700 font-medium mb-1">Loại giảm giá</label>
                <Dropdown
                    v-model="voucherForm.discount_type"
                    :options="[
                        { label: 'Phần trăm', value: 'percent' },
                        { label: 'Cố định', value: 'fixed' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Chọn loại giảm"
                    class="w-full"
                />
                <span v-if="errors.discount_type" class="text-red-600 text-sm">{{ errors.discount_type }}</span>
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Giá trị giảm</label>
                <InputNumber v-model="voucherForm.discount_value" mode="decimal" min="0" class="w-full" />
                <span v-if="errors.discount_value" class="text-red-600 text-sm">{{ errors.discount_value }}</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-700 font-medium mb-1">Ngày bắt đầu</label>
                <Calendar v-model="voucherForm.start_date" dateFormat="yy-mm-dd" class="w-full" />
                <span v-if="errors.start_date" class="text-red-600 text-sm">{{ errors.start_date }}</span>
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Ngày kết thúc</label>
                <Calendar v-model="voucherForm.end_date" dateFormat="yy-mm-dd" class="w-full" />
                <span v-if="errors.end_date" class="text-red-600 text-sm">{{ errors.end_date }}</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-700 font-medium mb-1">Số lượt sử dụng</label>
                <InputNumber v-model="voucherForm.usage_limit" mode="decimal" min="0" class="w-full" />
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Giá trị đơn hàng tối thiểu</label>
                <InputNumber v-model="voucherForm.min_order_value" mode="decimal" min="0" class="w-full" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-gray-700 font-medium mb-1">Giá trị giảm tối đa</label>
                <InputNumber v-model="voucherForm.max_discount_amount" mode="decimal" min="0" class="w-full" />
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Mô tả</label>
                <InputText v-model="description" class="w-full" />
            </div>
        </div>

        <div>
            <label class="block text-gray-700 font-medium mb-1">Trạng thái</label>
            <Dropdown
                v-model="voucherForm.status"
                :options="[
                    { label: 'Hoạt động', value: 'active' },
                    { label: 'Ngưng hoạt động', value: 'inactive' }
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Chọn trạng thái"
                class="w-full"
            />
            <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
        </div>

        <div class="flex justify-end">
            <Button
                label="Cập nhật Voucher"
                icon="pi pi-check"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                :loading="loading"
                @click.prevent="submitForm"
            />
        </div>
    </form>
</div>
</template>

<style scoped>
.p-inputtext,
.p-dropdown,
.p-calendar,
.p-inputnumber {
    min-height: 2.5rem;
}
</style>
