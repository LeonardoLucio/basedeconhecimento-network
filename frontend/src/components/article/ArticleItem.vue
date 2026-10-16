<template>
    <div class="article-item">
        <router-link :to="{ name: 'articleById', params: { id: article.id } }">
            <div class="article-item-image d-none d-sm-block">
                <img v-if="article.imageUrl"
                    :src="article.imageUrl"
                    height="150" width="150" :alt="`Imagem do artigo ${article.name}`">
                <img v-else
                    src="@/assets/article.png"
                    height="150" width="150" alt="">
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
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 15px;
        box-shadow: 0 3px 12px rgba(16, 24, 40, 0.035);
        transition: transform 140ms ease, box-shadow 140ms ease;
    }

    .article-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(16, 24, 40, 0.08);
    }

    .article-item a {
        display: flex;
        align-items: flex-start;
        text-decoration: none;
        color: #172033;
    }

    .article-item-info h2 {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 7px;
        font-size: 1.15rem;
        font-weight: 700;
    }

    .article-item-info h2 svg {
        color: var(--color-primary);
        opacity: 0;
        transition: opacity 140ms ease;
    }

    .article-item:hover .article-item-info h2 svg {
        opacity: 1;
    }

    .article-item-image {
        padding-right: 20px;
        margin-right: 20px;
        border-right: 1px solid var(--color-border);
    }

    .article-item-image img {
        border-radius: 5px;
    }

    .article-item-info {
        display: flex;
        align-self: stretch;
        flex-direction: column;
    }

    .article-item-info p {
        flex: 1;
        color: var(--color-muted);
        font-size: 0.94rem;
        line-height: 1.6;
    }

    .article-item-author {
        color: var(--color-muted);
        font-size: 0.8rem;
    }

    @media (max-width: 575.98px) {
        .article-item {
            padding: 16px;
        }

        .article-item-info h2 {
            font-size: 1.05rem;
        }
    }
</style>
