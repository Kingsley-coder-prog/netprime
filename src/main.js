import { createApp } from "vue";
import { createPinia } from "pinia";
import { Icon } from "@iconify/vue";
import router from "./router";
import App from "./App.vue";
import "./style.css";
import "aos/dist/aos.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.component("Icon", Icon);

app.mount("#app");
