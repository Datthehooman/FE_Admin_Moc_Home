<script setup>
import apiClient from '@/api/axios';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const voucherId = route.params.id;

const loading = ref(false);

const voucherForm = reactive({
    discount_value: 0,
    end_date: null,
    status: 0,
    code: ''
});

const errors = reactive({
    discount_value: '',
    end_date: '',
    status: '',
    code: ''
});

// ---------------------- LOAD VOUCHER ----------------------
const loadVoucher = async () => {
    loading.value = true;
    try {
        const res = await apiClient.get(`/voucher/${voucherId}`);
        const v = res.data.result.data;
        voucherForm.discount_value = Number(v.discount_value) || 0;
        voucherForm.end_date = v.end_date ?? null;
        voucherForm.status = v.status ?? 'inactive';
        voucherForm.code = v.code ?? '';
    } catch (err) {
        console.error('Lỗi tải voucher:', err);
    } finally {
        loading.value = false;
    }
};

// ---------------------- VALIDATE ----------------------
const validateForm = () => {
    Object.keys(errors).forEach((key) => (errors[key] = ''));

    if (!voucherForm.discount_value || Number(voucherForm.discount_value) <= 0) errors.discount_value = 'Giá trị giảm giá phải lớn hơn 0.';
    if (!voucherForm.end_date) errors.end_date = 'Vui lòng chọn ngày kết thúc.';
    if (voucherForm.status === null) errors.status = 'Vui lòng chọn trạng thái.';
    if (!voucherForm.code.trim()) errors.code = 'Mã voucher không được để trống.';

    return !Object.values(errors).some((e) => e);
};

// ---------------------- SUBMIT ----------------------
const submitForm = async () => {
    if (!validateForm()) return;

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append('discount_value', voucherForm.discount_value);
        formData.append('end_date', voucherForm.end_date);
        formData.append('status', voucherForm.status);
        formData.append('code', voucherForm.code);

        await apiClient.post(`/voucher/${voucherId}?_method=POST`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        alert('✅ Cập nhật voucher thành công!');
        router.push('/Voucher/List_Voucher');
    } catch (err) {
        console.error('❌ Lỗi API:', err.response?.data);
        alert('❌ Cập nhật thất bại!');
    } finally {
        loading.value = false;
    }
};

// ---------------------- MOUNT ----------------------
onMounted(() => {
    loadVoucher();
});
</script>

<template>
    <div class="card flex-1">
        <h2 class="font-semibold text-xl mb-4">Chỉnh sửa Voucher</h2>

        <div class="flex flex-col gap-4">
            <!-- Discount Value -->
            <div class="flex flex-col gap-1 w-full">
                <label>Giá trị giảm giá</label>
                <InputText v-model="voucherForm.discount_value" type="number" class="w-full" />
                <span v-if="errors.discount_value" class="text-red-600 text-sm">{{ errors.discount_value }}</span>
            </div>

            <!-- End Date -->
            <div class="flex flex-col gap-1 w-full">
                <label>Ngày kết thúc</label>
                <Calendar v-model="voucherForm.end_date" date-format="yy-mm-dd" class="w-full" />
                <span v-if="errors.end_date" class="text-red-600 text-sm">{{ errors.end_date }}</span>
            </div>

            <!-- Status -->
            <div class="flex flex-col gap-1 w-full">
                <label>Trạng thái</label>
               <Dropdown
    v-model="voucherForm.status"
    :options="[
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
    ]"
    optionLabel="label"
    optionValue="value"
    placeholder="Chọn trạng thái"
    class="w-full"
/>

                <span v-if="errors.status" class="text-red-600 text-sm">{{ errors.status }}</span>
            </div>

            <!-- Code -->
            <div class="flex flex-col gap-1 w-full">
                <label>Mã voucher</label>
                <InputText v-model="voucherForm.code" class="w-full" />
                <span v-if="errors.code" class="text-red-600 text-sm">{{ errors.code }}</span>
            </div>

            <!-- Submit -->
            <Button label="Cập nhật voucher" class="mt-4" :loading="loading" @click="submitForm" />
        </div>
    </div>
</template>

<style scoped>
.card.flex-1 {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}
</style>
