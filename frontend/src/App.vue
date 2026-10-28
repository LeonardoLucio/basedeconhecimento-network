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
		font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: var(--color-text);
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-optical-sizing: auto;

		--color-primary: #5b5bd6;
		--color-primary-dark: #4747c2;
		--color-primary-soft: #eeeefd;
		--color-ink: #131a2e;
		--color-text: #1c2336;
		--color-muted: #667085;
		--color-border: #e5e7f0;
		--color-bg: #f5f6fb;
		--color-surface: #ffffff;
		--color-surface-alt: #f8f9fd;
		--color-danger: #d92d20;
		--color-success: #12a150;
		--radius-sm: 10px;
		--radius-md: 14px;
		--radius-lg: 20px;
		--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 8px rgba(16, 24, 40, 0.04);
		--shadow-md: 0 4px 12px rgba(16, 24, 40, 0.06), 0 12px 32px rgba(16, 24, 40, 0.06);
		--shadow-lg: 0 24px 60px rgba(16, 24, 40, 0.16);
		--header-height: 72px;
	}

	* { box-sizing: border-box; }

	html { scroll-behavior: smooth; }

	body {
		margin: 0;
		min-width: 320px;
		min-height: 100vh;
		color: var(--color-text);
		background:
			radial-gradient(900px 420px at 88% -8%, #e4e4ff 0%, rgba(228, 228, 255, 0) 70%),
			radial-gradient(700px 360px at -6% 8%, #e3f0ff 0%, rgba(227, 240, 255, 0) 70%),
			var(--color-bg);
		background-attachment: fixed;
	}

	::selection { background: rgba(91, 91, 214, 0.22); }

	.app-shell {
		min-height: 100vh;
		display: grid;
		grid-template-rows: var(--header-height) 1fr auto;
		grid-template-columns: 284px minmax(0, 1fr);
		grid-template-areas:
			"header header"
			"menu content"
			"menu footer";
		transition: grid-template-columns 200ms ease;
	}

	.app-shell:not(.menu-open) { grid-template-columns: 0 minmax(0, 1fr); }

	.menu-backdrop { display: none; }

	button, input, select, textarea { font: inherit; }

	a { color: var(--color-primary); }

	.form-label {
		margin-bottom: 6px;
		color: #344054;
		font-size: 0.84rem;
		font-weight: 600;
	}

	.form-control,
	.form-select {
		min-height: 44px;
		color: var(--color-text);
		background-color: var(--color-surface);
		border-color: #d5d9e5;
		border-radius: var(--radius-sm);
		transition: border-color 140ms ease, box-shadow 140ms ease;
	}

	.form-control::placeholder { color: #98a2b3; }

	.form-control:focus,
	.form-select:focus {
		border-color: #8f8fe8;
		box-shadow: 0 0 0 4px rgba(91, 91, 214, 0.14);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		transition: transform 120ms ease, box-shadow 160ms ease, background-color 160ms ease;
	}

	.btn:active:not(:disabled) { transform: translateY(1px); }

	.btn-primary {
		--bs-btn-bg: var(--color-primary);
		--bs-btn-border-color: var(--color-primary);
		--bs-btn-hover-bg: var(--color-primary-dark);
		--bs-btn-hover-border-color: var(--color-primary-dark);
		--bs-btn-active-bg: var(--color-primary-dark);
		--bs-btn-active-border-color: var(--color-primary-dark);
		--bs-btn-disabled-bg: var(--color-primary);
		--bs-btn-disabled-border-color: var(--color-primary);
		box-shadow: 0 1px 2px rgba(71, 71, 194, 0.3), 0 6px 14px rgba(91, 91, 214, 0.2);
	}

	.btn-outline-primary {
		--bs-btn-color: var(--color-primary);
		--bs-btn-border-color: #c9c9f3;
		--bs-btn-hover-bg: var(--color-primary);
		--bs-btn-hover-border-color: var(--color-primary);
		--bs-btn-active-bg: var(--color-primary-dark);
		--bs-btn-active-border-color: var(--color-primary-dark);
		--bs-btn-disabled-color: var(--color-primary);
		--bs-btn-disabled-border-color: #c9c9f3;
	}

	.btn-light {
		--bs-btn-bg: #f1f3f9;
		--bs-btn-border-color: #f1f3f9;
		--bs-btn-hover-bg: #e6e9f3;
		--bs-btn-hover-border-color: #e6e9f3;
	}

	.table {
		--bs-table-bg: transparent;
		--bs-table-striped-bg: #fafbfe;
		--bs-table-hover-bg: #f3f4ff;
		margin-bottom: 0;
		font-size: 0.88rem;
	}

	.table thead th {
		color: var(--color-muted);
		background: var(--color-surface-alt);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.table > :not(caption) > * > * {
		padding: 13px 14px;
		border-bottom-color: var(--color-border);
	}

	.table-responsive {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	hr { border-color: var(--color-border); opacity: 1; margin: 28px 0; }

	:focus-visible {
		outline: 3px solid rgba(91, 91, 214, 0.4);
		outline-offset: 2px;
	}

	* { scrollbar-color: #c4c9d8 transparent; scrollbar-width: thin; }

	@media (max-width: 767.98px) {
		.app-shell,
		.app-shell:not(.menu-open) {
			--header-height: 64px;
			grid-template-rows: 64px minmax(0, 1fr) auto;
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas:
				"header"
				"content"
				"footer";
		}

		.app-shell.menu-open .menu { transform: translateX(0); }

		.menu-backdrop {
			position: fixed;
			inset: 64px 0 0;
			z-index: 19;
			display: block;
			border: 0;
			background: rgba(16, 24, 40, 0.45);
			backdrop-filter: blur(2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
	}
</style>
