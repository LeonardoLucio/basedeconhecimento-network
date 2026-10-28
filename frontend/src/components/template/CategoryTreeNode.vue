<template>
    <li class="category-tree-node">
        <button class="category-tree-link" type="button"
            :disabled="node.navigationOnly"
            :title="node.navigationOnly ? 'Acesse uma subcategoria liberada' : ''"
            @click="$emit('select', node)">
            <Folder :size="16" aria-hidden="true" />
            {{ node.name }}
        </button>
        <ul v-if="node.children && node.children.length">
            <CategoryTreeNode
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                @select="$emit('select', $event)"
            />
        </ul>
    </li>
</template>

<script>
import { Folder } from '@lucide/vue'

export default {
    name: 'CategoryTreeNode',
    components: { Folder },
    props: {
        node: {
            type: Object,
            required: true
        }
    },
    emits: ['select']
}
</script>

<style>
.category-tree-node ul {
    list-style: none;
    padding-left: 16px;
    margin: 2px 0 2px 10px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.category-tree-link {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    border: 0;
    padding: 9px 10px;
    background: transparent;
    color: #cbd2e3;
    text-align: left;
    border-radius: 9px;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease;
}

.category-tree-link svg { flex: 0 0 auto; color: #8d97b3; }

.category-tree-link:hover,
.category-tree-link:focus-visible {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
}

.category-tree-link:hover svg { color: #b9b9f7; }

.category-tree-link:disabled { color: #7d87a3; cursor: default; }
.category-tree-link:disabled:hover { background: transparent; }
</style>
