<template>
  <div
    class="relative group transition-all duration-300 hover:scale-105 hover:z-10"
    data-aos="fade-up"
  >
    <img
      :src="movie.imageUrl"
      :alt="movie.title"
      class="w-50 h-50 object-cover rounded transition-all duration-300 group-hover:rounded-b-none"
    />
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
    >
      <h3 class="text-white font-bold truncate">{{ movie.title }}</h3>
      <div
        class="flex items-center mt-2 space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <button
          class="bg-netflix-red p-2 rounded-full hover:bg-netflix-red/80 transition"
        >
          <Icon icon="mdi:play" width="20" />
        </button>
        <button
          class="border border-white/50 p-2 rounded-full hover:border-white transition"
        >
          <Icon icon="mdi:plus" width="20" />
        </button>
        <button
          class="border border-white/50 p-2 rounded-full hover:border-white transition"
        >
          <Icon icon="mdi:thumb-up-outline" width="20" />
        </button>
      </div>
      <div
        class="mt-2 flex items-center text-xs text-gray-300 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <span class="text-green-500 font-bold">98% Match</span>
        <span>TV-MA</span>
        <span>2 Seasons</span>
      </div>
      <div
        class="mt-1 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      >
        <span class="text-xs px-1.5 py-0.5 bg-gray-800/80 rounded"
          >Exciting</span
        >
        <span class="text-xs px-1.5 py-0.5 bg-gray-800/80 rounded">Sci-Fi</span>
        <span class="text-xs px-1.5 py-0.5 bg-gray-800/80 rounded">Teen</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  movie: Object,
  size: {
    type: String,
  },
});

const sizes = {
  small: "w-40 h-24",
  medium: "w-64 h-36",
  large: "w-80 h-44",
};
</script>

<style>
</style>