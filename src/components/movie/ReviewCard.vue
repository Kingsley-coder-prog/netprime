<template>
  <div
    class="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-full bg-red-600/80 flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        >
          {{ review.user?.name?.[0]?.toUpperCase() || "?" }}
        </div>
        <div>
          <p class="text-white text-sm font-medium">
            {{ review.user?.name || "Anonymous" }}
          </p>
          <p class="text-white/30 text-xs">
            {{ formatDate(review.createdAt) }}
          </p>
        </div>
      </div>
      <!-- Rating -->
      <div
        class="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full"
      >
        <Icon icon="mdi:star" class="text-yellow-400 text-xs" />
        <span class="text-yellow-400 text-xs font-bold"
          >{{ review.rating }}/10</span
        >
      </div>
    </div>

    <h4 v-if="review.title" class="text-white font-semibold text-sm mb-1">
      {{ review.title }}
    </h4>
    <p
      v-if="review.body"
      class="text-white/60 text-sm leading-relaxed line-clamp-3"
    >
      {{ review.body }}
    </p>

    <div
      v-if="review.spoiler"
      class="mt-2 flex items-center gap-1 text-xs text-yellow-500/70"
    >
      <Icon icon="mdi:alert" class="text-xs" />
      Contains spoilers
    </div>

    <!-- Delete (own review) -->
    <button
      v-if="canDelete"
      @click="$emit('delete', review._id)"
      class="mt-3 text-xs text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
    >
      <Icon icon="mdi:trash-can-outline" />
      Delete
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../stores/auth.store";

const props = defineProps({
  review: { type: Object, required: true },
});
defineEmits(["delete"]);

const auth = useAuthStore();

const canDelete = computed(
  () =>
    auth.user?.id === props.review.user ||
    auth.user?.id === props.review.user?._id ||
    auth.isAdmin
);

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>