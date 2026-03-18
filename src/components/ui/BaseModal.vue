<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9000] flex items-center justify-center p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          @click="$emit('update:modelValue', false)"
        />

        <!-- Panel -->
        <div
          class="relative z-10 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full"
          :class="sizeClasses[size]"
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between px-6 py-4 border-b border-white/10"
          >
            <slot name="header">
              <h3 class="text-white font-semibold text-lg">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              @click="$emit('update:modelValue', false)"
              class="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <Icon icon="mdi:close" class="text-xl" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-white/10">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  size: { type: String, default: "md" },
  closable: { type: Boolean, default: true },
});
defineEmits(["update:modelValue"]);

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
}
</style>