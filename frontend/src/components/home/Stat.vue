<template>
    <div class="stat">
        <div class="stat-icon">
            <component :is="icon" :size="25" :style="{ color }" aria-hidden="true" />
        </div>
        <div class="stat-info">
            <span class="stat-title">{{ title }}</span>
            <span class="stat-value">{{ displayValue }}</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Stat',
    props: {
        title: { type: String, required: true },
        value: { type: [Number, String], default: 0 },
        icon: { type: Object, required: true },
        color: { type: String, default: '#4255d4' }
    },
    computed: {
        displayValue() {
            return Number(this.value || 0).toLocaleString('pt-BR')
        }
    }
}
</script>

<style>
    .stat {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        border-radius: var(--radius-md);
        background: var(--color-surface);
        padding: 22px;
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
        transition: transform 160ms ease, box-shadow 160ms ease;
    }

    .stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

    .stat-icon {
        width: 52px;
        height: 52px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        background: var(--color-surface-alt);
        border: 1px solid var(--color-border);
        border-radius: 15px;
    }

    .stat-info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }

    .stat-title { color: var(--color-muted); font-size: 0.84rem; font-weight: 500; }

    .stat-value {
        color: var(--color-ink);
        font-size: 1.9rem;
        font-weight: 750;
        letter-spacing: -0.04em;
        line-height: 1.1;
    }
</style>
