<template>
  <header
    class="fixed top-0 left-0 right-0 w-full max-w-screen overflow-x-hidden z-50 bg-black/90"
  >
    <div class="flex items-center justify-between px-8 py-4">
      <div class="flex items-center space-x-8">
        <div class="text-netflix-red font-bold text-4xl">NETPRIME</div>

        <!-- Desktop Menu -->
        <nav class="hidden md:flex items-center space-x-6">
          <a
            href="#"
            v-for="link in navLinks"
            :key="link.name"
            class="{'text-white': link.active, 'text-netflix-light-gray': !link.active}"
            >{{ link.name }}</a
          >
        </nav>
      </div>

      <!-- Mobile Menu Toggle -->
      <div class="flex items-center space-x-4">
        <button
          class="md:hidden text-white hover:text-gray-300 transition-colors"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <Icon
            :icon="isMobileMenuOpen ? 'mdi:close' : 'mdi:menu'"
            width="28"
          />
        </button>

        <button
          class="hidden md:inline text-white hover:text-gray-300 transition-colors"
        >
          <Icon icon="ic:round-search" width="24" />
        </button>
        <button
          class="hidden md:inline text-white hover:text-gray-300 transition-colors"
        >
          <Icon icon="mdi:bell-outline" width="24" />
        </button>
        <div
          class="hidden md:flex w-8 h-8 rounded bg-netflix-red items-center justify-center"
        >
          <Icon icon="mdi:account" width="24" />
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
  </header>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";
const navLinks = ref([
  { name: "Home", active: true },
  { name: "TV Shows" },
  { name: "Movies" },
  { name: "New & Popular" },
  { name: "My List" },
]);

const isMobileMenuOpen = ref(false);
</script>
