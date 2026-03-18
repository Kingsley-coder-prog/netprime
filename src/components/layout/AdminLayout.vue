<template>
  <div class="min-h-screen flex bg-[#0a0a0a]">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-[#111] border-r border-white/5 flex flex-col fixed h-full z-40"
    >
      <!-- Logo -->
      <div class="p-6 border-b border-white/5">
        <router-link to="/" class="flex items-center gap-2">
          <span class="text-red-500 font-black text-xl tracking-wider"
            >NETPRIME</span
          >
          <span
            class="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded font-medium"
            >ADMIN</span
          >
        </router-link>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
          :class="[
            $route.path === item.to || $route.path.startsWith(item.to + '/')
              ? 'bg-red-500/20 text-red-400 font-medium'
              : 'text-white/50 hover:text-white hover:bg-white/5',
          ]"
        >
          <Icon :icon="item.icon" class="text-lg flex-shrink-0" />
          {{ item.label }}
        </router-link>
      </nav>

      <!-- Bottom -->
      <div class="p-4 border-t border-white/5 space-y-2">
        <router-link
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <Icon icon="mdi:home" class="text-lg" />
          Back to site
        </router-link>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Icon icon="mdi:logout" class="text-lg" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header
        class="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur border-b border-white/5 px-8 py-4 flex items-center justify-between"
      >
        <div>
          <h1 class="text-lg font-semibold text-white">{{ pageTitle }}</h1>
          <p class="text-xs text-white/40">
            {{
              new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5"
          >
            <div
              class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold"
            >
              {{ auth.user?.name?.[0]?.toUpperCase() }}
            </div>
            <span class="text-sm text-white/70">{{ auth.user?.name }}</span>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "mdi:view-dashboard" },
  { to: "/admin/movies", label: "Movies", icon: "mdi:film" },
  { to: "/admin/upload", label: "Upload", icon: "mdi:upload" },
  { to: "/admin/users", label: "Users", icon: "mdi:account-group" },
];

const pageTitles = {
  "/admin": "Dashboard",
  "/admin/movies": "Movies",
  "/admin/upload": "Upload Video",
  "/admin/users": "Users",
};

const pageTitle = computed(() => pageTitles[route.path] || "Admin");

async function handleLogout() {
  await auth.logout();
  router.push("/auth");
}
</script>