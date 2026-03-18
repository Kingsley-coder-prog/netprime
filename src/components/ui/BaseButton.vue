<template>
  <button
    v-bind="$attrs"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50"
    :class="[variantClasses, sizeClasses]"
    @click="$emit('click', $event)"
  >
    <Icon v-if="loading" icon="mdi:loading" class="animate-spin" />
    <Icon v-else-if="icon" :icon="icon" />
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: "primary" },
  size: { type: String, default: "md" },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: "" },
});
defineEmits(["click"]);

const variantClasses = {
  primary: "bg-red-600 hover:bg-red-500 text-white",
  secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
  ghost: "text-white/60 hover:text-white hover:bg-white/5",
  danger:
    "bg-red-900/50 hover:bg-red-800 text-red-300 border border-red-700/50",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};
</script>