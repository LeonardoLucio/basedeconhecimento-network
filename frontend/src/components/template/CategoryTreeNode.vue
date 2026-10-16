<template>
    <li class="category-tree-node">
        <button class="category-tree-link" type="button" @click="$emit('select', node)">
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
    padding-left: 14px;
    margin: 3px 0;
}

.category-tree-link {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    border: 0;
    padding: 9px 10px;
    background: transparent;
    color: #d0d5dd;
    text-align: left;
    border-radius: 9px;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease;
}

.category-tree-link:hover,
.category-tree-link:focus {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
}
</style>
