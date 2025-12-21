<template>
  <div class="card flex h-screen gap-6">

    <!-- DANH SÁCH CONVERSATION -->
    <aside class="w-[30%] border-r border-gray-200 p-4 flex-shrink-0 flex flex-col h-full">
      <h2 class="font-semibold text-xl mb-4">Người dùng</h2>

      <InputText
        v-model="searchKeyword"
        placeholder="Tìm kiếm người dùng..."
        class="w-full mb-4"
        @input="searchConversation"
      />

      <div class="flex-1 min-h-0 overflow-y-auto custom-scroll space-y-2">
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
          <div class="flex-1 flex flex-col min-w-0">
            <span class="font-medium truncate">{{ conv.user.full_name }}</span>
            <span class="text-xs text-gray-500 truncate">
              {{ conv.last_message?.message || 'Chưa có tin nhắn' }}
            </span>
          </div>
          <div v-if="!conv.is_read_by_admin" class="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </aside>

    <!-- CHAT BOX -->
    <main class="flex-1 flex flex-col p-4 min-w-0 h-full">
      <div v-if="selectedConversation" class="flex-1 flex flex-col border rounded-xl shadow overflow-hidden min-w-0">

        <!-- HEADER -->
        <div class="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#6E4E37] text-white flex items-center justify-center font-bold">
              {{ selectedConversation.user.full_name[0] }}
            </div>
            <span class="font-semibold">{{ selectedConversation.user.full_name }}</span>
          </div>
        </div>

        <!-- MESSAGES -->
        <div ref="messagesContainer" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scroll flex flex-col">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex min-w-0 gap-2 items-end w-full"
            :class="msg.is_admin_sender ? 'justify-end' : 'justify-start'"
          >
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
              :class="msg.is_admin_sender ? 'bg-[#AEC8FF]' : 'bg-[#6E4E37]'"
            >
              {{ msg.is_admin_sender ? 'M' : 'U' }}
            </div>

            <div
              class="bubble-safe flex flex-col gap-1 min-w-0"
              :class="msg.is_admin_sender ? 'bg-[#DCF8C6]' : 'bg-[#F1F1F1]'"
            >
              <p v-if="msg.message">{{ msg.message }}</p>

              <!-- HIỂN THỊ NHIỀU ẢNH -->
              <div v-if="getMessageImages(msg).length" class="flex flex-wrap gap-2 mt-1">
                <img
                  v-for="(img, idx) in getMessageImages(msg)"
                  :key="idx"
                  :src="img"
                  class="max-w-[150px] max-h-[150px] object-cover rounded-lg cursor-pointer"
                />
              </div>

              <span class="text-[10px] text-gray-400 self-end">
                {{ formatTime(msg.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- INPUT -->
        <div class="p-3 border-t bg-gray-50 flex-shrink-0 min-w-0">
          <div class="flex flex-col gap-2">

            <!-- PREVIEW IMAGE -->
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

            <div class="flex items-center gap-2 bg-[#F0F2F5] rounded-2xl px-3 py-2 min-w-0">
              <label class="cursor-pointer flex items-center justify-center h-10 w-10 shrink-0">
                <i class="pi pi-fw pi-image text-gray-500 hover:text-gray-700 text-lg"></i>
                <input type="file" accept="image/*" multiple class="hidden" @change="handleSelectImages" />
              </label>

              <textarea
                ref="textareaRef"
                v-model="newMessage"
                rows="1"
                placeholder="Nhập tin nhắn..."
                class="flex-1 min-w-0 bg-transparent resize-none outline-none text-sm leading-5 py-2 max-h-[100px] overflow-y-auto break-words custom-scroll"
                @input="handleInput"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.exact.stop
              ></textarea>

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

      <div v-else class="flex-1 flex items-center justify-center text-gray-400 min-w-0">
        Chọn một người dùng để bắt đầu chat
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import apiClient from '@/api/axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const conversations = ref<any[]>([]);
const selectedConversation = ref<any>(null);
const messages = ref<any[]>([]);
const newMessage = ref('');
const selectedImages = ref<File[]>([]);
const previewImages = ref<string[]>([]);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLDivElement | null>(null);
const searchKeyword = ref('');
const MAX_HEIGHT = 100;
let pollingInterval: any = null;

// Hàm chuẩn hóa image_url thành mảng
function getMessageImages(msg: any) {
  if (!msg.image_url) return [];
  if (typeof msg.image_url === 'string') {
    try {
      const parsed = JSON.parse(msg.image_url);
      return Array.isArray(parsed) ? parsed : [msg.image_url];
    } catch {
      return [msg.image_url];
    }
  }
  return Array.isArray(msg.image_url) ? msg.image_url : [msg.image_url];
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const cleaned = dateStr.replace(/\.\d{6}/, '');
  return new Date(cleaned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Auto scroll
watch(messages, async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

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

async function selectConversation(conv: any) {
  selectedConversation.value = conv;
  await loadMessages(conv.id);

  // scroll xuống cuối
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}


async function loadMessages(convId: number) {
  try {
    messages.value = [];
    const resFirst = await apiClient.get(`/conversation/${convId}/message?page=1`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    const firstPageData = resFirst.data.result.data.messages;
    const normalizeMessages = firstPageData.data.map((msg: any) => parseMessage(msg));
    messages.value.push(...normalizeMessages);

    for (let page = 2; page <= firstPageData.last_page; page++) {
      const res = await apiClient.get(`/conversation/${convId}/message?page=${page}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      const msgs = res.data.result.data.messages.data.map((msg: any) => parseMessage(msg));
      messages.value.push(...msgs);
    }

    const convIndex = conversations.value.findIndex(c => c.id === convId);
    if (convIndex !== -1 && messages.value.length) {
      conversations.value[convIndex].last_message = messages.value[messages.value.length - 1];
    }
  } catch (err) {
    console.error(err);
    messages.value = [];
  }
}

// Chuẩn hóa từng message
function parseMessage(msg: any) {
  if (msg.image_url && typeof msg.image_url === 'string') {
    try {
      msg.image_url = JSON.parse(msg.image_url);
    } catch {}
  }
  return msg;
}

// Poll messages
async function pollMessages() {
  if (!selectedConversation.value) return;

  try {
    const res = await apiClient.get(`/conversation/${selectedConversation.value.id}/message?page=1`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const fetchedMessages = res.data.result.data.messages.data || [];
    const newMsgs = fetchedMessages
      .map((msg: any) => parseMessage(msg))
      .filter((m: any) => !messages.value.some(msg => msg.id === m.id));

    if (newMsgs.length) {
      messages.value.push(...newMsgs);
      const convIndex = conversations.value.findIndex(c => c.id === selectedConversation.value.id);
      if (convIndex !== -1) {
        conversations.value[convIndex].last_message = messages.value[messages.value.length - 1];
        conversations.value[convIndex].is_read_by_admin = true;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Handle input
function handleInput() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  const h = el.scrollHeight;
  el.style.height = h <= MAX_HEIGHT ? h + 'px' : MAX_HEIGHT + 'px';
  el.style.overflowY = h <= MAX_HEIGHT ? 'hidden' : 'auto';
}

// Chọn ảnh
function handleSelectImages(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  files.forEach(file => {
    selectedImages.value.push(file);
    previewImages.value.push(URL.createObjectURL(file));
  });
  if (input) input.value = '';
}

function removeImage(index: number) {
  selectedImages.value.splice(index, 1);
  previewImages.value.splice(index, 1);
}

// Gửi tin nhắn
async function sendMessage() {
  if (!selectedConversation.value) return;
  if (!newMessage.value.trim() && !selectedImages.value.length) return;

  const formData = new FormData();
  if (newMessage.value.trim()) formData.append('message', newMessage.value);

  // append nhiều ảnh đúng chuẩn array
  selectedImages.value.forEach(file => formData.append('image[]', file));

  // Tạo tin nhắn tạm để show UI ngay
  const tempMsg = {
    id: Date.now(),
    message: newMessage.value || null,
    image_url: previewImages.value.length ? [...previewImages.value] : null,
    is_admin_sender: true,
    created_at: new Date().toISOString(),
    sender: { full_name: 'M' }
  };
  messages.value.push(tempMsg);

  newMessage.value = '';
  selectedImages.value = [];
  previewImages.value = [];
  handleInput();

  try {
    const res = await apiClient.post(
      `/conversation/${selectedConversation.value.id}/send-message`,
      formData,
      { headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
      }}
    );

    // API trả về mảng messages, push lại vào messages.value
    if (res.data?.result?.data?.messages?.length) {
      const newMsgs = res.data.result.data.messages.map((msg: any) => parseMessage(msg));
      messages.value.push(...newMsgs);
    }
  } catch (err) {
    console.error(err);
    const index = messages.value.findIndex(m => m.id === tempMsg.id);
    if (index !== -1) messages.value.splice(index, 1);
  }
}


// Search
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
  pollingInterval = setInterval(pollMessages, 3000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar { display: none; }
.custom-scroll { scrollbar-width: none; }

.bubble-safe {
  min-width: 0;
  max-width: 80%;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: pre-wrap;
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  display: inline-block;
}
.bubble-safe img {
  max-width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 0.5rem;
}
</style>
