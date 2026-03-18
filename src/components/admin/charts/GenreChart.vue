<template>
  <div class="bg-[#111] border border-white/5 rounded-xl p-5">
    <h3 class="text-white font-semibold mb-1">Movies by Genre</h3>
    <p class="text-white/30 text-xs mb-5">Distribution of published movies</p>
    <div v-if="hasData" class="h-48 flex items-center justify-center">
      <Doughnut :data="chartData" :options="chartOptions" />
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
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  data: { type: Array, default: () => [] },
});

const hasData = computed(() => props.data.length > 0);

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

const chartData = computed(() => ({
  labels: props.data.map((d) => d.genre || d.label),
  datasets: [
    {
      data: props.data.map((d) => d.count || d.value),
      backgroundColor: COLORS.slice(0, props.data.length),
      borderColor: "#111",
      borderWidth: 2,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: {
        color: "rgba(255,255,255,0.5)",
        font: { size: 11 },
        boxWidth: 12,
        padding: 12,
      },
    },
  },
};
</script>