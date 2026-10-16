<template>
    <div class="stat">
        <div class="stat-icon">
            <component :is="icon" :size="25" :style="{ color }" aria-hidden="true" />
        </div>
        <div class="stat-info">
            <span class="stat-title">{{ title }}</span>
            <span class="stat-value">{{ value }}</span>
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
        border-radius: 16px;
        background: #fff;
        padding: 22px;
        border: 1px solid var(--color-border);
        box-shadow: 0 4px 14px rgba(16, 24, 40, 0.04);
    }

    .stat-icon {
        width: 50px;
        height: 50px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        background: #f4f6fb;
        border-radius: 14px;
    }

    .stat-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .stat-title {
        color: var(--color-muted);
        font-size: 0.84rem;
    }

    .stat-value {
        color: #172033;
        font-size: 1.8rem;
        font-weight: 700;
        letter-spacing: -0.04em;
    }
</style>
