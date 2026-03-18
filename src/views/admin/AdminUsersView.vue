<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <div class="relative">
        <Icon
          icon="mdi:magnify"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          v-model="search"
          @input="debouncedSearch"
          type="text"
          placeholder="Search users..."
          class="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-white/30 outline-none focus:border-red-500/50 text-sm w-64 transition-all"
        />
      </div>
    </div>

    <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th
                class="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                User
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Plan
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Joined
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="text-right px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <template v-if="loading">
              <tr v-for="i in 8" :key="i">
                <td colspan="6" class="px-6 py-4">
                  <div class="h-8 bg-white/5 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <tr
              v-else
              v-for="user in users"
              :key="user._id"
              class="hover:bg-white/5 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-red-600/50 flex items-center justify-center text-sm font-bold flex-shrink-0"
                  >
                    {{ user.name?.[0]?.toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      {{ user.name }}
                    </p>
                    <p class="text-xs text-white/30">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full capitalize"
                  :class="{
                    'bg-red-500/20 text-red-400': user.role === 'admin',
                    'bg-blue-500/20 text-blue-400': user.role === 'moderator',
                    'bg-white/10 text-white/50': user.role === 'user',
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-4">
                <select
                  :value="user.subscription?.plan || 'free'"
                  @change="updateSubscription(user, $event.target.value)"
                  class="text-xs bg-transparent border border-white/10 rounded-lg px-2 py-1 text-white/70 outline-none cursor-pointer"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </td>
              <td class="px-4 py-4 text-xs text-white/40">
                {{ new Date(user.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-4 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="
                    user.isActive !== false
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  "
                >
                  {{ user.isActive !== false ? "Active" : "Inactive" }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="toggleUserStatus(user)"
                  class="text-xs px-3 py-1 rounded-lg border transition-all"
                  :class="
                    user.isActive !== false
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                  "
                >
                  {{ user.isActive !== false ? "Deactivate" : "Activate" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="pagination.pages > 1"
        class="flex items-center justify-between px-6 py-4 border-t border-white/5"
      >
        <p class="text-xs text-white/30">{{ pagination.total }} users total</p>
        <div class="flex gap-2">
          <button
            @click="
              page--;
              fetchUsers();
            "
            :disabled="page <= 1"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
          >
            <Icon icon="mdi:chevron-left" />
          </button>
          <span class="text-sm text-white/50 px-2 py-1"
            >{{ page }} / {{ pagination.pages }}</span
          >
          <button
            @click="
              page++;
              fetchUsers();
            "
            :disabled="page >= pagination.pages"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
          >
            <Icon icon="mdi:chevron-right" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { userService } from "../../services/user.service";
import { useToast } from "../../composables/useToast";

const toast = useToast();
const users = ref([]);
const loading = ref(true);
const pagination = ref({ total: 0, pages: 1 });
const page = ref(1);
const search = ref("");

let searchTimer = null;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchUsers, 400);
}

async function fetchUsers() {
  loading.value = true;
  try {
    const data = await userService.getAllUsers({ page: page.value, limit: 20 });
    users.value = data.users || [];
    pagination.value = data.pagination || { total: 0, pages: 1 };
  } finally {
    loading.value = false;
  }
}

async function updateSubscription(user, plan) {
  try {
    await userService.updateSubscription(user._id, { plan });
    if (!user.subscription) user.subscription = {};
    user.subscription.plan = plan;
    toast.success(`Subscription updated to ${plan}`);
  } catch {
    toast.error("Failed to update subscription");
  }
}

async function toggleUserStatus(user) {
  try {
    const newStatus = user.isActive === false;
    await userService.updateUserStatus(user._id, newStatus);
    user.isActive = newStatus;
    toast.success(`User ${newStatus ? "activated" : "deactivated"}`);
  } catch {
    toast.error("Failed to update user status");
  }
}

onMounted(fetchUsers);
</script>