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
            :class="{
              'text-white': link.active,
              'text-netflix-light-gray': !link.active,
            }"
            class="text-sm font-medium transition-colors hover:text-gray-300"
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
    <transition name="fade">
      <nav
        v-if="isMobileMenuOpen"
        class="md:hidden bg-black/95 backdrop-blur-sm px-8 space-y-4"
      >
        <a
          href="#"
          v-for="link in navLinks"
          :key="link.name"
          class="block text-base font-medium transition-colors hover:text-gray-300"
          :class="{
            'text-white': link.active,
            'text-netflix-light-gray': !link.active,
          }"
          >{{ link.name }}</a
        >
        <div class="flex items-center space-x-4 pt-4 border-t border-gray-700">
          <button class="text-white hover:text-gray-300 transition-colors">
            <Icon icon="ic:round-search" width="24" />
          </button>
          <button class="text-white hover:text-gray-300 transition-colors">
            <Icon icon="mdi:bell-outline" width="24" />
          </button>
          <div
            class="w-8 h-8 rounded bg-netflix-red flex items-center justify-center"
          >
            <Icon icon="mdi:account" width="24" />
          </div>
        </div>
      </nav>
    </transition>
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

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>