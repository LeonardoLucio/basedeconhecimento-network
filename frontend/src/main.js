import { createApp } from 'vue'

// O CSS do Bootstrap precisa vir antes dos estilos da aplicação para que os
// estilos próprios (App.vue e componentes) tenham prioridade.
import './config/bootstrap'
import './config/axios'

import App from './App.vue'

import store from './config/store'
import router from './config/router'
import { install as installNotifications } from './config/msgs'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(installNotifications)
app.mount('#app')