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
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        padding: clamp(24px, 4vw, 42px);
        color: #fff;
        background:
            radial-gradient(500px 240px at 100% 0%, rgba(255, 255, 255, 0.22), transparent 70%),
            linear-gradient(120deg, #3b3bb0, #5b5bd6 60%, #7f7ff0);
        border-radius: var(--radius-lg);
        box-shadow: 0 20px 44px rgba(91, 91, 214, 0.26);
    }

    .welcome-card::after {
        content: "";
        position: absolute;
        right: -60px;
        bottom: -90px;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        border: 38px solid rgba(255, 255, 255, 0.07);
    }

    .welcome-card h2 {
        max-width: 620px;
        margin: 10px 0;
        font-size: clamp(1.4rem, 3vw, 2.1rem);
        font-weight: 750;
        letter-spacing: -0.04em;
        line-height: 1.15;
    }

    .welcome-card p { max-width: 600px; margin: 0; color: rgba(255, 255, 255, 0.82); }

    .welcome-card > svg { position: relative; z-index: 1; flex: 0 0 auto; opacity: 0.8; }

    .welcome-kicker { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em; opacity: 0.8; }

    .stats-error { color: var(--color-danger); font-size: 0.88rem; margin-top: 14px; }

    @media (max-width: 900px) {
        .stats { grid-template-columns: 1fr; }
        .welcome-card > svg { display: none; }
    }
</style>
