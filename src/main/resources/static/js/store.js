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
    window.location.href = '/checkout?amount=' + getTotal().toFixed(2);
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


// Always show card list first — even if empty
function renderTokenForm() {
    return '<div id="savedCardRoot">'
        + '<div class="wiz-card" style="border-top:3px solid #1a1f71;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#1a1f71;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-shield-lock" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#1a1f71;">Saved Cards</div>'
        + '</div></div>'
        + '<div id="savedCardList"><div class="text-center my-4">'
        + '<div class="spinner-border spinner-border-sm" style="color:#1a1f71;"></div>'
        + '<p class="text-muted mt-2" style="font-size:.85rem;">Loading saved cards...</p></div></div>'
        + '<button class="w-100 border-0 py-2 rounded-2 fw-bold mt-3" id="proceedBtn" onclick="proceedWithCard()" disabled style="background:#1a1f71;color:#fff;font-size:.95rem;opacity:.6;">'
        + '<i class="bi bi-arrow-right me-2"></i>Proceed</button>'
        + '<div class="d-flex gap-2 mt-2">'
        + '<button class="btn flex-grow-1 fw-semibold" onclick="showAddCardForm()" style="border:1px solid #1a1f71;color:#1a1f71;">'
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
    if (proceedBtn) { proceedBtn.disabled = false; proceedBtn.style.opacity = '1'; }
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

// --- 3DS Payer Authentication Flow ---

var _threeDsState = {};

function completeCardPayment() {
    if (getCartCount() === 0) {
        var el = document.getElementById('paymentResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    var customerId = getSavedCustomerId();
    if (!customerId || _selectedCardIndex < 0) return;

    var card = _savedCards[_selectedCardIndex];
    var total = getTotal();

    var btn = document.getElementById('completePayBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Initiating bank verification...';

    // Store context for later steps
    _threeDsState = {
        customerId: customerId,
        card: card,
        total: total,
        cardSuffix: card.cardSuffix || '****',
        amount: parseFloat(total.toFixed(2)).toString()
    };

    // Step 1: Setup payer authentication
    console.log('3DS: Starting setup for card ending in', card.cardSuffix);
    callApi('/api/3ds/setup', 'POST', {
        cardSuffix: card.cardSuffix
    }).then(function(result) {
        console.log('3DS setup result:', result);
        if (!result.ok || !result.data.accessToken) {
            threeDsFallbackPayment('3DS setup unavailable — processing payment directly. Card suffix: ' + card.cardSuffix);
            return;
        }

        _threeDsState.referenceId = result.data.referenceId;

        // Step 2: Device data collection (hidden iframe)
        var form = document.getElementById('cardinal_collection_form');
        form.action = result.data.deviceDataCollectionUrl;
        document.getElementById('cardinal_collection_form_input').value = result.data.accessToken;
        form.submit();

        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Verifying card with your bank...';

        // Wait for device data collection (max 10 seconds), then check enrollment
        var ddcDone = false;
        function onDdcMessage(event) {
            if (event.data && event.data.MessageType === 'profile.completed') {
                ddcDone = true;
                window.removeEventListener('message', onDdcMessage);
                threeDsCheckEnrollment();
            }
        }
        window.addEventListener('message', onDdcMessage);
        setTimeout(function() {
            if (!ddcDone) {
                window.removeEventListener('message', onDdcMessage);
                threeDsCheckEnrollment();
            }
        }, 10000);
    });
}

function threeDsCheckEnrollment() {
    var btn = document.getElementById('completePayBtn');
    if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Checking authentication...';

    // Collect browser info
    var browserInfo = {
        httpAcceptContent: 'text/html',
        httpBrowserLanguage: navigator.language || 'en-ZA',
        httpBrowserColorDepth: String(screen.colorDepth || 24),
        httpBrowserScreenHeight: String(screen.height || 1080),
        httpBrowserScreenWidth: String(screen.width || 1920),
        httpBrowserTimeDifference: String(new Date().getTimezoneOffset()),
        userAgentBrowserValue: navigator.userAgent
    };

    callApi('/api/3ds/enroll', 'POST', {
        cardSuffix: _threeDsState.cardSuffix,
        amount: _threeDsState.amount,
        currency: 'ZAR',
        referenceId: _threeDsState.referenceId,
        browserInfo: browserInfo
    }).then(function(result) {
        if (!result.ok) {
            threeDsFallbackPayment('Bank verification unavailable — processing payment directly.');
            return;
        }

        var status = result.data.status;
        var authInfo = result.data.authenticationInformation || {};

        if (status === 'AUTHENTICATION_SUCCESSFUL') {
            // Frictionless — authentication passed silently
            if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Authenticated — processing payment...';
            threeDsFinalPayment(authInfo);

        } else if (status === 'PENDING_AUTHENTICATION') {
            // Challenge required — show step-up iframe
            _threeDsState.authTransactionId = authInfo.authenticationTransactionId;

            if (authInfo.stepUpUrl && authInfo.accessToken) {
                if (btn) btn.innerHTML = '<i class="bi bi-shield-lock me-1"></i> Complete verification in the popup...';
                showChallengeIframe(authInfo.stepUpUrl, authInfo.accessToken);
            } else {
                threeDsFallbackPayment('Challenge data missing — processing payment directly.');
            }

        } else {
            // Authentication failed or rejected
            var el = document.getElementById('paymentResult');
            if (el) {
                el.style.display = 'block';
                el.innerHTML = '<div class="alert alert-danger"><strong>Authentication Failed</strong><br>'
                    + 'Your bank could not verify your identity. Please try a different card.</div>';
            }
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lock me-2"></i>Complete Transaction'; }
        }
    });
}

function showChallengeIframe(stepUpUrl, accessToken) {
    // Set up the step-up form
    document.getElementById('step-up-form').action = stepUpUrl;
    document.getElementById('step-up-jwt').value = accessToken;
    document.getElementById('step-up-md').value = _threeDsState.cardSuffix;

    // Listen for challenge completion from the callback page
    function onChallengeComplete(event) {
        if (event.data && event.data.type === '3ds-challenge-complete') {
            window.removeEventListener('message', onChallengeComplete);

            // Hide the modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('threeDsModal'));
            if (modal) modal.hide();

            var btn = document.getElementById('completePayBtn');
            if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Validating authentication...';

            // Step 5: Validate authentication results
            threeDsValidate(event.data.transactionId);
        }
    }
    window.addEventListener('message', onChallengeComplete);

    // Show the modal and submit the form
    var modal = new bootstrap.Modal(document.getElementById('threeDsModal'));
    modal.show();
    document.getElementById('step-up-form').submit();
}

function threeDsValidate(transactionId) {
    callApi('/api/3ds/validate', 'POST', {
        authenticationTransactionId: transactionId || _threeDsState.authTransactionId,
        cardSuffix: _threeDsState.cardSuffix,
        amount: _threeDsState.amount,
        currency: 'ZAR'
    }).then(function(result) {
        if (result.ok && result.data.status === 'AUTHENTICATION_SUCCESSFUL') {
            var authInfo = result.data.authenticationInformation || {};
            threeDsFinalPayment(authInfo);
        } else {
            var el = document.getElementById('paymentResult');
            if (el) {
                el.style.display = 'block';
                el.innerHTML = '<div class="alert alert-danger"><strong>Verification Failed</strong><br>'
                    + 'Your bank could not verify your identity. Please try again.</div>';
            }
            var btn = document.getElementById('completePayBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lock me-2"></i>Complete Transaction'; }
        }
    });
}

function threeDsFinalPayment(authInfo) {
    var card = _threeDsState.card;
    var b = cardBrand(card.cardType);
    var suffix = card.cardSuffix || '****';
    var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';
    var total = _threeDsState.total;

    callApi('/api/tokens/pay', 'POST', {
        customerId: _threeDsState.customerId,
        amount: parseFloat(total.toFixed(2)),
        currency: 'ZAR',
        threeDsData: authInfo
    }).then(function(result) {
        if (result.ok) {
            var now = new Date();
            var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
            var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
            var ref = (result.data.transactionId || '').slice(-8).toUpperCase();

            clearCart();

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
            if (el) {
                el.style.display = 'block';
                el.innerHTML = '<div class="alert alert-danger"><strong>Payment Declined</strong><br>'
                    + esc(result.data.message || 'Your payment could not be processed. Please try again or use a different card.') + '</div>';
            }
            var btn = document.getElementById('completePayBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lock me-2"></i>Complete Transaction'; }
        }
    });
}

function threeDsFallbackPayment(msg) {
    console.warn('3DS: ' + msg);
    var card = _threeDsState.card;
    var b = cardBrand(card.cardType);
    var suffix = card.cardSuffix || '****';
    var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';
    var total = _threeDsState.total;

    var btn = document.getElementById('completePayBtn');
    if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

    callApi('/api/tokens/pay', 'POST', {
        customerId: _threeDsState.customerId,
        amount: parseFloat(total.toFixed(2)),
        currency: 'ZAR'
    }).then(function(result) {
        if (result.ok) {
            var now = new Date();
            var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
            var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
            var ref = (result.data.transactionId || '').slice(-8).toUpperCase();
            clearCart();
            var root = document.getElementById('savedCardRoot');
            if (!root) root = document.getElementById('sidebarContent');
            root.innerHTML = '<div class="text-center py-3">'
                + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
                + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
                + '<h5 class="fw-bold mb-1">Payment Successful</h5>'
                + '<p class="text-muted mb-0" style="font-size:.9rem;">Thank you for your purchase, ' + esc(name.split(' ')[0]) + '!</p></div>'
                + '<div class="wiz-card mt-2">'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + fmt(total) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
                + '<hr><div class="d-flex align-items-center gap-3">'
                + '<div style="font-size:1.4rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
                + '<div><div class="fw-semibold" style="font-size:.9rem;color:' + b.color + ';">' + esc(b.name) + ' ending in ' + esc(suffix) + '</div>'
                + '<div class="text-muted" style="font-size:.8rem;">' + esc(name) + '</div></div></div></div>'
                + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        } else {
            var el = document.getElementById('paymentResult');
            if (el) {
                el.style.display = 'block';
                el.innerHTML = '<div class="alert alert-danger"><strong>Payment Declined</strong><br>'
                    + esc(result.data.message || 'Your payment could not be processed.') + '</div>';
            }
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-lock me-2"></i>Complete Transaction'; }
        }
    });
}

function showAddCardForm() {
    var root = document.getElementById('savedCardRoot');
    if (!root) root = document.getElementById('sidebarContent');
    root.innerHTML = '<div class="wiz-card" style="border-top:3px solid #1a1f71;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#1a1f71;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-info-circle" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#1a1f71;">Add New Card</div>'
        + '</div></div>'
        + '<div class="p-3 rounded-3 mb-3" style="background:#f8f9fa;border:1px solid #e9ecef;">'
        + '<p class="text-muted mb-0" style="font-size:.9rem;">Test cards are pre-loaded automatically in this demo.</p>'
        + '</div>'
        + '<button class="btn w-100 fw-semibold" onclick="backToCardList()" style="border:1px solid #1a1f71;color:#1a1f71;">'
        + '<i class="bi bi-arrow-left me-2"></i>Back to Cards</button>'
        + '</div>';
}

function backToCardList() {
    var root = document.getElementById('savedCardRoot');
    if (!root) root = document.getElementById('sidebarContent');
    root.innerHTML = '<div id="savedCardRoot">'
        + '<div class="wiz-card" style="border-top:3px solid #1a1f71;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#1a1f71;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-shield-lock" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#1a1f71;">Saved Cards</div>'
        + '</div></div>'
        + '<div id="savedCardList"><div class="text-center my-4">'
        + '<div class="spinner-border spinner-border-sm" style="color:#1a1f71;"></div>'
        + '</div></div>'
        + '</div>'
        + '<button class="btn w-100 mt-3 fw-semibold" onclick="showAddCardForm()" style="border:1px solid #1a1f71;color:#1a1f71;">'
        + '<i class="bi bi-plus-circle me-2"></i>Add New Card</button>'
        + '</div>';
    initSavedCardView();
}

function submitAddCard() {
    // Removed — card entry now handled by Flex Microform (Tokenized Card) for PCI compliance
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
    return '<div class="wiz-card" style="border-top:3px solid #0d6efd;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#0d6efd;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-receipt" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#0d6efd;">Pay by Invoice</div>'
        + '</div></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Email <span class="text-danger">*</span></label>'
        + '<input type="email" id="invEmail" class="form-control wiz-input" placeholder="you@example.com" style="border-color:#0d6efd33;"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Name</label>'
        + '<input type="text" id="invName" class="form-control wiz-input" placeholder="Your name" style="border-color:#0d6efd33;"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="invDesc" class="form-control wiz-input" value="CyberShop Order" placeholder="Order description" style="border-color:#0d6efd33;"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Due Date</label>'
        + '<input type="date" id="invDue" class="form-control wiz-input" value="' + due.toISOString().split('T')[0] + '" style="border-color:#0d6efd33;"></div>'
        + '<button class="w-100 border-0 py-2 rounded-2 fw-bold" id="invoiceBtn" onclick="submitInvoice()" style="background:#0d6efd;color:#fff;font-size:.95rem;">'
        + '<i class="bi bi-receipt me-2"></i>Create &amp; Send Invoice</button>'
        + '<div id="invoiceResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitInvoice() {
    if (getCartCount() === 0) {
        var el = document.getElementById('invoiceResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before creating an invoice.</div>';
        return;
    }

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
    var btn = document.getElementById('invoiceBtn');
    if (result.ok) {
        var now = new Date();
        var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
        var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

        document.getElementById('sidebarContent').innerHTML =
            '<div class="text-center py-3">'
            + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
            + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
            + '<h5 class="fw-bold mb-1">Invoice Sent</h5>'
            + '<p class="text-muted mb-0" style="font-size:.9rem;">The invoice has been emailed to the recipient.</p>'
            + '</div>'
            + '<div class="wiz-card mt-2">'
            + (invoiceId ? '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Invoice ID</span><span class="fw-semibold" style="font-family:monospace;">' + esc(invoiceId) + '</span></div>' : '')
            + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
            + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
            + '<hr><div class="d-flex align-items-center gap-3">'
            + '<div style="font-size:1.4rem;color:#0d6efd;"><i class="bi bi-receipt"></i></div>'
            + '<div><div class="fw-semibold" style="font-size:.9rem;color:#0d6efd;">Pay by Invoice</div></div></div>'
            + '</div>'
            + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
            + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        clearCart();
    } else {
        var el = document.getElementById('invoiceResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-receipt me-2"></i>Create &amp; Send Invoice';
    }
}

// --- Card-Only (UC Widget without Click to Pay) ---

function renderCardOnlyForm() {
    var total = getTotal();
    return '<div class="wiz-card" style="border-top:3px solid #0d6efd;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#0d6efd;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-credit-card" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#0d6efd;">Pay with Card</div>'
        + '</div></div>'
        + '<div id="cardOnlyWidgetContainer" style="min-height:200px;">'
        + '<div class="text-center my-4"><div class="spinner-border spinner-border-sm text-primary"></div>'
        + '<p class="text-muted mt-2" style="font-size:.85rem;">Loading secure card form...</p></div>'
        + '</div>'
        + '<div id="cardOnlyConfirmation" style="display:none;"></div>'
        + '</div>';
}

function initCardOnlyWidget() {
    var total = getTotal();
    callApi('/api/card-only/capture-context', 'POST', {
        amount: parseFloat(total.toFixed(2)).toString()
    }).then(function(result) {
        if (!result.ok || !result.data.jwt) {
            document.getElementById('cardOnlyWidgetContainer').innerHTML =
                '<div class="alert alert-danger">Could not load card form.</div>';
            return;
        }

        var cardOnlyJwt = result.data.jwt;

        async function startCardOnlyWidget() {
            try {
                var accept = await Accept(cardOnlyJwt);
                var up = await accept.unifiedPayments(true);

                document.getElementById('cardOnlyWidgetContainer').innerHTML = '';

                var tt = await up.show({
                    containers: { paymentSelection: '#cardOnlyWidgetContainer' }
                });

                var completeResponse = await up.complete(tt);
                var parsed = parseJwt(completeResponse);
                if (parsed) {
                    document.getElementById('cardOnlyWidgetContainer').style.display = 'none';
                    clearCart();
                    showCardOnlyConfirmation(parsed, total);
                }
            } catch (error) {
                console.error('Card-only payment error:', error);
                document.getElementById('cardOnlyWidgetContainer').innerHTML =
                    '<div class="alert alert-danger">Payment failed: ' + esc(error.message || 'Unknown error') + '</div>';
            }
        }
        startCardOnlyWidget();
    });
}

function showCardOnlyConfirmation(paymentDetails, total) {
    var transactionId = (paymentDetails.details &&
        paymentDetails.details.processorInformation &&
        paymentDetails.details.processorInformation.transactionId) ||
        paymentDetails.id || '';
    var ref = transactionId.slice(-8).toUpperCase();

    var amount = '';
    if (paymentDetails.details &&
        paymentDetails.details.orderInformation &&
        paymentDetails.details.orderInformation.amountDetails) {
        amount = paymentDetails.details.orderInformation.amountDetails.totalAmount ||
                 paymentDetails.details.orderInformation.amountDetails.authorizedAmount || '';
    }
    var displayAmount = amount ? 'R' + parseFloat(amount).toFixed(2) : fmt(total);

    var cardSuffix = '';
    var cardType = '';
    if (paymentDetails.details && paymentDetails.details.paymentInformation) {
        var pi = paymentDetails.details.paymentInformation;
        if (pi.tokenizedCard) { cardSuffix = pi.tokenizedCard.suffix || ''; cardType = pi.tokenizedCard.type || ''; }
        else if (pi.card) { cardSuffix = pi.card.suffix || ''; cardType = pi.card.type || ''; }
    }
    var b = { name: 'Card', icon: 'bi-credit-card', color: '#0d6efd' };
    if (cardType === '001' || (cardType + '').toLowerCase() === 'visa') b = { name: 'Visa', icon: 'bi-credit-card', color: '#1a1f71' };
    else if (cardType === '002' || (cardType + '').toLowerCase() === 'mastercard') b = { name: 'Mastercard', icon: 'bi-credit-card-2-front', color: '#eb001b' };
    else if (cardType === '003' || (cardType + '').toLowerCase() === 'amex') b = { name: 'Amex', icon: 'bi-credit-card-2-back', color: '#006fcf' };

    var now = new Date();
    var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('sidebarContent').innerHTML =
        '<div class="text-center py-3">'
        + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
        + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
        + '<h5 class="fw-bold mb-1">Payment Successful</h5>'
        + '<p class="text-muted mb-0" style="font-size:.9rem;">Thank you for your purchase!</p>'
        + '</div>'
        + '<div class="wiz-card mt-2">'
        + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + displayAmount + '</span></div>'
        + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
        + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
        + (cardSuffix ? '<hr><div class="d-flex align-items-center gap-3">'
            + '<div style="font-size:1.4rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
            + '<div><div class="fw-semibold" style="font-size:.9rem;color:' + b.color + ';">' + esc(b.name) + ' ending in ' + esc(cardSuffix) + '</div></div></div>' : '')
        + '</div>'
        + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
        + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
}

// --- Tokenized Checkout (Flex Microform) ---

var _flexMicroform = null;

function renderTokenizedCheckoutForm() {
    var total = getTotal();
    return '<div class="wiz-card" style="border-top:3px solid #6f42c1;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#6f42c1;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-credit-card-2-front" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#6f42c1;">Tokenized Card</div>'
        + '</div></div>'
        // Card Number (Flex hosted field)
        + '<div class="mb-3"><label class="wiz-field-label">Card Number <span class="text-danger">*</span></label>'
        + '<div id="flexCardNumber" style="height:38px;border:1px solid #6f42c133;border-radius:6px;padding:6px 12px;background:#fff;"></div>'
        + '<div id="flexCardError" class="text-danger" style="font-size:.75rem;margin-top:2px;"></div></div>'
        // Expiry row
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Exp Month</label>'
        + '<input type="text" id="flexExpMonth" class="form-control wiz-input" placeholder="MM" maxlength="2" style="border-color:#6f42c133;"></div>'
        + '<div class="col-4"><label class="wiz-field-label">Exp Year</label>'
        + '<input type="text" id="flexExpYear" class="form-control wiz-input" placeholder="YYYY" maxlength="4" style="border-color:#6f42c133;"></div>'
        + '<div class="col-4"><label class="wiz-field-label">CVV <span class="text-danger">*</span></label>'
        + '<div id="flexSecurityCode" style="height:38px;border:1px solid #6f42c133;border-radius:6px;padding:6px 12px;background:#fff;"></div></div>'
        + '</div>'
        // Amount
        + '<div class="text-center mb-3">'
        + '<div class="text-muted" style="font-size:.8rem;">Amount to pay</div>'
        + '<div class="fw-bold fs-4">' + fmt(total) + '</div></div>'
        // Submit
        + '<button class="w-100 border-0 py-2 rounded-2 fw-bold" id="flexPayBtn" onclick="submitTokenizedCheckout()" style="background:#6f42c1;color:#fff;font-size:.95rem;">'
        + '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card</button>'
        + '<div id="flexResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function initFlexMicroform() {
    var container = document.getElementById('flexCardNumber');
    if (container) container.innerHTML = '<div class="text-muted" style="font-size:.85rem;">Loading secure card form...</div>';

    // Step 1: Get a Flex Microform-specific capture context from our backend
    callApi('/api/tokenized-checkout/capture-context', 'POST').then(function(result) {
        if (!result.ok || !result.data.jwt) {
            var err = document.getElementById('flexCardError');
            if (err) err.textContent = 'Could not load secure card form.';
            return;
        }

        var flexJwt = result.data.jwt;

        // Step 2: Decode JWT to extract the Flex client library URL
        try {
            var payload = JSON.parse(atob(flexJwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            var ctx = payload.ctx && payload.ctx[0] && payload.ctx[0].data;
            var libUrl = ctx && ctx.clientLibrary;

            if (!libUrl) {
                // Fallback URL
                libUrl = 'https://testflex.cybersource.com/microform/bundle/v2.0/flex-microform.min.js';
            }

            // Step 3: Dynamically load the Flex Microform library
            if (window.Flex) {
                // Already loaded
                setupFlexFields(flexJwt);
            } else {
                var script = document.createElement('script');
                script.src = libUrl;
                if (ctx && ctx.clientLibraryIntegrity) {
                    script.integrity = ctx.clientLibraryIntegrity;
                    script.crossOrigin = 'anonymous';
                }
                script.onload = function() { setupFlexFields(flexJwt); };
                script.onerror = function() {
                    var err = document.getElementById('flexCardError');
                    if (err) err.textContent = 'Failed to load secure card library.';
                };
                document.head.appendChild(script);
            }
        } catch (e) {
            console.error('Flex JWT decode error:', e);
            var err = document.getElementById('flexCardError');
            if (err) err.textContent = 'Could not initialize secure card form.';
        }
    });
}

function setupFlexFields(flexJwt) {
    try {
        var flex = new Flex(flexJwt);
        var microform = flex.microform({ styles: {
            input: { 'font-size': '1rem', 'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif', 'font-weight': '400', color: '#212529' },
            '::placeholder': { color: '#6c757d', 'font-weight': '400' },
            ':focus': { color: '#212529' },
            valid: { color: '#212529' },
            invalid: { color: '#dc3545' }
        }});

        var numberField = microform.createField('number', { placeholder: 'Enter card number' });
        var securityCodeField = microform.createField('securityCode', { placeholder: 'CVV' });

        // Clear the loading message before loading fields
        var container = document.getElementById('flexCardNumber');
        if (container) container.innerHTML = '';

        numberField.load('#flexCardNumber');
        securityCodeField.load('#flexSecurityCode');

        numberField.on('change', function(data) {
            var err = document.getElementById('flexCardError');
            if (data.empty) { err.textContent = ''; }
            else if (!data.valid) { err.textContent = 'Invalid card number'; }
            else { err.textContent = ''; }
        });

        _flexMicroform = microform;
        console.log('Flex Microform initialized successfully');
    } catch (e) {
        console.error('Flex Microform init error:', e);
        var err = document.getElementById('flexCardError');
        if (err) err.textContent = 'Could not initialize secure card form: ' + e.message;
    }
}

function submitTokenizedCheckout() {
    if (getCartCount() === 0) {
        var el = document.getElementById('flexResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    if (!_flexMicroform) {
        var el = document.getElementById('flexResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-danger">Secure card form not initialized. Please reopen this form.</div>';
        return;
    }

    var btn = document.getElementById('flexPayBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Tokenizing card...';

    var expMonth = document.getElementById('flexExpMonth').value.trim();
    var expYear = document.getElementById('flexExpYear').value.trim();

    var options = {
        expirationMonth: expMonth,
        expirationYear: expYear
    };

    _flexMicroform.createToken(options, function(err, token) {
        if (err) {
            console.error('Flex token error:', err);
            var el = document.getElementById('flexResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-danger"><strong>Tokenization Failed</strong><br>'
                + esc(err.message || 'Could not tokenize card data. Please check your card details.') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
            return;
        }

        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

        var total = getTotal();
        callApi('/api/tokenized-checkout/pay', 'POST', {
            transientToken: token,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        }).then(function(result) {
            if (result.ok) {
                clearCart();
                var now = new Date();
                var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
                var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                var ref = (result.data.transactionId || '').slice(-8).toUpperCase();

                document.getElementById('sidebarContent').innerHTML =
                    '<div class="text-center py-3">'
                    + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
                    + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
                    + '<h5 class="fw-bold mb-1">Payment Successful</h5>'
                    + '<p class="text-muted mb-0" style="font-size:.9rem;">Thank you for your purchase!</p>'
                    + '</div>'
                    + '<div class="wiz-card mt-2">'
                    + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + fmt(total) + '</span></div>'
                    + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
                    + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
                    + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
                    + '<hr><div class="d-flex align-items-center gap-3">'
                    + '<div style="font-size:1.4rem;color:#6f42c1;"><i class="bi bi-credit-card-2-front"></i></div>'
                    + '<div><div class="fw-semibold" style="font-size:.9rem;color:#6f42c1;">Tokenized Card</div>'
                    + '<div class="text-muted" style="font-size:.8rem;">Flex Microform</div></div></div>'
                    + '</div>'
                    + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                    + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
            } else {
                var el = document.getElementById('flexResult');
                el.style.display = 'block';
                el.innerHTML = '<div class="alert alert-danger"><strong>Payment Failed</strong><br>'
                    + esc(result.data.message || 'Could not process payment. Please try again.') + '</div>';
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
            }
        });
    });
}

// --- Payment Link ---

function renderPaymentLinkForm() {
    return '<div class="wiz-card" style="border-top:3px solid #E21836;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#E21836;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-link-45deg" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#E21836;">Payment Link</div>'
        + '</div></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="linkDesc" class="form-control wiz-input" value="CyberShop Payment" placeholder="Payment description" style="border-color:#E2183633;"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Recipient Phone (for WhatsApp)</label>'
        + '<input type="tel" id="linkPhone" class="form-control wiz-input" placeholder="Phone number" style="border-color:#E2183633;"></div>'
        + '<button class="w-100 border-0 py-2 rounded-2 fw-bold" id="linkBtn" onclick="submitPaymentLink()" style="background:#E21836;color:#fff;font-size:.95rem;">'
        + '<i class="bi bi-link-45deg me-2"></i>Create Payment Link</button>'
        + '<div id="linkResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitPaymentLink() {
    if (getCartCount() === 0) {
        var el = document.getElementById('linkResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before creating a payment link.</div>';
        return;
    }

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
                clearCart();
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
            clearCart();
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
    var total = getTotal();
    return '<div class="wiz-card" style="border-top:3px solid #1428A0;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#1428A0;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-phone" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#1428A0;">Samsung Pay</div>'
        + '</div></div>'
        // Simulated wallet card
        + '<div style="background:linear-gradient(135deg,#1428A0 0%,#1e3fbf 100%);border-radius:12px;padding:20px;color:#fff;margin-bottom:16px;position:relative;overflow:hidden;">'
        + '<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>'
        + '<div style="position:absolute;bottom:-30px;left:-10px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>'
        + '<div class="d-flex justify-content-between align-items-start mb-4">'
        + '<span style="font-size:.75rem;opacity:.8;letter-spacing:1px;">SAMSUNG WALLET</span>'
        + '<i class="bi bi-phone" style="font-size:1.2rem;opacity:.6;"></i></div>'
        + '<div style="font-size:1.3rem;letter-spacing:3px;margin-bottom:16px;">'
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span>1111</span></div>'
        + '<div class="d-flex justify-content-between align-items-end">'
        + '<div><div style="font-size:.6rem;opacity:.6;text-transform:uppercase;">Card Holder</div>'
        + '<div style="font-size:.85rem;">Demo Customer</div></div>'
        + '<div style="text-align:right;"><div style="font-size:.6rem;opacity:.6;text-transform:uppercase;">Expires</div>'
        + '<div style="font-size:.85rem;">12/28</div></div>'
        + '<div style="text-align:right;font-weight:bold;font-size:1.1rem;font-style:italic;">VISA</div>'
        + '</div></div>'
        // Amount
        + '<div class="text-center mb-3">'
        + '<div class="text-muted" style="font-size:.8rem;">Amount to pay</div>'
        + '<div class="fw-bold fs-4">' + fmt(total) + '</div></div>'
        // Fingerprint button
        + '<button class="w-100 border-0 py-3 rounded-2 fw-bold d-flex align-items-center justify-content-center gap-2" id="spBtn" onclick="authenticateSamsungPay()" style="background:#1428A0;color:#fff;font-size:.95rem;">'
        + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>'
        + '<path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 2 0 3.7 1 4.8 2.5"/>'
        + '<path d="M10 19c.5-2.5 1-5 1-7 0-1.7 1.3-3 3-3s3 1.3 3 3c0 3-1 6-2 8"/>'
        + '<path d="M17.5 22c.5-1.5 1-3.5 1.5-6"/>'
        + '</svg>'
        + 'Confirm with Fingerprint</button>'
        + '<div id="spResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function authenticateSamsungPay() {
    if (getCartCount() === 0) {
        var el = document.getElementById('spResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    var btn = document.getElementById('spBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Authenticating...';

    // Simulate fingerprint authentication delay
    setTimeout(function() {
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Authenticated — Processing payment...';
        submitSamsungPay();
    }, 1500);
}

function submitSamsungPay() {
    var btn = document.getElementById('spBtn');

    var req = {
        dpan: '4111111111111111',
        expirationMonth: '12',
        expirationYear: '2028',
        cryptogram: 'EHuWW9PiBkWvqE5juRwDzAUFBAk=',
        cardType: '001',
        amount: parseFloat(getTotal().toFixed(2)),
        currency: 'ZAR'
    };

    callApi('/api/samsung-pay', 'POST', req).then(function(result) {
        if (result.ok) {
            clearCart();
            var now = new Date();
            var dateStr = now.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
            var timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
            var ref = (result.data.transactionId || '').slice(-8).toUpperCase();

            document.getElementById('sidebarContent').innerHTML =
                '<div class="text-center py-3">'
                + '<div style="width:64px;height:64px;border-radius:50%;background:#d4edda;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">'
                + '<i class="bi bi-check-lg" style="font-size:2rem;color:#198754;"></i></div>'
                + '<h5 class="fw-bold mb-1">Payment Successful</h5>'
                + '<p class="text-muted mb-0" style="font-size:.9rem;">Thank you for your purchase!</p>'
                + '</div>'
                + '<div class="wiz-card mt-2">'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + fmt(req.amount) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
                + '<hr><div class="d-flex align-items-center gap-3">'
                + '<div style="font-size:1.4rem;color:#1428A0;"><i class="bi bi-phone"></i></div>'
                + '<div><div class="fw-semibold" style="font-size:.9rem;color:#1428A0;">Samsung Pay</div></div></div>'
                + '</div>'
                + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        } else {
            var el = document.getElementById('spResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-danger"><strong>Payment Declined</strong><br>'
                + esc(result.data.message || 'Your payment could not be processed. Please try again.') + '</div>';
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
