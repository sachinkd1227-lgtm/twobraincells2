/**
 * TwoBrainCells - E-Commerce Store & State Management
 * Handles Cart, Wishlist, Currency Conversion, Filtering, and Checkout
 */

const Store = {
    cart: [],
    wishlist: [],
    currency: 'INR',
    filters: {
        category: 'all',
        material: 'all',
        stone: 'all',
        occasion: 'all',
        maxPrice: 500000,
        sort: 'featured',
        searchQuery: ''
    },
    appliedCoupon: null,
    giftPackaging: false,

    init() {
        // Load from LocalStorage if available
        try {
            const savedCart = localStorage.getItem('tbc_cart');
            if (savedCart) this.cart = JSON.parse(savedCart);

            const savedWishlist = localStorage.getItem('tbc_wishlist');
            if (savedWishlist) this.wishlist = JSON.parse(savedWishlist);

            const savedCurrency = localStorage.getItem('tbc_currency');
            if (savedCurrency && window.TBC_CURRENCIES[savedCurrency]) {
                this.currency = savedCurrency;
            }
        } catch (e) {
            console.warn('LocalStorage unavailable:', e);
        }

        this.updateBadges();
    },

    saveCart() {
        try {
            localStorage.setItem('tbc_cart', JSON.stringify(this.cart));
        } catch (e) {}
        this.updateBadges();
        this.renderCartDrawer();
    },

    saveWishlist() {
        try {
            localStorage.setItem('tbc_wishlist', JSON.stringify(this.wishlist));
        } catch (e) {}
        this.updateBadges();
        this.renderWishlistDrawer();
    },

    setCurrency(currCode) {
        if (window.TBC_CURRENCIES[currCode]) {
            this.currency = currCode;
            try {
                localStorage.setItem('tbc_currency', currCode);
            } catch (e) {}
            // Re-render UI
            if (window.App) {
                window.App.renderProducts();
                this.renderCartDrawer();
                this.renderWishlistDrawer();
                window.App.updateCurrencyUI();
            }
        }
    },

    formatPrice(amountINR) {
        const curr = window.TBC_CURRENCIES[this.currency] || window.TBC_CURRENCIES.INR;
        const converted = Math.round(amountINR * curr.rate);
        
        if (this.currency === 'INR') {
            return `₹${converted.toLocaleString('en-IN')}`;
        } else if (this.currency === 'USD') {
            return `$${converted.toLocaleString('en-US')}`;
        } else if (this.currency === 'EUR') {
            return `€${converted.toLocaleString('de-DE')}`;
        } else if (this.currency === 'GBP') {
            return `£${converted.toLocaleString('en-GB')}`;
        } else if (this.currency === 'AED') {
            return `AED ${converted.toLocaleString('en-AE')}`;
        }
        return `${curr.symbol}${converted.toLocaleString()}`;
    },

    addToCart(productId, quantity = 1, options = {}) {
        const product = window.TBC_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const metal = options.metal || '22K Yellow Gold';
        const stone = options.stone || product.stone;

        const existingItem = this.cart.find(item => 
            item.productId === productId && 
            item.metal === metal && 
            item.stone === stone
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                productId: product.id,
                name: product.name,
                priceINR: product.priceINR,
                image: product.image,
                metal: metal,
                stone: stone,
                quantity: quantity
            });
        }

        this.saveCart();
        this.showToast(`Added to your Shopping Bag`, product.name);
        this.openCart();
    },

    updateQuantity(index, newQty) {
        if (newQty <= 0) {
            this.cart.splice(index, 1);
        } else {
            this.cart[index].quantity = newQty;
        }
        this.saveCart();
    },

    removeFromCart(index) {
        const removed = this.cart.splice(index, 1)[0];
        this.saveCart();
        if (removed) {
            this.showToast('Removed from Bag', removed.name);
        }
    },

    toggleWishlist(productId) {
        const product = window.TBC_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const idx = this.wishlist.indexOf(productId);
        if (idx > -1) {
            this.wishlist.splice(idx, 1);
            this.showToast('Removed from Wishlist', product.name);
        } else {
            this.wishlist.push(productId);
            this.showToast('Added to Wishlist', product.name);
        }
        this.saveWishlist();

        // Update heart icons across cards
        document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
            btn.classList.toggle('active', this.wishlist.includes(productId));
        });
    },

    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    },

    applyCoupon(code) {
        const cleanCode = (code || '').trim().toUpperCase();
        if (cleanCode === 'ROYAL10') {
            this.appliedCoupon = { code: 'ROYAL10', discountPercent: 10, name: 'Royal 10% Privileged Savings' };
            this.showToast('Coupon Applied', '10% Royal privilege discount unlocked!');
        } else if (cleanCode === 'JHUMKA15') {
            this.appliedCoupon = { code: 'JHUMKA15', discountPercent: 15, name: 'Festive 15% Jhumka Savings' };
            this.showToast('Coupon Applied', '15% Jhumka privilege discount unlocked!');
        } else {
            this.showToast('Invalid Code', 'Try ROYAL10 or JHUMKA15');
            return false;
        }
        this.renderCartDrawer();
        return true;
    },

    removeCoupon() {
        this.appliedCoupon = null;
        this.renderCartDrawer();
        this.showToast('Coupon Removed', 'Standard pricing restored.');
    },

    toggleGiftPackaging() {
        this.giftPackaging = !this.giftPackaging;
        this.renderCartDrawer();
    },

    getCartSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.priceINR * item.quantity), 0);
    },

    getCartDiscount() {
        if (!this.appliedCoupon) return 0;
        const subtotal = this.getCartSubtotal();
        return Math.round((subtotal * this.appliedCoupon.discountPercent) / 100);
    },

    getCartTotal() {
        const sub = this.getCartSubtotal();
        const disc = this.getCartDiscount();
        const giftCost = this.giftPackaging ? 1500 : 0; // ₹1,500 luxury velvet gift vault
        return Math.max(0, sub - disc + giftCost);
    },

    updateBadges() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadges = document.querySelectorAll('.cart-count-badge');
        cartBadges.forEach(badge => {
            badge.textContent = cartCount;
            badge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
        });

        const wishCount = this.wishlist.length;
        const wishBadges = document.querySelectorAll('.wishlist-count-badge');
        wishBadges.forEach(badge => {
            badge.textContent = wishCount;
            badge.style.display = wishCount > 0 ? 'inline-flex' : 'none';
        });
    },

    openCart() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            this.renderCartDrawer();
        }
    },

    closeCart() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    openWishlist() {
        const drawer = document.getElementById('wishlist-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            this.renderWishlistDrawer();
        }
    },

    closeWishlist() {
        const drawer = document.getElementById('wishlist-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    renderCartDrawer() {
        const container = document.getElementById('cart-items-container');
        const summaryContainer = document.getElementById('cart-summary-container');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="shopping-bag"></i>
                    </div>
                    <h3>Your Shopping Bag is Empty</h3>
                    <p>Adorn yourself with our timeless handcrafted royal jewels.</p>
                    <button class="tbc-btn tbc-btn-primary" onclick="Store.closeCart(); window.location.href='#jhumkas-section'">
                        Explore Jhumkas
                    </button>
                </div>
            `;
            if (summaryContainer) summaryContainer.style.display = 'none';
            if (window.lucide) lucide.createIcons();
            return;
        }

        if (summaryContainer) summaryContainer.style.display = 'block';

        let html = '';
        this.cart.forEach((item, index) => {
            html += `
                <div class="cart-item">
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <div class="cart-item-meta">${item.metal} • ${item.stone}</div>
                        <div class="cart-item-price">${this.formatPrice(item.priceINR * item.quantity)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-picker">
                                <button onclick="Store.updateQuantity(${index}, ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
                                <span>${item.quantity}</span>
                                <button onclick="Store.updateQuantity(${index}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                            </div>
                            <button class="cart-item-remove" onclick="Store.removeFromCart(${index})" title="Remove item">
                                <i data-lucide="trash-2"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Render Summary
        const subtotal = this.getCartSubtotal();
        const discount = this.getCartDiscount();
        const total = this.getCartTotal();

        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="cart-gift-box">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${this.giftPackaging ? 'checked' : ''} onchange="Store.toggleGiftPackaging()">
                        <span class="checkmark"></span>
                        <div class="checkbox-text">
                            <strong>Luxury Royal Gift Vault (+${this.formatPrice(1500)})</strong>
                            <p>Handcrafted velvet case, gold wax seal & personalized calligraphy note</p>
                        </div>
                    </label>
                </div>

                <div class="cart-coupon-box">
                    ${this.appliedCoupon ? `
                        <div class="applied-coupon-pill">
                            <span><i data-lucide="tag"></i> <strong>${this.appliedCoupon.code}</strong> (${this.appliedCoupon.discountPercent}% Off)</span>
                            <button onclick="Store.removeCoupon()" title="Remove coupon">✕</button>
                        </div>
                    ` : `
                        <div class="coupon-input-group">
                            <input type="text" id="cart-coupon-input" placeholder="Promo code (e.g. ROYAL10)">
                            <button class="tbc-btn tbc-btn-secondary" onclick="Store.applyCoupon(document.getElementById('cart-coupon-input').value)">
                                Apply
                            </button>
                        </div>
                    `}
                </div>

                <div class="cart-totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${this.formatPrice(subtotal)}</span>
                    </div>
                    ${discount > 0 ? `
                        <div class="total-row discount">
                            <span>Royal Privilege Discount (${this.appliedCoupon.discountPercent}%)</span>
                            <span>-${this.formatPrice(discount)}</span>
                        </div>
                    ` : ''}
                    ${this.giftPackaging ? `
                        <div class="total-row">
                            <span>Velvet Gift Presentation</span>
                            <span>${this.formatPrice(1500)}</span>
                        </div>
                    ` : ''}
                    <div class="total-row">
                        <span>Insured Express Courier</span>
                        <span class="free-badge">COMPLIMENTARY</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Estimated Total</span>
                        <span class="total-val">${this.formatPrice(total)}</span>
                    </div>
                </div>

                <button class="tbc-btn tbc-btn-primary tbc-btn-block checkout-btn" onclick="Store.openCheckout()">
                    Proceed to Royal Checkout <i data-lucide="arrow-right"></i>
                </button>
                <div class="checkout-guarantee">
                    <span><i data-lucide="shield-check"></i> BIS Hallmarked • 100% Insured Transit • 15-Day Exchange</span>
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();
    },

    renderWishlistDrawer() {
        const container = document.getElementById('wishlist-items-container');
        if (!container) return;

        if (this.wishlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="heart"></i>
                    </div>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Save your favorite royal jewels to view or order whenever you desire.</p>
                    <button class="tbc-btn tbc-btn-primary" onclick="Store.closeWishlist(); window.location.href='#jhumkas-section'">
                        Explore Masterpieces
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let html = '';
        this.wishlist.forEach(id => {
            const product = window.TBC_PRODUCTS.find(p => p.id === id);
            if (!product) return;

            html += `
                <div class="wishlist-item">
                    <div class="wishlist-item-img">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="wishlist-item-info">
                        <h4>${product.name}</h4>
                        <div class="wishlist-item-price">${this.formatPrice(product.priceINR)}</div>
                        <div class="wishlist-item-meta">${product.grossWeight} • ${product.stone}</div>
                        <div class="wishlist-item-buttons">
                            <button class="tbc-btn tbc-btn-sm tbc-btn-primary" onclick="Store.addToCart('${product.id}', 1); Store.toggleWishlist('${product.id}')">
                                Move to Bag
                            </button>
                            <button class="tbc-btn tbc-btn-sm tbc-btn-secondary" onclick="Store.toggleWishlist('${product.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    openCheckout() {
        this.closeCart();
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            this.renderCheckoutSummary();
        }
    },

    closeCheckout() {
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    },

    renderCheckoutSummary() {
        const summaryBox = document.getElementById('checkout-order-summary');
        if (!summaryBox) return;

        let itemsHtml = '';
        this.cart.forEach(item => {
            itemsHtml += `
                <div class="checkout-summary-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="summary-item-details">
                        <span class="title">${item.name}</span>
                        <span class="qty">Qty: ${item.quantity} • ${item.metal}</span>
                    </div>
                    <span class="price">${this.formatPrice(item.priceINR * item.quantity)}</span>
                </div>
            `;
        });

        const subtotal = this.getCartSubtotal();
        const discount = this.getCartDiscount();
        const total = this.getCartTotal();

        summaryBox.innerHTML = `
            <h3>Order Summary (${this.cart.length} ${this.cart.length === 1 ? 'item' : 'items'})</h3>
            <div class="checkout-items-list">${itemsHtml}</div>
            <div class="checkout-costs">
                <div class="row"><span>Subtotal</span><span>${this.formatPrice(subtotal)}</span></div>
                ${discount > 0 ? `<div class="row discount"><span>Privilege Discount</span><span>-${this.formatPrice(discount)}</span></div>` : ''}
                ${this.giftPackaging ? `<div class="row"><span>Royal Gift Vault</span><span>${this.formatPrice(1500)}</span></div>` : ''}
                <div class="row"><span>Insured Armored Courier</span><span class="green">COMPLIMENTARY</span></div>
                <div class="row total"><span>Total Payable</span><span>${this.formatPrice(total)}</span></div>
            </div>
        `;
    },

    processOrder(event) {
        if (event) event.preventDefault();

        // Validate form
        const form = document.getElementById('checkout-form');
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const nameInput = document.getElementById('checkout-name');
        const customerName = nameInput ? nameInput.value : 'Esteemed Patron';
        const orderId = 'TBC-' + Math.floor(100000 + Math.random() * 900000);

        // Show confirmation view
        const checkoutContent = document.getElementById('checkout-main-content');
        const confirmationView = document.getElementById('checkout-success-view');

        if (checkoutContent && confirmationView) {
            checkoutContent.style.display = 'none';
            confirmationView.style.display = 'block';

            document.getElementById('confirmed-order-id').textContent = orderId;
            document.getElementById('confirmed-patron-name').textContent = customerName;
            document.getElementById('confirmed-amount').textContent = this.formatPrice(this.getCartTotal());

            // Trigger luxury confetti celebration!
            if (window.confetti) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#D4AF37', '#FAF8F5', '#E5C378', '#2e7d32']
                });
            }

            // Clear Cart
            this.cart = [];
            this.appliedCoupon = null;
            this.giftPackaging = false;
            this.saveCart();
        }
    },

    showToast(title, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'tbc-toast';
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="sparkles"></i>
            </div>
            <div class="toast-body">
                <strong>${title}</strong>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.classList.add('visible');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
};

window.Store = Store;
