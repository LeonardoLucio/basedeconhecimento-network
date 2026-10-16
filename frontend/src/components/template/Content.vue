<template>
    <div class="content">
        <router-view></router-view>
    </div>
</template>

<script>
export default {
    name: 'Content'
}
</script>

<style>
    .content {
        grid-area: content;
        min-width: 0;
        width: 100%;
        max-width: 1440px;
        margin: 0 auto;
        padding: 36px clamp(20px, 4vw, 64px);
    }

    @media (max-width: 767.98px) {
        .content {
            padding: 24px 16px;
        }
    }
</style>
