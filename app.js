/**
 * TwoBrainCells - Main Application Controller
 * Handles Navigation, 3D Canvas instances, Catalog Rendering, Modals & Interactions
 */

const App = {
    heroViewer: null,
    storyViewer: null,
    modalViewer: null,
    activeStoryStep: 0,
    activeProductFor3D: null,

    init() {
        // Initialize Store
        window.Store.init();

        // 1. Initialize Hero 3D Jhumka Viewer
        this.initHeroViewer();

        // 2. Initialize 3D Texture Storytelling Viewer
        this.initStoryViewer();

        // 3. Render Product Catalog
        this.renderProducts();

        // 4. Render Collections
        this.renderCollections();

        // 5. Setup UI Listeners
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.setupStoryScroll();
        this.setupCustomCursor();
        this.setupNewsletter();
        this.setupModals();

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    initHeroViewer() {
        const container = document.getElementById('hero-jhumka-canvas');
        if (!container) return;

        this.heroViewer = new LuxuryJhumkaViewer('hero-jhumka-canvas', {
            autoRotate: true,
            autoRotateSpeed: 0.006,
            metalType: 'yellow-gold',
            gemType: 'emerald',
            fov: 36
        });

        // Setup Hero interactive material pickers
        document.querySelectorAll('.hero-metal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.hero-metal-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const metal = btn.dataset.metal;
                if (this.heroViewer) this.heroViewer.setMetal(metal);
            });
        });

        document.querySelectorAll('.hero-gem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.hero-gem-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const gem = btn.dataset.gem;
                if (this.heroViewer) this.heroViewer.setGemstone(gem);
            });
        });

        // Hero Camera Presets
        document.querySelectorAll('.hero-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hero-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = btn.dataset.preset;
                if (this.heroViewer) this.heroViewer.setCameraPreset(preset);
            });
        });
    },

    initStoryViewer() {
        const container = document.getElementById('story-jhumka-canvas');
        if (!container) return;

        this.storyViewer = new LuxuryJhumkaViewer('story-jhumka-canvas', {
            autoRotate: false,
            metalType: 'yellow-gold',
            gemType: 'ruby',
            fov: 34
        });
    },

    setupStoryScroll() {
        const steps = [
            { id: 0, preset: 'overview', title: 'The Royal Silhouette', desc: 'Handcrafted in 22K solid gold with parabolic bell geometry inspired by royal Indian courtyards.' },
            { id: 1, preset: 'macro-stud', title: 'Precision Kundan Crown', desc: 'Natural gemstone cabochon framed by eight hand-bezel set polki syndicate diamonds in pure 24K gold foil.' },
            { id: 2, preset: 'macro-jali', title: 'Hand-Pierced Jali Filigree', desc: 'Master artisans chisel microscopic lattice windows to permit light diffusion while preserving acoustic ring.' },
            { id: 3, preset: 'inside-bell', title: 'The Secret Interior Vault', desc: 'Glide inside the hollow bell to witness hand-painted Meenakari enamel roses and the tuned pearl clapper.' },
            { id: 4, preset: 'macro-pearls', title: 'Cascading Basra Pearls', desc: '48 calibrated natural seed pearls individually strung on pure gold wires that sway rhythmically with your poise.' }
        ];

        window.setStoryStep = (stepIndex) => {
            this.activeStoryStep = stepIndex;
            const step = steps[stepIndex];
            if (!step) return;

            // Update 3D Camera
            if (this.storyViewer) {
                this.storyViewer.setCameraPreset(step.preset, 1.8);
            }

            // Update UI indicators
            document.querySelectorAll('.story-nav-btn').forEach((btn, idx) => {
                btn.classList.toggle('active', idx === stepIndex);
            });

            // Update text content
            const titleEl = document.getElementById('story-step-title');
            const descEl = document.getElementById('story-step-desc');
            const badgeEl = document.getElementById('story-step-badge');

            if (titleEl && descEl) {
                titleEl.textContent = step.title;
                descEl.textContent = step.desc;
                if (badgeEl) badgeEl.textContent = `Phase 0${stepIndex + 1} / 05`;
            }
        };

        // Story Auto Play / Next / Prev
        const prevBtn = document.getElementById('story-prev-btn');
        const nextBtn = document.getElementById('story-next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const prev = (this.activeStoryStep - 1 + steps.length) % steps.length;
                window.setStoryStep(prev);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const next = (this.activeStoryStep + 1) % steps.length;
                window.setStoryStep(next);
            });
        }
    },

    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        let filtered = window.TBC_PRODUCTS.filter(product => {
            const f = window.Store.filters;
            // Category filter
            if (f.category !== 'all' && product.category !== f.category) return false;
            // Material filter
            if (f.material !== 'all' && product.materialCategory !== f.material) return false;
            // Stone filter
            if (f.stone !== 'all' && product.stoneCategory !== f.stone) return false;
            // Occasion filter
            if (f.occasion !== 'all' && product.occasion !== f.occasion) return false;
            // Price filter
            if (product.priceINR > f.maxPrice) return false;
            // Search Query
            if (f.searchQuery) {
                const q = f.searchQuery.toLowerCase();
                const matchName = product.name.toLowerCase().includes(q);
                const matchTag = product.tagline.toLowerCase().includes(q);
                const matchStone = product.stone.toLowerCase().includes(q);
                if (!matchName && !matchTag && !matchStone) return false;
            }
            return true;
        });

        // Sorting
        const sort = window.Store.filters.sort;
        if (sort === 'price-low') {
            filtered.sort((a, b) => a.priceINR - b.priceINR);
        } else if (sort === 'price-high') {
            filtered.sort((a, b) => b.priceINR - a.priceINR);
        } else if (sort === 'newest') {
            filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        } else if (sort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        // Render count
        const countEl = document.getElementById('products-count');
        if (countEl) {
            countEl.textContent = `Showing ${filtered.length} of ${window.TBC_PRODUCTS.length} Masterpieces`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i data-lucide="search-x"></i>
                    <h3>No Matching Jewels Found</h3>
                    <p>Try refining your filters or explore our signature 3D Jhumka collection.</p>
                    <button class="tbc-btn tbc-btn-secondary" onclick="App.resetFilters()">Reset All Filters</button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let html = '';
        filtered.forEach(p => {
            const isWish = window.Store.isInWishlist(p.id);
            html += `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-media">
                        <img src="${p.image}" alt="${p.name}" loading="lazy" class="product-img">
                        <span class="product-badge">${p.badge}</span>
                        <button class="wishlist-toggle ${isWish ? 'active' : ''}" 
                                data-wishlist-id="${p.id}" 
                                onclick="event.stopPropagation(); Store.toggleWishlist('${p.id}')"
                                title="Add to Wishlist" 
                                aria-label="Add to Wishlist">
                            <i data-lucide="heart"></i>
                        </button>
                        <div class="product-card-overlay">
                            <button class="overlay-btn view-3d-btn" onclick="event.stopPropagation(); App.open3DModal('${p.id}')">
                                <i data-lucide="box"></i> View in 3D
                            </button>
                            <button class="overlay-btn quick-view-btn" onclick="event.stopPropagation(); App.openQuickView('${p.id}')">
                                <i data-lucide="eye"></i> Quick View
                            </button>
                        </div>
                    </div>
                    <div class="product-content" onclick="App.openQuickView('${p.id}')">
                        <div class="product-category-meta">${p.subCategory} • ${p.grossWeight}</div>
                        <h3 class="product-title">${p.name}</h3>
                        <p class="product-tagline">${p.tagline}</p>
                        <div class="product-rating">
                            <span class="stars">★★★★★</span>
                            <span class="score">${p.rating}</span>
                            <span class="count">(${p.reviewsCount})</span>
                        </div>
                        <div class="product-price-row">
                            <span class="product-price">${window.Store.formatPrice(p.priceINR)}</span>
                            <button class="tbc-btn tbc-btn-sm tbc-btn-primary add-bag-btn" onclick="event.stopPropagation(); Store.addToCart('${p.id}')">
                                <i data-lucide="shopping-bag"></i> Add to Bag
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    renderCollections() {
        const container = document.getElementById('collections-grid');
        if (!container) return;

        let html = '';
        window.TBC_COLLECTIONS.forEach(col => {
            html += `
                <div class="collection-card" onclick="App.filterByCollection('${col.filter}')">
                    <div class="collection-bg">
                        <img src="${col.image}" alt="${col.title}">
                    </div>
                    <div class="collection-overlay">
                        <span class="collection-tag">${col.tag}</span>
                        <h3 class="collection-title">${col.title}</h3>
                        <p class="collection-subtitle">${col.subtitle}</p>
                        <span class="collection-cta">Discover Edit <i data-lucide="arrow-right"></i></span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    filterByCollection(filterKey) {
        if (filterKey === 'jhumkas') {
            window.Store.filters.category = 'jhumkas';
            window.Store.filters.material = 'all';
            window.Store.filters.occasion = 'all';
        } else if (filterKey === '22k-gold') {
            window.Store.filters.category = 'all';
            window.Store.filters.material = '22k-gold';
            window.Store.filters.occasion = 'all';
        } else if (filterKey === 'festive' || filterKey === 'everyday' || filterKey === 'bridal') {
            window.Store.filters.category = 'all';
            window.Store.filters.material = 'all';
            window.Store.filters.occasion = filterKey;
        }

        // Sync dropdowns/buttons
        const catSelect = document.getElementById('filter-category');
        if (catSelect) catSelect.value = window.Store.filters.category;

        this.renderProducts();
        const catalogSec = document.getElementById('jhumkas-section');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
    },

    setupFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const materialFilter = document.getElementById('filter-material');
        const occasionFilter = document.getElementById('filter-occasion');
        const sortFilter = document.getElementById('filter-sort');
        const priceSlider = document.getElementById('filter-price-slider');
        const priceLabel = document.getElementById('filter-price-label');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                window.Store.filters.category = e.target.value;
                this.renderProducts();
            });
        }
        if (materialFilter) {
            materialFilter.addEventListener('change', (e) => {
                window.Store.filters.material = e.target.value;
                this.renderProducts();
            });
        }
        if (occasionFilter) {
            occasionFilter.addEventListener('change', (e) => {
                window.Store.filters.occasion = e.target.value;
                this.renderProducts();
            });
        }
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                window.Store.filters.sort = e.target.value;
                this.renderProducts();
            });
        }
        if (priceSlider && priceLabel) {
            priceSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                window.Store.filters.maxPrice = val;
                priceLabel.textContent = window.Store.formatPrice(val);
                this.renderProducts();
            });
        }

        // Category Pills in header of catalog
        document.querySelectorAll('.cat-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cat = btn.dataset.category;
                window.Store.filters.category = cat;
                if (categoryFilter) categoryFilter.value = cat;
                this.renderProducts();
            });
        });
    },

    resetFilters() {
        window.Store.filters = {
            category: 'all',
            material: 'all',
            stone: 'all',
            occasion: 'all',
            maxPrice: 500000,
            sort: 'featured',
            searchQuery: ''
        };

        const catSelect = document.getElementById('filter-category');
        const matSelect = document.getElementById('filter-material');
        const occSelect = document.getElementById('filter-occasion');
        const sortSelect = document.getElementById('filter-sort');
        const priceSlider = document.getElementById('filter-price-slider');
        const searchInput = document.getElementById('nav-search-input');

        if (catSelect) catSelect.value = 'all';
        if (matSelect) matSelect.value = 'all';
        if (occSelect) occSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'featured';
        if (priceSlider) priceSlider.value = 500000;
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
        const firstPill = document.querySelector('.cat-pill-btn[data-category="all"]');
        if (firstPill) firstPill.classList.add('active');

        this.renderProducts();
    },

    setupSearch() {
        const searchInput = document.getElementById('nav-search-input');
        const autocompleteDropdown = document.getElementById('search-autocomplete');

        if (searchInput && autocompleteDropdown) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                window.Store.filters.searchQuery = q;

                if (q.length === 0) {
                    autocompleteDropdown.classList.remove('open');
                    this.renderProducts();
                    return;
                }

                const matches = window.TBC_PRODUCTS.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    p.category.toLowerCase().includes(q) || 
                    p.stone.toLowerCase().includes(q)
                ).slice(0, 4);

                if (matches.length > 0) {
                    let autoHtml = '';
                    matches.forEach(p => {
                        autoHtml += `
                            <div class="autocomplete-item" onclick="App.openQuickView('${p.id}')">
                                <img src="${p.image}" alt="${p.name}">
                                <div>
                                    <h4>${p.name}</h4>
                                    <span>${window.Store.formatPrice(p.priceINR)} • ${p.subCategory}</span>
                                </div>
                            </div>
                        `;
                    });
                    autocompleteDropdown.innerHTML = autoHtml;
                    autocompleteDropdown.classList.add('open');
                } else {
                    autocompleteDropdown.innerHTML = `<div class="autocomplete-no-match">No results found for "${q}"</div>`;
                    autocompleteDropdown.classList.add('open');
                }

                this.renderProducts();
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                    autocompleteDropdown.classList.remove('open');
                }
            });
        }
    },

    setupNavigation() {
        const header = document.getElementById('main-header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Mobile Menu Drawer
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const mobileDrawer = document.getElementById('mobile-nav-drawer');
        const mobileClose = document.getElementById('mobile-nav-close');
        const drawerOverlay = document.getElementById('drawer-overlay');

        if (menuToggle && mobileDrawer) {
            menuToggle.addEventListener('click', () => {
                mobileDrawer.classList.add('open');
                if (drawerOverlay) drawerOverlay.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        }

        if (mobileClose && mobileDrawer) {
            mobileClose.addEventListener('click', () => {
                mobileDrawer.classList.remove('open');
                if (drawerOverlay) drawerOverlay.classList.remove('open');
                document.body.style.overflow = '';
            });
        }

        // Currency dropdown
        const currSelect = document.getElementById('currency-selector');
        if (currSelect) {
            currSelect.value = window.Store.currency;
            currSelect.addEventListener('change', (e) => {
                window.Store.setCurrency(e.target.value);
            });
        }
    },

    updateCurrencyUI() {
        const currSelect = document.getElementById('currency-selector');
        if (currSelect) currSelect.value = window.Store.currency;

        const slider = document.getElementById('filter-price-slider');
        const label = document.getElementById('filter-price-label');
        if (slider && label) {
            label.textContent = window.Store.formatPrice(parseInt(slider.value, 10));
        }
    },

    setupCustomCursor() {
        const cursorDot = document.getElementById('custom-cursor-dot');
        const cursorRing = document.getElementById('custom-cursor-ring');
        if (!cursorDot || !cursorRing) return;

        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        });

        const renderRing = () => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
            requestAnimationFrame(renderRing);
        };
        requestAnimationFrame(renderRing);

        // Hover expand on interactive elements
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('button, a, .product-card, .collection-card, input, select')) {
                cursorRing.classList.add('hovered');
            } else {
                cursorRing.classList.remove('hovered');
            }
        });
    },

    open3DModal(productId) {
        const product = window.TBC_PRODUCTS.find(p => p.id === productId) || window.TBC_PRODUCTS[0];
        this.activeProductFor3D = product;

        const modal = document.getElementById('modal-3d-viewer');
        if (!modal) return;

        // Populate info in 3D modal
        document.getElementById('modal-3d-title').textContent = product.name;
        document.getElementById('modal-3d-meta').textContent = `${product.material} • ${product.stone}`;
        document.getElementById('modal-3d-price').textContent = window.Store.formatPrice(product.priceINR);

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Initialize 3D instance inside modal canvas
        if (this.modalViewer) {
            this.modalViewer.destroy();
        }

        setTimeout(() => {
            this.modalViewer = new LuxuryJhumkaViewer('modal-3d-canvas', {
                autoRotate: true,
                autoRotateSpeed: 0.005,
                metalType: 'yellow-gold',
                gemType: product.stoneCategory === 'ruby' ? 'ruby' : 'emerald',
                fov: 34
            });
        }, 100);
    },

    close3DModal() {
        const modal = document.getElementById('modal-3d-viewer');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
        if (this.modalViewer) {
            this.modalViewer.destroy();
            this.modalViewer = null;
        }
    },

    openQuickView(productId) {
        const product = window.TBC_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('quick-view-modal');
        const content = document.getElementById('quick-view-content');
        if (!modal || !content) return;

        let detailsListHtml = '';
        product.details.forEach(d => {
            detailsListHtml += `<li><i data-lucide="check"></i> <span>${d}</span></li>`;
        });

        content.innerHTML = `
            <div class="qv-grid">
                <div class="qv-media">
                    <img src="${product.image}" alt="${product.name}" class="qv-hero-img">
                    ${product.isJhumka ? `
                        <button class="tbc-btn tbc-btn-secondary qv-launch-3d" onclick="App.closeQuickView(); App.open3DModal('${product.id}')">
                            <i data-lucide="box"></i> Launch Interactive 3D Model
                        </button>
                    ` : ''}
                </div>
                <div class="qv-details">
                    <div class="qv-badge">${product.badge}</div>
                    <h2 class="qv-title">${product.name}</h2>
                    <p class="qv-tagline">${product.tagline}</p>
                    <div class="qv-rating">
                        <span class="stars">★★★★★</span>
                        <span>${product.rating} (${product.reviewsCount} verified royal reviews)</span>
                    </div>
                    <div class="qv-price">${window.Store.formatPrice(product.priceINR)}</div>
                    <p class="qv-desc">${product.description}</p>
                    
                    <div class="qv-specs-table">
                        <div class="qv-spec-row"><span>Material Purity</span><strong>${product.material}</strong></div>
                        <div class="qv-spec-row"><span>Gross Weight</span><strong>${product.grossWeight}</strong></div>
                        <div class="qv-spec-row"><span>Net Gold Weight</span><strong>${product.goldWeight}</strong></div>
                        <div class="qv-spec-row"><span>Primary Gemstone</span><strong>${product.stone}</strong></div>
                        <div class="qv-spec-row"><span>Dimensions</span><strong>${product.dimensions}</strong></div>
                        <div class="qv-spec-row"><span>Certification</span><strong>${product.certificate}</strong></div>
                    </div>

                    <ul class="qv-craft-list">${detailsListHtml}</ul>

                    <div class="qv-actions">
                        <button class="tbc-btn tbc-btn-primary" onclick="Store.addToCart('${product.id}', 1); App.closeQuickView();">
                            <i data-lucide="shopping-bag"></i> Add to Shopping Bag
                        </button>
                        <button class="tbc-btn tbc-btn-secondary" onclick="Store.addToCart('${product.id}', 1); App.closeQuickView(); Store.openCheckout();">
                            Buy Now
                        </button>
                        <button class="tbc-btn tbc-btn-icon" onclick="Store.toggleWishlist('${product.id}')" title="Save to Wishlist">
                            <i data-lucide="heart"></i>
                        </button>
                    </div>

                    <div class="qv-perks">
                        <div><i data-lucide="shield-check"></i> BIS 916 Hallmarked</div>
                        <div><i data-lucide="truck"></i> Insured Global Courier</div>
                        <div><i data-lucide="refresh-cw"></i> 15-Day Exchange</div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.lucide) lucide.createIcons();
    },

    closeQuickView() {
        const modal = document.getElementById('quick-view-modal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    setupModals() {
        // Close modal buttons
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetModal = btn.closest('.tbc-modal');
                if (targetModal) {
                    targetModal.classList.remove('open');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.tbc-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                    document.body.style.overflow = '';
                }
            });
        });

        // Overlay click closes drawers
        const overlay = document.getElementById('drawer-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                window.Store.closeCart();
                window.Store.closeWishlist();
                const mobileDrawer = document.getElementById('mobile-nav-drawer');
                if (mobileDrawer) mobileDrawer.classList.remove('open');
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            });
        }
    },

    openConsultationModal() {
        const modal = document.getElementById('consultation-modal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    },

    submitConsultation(e) {
        if (e) e.preventDefault();
        const form = document.getElementById('consultation-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const modal = document.getElementById('consultation-modal');
        if (modal) modal.classList.remove('open');
        document.body.style.overflow = '';

        window.Store.showToast('Consultation Scheduled', 'A Senior Jewelry Specialist will connect via video call at your selected slot.');
    },

    setupNewsletter() {
        const form = document.getElementById('newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('newsletter-email');
                if (input && input.value) {
                    window.Store.showToast('Privilege Access Granted', `Welcome to TwoBrainCells Private Circle (${input.value})`);
                    input.value = '';
                }
            });
        }
    }
};

window.App = App;

// Boot application upon DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
