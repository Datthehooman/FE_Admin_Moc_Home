<script setup>
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import InputText from "primevue/inputtext";
import FileUpload from "primevue/fileupload";
import Button from "primevue/button";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const categoryId = route.params.id;

const loading = ref(false);
const categoryForm = reactive({
  category_name: "",
  image: null,
});
const errors = reactive({
  category_name: "",
});

// ---------------------- LOAD CATEGORY ----------------------
const loadCategory = async () => {
  loading.value = true;
  try {
    const res = await axios.get(
      `http://api.mocfurni.shop/api/system/category/${categoryId}`,
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    const c = res.data.result.data;
    categoryForm.category_name = c.category_name ?? "";
    categoryForm.image = c.full_image_url ? [c.full_image_url] : [];
  } catch (err) {
    console.error("Lỗi tải danh mục:", err);
  } finally {
    loading.value = false;
  }
};

// ---------------------- VALIDATE ----------------------
const validateForm = () => {
  errors.category_name = "";
  if (!categoryForm.category_name.trim()) errors.category_name = "Tên danh mục không được để trống.";
  return !errors.category_name;
};

// ---------------------- SUBMIT ----------------------
const submitForm = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("category_name", categoryForm.category_name.trim());

    if (categoryForm.image && categoryForm.image.length > 0) {
      const file = categoryForm.image[0];
      if (file instanceof File) formData.append("image", file);
    }

    await axios.post(
      `http://api.mocfurni.shop/api/system/category/${categoryId}`,
      formData,
      { headers: { Authorization: `Bearer ${authStore.token}`, "Content-Type": "multipart/form-data" } }
    );

    alert("✅ Cập nhật danh mục thành công!");
    router.push("/Category/Categories");

  } catch (err) {
    console.error("❌ Lỗi API:", err.response?.data || err);
    alert("❌ Cập nhật thất bại!");
  } finally {
    loading.value = false;
  }
};


// ---------------------- MOUNT ----------------------
onMounted(() => {
  loadCategory();
});
</script>


<template>
  <div class="card flex-1">
    <h2 class="font-semibold text-xl mb-4">Chỉnh sửa Danh Mục</h2>

    <div class="flex flex-col gap-4">
      <!-- Tên danh mục -->
      <div class="flex flex-col gap-1 w-full">
        <label>Tên danh mục</label>
        <InputText v-model="categoryForm.category_name" class="w-full" />
        <span v-if="errors.category_name" class="text-red-600 text-sm">{{ errors.category_name }}</span>
      </div>

      <!-- Hình ảnh -->
      <div class="flex flex-col gap-1 w-full">
        <label>Hình ảnh</label>
        <FileUpload
          v-model="categoryForm.image"
          name="image"
          customUpload
          auto
          :maxFileSize="1000000"
          chooseLabel="Chọn hình"
          removeLabel="Xóa"
          accept="image/*"
        />
      </div>

      <!-- Submit -->
      <Button label="Cập nhật danh mục" class="mt-4" :loading="loading" @click="submitForm" />
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
