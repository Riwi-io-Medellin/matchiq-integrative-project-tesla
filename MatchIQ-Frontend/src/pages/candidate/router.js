// ── Candidate SPA Router ────────────────────────────────────────
// Hash-based router: loads HTML fragments and executes init functions.

const APP_CONTAINER_ID = 'app';

/** @type {Map<string, { html: string, init: (params?: object) => void }>} */
const routes = new Map();

let currentRoute = '';
let currentParams = '';

/**
 * Register a route with its HTML fragment and init function.
 */
export function registerRoute(path, htmlFile, initFn) {
    routes.set(path, { html: htmlFile, init: initFn });
}

/**
 * Navigate to a route programmatically.
 */
export function navigateTo(path) {
    window.location.hash = `/${path}`;
}

/**
 * Parse the current hash into route path + params.
 */
function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    return { path: hash, params: {} };
}

/**
 * Resolve the current route: fetch HTML, inject, run init.
 */
async function resolve() {
    const { path, params } = parseHash();

    const paramsKey = JSON.stringify(params);
    if (path === currentRoute && paramsKey === currentParams) return;
    currentRoute = path;
    currentParams = paramsKey;

    const route = routes.get(path);
    if (!route) {
        document.getElementById(APP_CONTAINER_ID).innerHTML = `
            <div class="empty-state view-enter">
                <h2 class="empty-state__title">Page not found</h2>
                <p class="empty-state__text">The view you're looking for doesn't exist.</p>
                <a href="#/dashboard" class="btn btn--primary">Go to Dashboard</a>
            </div>`;
        return;
    }

    const container = document.getElementById(APP_CONTAINER_ID);

    container.innerHTML = `
        <div class="page-loader">
            <div class="page-loader__spinner"></div>
            <span class="page-loader__text">Loading…</span>
        </div>`;

    try {
        const response = await fetch(route.html + '?v=' + Date.now());
        const html = await response.text();
        container.innerHTML = html;
        container.classList.remove('view-enter');
        void container.offsetWidth;
        container.classList.add('view-enter');

        updateSidebarActive(path);
        route.init(params);
    } catch (err) {
        console.error(`Error loading view "${path}":`, err);
    }
}

/**
 * Update sidebar active state.
 */
function updateSidebarActive(path) {
    const navItems = document.querySelectorAll('#sidebar-nav .nav__item');
    navItems.forEach(item => {
        const route = item.dataset.route;
        item.classList.toggle('is-active', path === route);
    });
}

/**
 * Start the router.
 */
export function startRouter() {
    window.addEventListener('hashchange', resolve);
    resolve();
}
