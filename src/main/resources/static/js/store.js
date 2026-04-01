// store.js — cart, products and checkout

var PRODUCTS = [
    { id: 1, name: 'Sony WH-1000XM5',    price: 6999.00, icon: 'bi-headphones', color: '#6f42c1', desc: 'Wireless noise-cancelling headphones, 30hr battery' },
    { id: 2, name: 'Samsung Galaxy Watch 6', price: 5499.00, icon: 'bi-smartwatch', color: '#0d6efd', desc: '44mm, BIA sensor, sapphire crystal glass' },
    { id: 3, name: 'Rain Design mStand',  price: 1299.00, icon: 'bi-laptop', color: '#198754', desc: 'Aluminium laptop stand, cable management' },
    { id: 4, name: 'Anker 7-in-1 Hub',    price: 899.00,  icon: 'bi-usb-drive', color: '#dc3545', desc: 'USB-C hub — HDMI 4K, 3x USB-A, SD, 100W PD' },
    { id: 5, name: 'Keychron K8 Pro',     price: 2799.00, icon: 'bi-keyboard', color: '#fd7e14', desc: 'TKL mechanical, hot-swap Gateron switches, RGB' },
    { id: 6, name: 'Anker 737 Power Bank', price: 2199.00, icon: 'bi-battery-charging', color: '#20c997', desc: '24K mAh, 140W USB-C, smart display' }
];

var TAX_RATE = 0.15; // SA VAT

function getCart() {
    try { return JSON.parse(localStorage.getItem('cybershop_cart') || '[]'); }
    catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem('cybershop_cart', JSON.stringify(cart)); updateCartBadge(); }

function addToCart(productId) {
    var cart = getCart();
    var existing = null, product = null;
    for (var i = 0; i < cart.length; i++) { if (cart[i].id === productId) { existing = cart[i]; break; } }
    if (existing) { existing.qty++; }
    else {
        for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === productId) { product = PRODUCTS[i]; break; } }
        if (product) cart.push({ id: product.id, name: product.name, price: product.price, icon: product.icon, color: product.color, desc: product.desc, qty: 1 });
    }
    saveCart(cart);
    showToast('"' + ((product || existing).name) + '" added to cart');
}
function removeFromCart(productId) { saveCart(getCart().filter(function(i) { return i.id !== productId; })); }
function updateQty(productId, delta) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === productId) { cart[i].qty += delta; if (cart[i].qty <= 0) cart.splice(i, 1); break; }
    }
    saveCart(cart);
}
function clearCart() { localStorage.removeItem('cybershop_cart'); updateCartBadge(); }

function getSubtotal() { return getCart().reduce(function(s, i) { return s + i.price * i.qty; }, 0); }
function getCartCount() { return getCart().reduce(function(s, i) { return s + i.qty; }, 0); }
function getTax() { return getSubtotal() * TAX_RATE; }
function getTotal() { return getSubtotal() + getTax(); }
function fmt(n) { return 'R' + n.toFixed(2); }

function updateCartBadge() {
    var badge = document.getElementById('cartBadge');
    if (!badge) return;
    var count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

// --- helpers ---

function esc(str) { if (!str) return ''; var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function showToast(message) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var id = 'toast-' + Date.now();
    c.insertAdjacentHTML('beforeend',
        '<div id="' + id + '" class="toast show align-items-center text-bg-dark border-0 mb-2" role="alert">'
        + '<div class="d-flex"><div class="toast-body"><i class="bi bi-check-circle me-2"></i>' + esc(message) + '</div>'
        + '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>');
    setTimeout(function() { var el = document.getElementById(id); if (el) el.remove(); }, 2500);
}

// --- product grid (index page) ---

function renderProductGrid() {
    var grid = document.getElementById('productGrid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < PRODUCTS.length; i++) {
        var p = PRODUCTS[i];
        html += '<div class="col-md-6 col-lg-4">'
            + '<div class="card product-card h-100 shadow-sm">'
            + '<div class="product-img" style="background:linear-gradient(135deg,' + p.color + ',' + p.color + 'aa);">'
            + '<i class="bi ' + p.icon + '"></i></div>'
            + '<div class="card-body d-flex flex-column">'
            + '<h5 class="card-title fw-bold">' + esc(p.name) + '</h5>'
            + '<p class="card-text text-muted small flex-grow-1">' + esc(p.desc) + '</p>'
            + '<div class="d-flex justify-content-between align-items-center mt-2">'
            + '<span class="fs-4 fw-bold" style="color:var(--cs-primary);">' + fmt(p.price) + '</span>'
            + '<button class="btn btn-accent" onclick="addToCart(' + p.id + ')">'
            + '<i class="bi bi-bag-plus me-1"></i>Add to Cart</button>'
            + '</div></div></div></div>';
    }
    grid.innerHTML = html;
    updateCartBadge();
}

// --- cart page ---

function renderCartPage() {
    var cart = getCart();
    var empty = document.getElementById('emptyCart');
    var filled = document.getElementById('filledCart');
    if (cart.length === 0) { empty.style.display = 'block'; filled.style.display = 'none'; updateCartBadge(); return; }
    empty.style.display = 'none';
    filled.style.display = 'block';

    var html = '';
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        html += '<div class="d-flex align-items-center gap-3 mb-3">'
            + '<div class="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width:50px;height:50px;background:linear-gradient(135deg,' + item.color + ',' + item.color + 'aa);color:#fff;font-size:1.2rem;">'
            + '<i class="bi ' + item.icon + '"></i></div>'
            + '<div class="flex-grow-1">'
            + '<div class="fw-semibold" style="font-size:.95rem;">' + esc(item.name) + '</div>'
            + '<div class="text-muted" style="font-size:.8rem;">' + esc(item.desc) + '</div>'
            + '<div class="text-primary" style="font-size:.85rem;">Quantity: ' + item.qty + '</div></div>'
            + '<div class="text-end">'
            + '<div class="fw-bold">' + fmt(item.price * item.qty) + '</div>'
            + '<div class="d-flex align-items-center gap-1 mt-1 justify-content-end">'
            + '<button class="btn btn-outline-secondary qty-btn" onclick="updateQty(' + item.id + ',-1);renderCartPage()"><i class="bi bi-dash"></i></button>'
            + '<button class="btn btn-outline-secondary qty-btn" onclick="updateQty(' + item.id + ',1);renderCartPage()"><i class="bi bi-plus"></i></button>'
            + '<button class="btn btn-sm btn-outline-danger ms-1" onclick="removeFromCart(' + item.id + ');renderCartPage()" style="width:32px;height:32px;padding:0;"><i class="bi bi-trash3"></i></button>'
            + '</div></div></div>';
    }
    document.getElementById('cartItemsList').innerHTML = html;
    document.getElementById('cartSubtotal').textContent = fmt(getSubtotal());
    document.getElementById('cartTax').textContent = fmt(getTax());
    document.getElementById('cartTotal').textContent = fmt(getTotal());
    updateCartBadge();
}

function goToCheckout() {
    if (getCartCount() === 0) return;
    window.location.href = '/checkout';
}

// --- helpers for API calls ---

function callApi(url, method, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res) {
        if (res.status === 204) return { ok: true, data: {} };
        return res.json().then(function(data) { return { ok: res.ok, data: data }; });
    }).catch(function(err) { return { ok: false, data: { status: 'ERROR', message: err.message } }; });
}

// --- checkout page ---

function initCheckout() {
    if (getCartCount() === 0) { window.location.href = '/cart'; return; }
    updateCartBadge();

    var container = document.getElementById('wizardContent');
    if (!container) return;

    // Render order summary
    container.innerHTML = renderOrderSummary();
}

function renderOrderSummary() {
    var cart = getCart();
    var html = '<div class="wiz-card">'
        + '<div class="wiz-label">ORDER SUMMARY</div>';

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        html += '<div class="d-flex align-items-center gap-3 mb-3">'
            + '<div class="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width:40px;height:40px;background:linear-gradient(135deg,' + item.color + ',' + item.color + 'aa);color:#fff;font-size:1rem;">'
            + '<i class="bi ' + item.icon + '"></i></div>'
            + '<div class="flex-grow-1">'
            + '<div class="fw-semibold" style="font-size:.9rem;">' + esc(item.name) + ' x' + item.qty + '</div></div>'
            + '<div class="fw-bold">' + fmt(item.price * item.qty) + '</div></div>';
    }

    html += '<hr>'
        + '<div class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>' + fmt(getSubtotal()) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-1"><span>VAT (15%)</span><span>' + fmt(getTax()) + '</span></div>'
        + '<div class="d-flex justify-content-between fw-bold fs-5 mt-2"><span>Total</span><span style="color:var(--cs-primary);">' + fmt(getTotal()) + '</span></div>'
        + '</div>';
    return html;
}

// --- Saved Card (Tokenized Payments) ---

var _rawCardNumber = '';

function getSavedCustomerId() { return localStorage.getItem('cybershop_customerId'); }
function setSavedCustomerId(id) { localStorage.setItem('cybershop_customerId', id); }

var _savedCards = [];
var _selectedCardIndex = -1;

function cardBrand(type) {
    if (!type) return { name: 'Card', icon: 'bi-credit-card', color: '#6c757d', bg: '#f8f9fa' };
    var t = type.toLowerCase();
    if (t === 'visa' || t === '001') return { name: 'Visa', icon: 'bi-credit-card', color: '#1a1f71', bg: '#eef0ff' };
    if (t === 'mastercard' || t === '002') return { name: 'Mastercard', icon: 'bi-credit-card-2-front', color: '#eb001b', bg: '#fff0f0' };
    if (t === 'amex' || t === '003') return { name: 'Amex', icon: 'bi-credit-card-2-back', color: '#006fcf', bg: '#eef6ff' };
    return { name: type, icon: 'bi-credit-card', color: '#6c757d', bg: '#f8f9fa' };
}

function maskCardDisplay(raw) {
    var digits = raw.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    var masked = '';
    for (var i = 0; i < digits.length - 4; i++) masked += '\u2022';
    masked += digits.slice(-4);
    return masked.replace(/(.{4})/g, '$1 ').trim();
}

function onCardNumberInput(el) {
    var cursorPos = el.selectionStart;
    var oldLen = el.value.length;
    var raw = el.value.replace(/\D/g, '');
    if (raw.length > 16) raw = raw.slice(0, 16);
    _rawCardNumber = raw;
    el.value = maskCardDisplay(raw);
    var newLen = el.value.length;
    var newPos = cursorPos + (newLen - oldLen);
    el.setSelectionRange(newPos, newPos);
}

// Always show card list first — even if empty
function renderTokenForm() {
    return '<div id="savedCardRoot">'
        + '<div class="wiz-card">'
        + '<div class="wiz-label">YOUR SAVED CARDS</div>'
        + '<p class="text-muted" style="font-size:.85rem;">Select a card to pay with</p>'
        + '<div id="savedCardList"><div class="text-center my-4">'
        + '<div class="spinner-border spinner-border-sm text-primary"></div>'
        + '<p class="text-muted mt-2" style="font-size:.85rem;">Loading saved cards...</p></div></div>'
        + '<button class="wiz-btn w-100 mt-3" id="proceedBtn" onclick="proceedWithCard()" disabled>'
        + '<i class="bi bi-arrow-right me-2"></i>Proceed</button>'
        + '<div class="d-flex gap-2 mt-2">'
        + '<button class="btn btn-outline-primary flex-grow-1" onclick="showAddCardForm()">'
        + '<i class="bi bi-plus-circle me-2"></i>Add New Card</button>'
        + '<button class="btn btn-outline-danger flex-grow-0" id="deleteCardBtn" onclick="deleteSelectedCard()" disabled>'
        + '<i class="bi bi-trash3"></i></button>'
        + '</div>'
        + '</div>'
        + '</div>';
}

function initSavedCardView() {
    var customerId = getSavedCustomerId();
    if (!customerId) {
        seedTestCards();
        return;
    }
    fetchAndRenderCards(customerId);
}

function seedTestCards() {
    var container = document.getElementById('savedCardList');
    if (container) {
        container.innerHTML = '<div class="text-center my-4">'
            + '<div class="spinner-border spinner-border-sm text-primary"></div>'
            + '<p class="text-muted mt-2" style="font-size:.85rem;">Loading saved cards...</p></div>';
    }
    callApi('/api/tokens/seed', 'POST').then(function(result) {
        if (result.ok && result.data.customerId) {
            setSavedCustomerId(result.data.customerId);
            fetchAndRenderCards(result.data.customerId);
        } else {
            if (container) {
                container.innerHTML = '<div class="text-center py-3">'
                    + '<i class="bi bi-credit-card text-muted" style="font-size:2rem;"></i>'
                    + '<p class="text-muted mt-2" style="font-size:.9rem;">No saved cards yet.</p>'
                    + '</div>';
            }
        }
    });
}

function fetchAndRenderCards(customerId) {
    callApi('/api/tokens/customers/' + customerId + '/cards', 'GET').then(function(result) {
        var container = document.getElementById('savedCardList');
        if (!container) return;
        if (!result.ok || !result.data || result.data.length === 0) {
            container.innerHTML = '<div class="text-center py-3">'
                + '<i class="bi bi-credit-card text-muted" style="font-size:2rem;"></i>'
                + '<p class="text-muted mt-2" style="font-size:.9rem;">No saved cards yet.</p>'
                + '</div>';
            return;
        }
        renderCardList(result.data);
    });
}

function renderCardList(cards) {
    _savedCards = cards;
    _selectedCardIndex = -1;
    var container = document.getElementById('savedCardList');
    if (!container) return;
    var html = '';
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var suffix = card.cardSuffix || '****';
        var b = cardBrand(card.cardType);
        var expiry = (card.expirationMonth || '??') + '/' + (card.expirationYear || '????');
        var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';

        html += '<div class="saved-card-item d-flex align-items-center gap-3 mb-2 p-3 rounded-3" '
            + 'id="cardItem' + i + '" '
            + 'onclick="selectCard(' + i + ')" '
            + 'style="background:' + b.bg + ';border:2px solid transparent;cursor:pointer;transition:border-color .2s;">'
            + '<div class="flex-shrink-0" style="font-size:1.6rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
            + '<div class="flex-grow-1">'
            + '<div class="fw-bold" style="font-size:.9rem;color:' + b.color + ';">' + esc(b.name) + '</div>'
            + '<div style="font-family:monospace;font-size:.95rem;letter-spacing:2px;">'
            + '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ' + esc(suffix) + '</div>'
            + '<div class="text-muted" style="font-size:.8rem;">' + esc(name) + ' &middot; Exp ' + esc(expiry) + '</div>'
            + '</div>'
            + '<div class="flex-shrink-0">'
            + '<div class="card-radio" id="cardRadio' + i + '" style="width:22px;height:22px;border-radius:50%;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;">'
            + '</div></div>'
            + '</div>';
    }
    container.innerHTML = html;

    // Update proceed button state
    var proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) proceedBtn.disabled = true;
}

function selectCard(index) {
    _selectedCardIndex = index;
    var items = document.querySelectorAll('.saved-card-item');
    for (var i = 0; i < items.length; i++) {
        var b = cardBrand(_savedCards[i].cardType);
        items[i].style.borderColor = (i === index) ? b.color : 'transparent';
        var radio = document.getElementById('cardRadio' + i);
        if (radio) {
            if (i === index) {
                radio.style.borderColor = b.color;
                radio.innerHTML = '<div style="width:12px;height:12px;border-radius:50%;background:' + b.color + ';"></div>';
            } else {
                radio.style.borderColor = '#ccc';
                radio.innerHTML = '';
            }
        }
    }
    var proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) proceedBtn.disabled = false;
    var deleteBtn = document.getElementById('deleteCardBtn');
    if (deleteBtn) deleteBtn.disabled = false;
}

function proceedWithCard() {
    if (_selectedCardIndex < 0 || _selectedCardIndex >= _savedCards.length) return;
    var card = _savedCards[_selectedCardIndex];
    var b = cardBrand(card.cardType);
    var suffix = card.cardSuffix || '****';
    var expiry = (card.expirationMonth || '??') + '/' + (card.expirationYear || '????');
    var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';

    var root = document.getElementById('savedCardRoot');
    if (!root) root = document.getElementById('sidebarContent');

    root.innerHTML = '<div class="wiz-card">'
        + '<div class="wiz-label">CONFIRM PAYMENT</div>'
        // Selected card summary
        + '<div class="p-3 rounded-3 mb-3" style="background:' + b.bg + ';border:2px solid ' + b.color + ';">'
        + '<div class="d-flex align-items-center gap-3">'
        + '<div style="font-size:2rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
        + '<div>'
        + '<div class="fw-bold" style="color:' + b.color + ';">' + esc(b.name) + '</div>'
        + '<div style="font-family:monospace;font-size:1rem;letter-spacing:2px;">'
        + '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ' + esc(suffix) + '</div>'
        + '</div></div></div>'
        // Cardholder details
        + '<div class="wiz-label" style="font-size:.75rem;">CARDHOLDER DETAILS</div>'
        + '<div class="mb-3">'
        + '<div class="d-flex justify-content-between mb-1"><span class="text-muted">Name</span><span class="fw-semibold">' + esc(name) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-1"><span class="text-muted">Card</span><span class="fw-semibold">' + esc(b.name) + ' ending in ' + esc(suffix) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-1"><span class="text-muted">Expiry</span><span class="fw-semibold">' + esc(expiry) + '</span></div>'
        + '</div>'
        + '<hr>'
        // Amount
        + '<div class="d-flex justify-content-between mb-1"><span class="text-muted">Subtotal</span><span>' + fmt(getSubtotal()) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-1"><span class="text-muted">VAT (15%)</span><span>' + fmt(getTax()) + '</span></div>'
        + '<div class="d-flex justify-content-between fw-bold fs-5 mt-2 mb-3"><span>Total</span><span style="color:var(--cs-primary);">' + fmt(getTotal()) + '</span></div>'
        // Buttons
        + '<button class="wiz-btn w-100" id="completePayBtn" onclick="completeCardPayment()">'
        + '<i class="bi bi-lock me-2"></i>Complete Transaction</button>'
        + '<div id="paymentResult" class="mt-3" style="display:none;"></div>'
        + '<button class="btn btn-outline-secondary w-100 mt-2" onclick="backToCardList()">'
        + '<i class="bi bi-arrow-left me-2"></i>Back to Cards</button>'
        + '</div>';
}

function completeCardPayment() {
    var customerId = getSavedCustomerId();
    if (!customerId || _selectedCardIndex < 0) return;

    var card = _savedCards[_selectedCardIndex];
    var b = cardBrand(card.cardType);
    var suffix = card.cardSuffix || '****';
    var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';
    var total = getTotal();

    var btn = document.getElementById('completePayBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

    callApi('/api/tokens/pay', 'POST', {
        customerId: customerId,
        amount: parseFloat(total.toFixed(2)),
        currency: 'ZAR'
    }).then(function(result) {
        if (result.ok) {
            var now = new Date();
            var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
            var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
            var ref = (result.data.transactionId || '').slice(-8).toUpperCase();

            var root = document.getElementById('savedCardRoot');
            if (!root) root = document.getElementById('sidebarContent');

            root.innerHTML = '<div class="text-center py-3">'
                + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
                + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
                + '<h5 class="fw-bold mb-1">Payment Successful</h5>'
                + '<p class="text-muted mb-0" style="font-size:.9rem;">Thank you for your purchase, ' + esc(name.split(' ')[0]) + '!</p>'
                + '</div>'
                + '<div class="wiz-card mt-2">'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + fmt(total) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
                + '<hr>'
                + '<div class="d-flex align-items-center gap-3">'
                + '<div style="font-size:1.4rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
                + '<div>'
                + '<div class="fw-semibold" style="font-size:.9rem;color:' + b.color + ';">' + esc(b.name) + ' ending in ' + esc(suffix) + '</div>'
                + '<div class="text-muted" style="font-size:.8rem;">' + esc(name) + '</div>'
                + '</div></div>'
                + '</div>'
                + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        } else {
            var el = document.getElementById('paymentResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-danger"><strong>Payment Declined</strong><br>'
                + esc(result.data.message || 'Your payment could not be processed. Please try again or use a different card.') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Complete Transaction';
        }
    });
}

function showAddCardForm() {
    var root = document.getElementById('savedCardRoot');
    if (!root) root = document.getElementById('sidebarContent');
    root.innerHTML = '<div class="wiz-card">'
        + '<div class="wiz-label">ADD NEW CARD</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Your card will be securely tokenized. We never store full card numbers.</p>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-12"><label class="wiz-field-label">Card Number <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokCardNumber" class="form-control wiz-input" placeholder="\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022" maxlength="23" oninput="onCardNumberInput(this)" autocomplete="off"></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Exp Month</label>'
        + '<input type="text" id="tokExpMonth" class="form-control wiz-input" placeholder="12" maxlength="2"></div>'
        + '<div class="col-4"><label class="wiz-field-label">Exp Year</label>'
        + '<input type="text" id="tokExpYear" class="form-control wiz-input" placeholder="2028" maxlength="4"></div>'
        + '<div class="col-4"><label class="wiz-field-label">CVV</label>'
        + '<input type="password" id="tokCvv" class="form-control wiz-input" placeholder="\u2022\u2022\u2022" maxlength="4"></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First Name <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokFirstName" class="form-control wiz-input" placeholder="John"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last Name <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokLastName" class="form-control wiz-input" placeholder="Doe"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Email <span class="text-danger">*</span></label>'
        + '<input type="email" id="tokEmail" class="form-control wiz-input" placeholder="john@example.com"></div>'
        + '<button class="wiz-btn w-100" id="tokenStoreBtn" onclick="submitAddCard()">'
        + '<i class="bi bi-shield-check me-2"></i>Save Card</button>'
        + '<div id="tokenResult" class="mt-3" style="display:none;"></div>'
        + '<button class="btn btn-outline-secondary w-100 mt-2" onclick="backToCardList()">'
        + '<i class="bi bi-arrow-left me-2"></i>Back to Cards</button>'
        + '</div>';
    _rawCardNumber = '';
}

function backToCardList() {
    var root = document.getElementById('savedCardRoot');
    if (!root) root = document.getElementById('sidebarContent');
    root.innerHTML = '<div id="savedCardRoot">'
        + '<div class="wiz-card">'
        + '<div class="wiz-label">YOUR SAVED CARDS</div>'
        + '<div id="savedCardList"><div class="text-center my-4">'
        + '<div class="spinner-border spinner-border-sm text-primary"></div>'
        + '</div></div>'
        + '</div>'
        + '<button class="btn btn-outline-primary w-100 mt-3" onclick="showAddCardForm()">'
        + '<i class="bi bi-plus-circle me-2"></i>Add New Card</button>'
        + '</div>';
    initSavedCardView();
}

function submitAddCard() {
    var btn = document.getElementById('tokenStoreBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving card...';

    var req = {
        cardNumber: _rawCardNumber,
        expirationMonth: document.getElementById('tokExpMonth').value.trim(),
        expirationYear: document.getElementById('tokExpYear').value.trim(),
        securityCode: document.getElementById('tokCvv').value.trim(),
        firstName: document.getElementById('tokFirstName').value.trim(),
        lastName: document.getElementById('tokLastName').value.trim(),
        email: document.getElementById('tokEmail').value.trim()
    };

    callApi('/api/tokens/customers', 'POST', req).then(function(result) {
        var el = document.getElementById('tokenResult');
        el.style.display = 'block';
        if (result.ok && result.data.transactionId) {
            setSavedCustomerId(result.data.transactionId);
            el.innerHTML = '<div class="alert alert-success">'
                + '<i class="bi bi-check-circle me-2"></i>Card saved securely.</div>';
            _rawCardNumber = '';
            setTimeout(function() { backToCardList(); }, 1000);
        } else {
            el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — '
                + esc(result.data.message || 'Unknown error') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Save Card';
        }
    });
}

function deleteSelectedCard() {
    if (_selectedCardIndex < 0 || _selectedCardIndex >= _savedCards.length) return;
    var card = _savedCards[_selectedCardIndex];
    var customerId = getSavedCustomerId();
    if (!customerId || !card.paymentInstrumentId) return;

    var btn = document.getElementById('deleteCardBtn');
    btn.disabled = true;

    callApi('/api/tokens/customers/' + customerId + '/cards/' + card.paymentInstrumentId, 'DELETE').then(function() {
        _selectedCardIndex = -1;
        backToCardList();
    });
}

// --- Pay by Invoice ---

function renderInvoiceForm() {
    var due = new Date(); due.setDate(due.getDate() + 14);
    return '<div class="wiz-card">'
        + '<div class="wiz-label">PAY BY INVOICE</div>'
        + '<p class="text-muted" style="font-size:.9rem;">An invoice will be created and sent to your email.</p>'
        + '<div class="mb-3"><label class="wiz-field-label">Email <span class="text-danger">*</span></label>'
        + '<input type="email" id="invEmail" class="form-control wiz-input" placeholder="you@example.com"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Name</label>'
        + '<input type="text" id="invName" class="form-control wiz-input" placeholder="Your name"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="invDesc" class="form-control wiz-input" value="CyberShop Order" placeholder="Order description"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Due Date</label>'
        + '<input type="date" id="invDue" class="form-control wiz-input" value="' + due.toISOString().split('T')[0] + '"></div>'
        + '<button class="wiz-btn w-100" id="invoiceBtn" onclick="submitInvoice()">'
        + '<i class="bi bi-receipt me-2"></i>Create &amp; Send Invoice</button>'
        + '<div id="invoiceResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitInvoice() {
    var btn = document.getElementById('invoiceBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating invoice...';

    var req = {
        customerEmail: document.getElementById('invEmail').value.trim(),
        customerName: document.getElementById('invName').value.trim(),
        description: document.getElementById('invDesc').value.trim() || 'CyberShop Order',
        amount: parseFloat(getTotal().toFixed(2)),
        currency: 'ZAR',
        dueDate: document.getElementById('invDue').value
    };

    callApi('/api/invoices', 'POST', req).then(function(result) {
        if (result.ok && result.data.transactionId) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Sending invoice...';
            return callApi('/api/invoices/' + result.data.transactionId + '/send', 'POST', {}).then(function(sendResult) {
                showInvoiceResult(sendResult, result.data.transactionId);
            });
        } else {
            showInvoiceResult(result, null);
        }
    });
}

function showInvoiceResult(result, invoiceId) {
    var el = document.getElementById('invoiceResult');
    el.style.display = 'block';
    var btn = document.getElementById('invoiceBtn');
    if (result.ok) {
        el.innerHTML = '<div class="alert alert-success">'
            + '<strong>' + esc(result.data.status) + '</strong> — ' + esc(result.data.message)
            + (invoiceId ? '<br><small>Invoice ID: ' + esc(invoiceId) + '</small>' : '')
            + '</div>';
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Invoice Sent';
    } else {
        el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-receipt me-2"></i>Create &amp; Send Invoice';
    }
}

// --- Payment Link ---

function renderPaymentLinkForm() {
    return '<div class="wiz-card">'
        + '<div class="wiz-label">PAYMENT LINK</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Create a secure payment link. Share it via QR code, WhatsApp, or copy the link.</p>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="linkDesc" class="form-control wiz-input" value="CyberShop Payment" placeholder="Payment description"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Recipient Phone (for WhatsApp)</label>'
        + '<input type="tel" id="linkPhone" class="form-control wiz-input" placeholder="+27821234567"></div>'
        + '<button class="wiz-btn w-100" id="linkBtn" onclick="submitPaymentLink()">'
        + '<i class="bi bi-link-45deg me-2"></i>Create Payment Link</button>'
        + '<div id="linkResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitPaymentLink() {
    var btn = document.getElementById('linkBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating link...';

    var desc = document.getElementById('linkDesc').value.trim() || 'CyberShop Payment';
    var phone = document.getElementById('linkPhone').value.trim().replace(/\s/g, '');
    var total = getTotal();

    var req = {
        description: desc,
        amount: parseFloat(total.toFixed(2)),
        currency: 'ZAR'
    };

    callApi('/api/payment-links', 'POST', req).then(function(result) {
        var el = document.getElementById('linkResult');
        el.style.display = 'block';
        if (result.ok) {
            var paymentUrl = (result.data.details && result.data.details.paymentUrl) || '';
            if (!paymentUrl) {
                el.innerHTML = '<div class="alert alert-success">'
                    + '<strong>Link Created</strong> — ' + esc(result.data.message)
                    + '<br><small>Link ID: ' + esc(result.data.transactionId) + '</small>'
                    + '</div>';
                btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Link Created';
                return;
            }

            var whatsappMsg = 'Hi! Please use this link to complete your payment of ' + fmt(total) + ':\n' + paymentUrl;
            var whatsappUrl = 'https://wa.me/' + (phone.replace(/^\+/, '') || '') + '?text=' + encodeURIComponent(whatsappMsg);

            el.innerHTML = '<div class="text-center mb-3">'
                + '<img src="/api/qr?url=' + encodeURIComponent(paymentUrl) + '" alt="QR Code" '
                + 'style="width:200px;height:200px;border-radius:8px;border:1px solid #e9ecef;" />'
                + '<p class="text-muted mt-2 mb-0" style="font-size:.8rem;">Scan to pay ' + fmt(total) + '</p>'
                + '</div>'
                + '<div class="d-flex gap-2 mb-3">'
                + '<a href="' + esc(whatsappUrl) + '" target="_blank" class="btn btn-success flex-grow-1">'
                + '<i class="bi bi-whatsapp me-2"></i>Send via WhatsApp</a>'
                + '<button class="btn btn-outline-secondary flex-grow-0" onclick="copyPaymentLink(\'' + esc(paymentUrl) + '\')" title="Copy link">'
                + '<i class="bi bi-clipboard"></i></button>'
                + '</div>'
                + '<div class="input-group mb-2">'
                + '<input type="text" class="form-control wiz-input" value="' + esc(paymentUrl) + '" readonly style="font-size:.8rem;">'
                + '</div>'
                + '<div id="copyMsg" style="display:none;" class="text-success text-center" style="font-size:.85rem;"></div>';
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Link Created';
        } else {
            el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-link-45deg me-2"></i>Create Payment Link';
        }
    });
}

function copyPaymentLink(url) {
    navigator.clipboard.writeText(url).then(function() {
        var msg = document.getElementById('copyMsg');
        if (msg) {
            msg.style.display = 'block';
            msg.innerHTML = '<i class="bi bi-check-circle me-1"></i>Link copied!';
            setTimeout(function() { msg.style.display = 'none'; }, 2000);
        }
    });
}

// --- Samsung Pay ---

function renderSamsungPayForm() {
    return '<div class="wiz-card">'
        + '<div class="wiz-label">SAMSUNG PAY</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Pay using Samsung Pay tokenized card data (DPAN + cryptogram).</p>'
        + '<div class="mb-3"><label class="wiz-field-label">DPAN (Token Number) <span class="text-danger">*</span></label>'
        + '<input type="text" id="spDpan" class="form-control wiz-input" value="4111111111111111" maxlength="19"></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Exp Month</label>'
        + '<input type="text" id="spExpMonth" class="form-control wiz-input" value="12" maxlength="2"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Exp Year</label>'
        + '<input type="text" id="spExpYear" class="form-control wiz-input" value="2028" maxlength="4"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Cryptogram <span class="text-danger">*</span></label>'
        + '<input type="text" id="spCryptogram" class="form-control wiz-input" value="EHuWW9PiBkWvqE5juRwDzAUFBAk=" placeholder="Base64 cryptogram"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Card Type</label>'
        + '<select id="spCardType" class="form-select wiz-input">'
        + '<option value="001">Visa</option>'
        + '<option value="002">Mastercard</option>'
        + '<option value="003">Amex</option>'
        + '</select></div>'
        + '<button class="wiz-btn w-100" id="spBtn" onclick="submitSamsungPay()">'
        + '<i class="bi bi-phone me-2"></i>Pay with Samsung Pay</button>'
        + '<div id="spResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitSamsungPay() {
    var btn = document.getElementById('spBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing Samsung Pay...';

    var req = {
        dpan: document.getElementById('spDpan').value.trim(),
        expirationMonth: document.getElementById('spExpMonth').value.trim(),
        expirationYear: document.getElementById('spExpYear').value.trim(),
        cryptogram: document.getElementById('spCryptogram').value.trim(),
        cardType: document.getElementById('spCardType').value,
        amount: parseFloat(getTotal().toFixed(2)),
        currency: 'ZAR'
    };

    callApi('/api/samsung-pay', 'POST', req).then(function(result) {
        var el = document.getElementById('spResult');
        el.style.display = 'block';
        if (result.ok) {
            el.innerHTML = '<div class="alert alert-success">'
                + '<strong>' + esc(result.data.status) + '</strong> — ' + esc(result.data.message)
                + (result.data.transactionId ? '<br><small>Transaction: ' + esc(result.data.transactionId) + '</small>' : '')
                + '</div>';
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Payment Complete';
        } else {
            el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-phone me-2"></i>Pay with Samsung Pay';
        }
    });
}

function wizardBack() {
    window.location.href = '/cart';
}

// --- init ---

document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });
