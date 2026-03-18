<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
    <router-view />
    <BaseToast />
  </div>
</template>

<script setup>
import BaseToast from "./components/ui/BaseToast.vue";
</script>