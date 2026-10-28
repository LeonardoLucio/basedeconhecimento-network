<template>
    <div class="article-item">
        <router-link :to="{ name: 'articleById', params: { id: article.id } }">
            <div class="article-item-image d-none d-sm-block">
                <img v-if="article.imageUrl"
                    :src="article.imageUrl"
                    height="132" width="132" :alt="`Imagem do artigo ${article.name}`">
                <img v-else
                    src="@/assets/article.png"
                    height="132" width="132" alt="">
            </div>
            <div class="article-item-info">
                <h2>{{ article.name }} <ArrowUpRight :size="18" aria-hidden="true" /></h2>
                <p>{{ article.description }}</p>
                <span class="article-item-author">
                    <strong>Autor: </strong>{{ article.author }}
                </span>
            </div>
        </router-link>
    </div>
</template>

<script>
import { ArrowUpRight } from '@lucide/vue'

export default {
    name: 'ArticleItem',
    components: { ArrowUpRight },
    props: ['article']
}
</script>

<style>
    .article-item {
        margin-bottom: 14px;
        padding: 18px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }

    .article-item:hover {
        transform: translateY(-2px);
        border-color: #d6d6f6;
        box-shadow: var(--shadow-md);
    }

    .article-item a {
        display: flex;
        align-items: flex-start;
        text-decoration: none;
        color: var(--color-text);
    }

    .article-item-info { min-width: 0; display: flex; align-self: stretch; flex-direction: column; }

    .article-item-info h2 {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 0 0 7px;
        color: var(--color-ink);
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .article-item-info h2 svg {
        color: var(--color-primary);
        opacity: 0;
        transform: translate(-4px, 4px);
        transition: opacity 160ms ease, transform 160ms ease;
    }

    .article-item:hover .article-item-info h2 svg { opacity: 1; transform: none; }

    .article-item-image {
        padding-right: 20px;
        margin-right: 20px;
        border-right: 1px solid var(--color-border);
    }

    .article-item-image img {
        width: 132px;
        height: 132px;
        object-fit: cover;
        border-radius: 12px;
        background: var(--color-surface-alt);
    }

    .article-item-info p {
        flex: 1;
        margin: 0 0 12px;
        color: var(--color-muted);
        font-size: 0.94rem;
        line-height: 1.6;
    }

    .article-item-author {
        align-self: flex-start;
        padding: 3px 10px;
        color: var(--color-primary-dark);
        background: var(--color-primary-soft);
        border-radius: 999px;
        font-size: 0.76rem;
    }

    .article-item-author strong { font-weight: 600; }

    @media (max-width: 575.98px) {
        .article-item { padding: 16px; }
        .article-item-info h2 { font-size: 1.05rem; }
    }
</style>
