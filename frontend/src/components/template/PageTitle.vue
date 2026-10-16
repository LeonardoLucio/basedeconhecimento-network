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
        gap: 15px;
        margin-bottom: 28px;
    }

    .page-title-icon {
        width: 48px;
        height: 48px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        color: var(--color-primary);
        background: #e9ecff;
        border-radius: 14px;
    }

    .page-title-copy {
        min-width: 0;
    }

    .page-title h1 {
        margin: 0;
        color: #172033;
        font-size: clamp(1.45rem, 2vw, 1.85rem);
        font-weight: 700;
        letter-spacing: -0.035em;
        overflow-wrap: anywhere;
    }

    .page-title-subtitle {
        margin: 0 0 3px;
        color: var(--color-muted);
        font-size: 0.88rem;
    }
</style>
