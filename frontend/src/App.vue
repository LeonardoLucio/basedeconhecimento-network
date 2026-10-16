<template>
	<div class="app-shell" :class="{ 'menu-open': isMenuVisible && user }">
		<Header title="Base de Conhecimento"
			:hideToggle="!user"
			:hideUserDropdown="!user" />
		<Menu v-if="user" />
		<button
			v-if="isMenuVisible && user"
			class="menu-backdrop"
			type="button"
			aria-label="Fechar menu"
			@click="toggleMenu(false)"
		></button>
		<Loading v-if="validatingToken" />
		<Content v-else />
		<Footer />
	</div>
</template>

<script>
import axios from "axios"
import { baseApiUrl, showError, userKey } from "@/global"
import { mapState } from "pinia"
import { useAppStore } from "@/config/store"
import Header from "@/components/template/Header.vue"
import Menu from "@/components/template/Menu.vue"
import Content from "@/components/template/Content.vue"
import Footer from "@/components/template/Footer.vue"
import Loading from "@/components/template/Loading.vue"

export default {
	name: "App",
	components: { Header, Menu, Content, Footer, Loading },
	computed: mapState(useAppStore, ['isMenuVisible', 'user']),
	data: function() {
		return {
			validatingToken: true
		}
	},
	methods: {
		toggleMenu(isVisible) {
			useAppStore().toggleMenu(isVisible)
		},
		async validateToken() {
			this.validatingToken = true

			let userData
			try {
				userData = JSON.parse(localStorage.getItem(userKey))
			} catch {
				localStorage.removeItem(userKey)
			}
			useAppStore().setUser(null)

			if(!userData) {
				this.validatingToken = false
				this.$router.push({ name: 'auth' })
				return
			}

			try {
				const res = await axios.post(`${baseApiUrl}/validateToken`, userData)

				if (res.data?.valid && res.data.user) {
					const refreshedUser = { ...res.data.user, token: userData.token }
					localStorage.setItem(userKey, JSON.stringify(refreshedUser))
					useAppStore().setUser(refreshedUser)

					if(window.matchMedia('(max-width: 767.98px)').matches) {
						useAppStore().toggleMenu(false)
					}
				} else {
					localStorage.removeItem(userKey)
					this.$router.push({ name: 'auth' })
				}
			} catch (error) {
				showError(error)
				localStorage.removeItem(userKey)
				this.$router.push({ name: 'auth' })
			} finally {
				this.validatingToken = false
			}
		}
	},
	created() {
		this.validateToken()
	}
}
</script>

<style>
	:root {
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		color: #172033;
		background: #f4f6fb;
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-optical-sizing: auto;
		--color-primary: #4255d4;
		--color-primary-dark: #3344b5;
		--color-muted: #667085;
		--color-border: #e4e8f0;
	}

	* {
		box-sizing: border-box;
	}

	body {
		margin: 0;
		min-width: 320px;
		min-height: 100vh;
		background: #f4f6fb;
	}

	.app-shell {
		min-height: 100vh;
		display: grid;
		grid-template-rows: 72px 1fr auto;
		grid-template-columns: 280px minmax(0, 1fr);
		grid-template-areas:
			"header header"
			"menu content"
			"menu footer";
	}

	.app-shell:not(.menu-open) {
		grid-template-columns: 0 minmax(0, 1fr);
	}

	.menu-backdrop {
		display: none;
	}

	button, input, select, textarea {
		font: inherit;
	}

	.form-control,
	.form-select {
		min-height: 42px;
		border-color: #d0d5dd;
		border-radius: 9px;
	}

	.form-control:focus,
	.form-select:focus {
		border-color: #7d89eb;
		box-shadow: 0 0 0 3px rgba(66, 85, 212, 0.13);
	}

	.btn {
		border-radius: 9px;
		font-weight: 600;
	}

	.btn-primary {
		--bs-btn-bg: var(--color-primary);
		--bs-btn-border-color: var(--color-primary);
		--bs-btn-hover-bg: var(--color-primary-dark);
		--bs-btn-hover-border-color: var(--color-primary-dark);
	}

	.table {
		--bs-table-bg: transparent;
		margin-bottom: 0;
		font-size: 0.88rem;
	}

	.table thead th {
		color: #667085;
		background: #f8f9fc;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.table > :not(caption) > * > * {
		padding: 12px;
		border-bottom-color: var(--color-border);
	}

	.ql-editor pre.ql-syntax,
	.article-content pre.ql-syntax {
		color: #f8fafc;
		background: #090d14;
		border: 1px solid #263244;
		border-radius: 8px;
		padding: 14px 16px;
		font-family: 'Cascadia Code', Consolas, monospace;
		line-height: 1.6;
	}

	:focus-visible {
		outline: 3px solid rgba(66, 85, 212, 0.35);
		outline-offset: 2px;
	}

	@media (max-width: 767.98px) {
		.app-shell,
		.app-shell:not(.menu-open) {
			grid-template-rows: 64px minmax(0, 1fr) auto;
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas:
				"header"
				"content"
				"footer";
		}

		.app-shell.menu-open .menu {
			transform: translateX(0);
		}

		.menu-backdrop {
			position: fixed;
			inset: 64px 0 0;
			z-index: 19;
			display: block;
			border: 0;
			background: rgba(16, 24, 40, 0.42);
		}
	}
</style>
