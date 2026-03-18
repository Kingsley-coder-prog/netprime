<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl text-sm font-medium min-w-[280px] max-w-sm backdrop-blur-sm border"
          :class="toastClasses[toast.type]"
        >
          <Icon :icon="toastIcons[toast.type]" class="text-lg flex-shrink-0" />
          <span>{{ toast.message }}</span>
          <button
            @click="ui.removeToast(toast.id)"
            class="ml-auto opacity-60 hover:opacity-100 transition-opacity"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from "../../stores/ui.store";

const ui = useUiStore();

const toastClasses = {
  success: "bg-green-900/90 border-green-700 text-green-100",
  error: "bg-red-900/90 border-red-700 text-red-100",
  warning: "bg-yellow-900/90 border-yellow-700 text-yellow-100",
  info: "bg-zinc-800/90 border-zinc-600 text-zinc-100",
};

const toastIcons = {
  success: "mdi:check-circle",
  error: "mdi:alert-circle",
  warning: "mdi:alert",
  info: "mdi:information",
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>