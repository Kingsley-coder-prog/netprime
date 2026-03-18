<template>
  <div class="bg-[#111] border border-white/5 rounded-xl p-4">
    <div class="flex items-center gap-3 mb-3">
      <div
        class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"
      >
        <Icon icon="mdi:film" class="text-white/50" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-white text-sm font-medium truncate">
          {{ upload.originalName || "Unknown file" }}
        </p>
        <p class="text-white/30 text-xs">{{ upload.sizeMB }} MB</p>
      </div>
      <span
        class="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
        :class="statusClasses[upload.status]"
      >
        {{ upload.status }}
      </span>
    </div>

    <!-- Progress bar -->
    <div v-if="['queued', 'processing'].includes(upload.status)" class="mb-2">
      <div class="flex justify-between text-xs text-white/40 mb-1">
        <span>Transcoding...</span>
        <span>{{ upload.progress }}%</span>
      </div>
      <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          class="h-full bg-red-500 rounded-full transition-all duration-500"
          :style="{ width: `${upload.progress}%` }"
        />
      </div>
    </div>

    <!-- Outputs -->
    <div v-if="upload.outputs?.length" class="flex gap-2 mt-2">
      <span
        v-for="output in upload.outputs"
        :key="output.quality"
        class="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full"
      >
        {{ output.quality }}
      </span>
    </div>

    <!-- Error -->
    <p v-if="upload.errorMessage" class="text-xs text-red-400 mt-2">
      {{ upload.errorMessage }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  upload: { type: Object, required: true },
});

const statusClasses = {
  pending: "bg-white/10 text-white/50",
  queued: "bg-blue-500/10 text-blue-400",
  processing: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
};
</script>