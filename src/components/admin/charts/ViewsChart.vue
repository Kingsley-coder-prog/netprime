<template>
  <div class="bg-[#111] border border-white/5 rounded-xl p-5">
    <h3 class="text-white font-semibold mb-1">Views Over Time</h3>
    <p class="text-white/30 text-xs mb-5">Total watch sessions per day</p>
    <div v-if="hasData" class="h-48">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div
      v-else
      class="h-48 flex items-center justify-center text-white/20 text-sm"
    >
      No data yet
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
  data: { type: Array, default: () => [] },
});

const hasData = computed(() => props.data.length > 0);

const chartData = computed(() => ({
  labels: props.data.map((d) => d.date || d.label),
  datasets: [
    {
      data: props.data.map((d) => d.views || d.value),
      backgroundColor: "rgba(239, 68, 68, 0.6)",
      borderColor: "rgba(239, 68, 68, 1)",
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } },
    },
  },
};
</script>