<template>
  <div class="px-8 mb-16">
    <h2 class="text-2xl font-bold mb-6">{{ title }}</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <div v-for="genre in genres" :key="genre.name" class="group">
        <div class="relative h-32 rounded-lg overflow-hidden mb-2">
          <img
            :src="genre.imageUrl"
            :alt="genre.name"
            class="w-full h-full object-cover"
          />
        </div>
        <h3
          class="text-center font-bold text-white group-hover:text-red-500 transition"
        >
          {{ genre.name }}
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  genres: {
    type: Array,
    required: true,
  },
});
</script>

<style>
</style>