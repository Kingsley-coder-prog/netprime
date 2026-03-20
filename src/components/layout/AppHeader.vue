<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="
      isScrolled
        ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg'
        : 'bg-gradient-to-b from-black/80 to-transparent'
    "
  >
    <div class="flex items-center justify-between px-6 md:px-12 py-4">
      <!-- Logo -->
      <router-link to="/" class="flex-shrink-0">
        <span
          class="text-red-500 font-black text-2xl tracking-widest hover:text-red-400 transition-colors"
        >
          NETPRIME
        </span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8">
        <router-link
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="text-sm font-medium transition-colors duration-200"
          :class="
            isActive(item.to) ? 'text-white' : 'text-white/60 hover:text-white'
          "
        >
          {{ item.label }}
        </router-link>
      </nav>

      <!-- Right side -->
      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative">
          <button
            @click="toggleSearch"
            class="text-white/60 hover:text-white transition-colors p-1"
          >
            <Icon icon="mdi:magnify" class="text-xl" />
          </button>
          <Transition name="search">
            <div
              v-if="searchOpen"
              class="absolute right-0 top-10 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden flex items-center shadow-2xl"
            >
              <input
                ref="searchInput"
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                @keyup.esc="closeSearch"
                type="text"
                placeholder="Search movies..."
                class="bg-transparent text-white placeholder-white/30 text-sm px-4 py-2.5 w-64 outline-none"
              />
              <button
                @click="handleSearch"
                class="px-3 py-2.5 text-white/40 hover:text-white"
              >
                <Icon icon="mdi:magnify" />
              </button>
            </div>
          </Transition>
        </div>

        <!-- Guest buttons -->
        <template v-if="!auth.isAuthenticated">
          <router-link
            to="/auth"
            class="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
          >
            Sign In
          </router-link>
        </template>

        <!-- User menu -->
        <template v-else>
          <div class="relative" ref="userMenuRef">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2 group"
            >
              <div
                class="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-sm font-bold text-white"
              >
                {{ auth.user?.name?.[0]?.toUpperCase() }}
              </div>
              <Icon
                icon="mdi:chevron-down"
                class="text-white/60 text-sm transition-transform duration-200"
                :class="userMenuOpen ? 'rotate-180' : ''"
              />
            </button>

            <Transition name="dropdown">
              <div
                v-if="userMenuOpen"
                class="absolute right-0 top-12 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                <div class="px-4 py-3 border-b border-white/10">
                  <p class="text-white text-sm font-medium truncate">
                    {{ auth.user?.name }}
                  </p>
                  <p class="text-white/40 text-xs truncate">
                    {{ auth.user?.email }}
                  </p>
                  <span
                    class="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="planBadgeClass"
                  >
                    {{
                      (auth.user?.subscription?.plan || "free").toUpperCase()
                    }}
                  </span>
                </div>
                <div class="py-1">
                  <router-link
                    v-for="item in userMenuItems"
                    :key="item.to"
                    :to="item.to"
                    @click="userMenuOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Icon :icon="item.icon" class="text-base" />
                    {{ item.label }}
                  </router-link>
                  <router-link
                    v-if="auth.isAdmin"
                    to="/admin"
                    @click="userMenuOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <Icon icon="mdi:shield-account" class="text-base" />
                    Admin Console
                  </router-link>
                  <hr class="my-1 border-white/10" />
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Icon icon="mdi:logout" class="text-base" />
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Mobile menu -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden text-white/60 hover:text-white"
        >
          <Icon
            :icon="mobileMenuOpen ? 'mdi:close' : 'mdi:menu'"
            class="text-2xl"
          />
        </button>
      </div>
    </div>

    <!-- Mobile nav -->
    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-[#0a0a0a]/98 border-t border-white/10 px-6 py-4 space-y-1"
      >
        <router-link
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          @click="mobileMenuOpen = false"
          class="block text-white/70 hover:text-white py-2.5 text-sm font-medium transition-colors border-b border-white/5 last:border-0"
        >
          {{ item.label }}
        </router-link>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";
import { onClickOutside } from "@vueuse/core";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const isScrolled = ref(false);
const searchOpen = ref(false);
const searchQuery = ref("");
const searchInput = ref(null);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const mobileMenuOpen = ref(false);

const navItems = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Movies" },
  { to: "/browse?sort=newest", label: "New & Popular" },
  { to: "/watchlist", label: "My List" },
];

const userMenuItems = [
  { to: "/profile", label: "Account", icon: "mdi:account" },
  { to: "/watchlist", label: "My List", icon: "mdi:bookmark" },
  { to: "/settings", label: "Settings", icon: "mdi:cog" },
];

const planBadgeClass = computed(() => {
  const plan = auth.user?.subscription?.plan;
  if (plan === "premium") return "bg-yellow-500/20 text-yellow-400";
  if (plan === "basic") return "bg-blue-500/20 text-blue-400";
  return "bg-white/10 text-white/50";
});

function isActive(to) {
  if (to === "/") return route.path === "/";
  const path = to.split("?")[0];
  const query = to.includes("?") ? to.split("?")[1] : null;
  if (query) {
    // For links with query params, check both path AND query match
    const param = query.split("=");
    return route.path === path && route.query[param[0]] === param[1];
  }
  return route.path === path;
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) setTimeout(() => searchInput.value?.focus(), 50);
}

function closeSearch() {
  searchOpen.value = false;
  searchQuery.value = "";
}

function handleSearch() {
  if (!searchQuery.value.trim()) return;
  router.push({ path: "/browse", query: { q: searchQuery.value } });
  closeSearch();
}

async function handleLogout() {
  userMenuOpen.value = false;
  await auth.logout();
  router.push("/");
}

onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

function onScroll() {
  isScrolled.value = window.scrollY > 20;
}
onMounted(() => window.addEventListener("scroll", onScroll));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<style scoped>
.search-enter-active,
.search-leave-active {
  transition: all 0.2s ease;
}
.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: scaleX(0.8);
  transform-origin: right;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.2s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>