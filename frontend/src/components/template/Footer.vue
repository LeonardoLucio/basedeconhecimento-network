<template>
    <footer class="footer">
        <span>Base de Conhecimento <span aria-hidden="true">·</span> Organize e compartilhe conhecimento</span>
    </footer>
</template>

<script>
export default {
    name: "Footer"
}
</script>

<style>
    .footer {
        grid-area: footer;
        min-height: 54px;
        color: var(--color-muted);
        border-top: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 20px;
        font-size: 0.78rem;
    }
</style>
