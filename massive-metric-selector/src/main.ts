import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import './styles.css'
import App from './App.vue'
import { useElement } from './element'
import { installBench } from './utils/bench'
import { FIELD_CATEGORIES } from './data/fields'

const app = createApp(App)
useElement(app)
app.mount('#app')

const ALL_FIELDS = FIELD_CATEGORIES.flatMap((category) =>
  category.children.flatMap((group) => group.children)
)
installBench((count) => ALL_FIELDS.slice(0, count))
