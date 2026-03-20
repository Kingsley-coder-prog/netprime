<template>
  <div class="space-y-8 max-w-3xl">
    <div>
      <h2 class="text-xl font-bold text-white mb-1">Upload Video</h2>
      <p class="text-white/40 text-sm">
        Upload a video file to an existing movie. Supports MP4, MOV, AVI, MKV,
        WebM.
      </p>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-0">
      <div v-for="(step, i) in steps" :key="step.id" class="flex items-center">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            :class="{
              'bg-red-600 text-white': currentStep > i,
              'bg-red-600/30 text-red-400 border border-red-500/50':
                currentStep === i,
              'bg-white/10 text-white/30': currentStep < i,
            }"
          >
            <Icon v-if="currentStep > i" icon="mdi:check" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="text-sm hidden sm:block"
            :class="currentStep >= i ? 'text-white' : 'text-white/30'"
          >
            {{ step.label }}
          </span>
        </div>
        <div
          v-if="i < steps.length - 1"
          class="flex-1 h-px mx-4 min-w-[40px]"
          :class="currentStep > i ? 'bg-red-600' : 'bg-white/10'"
        />
      </div>
    </div>

    <!-- Step 1: Select movie -->
    <div
      v-if="currentStep === 0"
      class="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
    >
      <h3 class="text-base font-semibold text-white">Select Movie</h3>
      <div>
        <label
          class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
          >Movie</label
        >
        <select
          v-model="selectedMovieId"
          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm transition-all"
        >
          <option value="">Select a movie...</option>
          <option v-for="movie in movies" :key="movie._id" :value="movie._id">
            {{ movie.title }} ({{ movie.releaseYear }}) — {{ movie.status }}
          </option>
        </select>
      </div>
      <button
        @click="currentStep = 1"
        :disabled="!selectedMovieId"
        class="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all"
      >
        Continue
      </button>
    </div>

    <!-- Step 2: Select file -->
    <div v-else-if="currentStep === 1" class="space-y-4">
      <div
        class="bg-white/5 border-2 border-dashed rounded-2xl p-12 text-center transition-all"
        :class="
          isDragging
            ? 'border-red-500 bg-red-500/5'
            : 'border-white/10 hover:border-white/30'
        "
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <Icon
          icon="mdi:upload-outline"
          class="text-5xl text-white/30 mb-4 mx-auto block"
        />
        <p class="text-white font-medium mb-2">Drag & drop your video here</p>
        <p class="text-white/40 text-sm mb-6">
          MP4, MOV, AVI, MKV, WebM · Max 4 GB
        </p>
        <label
          class="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all border border-white/20"
        >
          <Icon icon="mdi:folder-open" />
          Browse Files
          <input
            type="file"
            @change="handleFileSelect"
            accept="video/*"
            class="hidden"
          />
        </label>
      </div>

      <!-- Selected file info -->
      <div
        v-if="selectedFile"
        class="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
      >
        <div
          class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0"
        >
          <Icon icon="mdi:video" class="text-red-400 text-xl" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-white/40">
            {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB ·
            {{ selectedFile.type }}
          </p>
        </div>
        <button
          @click="selectedFile = null"
          class="text-white/40 hover:text-white transition-colors"
        >
          <Icon icon="mdi:close" />
        </button>
      </div>

      <div class="flex gap-3">
        <button
          @click="currentStep = 0"
          class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all"
        >
          Back
        </button>
        <button
          @click="startUpload"
          :disabled="!selectedFile"
          class="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all"
        >
          Start Upload
        </button>
      </div>
    </div>

    <!-- Step 3: Uploading -->
    <div
      v-else-if="currentStep === 2"
      class="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-6"
    >
      <div class="relative w-24 h-24 mx-auto">
        <svg class="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            stroke-width="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#dc2626"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="`${uploadProgress * 2.83} 283`"
            class="transition-all duration-300"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-white"
            >{{ uploadProgress }}%</span
          >
        </div>
      </div>
      <div>
        <p class="text-lg font-semibold text-white mb-1">{{ uploadStatus }}</p>
        <p class="text-white/40 text-sm">{{ uploadDetail }}</p>
      </div>
      <div class="w-full bg-white/10 rounded-full h-2">
        <div
          class="h-2 bg-red-500 rounded-full transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
    </div>

    <!-- Step 4: Done -->
    <div
      v-else-if="currentStep === 3"
      class="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4"
    >
      <div
        class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
      >
        <Icon icon="mdi:check-circle" class="text-4xl text-green-400" />
      </div>
      <h3 class="text-xl font-bold text-white">Upload Complete!</h3>
      <p class="text-white/50 text-sm">
        Your video has been uploaded and is now being transcoded. This may take
        a few minutes depending on the file size.
      </p>

      <!-- Poll status -->
      <div
        class="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2"
      >
        <p class="text-xs text-white/40 uppercase tracking-wider">
          Transcoding Status
        </p>
        <div class="flex items-center gap-2">
          <Icon
            :icon="
              transcodeStatus === 'completed'
                ? 'mdi:check-circle'
                : transcodeStatus === 'failed'
                ? 'mdi:alert-circle'
                : 'mdi:loading'
            "
            class="text-lg"
            :class="{
              'text-green-400': transcodeStatus === 'completed',
              'text-red-400': transcodeStatus === 'failed',
              'text-yellow-400 animate-spin': ['queued', 'processing'].includes(
                transcodeStatus
              ),
              'text-white/40': transcodeStatus === 'pending',
            }"
          />
          <span class="text-sm text-white capitalize">{{
            transcodeStatus
          }}</span>
          <span
            v-if="transcodeProgress > 0 && transcodeStatus === 'processing'"
            class="text-white/40 text-sm"
            >({{ transcodeProgress }}%)</span
          >
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <router-link
          :to="`/movie/${selectedMovieId}`"
          class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all"
        >
          View Movie
        </router-link>
        <button
          @click="resetForm"
          class="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition-all"
        >
          Upload Another
        </button>
      </div>
    </div>

    <!-- Recent uploads list -->
    <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-white/5">
        <h3
          class="text-sm font-semibold text-white/60 uppercase tracking-wider"
        >
          Recent Uploads
        </h3>
      </div>
      <div class="divide-y divide-white/5">
        <div
          v-for="upload in recentUploads"
          :key="upload._id"
          class="flex items-center gap-4 px-6 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white truncate">{{ upload.originalName }}</p>
            <p class="text-xs text-white/30">{{ upload.sizeMB }} MB</p>
          </div>
          <div class="text-right flex items-center gap-2">
            <span
              v-if="
                ['processing', 'queued'].includes(upload.status) &&
                upload.progress > 0
              "
              class="text-xs text-white/40"
            >
              {{ upload.progress }}%
            </span>
            <span
              class="text-xs px-2 py-1 rounded-full capitalize"
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
            <button
              v-if="
                upload.status === 'failed' ||
                upload.status === 'processing' ||
                upload.status === 'pending'
              "
              @click="retryUpload(upload)"
              class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
              title="Retry transcoding"
            >
              <Icon icon="mdi:refresh" class="text-xs" />
              Retry
            </button>
          </div>
        </div>
        <div
          v-if="!recentUploads.length"
          class="px-6 py-6 text-center text-white/30 text-sm"
        >
          No uploads yet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { uploadService } from "../../services/upload.service";
import { movieService } from "../../services/movie.service";
import { useToast } from "../../composables/useToast";

const route = useRoute();
const toast = useToast();

const steps = [
  { id: "movie", label: "Select Movie" },
  { id: "file", label: "Choose File" },
  { id: "upload", label: "Uploading" },
  { id: "done", label: "Complete" },
];

const currentStep = ref(0);
const movies = ref([]);
const recentUploads = ref([]);
const selectedMovieId = ref(route.query.movieId || "");
const selectedFile = ref(null);
const isDragging = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const uploadDetail = ref("");
const transcodeStatus = ref("pending");
const transcodeProgress = ref(0);
const currentUploadId = ref(null);
let pollInterval = null;

if (selectedMovieId.value) currentStep.value = 1;

function handleFileSelect(e) {
  selectedFile.value = e.target.files[0] || null;
}

function handleDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("video/")) {
    selectedFile.value = file;
  }
}

async function startUpload() {
  if (!selectedFile.value || !selectedMovieId.value) return;
  currentStep.value = 2;
  uploadProgress.value = 0;

  try {
    // Step 1: Get presigned URL
    uploadStatus.value = "Preparing upload...";
    uploadDetail.value = "Getting upload URL";
    const { uploadId, presignedUrl } = await uploadService.getPresignedUrl({
      fileName: selectedFile.value.name,
      mimeType: selectedFile.value.type,
      sizeBytes: selectedFile.value.size,
      movieId: selectedMovieId.value,
    });
    currentUploadId.value = uploadId;

    // Step 2: Upload to S3
    uploadStatus.value = "Uploading to storage...";
    uploadDetail.value = `${selectedFile.value.name} (${(
      selectedFile.value.size /
      1024 /
      1024
    ).toFixed(1)} MB)`;
    await uploadService.uploadToS3(
      presignedUrl,
      selectedFile.value,
      (percent) => {
        uploadProgress.value = Math.floor(percent * 0.9); // 0-90% for upload
      }
    );

    // Step 3: Confirm
    uploadStatus.value = "Processing...";
    uploadDetail.value = "Confirming upload and queuing transcoder";
    uploadProgress.value = 95;
    await uploadService.confirmUpload(uploadId);
    uploadProgress.value = 100;

    // Move to done
    currentStep.value = 3;
    transcodeStatus.value = "queued";

    // Start polling for transcode status
    startPolling(uploadId);

    // Refresh recent uploads
    await fetchRecentUploads();
  } catch (err) {
    toast.error(err.response?.data?.message || "Upload failed");
    currentStep.value = 1;
  }
}

function startPolling(uploadId) {
  pollInterval = setInterval(async () => {
    try {
      const status = await uploadService.getStatus(uploadId);
      transcodeStatus.value = status.status;
      transcodeProgress.value = status.progress || 0;

      if (["completed", "failed"].includes(status.status)) {
        clearInterval(pollInterval);
        if (status.status === "completed") {
          toast.success("Transcoding complete! Movie is ready to stream.");
        } else {
          toast.error(
            "Transcoding failed: " + (status.errorMessage || "Unknown error")
          );
        }
        await fetchRecentUploads();
      }
    } catch {
      // ignore poll errors
    }
  }, 15000); // Poll every 15s to avoid rate limiting
}

function resetForm() {
  currentStep.value = selectedMovieId.value ? 1 : 0;
  selectedFile.value = null;
  uploadProgress.value = 0;
  transcodeStatus.value = "pending";
  transcodeProgress.value = 0;
  currentUploadId.value = null;
  if (pollInterval) clearInterval(pollInterval);
}

async function fetchRecentUploads() {
  try {
    const data = await uploadService.getUploads({ limit: 10 });
    recentUploads.value = data.uploads || [];
  } catch {
    recentUploads.value = [];
  }
}

async function retryUpload(upload) {
  try {
    await uploadService.confirmUpload(upload.uploadId);
    toast.success("Transcoding job requeued");
    await fetchRecentUploads();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to retry");
  }
}

onMounted(async () => {
  try {
    const movieData = await movieService.getMovies({
      limit: 50,
      sort: "newest",
    });
    movies.value = movieData?.movies || [];
  } catch (err) {
    console.error("Movie fetch error:", err.response?.data || err.message);
    toast.error("Failed to load movies — check console");
  }
  await fetchRecentUploads();
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>