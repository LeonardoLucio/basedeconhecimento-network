<template>
    <div class="page-title">
        <div class="page-title-icon" v-if="icon"><component :is="icon" :size="23" /></div>
        <div class="page-title-copy">
            <p v-if="sub" class="page-title-subtitle">{{ sub }}</p>
            <h1>{{ main }}</h1>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PageTitle',
    props: ['icon', 'main', 'sub']
}
</script>

<style>
    .page-title {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
    }

    .page-title-icon {
        width: 50px;
        height: 50px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(135deg, #7272ec, #4747c2);
        border-radius: 15px;
        box-shadow: 0 8px 18px rgba(91, 91, 214, 0.3);
    }

    .page-title-copy { min-width: 0; }

    .page-title h1 {
        margin: 0;
        color: var(--color-ink);
        font-size: clamp(1.45rem, 2vw, 1.9rem);
        font-weight: 750;
        letter-spacing: -0.035em;
        overflow-wrap: anywhere;
    }

    .page-title-subtitle {
        margin: 0 0 3px;
        color: var(--color-muted);
        font-size: 0.86rem;
        font-weight: 500;
    }
</style>
