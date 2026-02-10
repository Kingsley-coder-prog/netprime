<template>
  <div
    class="relative h-screen w-full bg-cover bg-center flex items-end mb-20"
    :style="{
      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%), url(${featured.imageUrl})`,
    }"
    data-aos="fade"
    data-aos-duration="1000"
  >
    <div class="container mx-auto px-8 pb-32 z-10">
      <div class="max-w-2xl">
        <!-- Title with rating badge -->
        <div class="flex items-center gap-4 mb-3">
          <h1 class="text-5xl font-bold text-white" data-aos="fade-right">
            {{ featured.title }}
          </h1>
          <div class="flex items-center bg-red-600 px-3 py-1 rounded-md">
            <Icon icon="mdi:star" class="text-yellow-300 mr-1" width="18" />
            <span class="font-bold">{{ featured.rating }}</span>
          </div>
        </div>

        <!-- Meta Info(Year, Seasons, Quality) -->
        <div
          class="flex items-center gap-4 mb-4 text-gray-300"
          data-aos="fade-right"
          data-aos-delay="50"
        >
          <span>{{ featured.year }}</span>
          <span>{{ featured.seasons }} Seasons</span>
          <div class="flex gap-2">
            <span class="border border-gray-400 px-1 rounded text-xs">HD</span>
            <span class="border border-gray-400 px-1 rounded text-xs">5.1</span>
          </div>
        </div>

        <!-- Genres(Pill Badges) -->
        <div
          class="flex flex-wrap gap-2 mb-5"
          data-aos="fade-right"
          data-aos-delay="100"
        >
          <span
            v-for="(genre, index) in featured.genres"
            :key="index"
            class="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm border-gray-600 hover:bg-opacity-70 transition"
            >{{ genre }}</span
          >
        </div>

        <!-- Description -->
        <p
          class="text-gray-200 text-lg mb-6"
          data-aos="fade-right"
          data-aos-delay="150"
        >
          {{ featured.description }}
        </p>
        <!-- Action Button(Dark & Sleek) -->
        <div class="flex gap-4" data-aos="fade-up" data-aos-delay="200">
          <button
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md flex items-center gap-2 transition transform hover:scale-105"
          >
            <Icon icon="mdi:play" width="18" />
            <span class="font-semibold">Play</span>
          </button>
          <button
            class="bg-gray-800 hover:bg-red-700 text-white px-6 py-3 rounded-md flex items-center gap-2 transition transform hover:scale-105"
          >
            <Icon icon="mdi:plus" width="20" />
            <span class="font-semibold">My List</span>
          </button>
          <button
            class="bg-gray-800 hover:bg-red-700 text-white p-3 rounded-md transition transform hover:scale-105"
          >
            <Icon icon="mdi:information-outline" width="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  featured: Object,
});
</script>

<style>
</style>