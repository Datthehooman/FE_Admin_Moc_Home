<script setup>
import apiClient from '@/api/axios';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { reactive, ref } from 'vue';

const voucherForm = reactive({
    code: '',
    discount_type: null, // 'percent' | 'fixed'
    discount_value: null,
    start_date: null,
    end_date: null,
    usage_limit: null,
    min_order_value: null,
    max_discount_amount: null,
    description: '',
    status: null // 'Hiện' | 'Ẩn'
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

// Validate form
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!voucherForm.code.trim()) errors.code = 'Mã voucher không được để trống.';
    if (!voucherForm.discount_type) errors.discount_type = 'Chọn loại giảm giá.';
    if (voucherForm.discount_value === null || isNaN(voucherForm.discount_value) || voucherForm.discount_value <= 0) errors.discount_value = 'Giá trị giảm phải lớn hơn 0.';
    if (!voucherForm.start_date) errors.start_date = 'Chọn ngày bắt đầu.';
    if (!voucherForm.end_date) errors.end_date = 'Chọn ngày kết thúc.';
    if (voucherForm.start_date && voucherForm.end_date && new Date(voucherForm.start_date) > new Date(voucherForm.end_date)) errors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu.';
    if (voucherForm.usage_limit !== null && (isNaN(voucherForm.usage_limit) || voucherForm.usage_limit <= 0)) errors.usage_limit = 'Số lượt sử dụng phải lớn hơn 0.';
    if (voucherForm.min_order_value !== null && (isNaN(voucherForm.min_order_value) || voucherForm.min_order_value < 0)) errors.min_order_value = 'Giá trị đơn hàng tối thiểu không hợp lệ.';
    if (voucherForm.max_discount_amount !== null && (isNaN(voucherForm.max_discount_amount) || voucherForm.max_discount_amount < 0)) errors.max_discount_amount = 'Giá trị giảm tối đa không hợp lệ.';
    if (!voucherForm.status) errors.status = 'Chọn trạng thái.';

    return !Object.values(errors).some((e) => e);
};

// Submit form
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const payload = {
            code: voucherForm.code,
            discount_type: voucherForm.discount_type,
            discount_value: voucherForm.discount_value,
            start_date: voucherForm.start_date,
            end_date: voucherForm.end_date,
            usage_limit: voucherForm.usage_limit,
            min_order_value: voucherForm.min_order_value,
            max_discount_amount: voucherForm.max_discount_amount,
            description: voucherForm.description,
            status: voucherForm.status === 'Hiện' ? 1 : 0
        };

        const response = await apiClient.post('/voucher', payload);

        alert('Thêm voucher thành công!');
        console.log('Response:', response.data);

        // Reset form
        Object.keys(voucherForm).forEach((key) => (voucherForm[key] = null));
        voucherForm.code = '';
        voucherForm.status = null;
    } catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            alert('Thêm voucher thất bại: ' + JSON.stringify(err.response.data));
        } else {
            console.error(err);
            alert('Thêm voucher thất bại!');
        }
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Thêm Voucher</h2>
        <div class="flex flex-col gap-4">
            <!-- Code -->
            <div class="flex flex-col gap-1 w-full">
                <label for="code">Mã voucher</label>
                <InputText id="code" v-model="voucherForm.code" class="w-full" />
                <span v-if="errors.code" class="text-red-600 text-sm">{{ errors.code }}</span>
            </div>

            <!-- Discount Type and Value -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="discount_type">Loại giảm giá</label>
                    <Dropdown id="discount_type" v-model="voucherForm.discount_type" :options="['percent', 'fixed']" placeholder="Chọn loại giảm" class="w-full" />
                    <span v-if="errors.discount_type" class="text-red-600 text-sm">{{ errors.discount_type }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="discount_value">Giá trị giảm</label>
                    <InputNumber id="discount_value" v-model="voucherForm.discount_value" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.discount_value" class="text-red-600 text-sm">{{ errors.discount_value }}</span>
                </div>
            </div>

            <!-- Start Date & End Date -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="start_date">Ngày bắt đầu</label>
                    <Calendar id="start_date" v-model="voucherForm.start_date" dateFormat="yy-mm-dd" class="w-full" />
                    <span v-if="errors.start_date" class="text-red-600 text-sm">{{ errors.start_date }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="end_date">Ngày kết thúc</label>
                    <Calendar id="end_date" v-model="voucherForm.end_date" dateFormat="yy-mm-dd" class="w-full" />
                    <span v-if="errors.end_date" class="text-red-600 text-sm">{{ errors.end_date }}</span>
                </div>
            </div>

            <!-- Usage limit & Min order -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="usage_limit">Số lượt sử dụng</label>
                    <InputNumber id="usage_limit" v-model="voucherForm.usage_limit" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.usage_limit" class="text-red-600 text-sm">{{ errors.usage_limit }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="min_order_value">Giá trị đơn hàng tối thiểu</label>
                    <InputNumber id="min_order_value" v-model="voucherForm.min_order_value" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.min_order_value" class="text-red-600 text-sm">{{ errors.min_order_value }}</span>
                </div>
            </div>

            <!-- Max discount & Description -->
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-1 w-full">
                    <label for="max_discount_amount">Giá trị giảm tối đa</label>
                    <InputNumber id="max_discount_amount" v-model="voucherForm.max_discount_amount" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.max_discount_amount" class="text-red-600 text-sm">{{ errors.max_discount_amount }}</span>
                </div>

                <div class="flex flex-col gap-1 w-full">
                    <label for="description">Mô tả</label>
                    <InputText id="description" v-model="voucherForm.description" class="w-full" />
                </div>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-1 w-full">
                <label for="status">Trạng thái</label>
                <Dropdown id="status" v-model="voucherForm.status" :options="['Hiện', 'Ẩn']" placeholder="Chọn trạng thái" class="w-full" />
                <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
            </div>

            <!-- Submit -->
            <Button label="Thêm Voucher" icon="pi pi-check" class="mt-4" :loading="loading" @click="submitForm" />
        </div>
    </div>
</template>

<style scoped>
.card.flex-1 {
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>
