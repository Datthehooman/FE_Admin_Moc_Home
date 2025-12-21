<template>
  <div class="card flex-1 flex gap-6 min-h-screen">

    <!-- DANH SÁCH CONVERSATION -->
    <aside class="w-[30%] border-r border-gray-200 p-4">
      <h2 class="font-semibold text-xl mb-4">Người dùng</h2>

      <InputText
        v-model="searchKeyword"
        placeholder="Tìm kiếm người dùng..."
        class="w-full mb-4"
        @input="searchConversation"
      />

      <div class="space-y-2 max-h-[600px] overflow-y-auto custom-scroll">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          @click="selectConversation(conv)"
          :class="['p-2 rounded cursor-pointer flex items-center gap-3',
                   selectedConversation?.id === conv.id ? 'bg-blue-100' : 'hover:bg-gray-100']"
        >
          <div class="w-10 h-10 rounded-full bg-[#6E4E37] text-white flex items-center justify-center font-bold">
            {{ conv.user.full_name[0] }}
          </div>
          <div class="flex-1 flex flex-col">
            <span class="font-medium">{{ conv.user.full_name }}</span>
            <span class="text-xs text-gray-500 truncate">
              {{ conv.last_message?.message || 'Chưa có tin nhắn' }}
            </span>
          </div>
          <div v-if="!conv.is_read_by_admin" class="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </aside>

    <!-- CHAT BOX -->
    <main class="flex-1 flex flex-col p-4">
      <div v-if="selectedConversation" class="flex-1 flex flex-col border rounded-xl shadow overflow-hidden">

        <!-- HEADER -->
        <div class="flex items-center justify-between p-3 border-b bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#6E4E37] text-white flex items-center justify-center font-bold">
              {{ selectedConversation.user.full_name[0] }}
            </div>
            <span class="font-semibold">{{ selectedConversation.user.full_name }}</span>
          </div>
        </div>

        <!-- MESSAGES -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll max-h-[500px]"
        >
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex items-end gap-2"
            :class="msg.is_admin_sender ? 'justify-end' : 'justify-start'"
          >
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
              :class="msg.is_admin_sender ? 'bg-[#AEC8FF]' : 'bg-[#6E4E37]'"
            >
              {{ msg.is_admin_sender ? 'M' : 'U' }}
            </div>

            <div
              class="max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words flex flex-col gap-1"
              :class="msg.is_admin_sender ? 'bg-[#DCF8C6]' : 'bg-[#F1F1F1]'"
            >
              <p v-if="msg.message">{{ msg.message }}</p>

              <!-- Hiển thị nhiều ảnh -->
              <div v-if="msg.image_url && msg.image_url.length" class="flex flex-wrap gap-2 mt-1">
                <img
                  v-for="(img, idx) in msg.image_url"
                  :key="idx"
                  :src="img"
                  class="w-[100px] h-[100px] object-cover rounded-lg"
                />
              </div>

              <span class="text-[10px] text-gray-400 self-end">
                {{ new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
              </span>
            </div>
          </div>
        </div>

        <!-- INPUT -->
        <div class="p-3 border-t bg-gray-50">
          <div class="flex flex-col gap-2">

            <!-- PREVIEW NHIỀU ẢNH -->
            <div v-if="previewImages.length" class="flex flex-wrap gap-2 mb-2">
              <div v-for="(img, i) in previewImages" :key="i" class="relative">
                <img :src="img" class="w-[72px] h-[72px] object-cover rounded-lg border" />
                <button
                  @click="removeImage(i)"
                  class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- ROW INPUT -->
            <div class="flex items-center gap-2 bg-[#F0F2F5] rounded-2xl px-3 py-2">
              <!-- IMAGE SELECT -->
              <label class="cursor-pointer flex items-center justify-center h-10 w-10 shrink-0">
                <i class="pi pi-fw pi-image text-gray-500 hover:text-gray-700 text-lg"></i>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleSelectImages"
                />
              </label>

              <!-- TEXTAREA -->
              <textarea
                ref="textareaRef"
                v-model="newMessage"
                rows="1"
                wrap="hard"
                placeholder="Nhập tin nhắn..."
                class="flex-1 bg-transparent resize-none outline-none text-sm leading-5 py-2 max-h-[100px] overflow-y-auto break-words custom-scroll"
                @input="handleInput"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.exact.stop
              ></textarea>

              <!-- SEND -->
              <button
                @click="sendMessage"
                :disabled="!newMessage.trim() && !selectedImages.length"
                class="flex items-center justify-center h-10 w-10 text-[#0084FF] disabled:text-gray-400 shrink-0"
              >
                <i class="pi pi-fw pi-send rotate-90 text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center text-gray-400">
        Chọn một người dùng để bắt đầu chat
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, nextTick } from 'vue';
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const conversations = ref([]);
const selectedConversation = ref(null);
const messages = ref([]);
const newMessage = ref('');
const selectedImages = ref<File[]>([]);
const previewImages = ref<string[]>([]);
const textareaRef = ref(null);
const messagesContainer = ref(null);
const searchKeyword = ref('');

const MAX_HEIGHT = 100;

// LOAD CONVERSATIONS
async function loadConversations() {
  try {
    const res = await apiClient.get('/conversation', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    conversations.value = res.data.result.data.conversations || [];
  } catch (err) {
    console.error(err);
    conversations.value = [];
  }
}

// SELECT CONVERSATION
async function selectConversation(conv) {
  selectedConversation.value = conv;
  await loadMessages(conv.id);
}

// LOAD MESSAGES
async function loadMessages(convId) {
  try {
    const res = await apiClient.get(`/conversation/${convId}/message`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    messages.value = res.data.result.data || [];
    nextTick(() => scrollToBottom());
  } catch (err) {
    console.error(err);
    messages.value = [];
  }
}

// SCROLL
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// INPUT RESIZE
function handleInput() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  const h = el.scrollHeight;
  if (h <= MAX_HEIGHT) {
    el.style.height = h + 'px';
    el.style.overflowY = 'hidden';
  } else {
    el.style.height = MAX_HEIGHT + 'px';
    el.style.overflowY = 'auto';
  }
}

// SELECT MULTI IMAGES
function handleSelectImages(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    selectedImages.value.push(file);
    previewImages.value.push(URL.createObjectURL(file));
  });
  e.target.value = ''; // reset input
}

// REMOVE IMAGE
function removeImage(index) {
  selectedImages.value.splice(index, 1);
  previewImages.value.splice(index, 1);
}

// SEND MESSAGE
// SEND MESSAGE
async function sendMessage() {
  if (!selectedConversation.value) return;
  if (!newMessage.value.trim() && !selectedImages.value.length) return;

  // Tạo FormData để gửi lên server
  const formData = new FormData();
  if (newMessage.value.trim()) formData.append('message', newMessage.value);
  selectedImages.value.forEach(file => formData.append('image[]', file));

  // Tạm lưu tin nhắn mới (nếu API trả về chậm)
  const tempMsg = {
    id: Date.now(), // ID tạm thời
    message: newMessage.value || null,
    image_url: previewImages.value.length ? [...previewImages.value] : null,
    is_admin_sender: true,
    created_at: new Date().toISOString(),
    sender: { full_name: 'M' }
  };
  messages.value.push(tempMsg);

  // Scroll xuống tin nhắn mới
  nextTick(() => scrollToBottom());

  // Reset input và preview
  newMessage.value = '';
  selectedImages.value = [];
  previewImages.value = [];
  handleInput();

  try {
    // Gửi lên server
    const res = await apiClient.post(
      `/conversation/${selectedConversation.value.id}/send-message`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Nếu API trả về tin nhắn thực tế, update lại messages
    const newMsgFromApi = res.data.result?.data;
    if (newMsgFromApi) {
      // Thay tin nhắn tạm bằng tin nhắn thật
      const index = messages.value.findIndex(m => m.id === tempMsg.id);
      if (index !== -1) messages.value[index] = newMsgFromApi;
      else messages.value.push(newMsgFromApi);
    }
  } catch (err) {
    console.error(err);
    // Nếu gửi thất bại, xóa tin nhắn tạm hoặc đánh dấu lỗi
    const index = messages.value.findIndex(m => m.id === tempMsg.id);
    if (index !== -1) messages.value.splice(index, 1);
  }
}


// SEARCH
async function searchConversation() {
  if (!searchKeyword.value.trim()) {
    await loadConversations();
    return;
  }
  try {
    const res = await apiClient.get(`/conversation/search?keyword=${searchKeyword.value}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    conversations.value = res.data.result.data.conversations || [];
  } catch (err) {
    console.error(err);
  }
}

onMounted(() => {
  loadConversations();
});
</script>

<style scoped>
.custom-scroll {
  scrollbar-width: none;
}
.custom-scroll::-webkit-scrollbar {
  display: none;
}
.custom-scroll {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
.custom-scroll::-webkit-scrollbar {
  display: none !important;
}
</style>
