<template>
  <div class="space-y-8">
    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-all"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="stat.iconBg"
          >
            <Icon :icon="stat.icon" class="text-xl" :class="stat.iconColor" />
          </div>
          <span
            class="text-xs font-medium px-2 py-1 rounded-full"
            :class="stat.changeBg"
          >
            {{ stat.change }}
          </span>
        </div>
        <p class="text-2xl font-black text-white mb-1">{{ stat.value }}</p>
        <p class="text-xs text-white/40">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Views chart -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 class="text-base font-semibold text-white mb-1">Total Views</h3>
        <p class="text-xs text-white/40 mb-6">Last 7 days</p>
        <div class="h-48 flex items-end gap-2">
          <div
            v-for="(day, i) in viewsData"
            :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <div
              class="w-full bg-red-500/80 rounded-t-sm transition-all duration-500 hover:bg-red-400"
              :style="{ height: `${(day.views / maxViews) * 100}%` }"
            />
            <span class="text-xs text-white/30">{{ day.label }}</span>
          </div>
        </div>
      </div>

      <!-- Top movies -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 class="text-base font-semibold text-white mb-1">Top Movies</h3>
        <p class="text-xs text-white/40 mb-6">By view count</p>
        <div class="space-y-3">
          <div
            v-for="(movie, i) in topMovies"
            :key="movie._id || i"
            class="flex items-center gap-3"
          >
            <span class="text-sm font-bold text-white/30 w-5">{{ i + 1 }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate">
                {{ movie.title || `Movie ${i + 1}` }}
              </p>
              <div class="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  class="h-1 bg-red-500 rounded-full transition-all"
                  :style="{
                    width: `${
                      topMovies[0]?.viewCount
                        ? (movie.viewCount / topMovies[0].viewCount) * 100
                        : 0
                    }%`,
                  }"
                />
              </div>
            </div>
            <span class="text-xs text-white/40 flex-shrink-0">{{
              (movie.viewCount || 0).toLocaleString()
            }}</span>
          </div>
          <div
            v-if="!topMovies.length"
            class="text-center py-4 text-white/30 text-sm"
          >
            No data yet
          </div>
        </div>
      </div>
    </div>

    <!-- Recent uploads -->
    <div class="bg-white/5 border border-white/10 rounded-2xl">
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-white/5"
      >
        <h3 class="text-base font-semibold text-white">Recent Uploads</h3>
        <router-link
          to="/admin/upload"
          class="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
        >
          New upload <Icon icon="mdi:plus" />
        </router-link>
      </div>
      <div class="divide-y divide-white/5">
        <div
          v-for="upload in recentUploads"
          :key="upload._id"
          class="flex items-center gap-4 px-6 py-4"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="{
              'bg-green-500/20': upload.status === 'completed',
              'bg-yellow-500/20':
                upload.status === 'processing' || upload.status === 'queued',
              'bg-red-500/20': upload.status === 'failed',
              'bg-white/10': upload.status === 'pending',
            }"
          >
            <Icon
              :icon="
                {
                  completed: 'mdi:check-circle',
                  processing: 'mdi:loading',
                  queued: 'mdi:clock',
                  failed: 'mdi:alert-circle',
                  pending: 'mdi:upload',
                }[upload.status] || 'mdi:upload'
              "
              class="text-lg"
              :class="{
                'text-green-400': upload.status === 'completed',
                'text-yellow-400 animate-spin': upload.status === 'processing',
                'text-yellow-400': upload.status === 'queued',
                'text-red-400': upload.status === 'failed',
                'text-white/40': upload.status === 'pending',
              }"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white truncate">{{ upload.originalName }}</p>
            <p class="text-xs text-white/30">
              {{ upload.sizeMB }} MB ·
              {{ new Date(upload.createdAt).toLocaleDateString() }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <span
              class="text-xs px-2 py-1 rounded-full font-medium capitalize"
              :class="{
                'bg-green-500/20 text-green-400': upload.status === 'completed',
                'bg-yellow-500/20 text-yellow-400': [
                  'processing',
                  'queued',
                ].includes(upload.status),
                'bg-red-500/20 text-red-400': upload.status === 'failed',
                'bg-white/10 text-white/40': upload.status === 'pending',
              }"
            >
              {{ upload.status }}
            </span>
            <p
              v-if="upload.status === 'processing'"
              class="text-xs text-white/30 mt-1"
            >
              {{ upload.progress }}%
            </p>
          </div>
        </div>
        <div
          v-if="!recentUploads.length"
          class="px-6 py-8 text-center text-white/30 text-sm"
        >
          No uploads yet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { uploadService } from "../../services/upload.service";
import { movieService } from "../../services/movie.service";
import { streamService } from "../../services/stream.service";

const recentUploads = ref([]);
const topMovies = ref([]);
const totalMovies = ref(0);
const totalUsers = ref(0);

const viewsData = ref([
  { label: "Mon", views: 120 },
  { label: "Tue", views: 85 },
  { label: "Wed", views: 200 },
  { label: "Thu", views: 150 },
  { label: "Fri", views: 320 },
  { label: "Sat", views: 410 },
  { label: "Sun", views: 280 },
]);

const maxViews = computed(() =>
  Math.max(...viewsData.value.map((d) => d.views), 1)
);

const stats = computed(() => [
  {
    label: "Total Movies",
    value: totalMovies.value.toLocaleString(),
    icon: "mdi:film",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    change: "+2 this week",
    changeBg: "bg-red-500/20 text-red-400",
  },
  {
    label: "Total Views",
    value: topMovies.value
      .reduce((sum, m) => sum + (m.viewCount || 0), 0)
      .toLocaleString(),
    icon: "mdi:play-circle",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    change: "All time",
    changeBg: "bg-blue-500/20 text-blue-400",
  },
  {
    label: "Processing",
    value: recentUploads.value.filter((u) =>
      ["processing", "queued"].includes(u.status)
    ).length,
    icon: "mdi:cog",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    change: "Active jobs",
    changeBg: "bg-yellow-500/20 text-yellow-400",
  },
  {
    label: "Completed Uploads",
    value: recentUploads.value.filter((u) => u.status === "completed").length,
    icon: "mdi:check-circle",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    change: "This session",
    changeBg: "bg-green-500/20 text-green-400",
  },
]);

onMounted(async () => {
  try {
    const [uploads, movies, analytics] = await Promise.all([
      uploadService.getUploads({ limit: 10 }).catch(() => ({ uploads: [] })),
      movieService
        .getMovies({ limit: 1 })
        .catch(() => ({ pagination: { total: 0 } })),
      streamService.getAnalytics().catch(() => ({ topMovies: [] })),
    ]);

    recentUploads.value = uploads.uploads || [];
    totalMovies.value = movies.pagination?.total || 0;
    topMovies.value = analytics.topMovies || [];
  } catch {
    // fail gracefully
  }
});
</script>