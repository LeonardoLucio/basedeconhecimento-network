import { createApp } from 'vue'

import App from './App.vue'

import './config/bootstrap'
import './config/axios'

import store from './config/store'
import router from './config/router'
import { install as installNotifications } from './config/msgs'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(installNotifications)
app.mount('#app')