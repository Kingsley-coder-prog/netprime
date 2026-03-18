<template>
  <div class="min-h-screen pb-20">
    <!-- Loading -->
    <div v-if="loading" class="h-[60vh] flex items-center justify-center">
      <BaseSpinner size="lg" />
    </div>

    <template v-else-if="movie">
      <!-- Backdrop hero -->
      <div class="relative h-[60vh] overflow-hidden">
        <img
          v-if="backdropSrc"
          :src="backdropSrc"
          :alt="movie.title"
          class="w-full h-full object-cover object-top"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/50 to-transparent"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30"
        />

        <!-- Content overlay -->
        <div class="absolute inset-0 flex items-end pt-16">
          <div
            class="px-6 md:px-12 pb-10 flex gap-8 items-end max-w-6xl w-full"
          >
            <!-- Poster -->
            <div
              class="hidden md:block w-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img
                v-if="posterSrc"
                :src="posterSrc"
                :alt="movie.title"
                class="w-full aspect-[2/3] object-cover"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2 text-sm text-white/50">
                <span v-if="movie.releaseYear">{{ movie.releaseYear }}</span>
                <span
                  v-if="movie.ageRating"
                  class="border border-white/30 px-1.5 py-0.5 rounded text-xs"
                  >{{ movie.ageRating }}</span
                >
                <span v-if="movie.durationFormatted">{{
                  movie.durationFormatted
                }}</span>
                <span v-if="movie.language">{{ movie.language }}</span>
              </div>

              <h1 class="text-4xl md:text-5xl font-black text-white mb-3">
                {{ movie.title }}
              </h1>

              <div class="flex items-center gap-3 mb-4">
                <div
                  v-if="movie.rating?.average"
                  class="flex items-center gap-1"
                >
                  <Icon icon="mdi:star" class="text-yellow-400" />
                  <span class="text-white font-semibold">{{
                    movie.rating.average.toFixed(1)
                  }}</span>
                  <span class="text-white/40 text-sm"
                    >({{ movie.rating.count }} reviews)</span
                  >
                </div>
                <span
                  v-if="movie.requiredPlan !== 'free'"
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="
                    movie.requiredPlan === 'premium'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  "
                >
                  {{ movie.requiredPlan?.toUpperCase() }}
                </span>
              </div>

              <!-- Genres -->
              <div class="flex flex-wrap gap-2 mb-4">
                <router-link
                  v-for="genre in movie.genres"
                  :key="genre"
                  :to="{ path: '/browse', query: { genre } }"
                  class="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-xs text-white/70 hover:text-white transition-all"
                >
                  {{ genre }}
                </router-link>
              </div>

              <!-- Buttons -->
              <div class="flex flex-wrap items-center gap-3">
                <button
                  @click="handlePlay"
                  class="flex items-center gap-2 px-8 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-lg text-sm transition-all hover:scale-105"
                >
                  <Icon icon="mdi:play" class="text-xl ml-0.5" />
                  Play
                </button>
                <button
                  @click="handleWatchlist"
                  class="flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-lg text-sm transition-all border border-white/20"
                >
                  <Icon
                    :icon="inWatchlist ? 'mdi:check' : 'mdi:plus'"
                    class="text-lg"
                  />
                  {{ inWatchlist ? "In My List" : "Add to List" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details section -->
      <div class="px-6 md:px-12 max-w-6xl mt-8 space-y-10">
        <!-- Description + Cast -->
        <div class="grid md:grid-cols-3 gap-8">
          <div class="md:col-span-2">
            <p class="text-white/70 text-base leading-relaxed mb-6">
              {{ movie.description }}
            </p>

            <!-- Director & Cast -->
            <div class="space-y-3 text-sm">
              <div v-if="movie.director" class="flex gap-2">
                <span class="text-white/40 min-w-[80px]">Director:</span>
                <span class="text-white">{{ movie.director }}</span>
              </div>
              <div v-if="movie.cast?.length" class="flex gap-2">
                <span class="text-white/40 min-w-[80px]">Cast:</span>
                <span class="text-white">{{
                  movie.cast.map((c) => c.name).join(", ")
                }}</span>
              </div>
              <div v-if="movie.country" class="flex gap-2">
                <span class="text-white/40 min-w-[80px]">Country:</span>
                <span class="text-white">{{ movie.country }}</span>
              </div>
            </div>
          </div>

          <!-- Status sidebar -->
          <div class="space-y-4">
            <div
              class="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="text-white/40">Status</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-500/20 text-green-400':
                      movie.status === 'published',
                    'bg-yellow-500/20 text-yellow-400':
                      movie.status === 'processing',
                    'bg-zinc-500/20 text-zinc-400': movie.status === 'draft',
                  }"
                >
                  {{ movie.status }}
                </span>
              </div>
              <div
                v-if="movie.viewCount"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-white/40">Views</span>
                <span class="text-white">{{
                  movie.viewCount.toLocaleString()
                }}</span>
              </div>
              <div
                v-if="movie.imdbRating"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-white/40">IMDb</span>
                <span class="text-yellow-400 font-semibold"
                  >⭐ {{ movie.imdbRating }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews section -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Reviews</h2>
            <button
              v-if="auth.isAuthenticated && !userReview"
              @click="showReviewForm = !showReviewForm"
              class="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Icon icon="mdi:plus" />
              Write a Review
            </button>
          </div>

          <!-- Review form -->
          <Transition name="slide">
            <form
              v-if="showReviewForm"
              @submit.prevent="submitReview"
              class="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 space-y-4"
            >
              <div>
                <label class="block text-sm text-white/50 mb-2">Rating</label>
                <div class="flex gap-2">
                  <button
                    v-for="n in 10"
                    :key="n"
                    type="button"
                    @click="reviewForm.rating = n"
                    class="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
                    :class="
                      n <= reviewForm.rating
                        ? 'bg-yellow-500 text-black'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    "
                  >
                    {{ n }}
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm text-white/50 mb-2"
                  >Title (optional)</label
                >
                <input
                  v-model="reviewForm.title"
                  type="text"
                  placeholder="Sum it up..."
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-red-500/50 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm text-white/50 mb-2"
                  >Review (optional)</label
                >
                <textarea
                  v-model="reviewForm.body"
                  rows="3"
                  placeholder="Share your thoughts..."
                  class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-red-500/50 text-sm resize-none"
                />
              </div>
              <div class="flex gap-3">
                <button
                  type="submit"
                  :disabled="!reviewForm.rating || reviewSubmitting"
                  class="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-all"
                >
                  {{ reviewSubmitting ? "Submitting..." : "Submit Review" }}
                </button>
                <button
                  type="button"
                  @click="showReviewForm = false"
                  class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Transition>

          <!-- Reviews list -->
          <div v-if="reviews.length" class="space-y-4">
            <div
              v-for="review in reviews"
              :key="review._id"
              class="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-red-600/50 flex items-center justify-center text-sm font-bold"
                  >
                    {{ review.user?.name?.[0] || "U" }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      {{ review.user?.name || "User" }}
                    </p>
                    <p class="text-xs text-white/30">
                      {{ new Date(review.createdAt).toLocaleDateString() }}
                    </p>
                  </div>
                </div>
                <div
                  class="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg"
                >
                  <Icon icon="mdi:star" class="text-yellow-400 text-sm" />
                  <span class="text-yellow-400 text-sm font-semibold"
                    >{{ review.rating }}/10</span
                  >
                </div>
              </div>
              <p v-if="review.title" class="text-white font-medium mb-1">
                {{ review.title }}
              </p>
              <p v-if="review.body" class="text-white/60 text-sm">
                {{ review.body }}
              </p>
            </div>
          </div>
          <div v-else class="text-center py-10 text-white/30 text-sm">
            No reviews yet. Be the first to review this movie.
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div
      v-else
      class="flex items-center justify-center h-[60vh] flex-col gap-4"
    >
      <Icon icon="mdi:film-off" class="text-6xl text-white/20" />
      <h2 class="text-xl text-white/50">Movie not found</h2>
      <router-link
        to="/browse"
        class="text-red-400 hover:text-red-300 transition-colors text-sm"
        >← Browse movies</router-link
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { movieService } from "../services/movie.service";
import { userService } from "../services/user.service";
import { tmdbService } from "../services/tmdb.service";
import { useAuthStore } from "../stores/auth.store";
import { useToast } from "../composables/useToast";
import BaseSpinner from "../components/ui/BaseSpinner.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const movie = ref(null);
const reviews = ref([]);
const loading = ref(true);
const inWatchlist = ref(false);
const showReviewForm = ref(false);
const reviewSubmitting = ref(false);
const tmdbImages = ref({ poster: null, backdrop: null });

const reviewForm = ref({ rating: 0, title: "", body: "" });

const userReview = computed(() =>
  reviews.value.find((r) => r.user === auth.user?.id)
);
const posterSrc = computed(
  () => movie.value?.posterUrl || tmdbImages.value.poster
);
const backdropSrc = computed(
  () => movie.value?.backdropUrl || tmdbImages.value.backdrop
);

async function handlePlay() {
  if (!auth.isAuthenticated) return router.push("/auth");
  router.push(`/watch/${movie.value._id}`);
}

async function handleWatchlist() {
  if (!auth.isAuthenticated) return router.push("/auth");
  try {
    const id = movie.value._id;
    if (inWatchlist.value) {
      await userService.removeFromWatchlist(id);
      inWatchlist.value = false;
      toast.info("Removed from My List");
    } else {
      await userService.addToWatchlist(id);
      inWatchlist.value = true;
      toast.success("Added to My List");
    }
  } catch {
    toast.error("Failed to update watchlist");
  }
}

async function submitReview() {
  if (!reviewForm.value.rating) return;
  reviewSubmitting.value = true;
  try {
    const review = await movieService.addReview(
      movie.value._id,
      reviewForm.value
    );
    reviews.value.unshift(review);
    showReviewForm.value = false;
    reviewForm.value = { rating: 0, title: "", body: "" };
    toast.success("Review submitted!");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to submit review");
  } finally {
    reviewSubmitting.value = false;
  }
}

onMounted(async () => {
  const id = route.params.id;
  try {
    const [movieData, reviewData] = await Promise.all([
      movieService.getMovie(id),
      movieService.getReviews(id).catch(() => ({ reviews: [] })),
    ]);
    movie.value = movieData;
    reviews.value = reviewData.reviews || [];

    // Fetch TMDB images
    if (movie.value && (!movie.value.posterUrl || !movie.value.backdropUrl)) {
      tmdbImages.value = await tmdbService.getMovieImages(
        movie.value.title,
        movie.value.releaseYear
      );
    }
  } catch {
    movie.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 600px;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>