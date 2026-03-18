<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div
      class="rounded-full border-2 border-transparent animate-spin"
      :class="[sizeClasses[size], colorClass]"
      style="border-top-color: currentColor"
    />
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: "md" },
  color: { type: String, default: "red" },
  fullscreen: { type: Boolean, default: false },
});

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};
</script>