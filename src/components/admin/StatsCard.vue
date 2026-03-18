<template>
  <div
    class="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
  >
    <div class="flex items-start justify-between mb-4">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center"
        :class="iconBg"
      >
        <Icon :icon="icon" class="text-xl" :class="iconColor" />
      </div>
      <span
        v-if="change !== undefined"
        class="text-xs font-medium px-2 py-1 rounded-full"
        :class="
          change >= 0
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        "
      >
        {{ change >= 0 ? "+" : "" }}{{ change }}%
      </span>
    </div>
    <p class="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
      {{ label }}
    </p>
    <p class="text-white text-2xl font-black">{{ formattedValue }}</p>
    <p v-if="subtitle" class="text-white/30 text-xs mt-1">{{ subtitle }}</p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: "mdi:chart-bar" },
  iconBg: { type: String, default: "bg-red-500/10" },
  iconColor: { type: String, default: "text-red-400" },
  change: { type: Number, default: undefined },
  subtitle: { type: String, default: "" },
  format: { type: String, default: "number" },
});

const formattedValue = computed(() => {
  if (props.format === "currency")
    return `$${Number(props.value).toLocaleString()}`;
  if (props.format === "compact") {
    const n = Number(props.value);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }
  return typeof props.value === "number"
    ? props.value.toLocaleString()
    : props.value;
});
</script>