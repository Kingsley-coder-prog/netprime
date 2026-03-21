<template>
  <section class="px-6 md:px-12">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2
        class="text-lg md:text-xl font-semibold text-white flex items-center gap-2 group cursor-pointer"
        @click="viewAll"
      >
        {{ title }}
        <span
          class="text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
        >
          View all <Icon icon="mdi:chevron-right" />
        </span>
      </h2>
    </div>

    <!-- Row with scroll -->
    <div class="relative">
      <!-- Left arrow -->
      <button
        v-show="canScrollLeft"
        @click="scroll(-1)"
        class="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent flex items-center justify-start pl-1 opacity-0 group-hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': showControls }"
      >
        <div
          class="w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-black transition-colors"
        >
          <Icon icon="mdi:chevron-left" class="text-white" />
        </div>
      </button>

      <!-- Scrollable row -->
      <div
        ref="rowRef"
        class="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        @scroll="checkScroll"
        @mouseenter="showControls = true"
        @mouseleave="showControls = false"
      >
        <MovieCard
          v-for="movie in movies"
          :key="movie._id || movie.id"
          :movie="movie"
          :size="size"
          :type="type"
          @play="$emit('play', $event)"
          @info="$emit('info', $event)"
        />
      </div>

      <!-- Right arrow -->
      <button
        v-show="canScrollRight"
        @click="scroll(1)"
        class="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent flex items-center justify-end pr-1"
        :class="{ 'opacity-100': showControls, 'opacity-0': !showControls }"
      >
        <div
          class="w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-black transition-colors"
        >
          <Icon icon="mdi:chevron-right" class="text-white" />
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import MovieCard from "../movie/MovieCard.vue";

const props = defineProps({
  title: { type: String, required: true },
  movies: { type: Array, default: () => [] },
  size: { type: String, default: "medium" },
  type: { type: String, default: "default" },
  browseQuery: { type: Object, default: () => ({}) },
});

defineEmits(["play", "info"]);

const router = useRouter();
const rowRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const showControls = ref(false);

function scroll(dir) {
  const el = rowRef.value;
  if (!el) return;
  el.scrollBy({ left: dir * 600, behavior: "smooth" });
}

function checkScroll() {
  const el = rowRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function viewAll() {
  router.push({ path: "/browse", query: props.browseQuery });
}

onMounted(async () => {
  await nextTick();
  checkScroll();
});
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>