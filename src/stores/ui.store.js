import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const toasts = ref([]);
  let toastId = 0;

  function toast(message, type = "info", duration = 4000) {
    const id = ++toastId;
    toasts.value.push({ id, message, type });
    setTimeout(() => removeToast(id), duration);
    return id;
  }

  function success(message) {
    return toast(message, "success");
  }
  function error(message) {
    return toast(message, "error");
  }
  function info(message) {
    return toast(message, "info");
  }
  function warning(message) {
    return toast(message, "warning");
  }

  function removeToast(id) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  return { toasts, toast, success, error, info, warning, removeToast };
});
