<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wide"
    >
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <Icon
        v-if="iconLeft"
        :icon="iconLeft"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg"
      />
      <input
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="w-full bg-white/5 border rounded-xl text-white placeholder-white/20 text-sm outline-none transition-all disabled:opacity-50"
        :class="[
          error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-white/10 focus:border-red-500/50',
          iconLeft ? 'pl-10 pr-4 py-3' : 'px-4 py-3',
          iconRight ? 'pr-10' : '',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <slot name="right" />
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-white/30">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  iconLeft: { type: String, default: "" },
  iconRight: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);
</script>