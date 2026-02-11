<template>
  <div class="px-6 mb-16">
    <h2 class="text-2xl font-bold mb-6">Spotlight</h2>
    <div class="relative">
      <div class="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex-shrink-0 w-80 bg-netflix-dark-light rounded-lg overflow-hidden shadow-lg transform transition hover:scale-105"
        >
          <img
            :src="item.imageUrl"
            :alt="item.title"
            class="w-full h-48 object-cover"
          />
          <div class="p-4">
            <h3 class="text-xl font-bold mb-2">{{ item.title }}</h3>
            <p class="text-gray-400 text-sm line-clamp-2">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>