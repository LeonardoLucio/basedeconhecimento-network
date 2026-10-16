import eslint from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'

export default [
    {
        ignores: ['dist/**', 'node_modules/**']
    },
    eslint.configs.recommended,
    ...vue.configs['flat/essential'],
    {
        files: ['src/**/*.{js,vue}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-reserved-component-names': 'off'
        }
    }
]
