<template>
    <div class="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800">Thêm Voucher</h2>
        <form class="space-y-6">
            <!-- Code -->
            <div>
                <label class="block text-gray-700 font-medium mb-1">Mã voucher</label>
                <InputText v-model="code" class="w-full" />
                <span v-if="errors.code" class="text-red-600 text-sm">{{ errors.code }}</span>
            </div>

            <!-- Discount Type & Value -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Loại giảm giá</label>
                    <Dropdown v-model="voucherForm.discount_type" :options="['percent', 'fixed']" placeholder="Chọn loại giảm" class="w-full" />
                    <span v-if="errors.discount_type" class="text-red-600 text-sm">{{ errors.discount_type }}</span>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Giá trị giảm (%)</label>
                    <InputNumber v-model="voucherForm.discount_value" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.discount_value" class="text-red-600 text-sm">{{ errors.discount_value }}</span>
                </div>
            </div>

            <!-- Start & End Date -->
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

            <!-- Usage & Min order -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Số lượt sử dụng</label>
                    <InputNumber v-model="voucherForm.usage_limit" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.usage_limit" class="text-red-600 text-sm">{{ errors.usage_limit }}</span>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Giá trị đơn hàng tối thiểu</label>
                    <InputNumber v-model="voucherForm.min_order_value" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.min_order_value" class="text-red-600 text-sm">{{ errors.min_order_value }}</span>
                </div>
            </div>

            <!-- Max discount & Description -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Giá trị giảm tối đa</label>
                    <InputNumber v-model="voucherForm.max_discount_amount" mode="decimal" min="0" class="w-full" />
                    <span v-if="errors.max_discount_amount" class="text-red-600 text-sm">{{ errors.max_discount_amount }}</span>
                </div>
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Mô tả</label>
                    <InputText v-model="description" class="w-full" />
                </div>
            </div>

            <!-- Status -->
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

            <!-- Submit -->
            <div class="flex justify-end">
                <Button label="Thêm Voucher" icon="pi pi-check" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg" :loading="loading" @click.prevent="submitForm" />
            </div>
        </form>
    </div>
</template>

<script setup>
import apiClient from '@/api/axios';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { reactive, ref } from 'vue';

const toast = useToast();

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

const validateForm = () => {
    Object.keys(errors).forEach((k) => (errors[k] = ''));

    if (!code.value.trim()) errors.code = 'Mã voucher không được để trống.';
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

const submitForm = async () => {
    if (!validateForm()) return;
    loading.value = true;
    try {
        const payload = {
            code: code.value,
            discount_type: voucherForm.discount_type,
            discount_value: voucherForm.discount_value,
            start_date: voucherForm.start_date,
            end_date: voucherForm.end_date,
            usage_limit: voucherForm.usage_limit,
            min_order_value: voucherForm.min_order_value,
            max_discount_amount: voucherForm.max_discount_amount,
            description: description.value,
            status: voucherForm.status
        };
        const response = await apiClient.post('/voucher', payload);
        toast.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm voucher thành công!',
            life: 3000
        });
        console.log(response.data);

        // Reset
        code.value = '';
        description.value = '';
        Object.keys(voucherForm).forEach((k) => (voucherForm[k] = null));
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thêm voucher thất bại: ' + (err.response ? JSON.stringify(err.response.data) : err.message),
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.p-inputtext,
.p-dropdown,
.p-calendar,
.p-inputnumber {
    min-height: 2.5rem;
}
</style>
