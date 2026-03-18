<template>
  <section class="content-showcase px-6 lg:px-12 mb-20">
    <header class="flex items-center justify-between mb-8">
      <h2 class="text-3xl font-bold text-white">{{ title }}</h2>
      <button
        class="text-sm font-medium text-gray-400 hover:text-white transition flex items-center gap-1"
      >
        View all
      </button>
      <Icon icon="mdi:chevron-right" width="20" />
    </header>
    <div class="showcase-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Featured Content -->
      <article class="featured-content lg:col-span-2 group">
        <figure class="relative aspect-video overflow-hidden rounded-xl">
          <img
            :src="featured.imageUrl"
            :alt="featured.title"
            class="featured-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
          ></div>

          <figcaption class="content-info absolute bottom-0 left-0 p-6 w-full">
            <div class="flex items-center gap-3 mb-3">
              <span
                class="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"
              >
                <Icon icon="mdi:star" width="14" />
                {{ featured.rating }}
              </span>
              <time class="text-gray-300 text-sm">{{ featured.year }}</time>
              <span class="text-gray-300 text-sm">{{ featured.duration }}</span>
              <span
                class="quality-tag border-gray-500 text-gray-300 text-xs px-1 rounded"
                >HD</span
              >
            </div>

            <h3 class="content-title text-2xl lg:text-3xl font-bold mb-4">
              {{ featured.title }}
            </h3>
            <p class="text-gray-300 mb-5 line-clamp-2">
              {{ featured.description }}
            </p>

            <div class="flex gap-3">
              <button
                class="play-btn bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-opacity-90 transition flex items-center gap-2"
              >
                <Icon icon="mdi:play" width="20" />
                Play
              </button>
              <button
                class="add-btn bg-gray-800 bg-opacity-60 text-white px-4 py-2 rounded-md hover:bg-opacity-80"
              >
                <Icon icon="mdi:plus" width="20" />
              </button>
            </div>
          </figcaption>
        </figure>
      </article>

      <!-- Related Content Grid -->
      <aside class="grid grid-cols-2 gap-4">
        <article
          v-for="item in items"
          :key="item.id"
          class="content-card group relative aspect-[3/4]"
        >
          <figure class="relative h-full overflow-hidden rounded-lg">
            <img
              :src="item.imageUrl"
              :alt="item.title"
              class="card-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opaity-0 group-hover:opacity-100 transition-opacity"
            ></div>
            <figcaption
              class="absolute bottom-0 left-0 p-4 w-full translate-y-2 group-hover:translate-y-0 transition-transform"
            >
              <h4 class="font-bold text-white">{{ item.title }}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-yellow-400 text-xs flex items-center gap-1">
                  <Icon icon="mdi:star" width="12" />
                  {{ item.rating }}
                </span>
                <time class="text-gray-300 text-xs">{{ item.year }}</time>
              </div>
            </figcaption>
          </figure>
        </article>
      </aside>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  featured: {
    type: Object,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.content-showcase {
  --transition-speed: 300ms;
}
.featured-content:hover .featured-image {
  transform: scale(1.03);
}
.content-card:hover .card-image {
  transform: scale(1.1);
}
.play-btn:hover {
  transform: translateY(-2px);
}
.add-btn:hover {
  transform: scale(1.05);
}
.quality-tag {
  letter-spacing: 0.5px;
}
@media (max-width: 1023px) {
  .showcase-grid {
    gap: 4;
  }
  .content-info {
    padding: 1.5rem;
  }
  .content-title {
    font-size: 1.5rem;
  }
}
</style>