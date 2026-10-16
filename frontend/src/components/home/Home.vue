<template>
    <div class="home">
        <PageTitle :icon="LayoutDashboard" main="Visão geral"
            sub="Acompanhe o conteúdo da sua base de conhecimento" />
        <div class="welcome-card">
            <div>
                <span class="welcome-kicker">BIBLIOTECA DE CONHECIMENTO</span>
                <h2>Conhecimento que fica fácil de encontrar.</h2>
                <p>Explore as categorias no menu ou confira os indicadores da sua biblioteca.</p>
            </div>
            <BookOpen :size="68" :stroke-width="1.25" aria-hidden="true" />
        </div>
        <div class="stats">
            <Stat title="Categorias" :value="stat.categories"
                :icon="Folder" color="#d54d50" />
            <Stat title="Artigos" :value="stat.articles"
                :icon="FileText" color="#3bc480" />
            <Stat title="Usuários" :value="stat.users"
                :icon="Users" color="#3282cd" />
        </div>
        <p v-if="error" class="stats-error" role="status">{{ error }}</p>
    </div>
</template>

<script>
import PageTitle from '../template/PageTitle.vue'
import Stat from './Stat.vue'
import axios from 'axios'
import { baseApiUrl, showError } from '@/global'
import { BookOpen, FileText, Folder, LayoutDashboard, Users } from '@lucide/vue'
import { markRaw } from 'vue'

export default {
    name: 'Home',
    components: { PageTitle, Stat },
    data: function() {
        return {
            stat: { categories: 0, articles: 0, users: 0 },
            error: null,
            LayoutDashboard: markRaw(LayoutDashboard),
            Folder: markRaw(Folder),
            FileText: markRaw(FileText),
            Users: markRaw(Users),
            BookOpen: markRaw(BookOpen)
        }
    },
    mounted() {
        axios.get(`${baseApiUrl}/stats`)
            .then(res => this.stat = res.data)
            .catch(error => {
                this.error = 'Não foi possível carregar os indicadores.'
                showError(error)
            })
    }
}
</script>

<style>
    .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
    }

    .welcome-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        padding: clamp(22px, 4vw, 36px);
        color: #fff;
        background: linear-gradient(115deg, #3344b5, #5869e8 72%, #7b88f2);
        border-radius: 20px;
        box-shadow: 0 16px 36px rgba(66, 85, 212, 0.18);
    }

    .welcome-card h2 {
        max-width: 620px;
        margin: 9px 0;
        font-size: clamp(1.35rem, 3vw, 2rem);
        font-weight: 700;
        letter-spacing: -0.035em;
    }

    .welcome-card p {
        max-width: 600px;
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
    }

    .welcome-card > svg {
        flex: 0 0 auto;
        opacity: 0.72;
    }

    .welcome-kicker {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.13em;
        opacity: 0.75;
    }

    .stats-error {
        color: #b42318;
        font-size: 0.88rem;
    }

    @media (max-width: 900px) {
        .stats {
            grid-template-columns: 1fr;
        }

        .welcome-card > svg {
            display: none;
        }
    }
</style>
