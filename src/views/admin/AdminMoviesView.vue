<template>
  <div class="space-y-6">
    <!-- Header actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <Icon
            icon="mdi:magnify"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            v-model="search"
            @input="debouncedSearch"
            type="text"
            placeholder="Search movies..."
            class="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-white/30 outline-none focus:border-red-500/50 text-sm w-64 transition-all"
          />
        </div>
        <select
          v-model="statusFilter"
          @change="fetchMovies"
          class="admin-select"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="processing">Processing</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
      >
        <Icon icon="mdi:plus" />
        Add Movie
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th
                class="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Movie
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Plan
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Views
              </th>
              <th
                class="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Rating
              </th>
              <th
                class="text-right px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i">
                <td colspan="6" class="px-6 py-4">
                  <div class="h-8 bg-white/5 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <tr
              v-else
              v-for="movie in movies"
              :key="movie._id"
              class="hover:bg-white/5 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-14 rounded-md bg-zinc-800 flex-shrink-0 overflow-hidden"
                  >
                    <Icon
                      icon="mdi:film"
                      class="w-full h-full p-2 text-zinc-600"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">
                      {{ movie.title }}
                    </p>
                    <p class="text-xs text-white/30">
                      {{ movie.releaseYear }} · {{ movie.durationFormatted }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <select
                  :value="movie.status"
                  @change="updateStatus(movie, $event.target.value)"
                  class="text-xs px-2 py-1 rounded-lg border cursor-pointer outline-none transition-all"
                  :class="{
                    'bg-green-500/20 border-green-500/30 text-green-400':
                      movie.status === 'published',
                    'bg-yellow-500/20 border-yellow-500/30 text-yellow-400':
                      movie.status === 'processing',
                    'bg-zinc-500/20 border-zinc-500/30 text-zinc-400':
                      movie.status === 'draft',
                    'bg-red-500/20 border-red-500/30 text-red-400':
                      movie.status === 'archived',
                  }"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
              <td class="px-4 py-4">
                <span
                  class="text-xs px-2 py-1 rounded-full capitalize"
                  :class="{
                    'bg-zinc-700 text-zinc-300': movie.requiredPlan === 'free',
                    'bg-blue-500/20 text-blue-400':
                      movie.requiredPlan === 'basic',
                    'bg-amber-500/20 text-amber-400':
                      movie.requiredPlan === 'premium',
                  }"
                >
                  {{ movie.requiredPlan }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-white/60">
                {{ (movie.viewCount || 0).toLocaleString() }}
              </td>
              <td class="px-4 py-4">
                <div
                  v-if="movie.rating?.average"
                  class="flex items-center gap-1"
                >
                  <Icon icon="mdi:star" class="text-yellow-400 text-sm" />
                  <span class="text-sm text-white/70">{{
                    movie.rating.average.toFixed(1)
                  }}</span>
                </div>
                <span v-else class="text-white/20 text-sm">—</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <router-link
                    :to="`/movie/${movie._id}`"
                    class="icon-btn"
                    title="View"
                  >
                    <Icon icon="mdi:eye" />
                  </router-link>
                  <router-link
                    :to="`/admin/upload?movieId=${movie._id}`"
                    class="icon-btn"
                    title="Upload video"
                  >
                    <Icon icon="mdi:upload" />
                  </router-link>
                  <button
                    @click="confirmDelete(movie)"
                    class="icon-btn text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Icon icon="mdi:delete" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.pages > 1"
        class="flex items-center justify-between px-6 py-4 border-t border-white/5"
      >
        <p class="text-xs text-white/30">{{ pagination.total }} movies total</p>
        <div class="flex gap-2">
          <button
            @click="
              page--;
              fetchMovies();
            "
            :disabled="page <= 1"
            class="admin-page-btn"
          >
            <Icon icon="mdi:chevron-left" />
          </button>
          <span class="text-sm text-white/50 px-2 py-1"
            >{{ page }} / {{ pagination.pages }}</span
          >
          <button
            @click="
              page++;
              fetchMovies();
            "
            :disabled="page >= pagination.pages"
            class="admin-page-btn"
          >
            <Icon icon="mdi:chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create Movie Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="showCreateModal = false"
          />
          <div
            class="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-white/10"
            >
              <h2 class="text-lg font-bold text-white">Add New Movie</h2>
              <button
                @click="showCreateModal = false"
                class="text-white/40 hover:text-white transition-colors"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>
            <form @submit.prevent="createMovie" class="p-6 space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="form-label">Title *</label>
                  <input
                    v-model="newMovie.title"
                    required
                    class="form-input"
                    placeholder="Movie title"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="form-label">Description *</label>
                  <textarea
                    v-model="newMovie.description"
                    required
                    rows="3"
                    class="form-input resize-none"
                    placeholder="Movie description (min 10 chars)"
                  />
                </div>
                <div>
                  <label class="form-label">Release Year *</label>
                  <input
                    v-model.number="newMovie.releaseYear"
                    required
                    type="number"
                    min="1888"
                    :max="new Date().getFullYear() + 2"
                    class="form-input"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label class="form-label">Duration (minutes) *</label>
                  <input
                    v-model.number="newMovie.duration"
                    required
                    type="number"
                    min="1"
                    class="form-input"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label class="form-label">Director</label>
                  <input
                    v-model="newMovie.director"
                    class="form-input"
                    placeholder="Director name"
                  />
                </div>
                <div>
                  <label class="form-label">Age Rating</label>
                  <select v-model="newMovie.ageRating" class="form-input">
                    <option value="NR">NR</option>
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Language</label>
                  <input
                    v-model="newMovie.language"
                    class="form-input"
                    placeholder="English"
                  />
                </div>
                <div>
                  <label class="form-label">Country</label>
                  <input
                    v-model="newMovie.country"
                    class="form-input"
                    placeholder="USA"
                  />
                </div>
                <div>
                  <label class="form-label">Required Plan</label>
                  <select v-model="newMovie.requiredPlan" class="form-input">
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div class="flex items-center gap-3 pt-2">
                  <label class="form-label mb-0">Free Movie</label>
                  <button
                    type="button"
                    @click="newMovie.isFree = !newMovie.isFree"
                    class="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                    :class="newMovie.isFree ? 'bg-red-600' : 'bg-white/20'"
                  >
                    <div
                      class="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                      :class="newMovie.isFree ? 'left-5' : 'left-0.5'"
                    />
                  </button>
                </div>
                <div class="sm:col-span-2">
                  <label class="form-label"
                    >Genres * (select at least one)</label
                  >
                  <div class="flex flex-wrap gap-2 mt-1">
                    <button
                      v-for="genre in allGenres"
                      :key="genre"
                      type="button"
                      @click="toggleNewMovieGenre(genre)"
                      class="px-3 py-1 rounded-full text-xs border transition-all"
                      :class="
                        newMovie.genres.includes(genre)
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      "
                    >
                      {{ genre }}
                    </button>
                  </div>
                </div>
              </div>

              <div
                v-if="createError"
                class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {{ createError }}
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="submit"
                  :disabled="creating"
                  class="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
                >
                  <Icon
                    v-if="creating"
                    icon="mdi:loading"
                    class="animate-spin"
                  />
                  {{ creating ? "Creating..." : "Create Movie" }}
                </button>
                <button
                  type="button"
                  @click="showCreateModal = false"
                  class="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="deleteTarget = null"
          />
          <div
            class="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
          >
            <Icon
              icon="mdi:alert-circle"
              class="text-5xl text-red-500 mb-4 mx-auto block"
            />
            <h3 class="text-lg font-bold text-white mb-2">Archive Movie?</h3>
            <p class="text-white/50 text-sm mb-6">
              "{{ deleteTarget?.title }}" will be archived and hidden from
              users.
            </p>
            <div class="flex gap-3 justify-center">
              <button
                @click="executeDelete"
                :disabled="deleting"
                class="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all"
              >
                {{ deleting ? "Archiving..." : "Archive" }}
              </button>
              <button
                @click="deleteTarget = null"
                class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { movieService } from "../../services/movie.service";
import { useToast } from "../../composables/useToast";

const toast = useToast();

const movies = ref([]);
const loading = ref(true);
const pagination = ref({ total: 0, pages: 1 });
const page = ref(1);
const search = ref("");
const statusFilter = ref("");
const showCreateModal = ref(false);
const deleteTarget = ref(null);
const creating = ref(false);
const deleting = ref(false);
const createError = ref("");

const allGenres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
];

const newMovie = ref({
  title: "",
  description: "",
  releaseYear: new Date().getFullYear(),
  duration: 120,
  director: "",
  ageRating: "NR",
  language: "English",
  country: "USA",
  requiredPlan: "basic",
  isFree: false,
  genres: [],
});

let searchTimer = null;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchMovies, 400);
}

function toggleNewMovieGenre(genre) {
  const idx = newMovie.value.genres.indexOf(genre);
  if (idx === -1) newMovie.value.genres.push(genre);
  else newMovie.value.genres.splice(idx, 1);
}

async function fetchMovies() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: 20, sort: "newest" };
    if (statusFilter.value) params.status = statusFilter.value;
    if (search.value) params.q = search.value;
    const data = search.value
      ? await movieService.searchMovies(search.value, params)
      : await movieService.getMovies(params);
    movies.value = data.movies || [];
    pagination.value = data.pagination || { total: 0, pages: 1 };
  } finally {
    loading.value = false;
  }
}

async function updateStatus(movie, status) {
  try {
    await movieService.updateMovie(movie._id, { status });
    movie.status = status;
    toast.success(`Movie ${status}`);
  } catch {
    toast.error("Failed to update status");
  }
}

function confirmDelete(movie) {
  deleteTarget.value = movie;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await movieService.deleteMovie(deleteTarget.value._id);
    movies.value = movies.value.filter((m) => m._id !== deleteTarget.value._id);
    toast.success("Movie archived");
    deleteTarget.value = null;
  } catch {
    toast.error("Failed to archive movie");
  } finally {
    deleting.value = false;
  }
}

async function createMovie() {
  if (!newMovie.value.genres.length) {
    createError.value = "Please select at least one genre";
    return;
  }
  creating.value = true;
  createError.value = "";
  try {
    const movie = await movieService.createMovie(newMovie.value);
    movies.value.unshift(movie);
    showCreateModal.value = false;
    toast.success("Movie created!");
    newMovie.value = {
      title: "",
      description: "",
      releaseYear: new Date().getFullYear(),
      duration: 120,
      director: "",
      ageRating: "NR",
      language: "English",
      country: "USA",
      requiredPlan: "basic",
      isFree: false,
      genres: [],
    };
  } catch (err) {
    createError.value = err.response?.data?.message || "Failed to create movie";
  } finally {
    creating.value = false;
  }
}

onMounted(fetchMovies);
</script>

<style scoped>
@reference "tailwindcss";
.admin-select {
  @apply bg-white/5 border border-white/10 text-white/70 text-sm rounded-xl px-3 py-2 outline-none focus:border-red-500/50 transition-all;
}
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all text-base;
}
.admin-page-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all;
}
.form-label {
  @apply block text-xs text-white/50 mb-1.5 uppercase tracking-wider;
}
.form-input {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-red-500/50 transition-all text-sm;
}
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>