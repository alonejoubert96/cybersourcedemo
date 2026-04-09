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

// --- Click to Pay (Simulated) ---

var _ctpCards = [];
var _ctpSelectedIndex = -1;

function renderCardOnlyForm() {
    return '<div class="wiz-card" style="border-top:3px solid #1a1f71;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#1a1f71;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-credit-card" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#1a1f71;">Click to Pay</div>'
        + '</div></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Email Address</label>'
        + '<input type="email" id="ctpEmail" class="form-control wiz-input" placeholder="Enter email address" style="border-color:#1a1f7133;"></div>'
        + '<button class="w-100 border-0 py-2 rounded-2 fw-bold" id="ctpLookupBtn" onclick="ctpLookup()" style="background:#1a1f71;color:#fff;font-size:.95rem;">'
        + '<i class="bi bi-search me-2"></i>Find My Cards</button>'
        + '<div id="ctpContent" class="mt-3"></div>'
        + '</div>';
}

function initCardOnlyWidget() {
    // Nothing to init — user clicks "Find My Cards"
}

function ctpLookup() {
    var btn = document.getElementById('ctpLookupBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Looking up cards...';

    var customerId = getSavedCustomerId();
    if (!customerId) {
        // Seed cards first
        callApi('/api/tokens/seed', 'POST').then(function(result) {
            if (result.ok && result.data.customerId) {
                setSavedCustomerId(result.data.customerId);
                ctpFetchCards(result.data.customerId, btn);
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-search me-2"></i>Find My Cards';
                document.getElementById('ctpContent').innerHTML = '<div class="alert alert-warning">No cards found for this email.</div>';
            }
        });
    } else {
        // Simulate lookup delay
        setTimeout(function() { ctpFetchCards(customerId, btn); }, 800);
    }
}

function ctpFetchCards(customerId, btn) {
    callApi('/api/tokens/customers/' + customerId + '/cards', 'GET').then(function(result) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-search me-2"></i>Find My Cards';

        if (!result.ok || !result.data || result.data.length === 0) {
            document.getElementById('ctpContent').innerHTML = '<div class="alert alert-info">No cards found. Add a card to get started.</div>';
            return;
        }

        _ctpCards = result.data;
        _ctpSelectedIndex = -1;
        ctpRenderCardList();
    });
}

function ctpRenderCardList() {
    var email = document.getElementById('ctpEmail').value.trim();
    var total = getTotal();
    var html = '<div class="mb-2" style="font-size:.85rem;color:#1a1f71;"><i class="bi bi-check-circle me-1"></i>'
        + esc(_ctpCards.length) + ' card' + (_ctpCards.length !== 1 ? 's' : '') + ' found for <strong>' + esc(email) + '</strong></div>';

    for (var i = 0; i < _ctpCards.length; i++) {
        var c = _ctpCards[i];
        var b = cardBrand(c.cardType);
        var suffix = c.cardSuffix || '****';
        var expiry = (c.expirationMonth || '??') + '/' + (c.expirationYear || '????');
        var name = ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || 'Cardholder';
        var selected = _ctpSelectedIndex === i;

        html += '<div onclick="ctpSelectCard(' + i + ')" style="cursor:pointer;border:2px solid ' + (selected ? b.color : '#e9ecef') + ';border-radius:8px;padding:12px;margin-bottom:8px;background:' + (selected ? b.bg : '#fff') + ';transition:all .2s;">'
            + '<div class="d-flex align-items-center gap-3">'
            + '<div style="font-size:1.5rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
            + '<div class="flex-grow-1">'
            + '<div class="fw-semibold" style="color:' + b.color + ';">' + esc(b.name) + '</div>'
            + '<div style="font-family:monospace;font-size:.9rem;letter-spacing:1px;">\u2022\u2022\u2022\u2022 ' + esc(suffix) + '</div>'
            + '<div class="text-muted" style="font-size:.75rem;">' + esc(name) + ' \u2022 ' + esc(expiry) + '</div>'
            + '</div>'
            + (selected ? '<i class="bi bi-check-circle-fill" style="color:' + b.color + ';font-size:1.2rem;"></i>' : '<i class="bi bi-circle" style="color:#ccc;font-size:1.2rem;"></i>')
            + '</div></div>';
    }

    // Amount
    html += '<div class="text-center my-3">'
        + '<div class="text-muted" style="font-size:.8rem;">Amount to pay</div>'
        + '<div class="fw-bold fs-4">' + fmt(total) + '</div></div>';

    // Pay button
    html += '<button class="w-100 border-0 py-2 rounded-2 fw-bold" id="ctpPayBtn" onclick="ctpPay()" '
        + (_ctpSelectedIndex < 0 ? 'disabled style="background:#1a1f71;color:#fff;font-size:.95rem;opacity:.6;"' : 'style="background:#1a1f71;color:#fff;font-size:.95rem;opacity:1;"')
        + '><i class="bi bi-lock me-2"></i>Pay Now</button>';

    // Remove card link
    if (_ctpSelectedIndex >= 0) {
        html += '<button class="btn btn-link text-danger w-100 mt-2" style="font-size:.85rem;" onclick="ctpRemoveCard()">'
            + '<i class="bi bi-trash me-1"></i>Remove Selected Card</button>';
    }

    document.getElementById('ctpContent').innerHTML = html;
}

function ctpSelectCard(index) {
    _ctpSelectedIndex = index;
    ctpRenderCardList();
}

function ctpRemoveCard() {
    if (_ctpSelectedIndex < 0 || _ctpSelectedIndex >= _ctpCards.length) return;
    var card = _ctpCards[_ctpSelectedIndex];
    var customerId = getSavedCustomerId();
    if (!customerId || !card.paymentInstrumentId) return;

    callApi('/api/tokens/customers/' + customerId + '/cards/' + card.paymentInstrumentId, 'DELETE').then(function() {
        _ctpCards.splice(_ctpSelectedIndex, 1);
        _ctpSelectedIndex = -1;
        if (_ctpCards.length === 0) {
            document.getElementById('ctpContent').innerHTML = '<div class="alert alert-info">All cards removed. Use Tokenized Card to add a new one.</div>';
        } else {
            ctpRenderCardList();
        }
    });
}

function ctpPay() {
    if (_ctpSelectedIndex < 0 || getCartCount() === 0) return;

    var customerId = getSavedCustomerId();
    var card = _ctpCards[_ctpSelectedIndex];
    var b = cardBrand(card.cardType);
    var suffix = card.cardSuffix || '****';
    var name = ((card.firstName || '') + ' ' + (card.lastName || '')).trim() || 'Cardholder';
    var total = getTotal();

    var btn = document.getElementById('ctpPayBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

    callApi('/api/tokens/pay', 'POST', {
        customerId: customerId,
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
                + '<div style="font-size:1.4rem;color:' + b.color + ';"><i class="bi ' + b.icon + '"></i></div>'
                + '<div><div class="fw-semibold" style="font-size:.9rem;color:' + b.color + ';">' + esc(b.name) + ' ending in ' + esc(suffix) + '</div>'
                + '<div class="text-muted" style="font-size:.8rem;">' + esc(name) + '</div></div></div>'
                + '</div>'
                + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        } else {
            var el = document.getElementById('ctpContent');
            el.innerHTML = '<div class="alert alert-danger"><strong>Payment Failed</strong><br>'
                + esc(result.data.message || 'Could not process payment.') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay Now';
        }
    });
}

// --- Tokenized Checkout (Flex Microform) ---

var _flexMicroform = null;

var _flexCardEntered = false;

function renderTokenizedCheckoutForm() {
    var total = getTotal();
    return '<div class="wiz-card" style="border-top:3px solid #6f42c1;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#6f42c1;display:flex;align-items:center;justify-content:center;">'
        + '<i class="bi bi-credit-card-2-front" style="color:#fff;font-size:1.2rem;"></i></div>'
        + '<div><div class="fw-bold" style="color:#6f42c1;">Tokenized Card</div>'
        + '</div></div>'
        // Card Number — pre-loaded display + hidden Flex field
        + '<div class="mb-3"><label class="wiz-field-label">Card Number <span class="text-danger">*</span></label>'
        + '<div id="flexCardPreview" onclick="showFlexCardField()" style="height:38px;border:1px solid #6f42c133;border-radius:6px;padding:6px 12px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">'
        + '<span style="font-size:1rem;color:#212529;letter-spacing:1px;">\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 1091</span>'
        + '<span style="font-size:.75rem;color:#6f42c1;font-weight:600;">Change</span></div>'
        + '<div id="flexCardNumber" style="height:38px;border:1px solid #6f42c133;border-radius:6px;padding:6px 12px;background:#fff;display:none;"></div>'
        + '<div id="flexCardError" class="text-danger" style="font-size:.75rem;margin-top:2px;"></div></div>'
        // Expiry row
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Exp Month</label>'
        + '<input type="text" id="flexExpMonth" class="form-control wiz-input" value="12" maxlength="2" style="border-color:#6f42c133;"></div>'
        + '<div class="col-4"><label class="wiz-field-label">Exp Year</label>'
        + '<input type="text" id="flexExpYear" class="form-control wiz-input" value="2028" maxlength="4" style="border-color:#6f42c133;"></div>'
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

function showFlexCardField() {
    document.getElementById('flexCardPreview').style.display = 'none';
    document.getElementById('flexCardNumber').style.display = '';
    _flexCardEntered = true;
}

function initFlexMicroform() {
    _flexCardEntered = false;

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

var _flexTransientToken = null;

function submitTokenizedCheckout() {
    if (getCartCount() === 0) {
        var el = document.getElementById('flexResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    var btn = document.getElementById('flexPayBtn');
    btn.disabled = true;
    var total = getTotal();
    var amount = parseFloat(total.toFixed(2)).toString();

    // Default card path — use stored token (TMS customer) for payment
    if (!_flexCardEntered) {
        var customerId = getSavedCustomerId();
        if (!customerId) {
            var el = document.getElementById('flexResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-warning">No saved cards found. Please enter card details above.</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
            return;
        }
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Initiating bank verification...';
        callApi('/api/3ds/setup', 'POST', { cardSuffix: '1091' }).then(function(result) {
            if (!result.ok || !result.data.accessToken) {
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';
                callApi('/api/tokens/pay', 'POST', { customerId: customerId, amount: parseFloat(amount), currency: 'ZAR' }).then(function(r) {
                    handleTokenizedCheckoutResult(r, total, btn);
                });
                return;
            }
            runTokenized3ds(result.data, amount, 'default', null, btn, total);
        });
        return;
    }

    // Flex Microform path — tokenize first, then 3DS with transient token
    if (!_flexMicroform) {
        var el = document.getElementById('flexResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-danger">Secure card form not initialized. Please reopen this form.</div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
        return;
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Tokenizing card...';

    var expMonth = document.getElementById('flexExpMonth').value.trim();
    var expYear = document.getElementById('flexExpYear').value.trim();

    _flexMicroform.createToken({ expirationMonth: expMonth, expirationYear: expYear }, function(err, token) {
        if (err) {
            var el = document.getElementById('flexResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-danger"><strong>Tokenization Failed</strong><br>'
                + esc(err.message || 'Could not tokenize card data. Please check your card details.') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
            return;
        }

        _flexTransientToken = token;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Initiating bank verification...';

        // 3DS setup with transient token
        callApi('/api/3ds/token/setup', 'POST', { transientToken: token }).then(function(result) {
            if (!result.ok || !result.data.accessToken) {
                // 3DS not available — pay directly with token
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';
                callApi('/api/tokenized-checkout/pay', 'POST', { transientToken: token, amount: amount, currency: 'ZAR' }).then(function(r) {
                    handleTokenizedCheckoutResult(r, total, btn);
                });
                return;
            }
            runTokenized3ds(result.data, amount, 'flex', token, btn, total);
        });
    });
}

function runTokenized3ds(setupData, amount, mode, transientToken, btn, total) {
    // Device data collection
    var form = document.getElementById('cardinal_collection_form');
    form.action = setupData.deviceDataCollectionUrl;
    document.getElementById('cardinal_collection_form_input').value = setupData.accessToken;
    form.submit();

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Verifying card with your bank...';

    var ddcDone = false;
    function onDdc(event) {
        if (event.data && event.data.MessageType === 'profile.completed') {
            ddcDone = true;
            window.removeEventListener('message', onDdc);
            tokenized3dsEnroll(setupData.referenceId, amount, mode, transientToken, btn, total);
        }
    }
    window.addEventListener('message', onDdc);
    setTimeout(function() {
        if (!ddcDone) {
            window.removeEventListener('message', onDdc);
            tokenized3dsEnroll(setupData.referenceId, amount, mode, transientToken, btn, total);
        }
    }, 10000);
}

function tokenized3dsEnroll(referenceId, amount, mode, transientToken, btn, total) {
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Checking authentication...';

    var browserInfo = {
        httpAcceptContent: 'text/html',
        httpBrowserLanguage: navigator.language || 'en-ZA',
        httpBrowserColorDepth: String(screen.colorDepth || 24),
        httpBrowserScreenHeight: String(screen.height || 1080),
        httpBrowserScreenWidth: String(screen.width || 1920),
        httpBrowserTimeDifference: String(new Date().getTimezoneOffset()),
        userAgentBrowserValue: navigator.userAgent
    };

    var enrollUrl = mode === 'default' ? '/api/3ds/enroll' : '/api/3ds/token/enroll';
    var enrollBody = mode === 'default'
        ? { cardSuffix: '1091', amount: amount, currency: 'ZAR', referenceId: referenceId, browserInfo: browserInfo }
        : { transientToken: transientToken, amount: amount, currency: 'ZAR', referenceId: referenceId, browserInfo: browserInfo };

    callApi(enrollUrl, 'POST', enrollBody).then(function(result) {
        if (!result.ok) {
            tokenized3dsFallbackPay(mode, transientToken, amount, btn, total);
            return;
        }

        var status = result.data.status;
        var authInfo = result.data.authenticationInformation || {};

        if (status === 'AUTHENTICATION_SUCCESSFUL') {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Authenticated — processing payment...';
            tokenized3dsFinalPay(mode, transientToken, amount, authInfo, btn, total);
        } else if (status === 'PENDING_AUTHENTICATION' && authInfo.stepUpUrl && authInfo.accessToken) {
            btn.innerHTML = '<i class="bi bi-shield-lock me-1"></i> Complete verification in the popup...';
            // Store state for after challenge
            window._tokenized3dsState = { mode: mode, transientToken: transientToken, amount: amount, btn: btn, total: total, authTransactionId: authInfo.authenticationTransactionId };
            showTokenizedChallengeIframe(authInfo.stepUpUrl, authInfo.accessToken);
        } else {
            var el = document.getElementById('flexResult');
            if (el) { el.style.display = 'block'; el.innerHTML = '<div class="alert alert-danger"><strong>Authentication Failed</strong><br>Your bank could not verify your identity.</div>'; }
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
        }
    });
}

function showTokenizedChallengeIframe(stepUpUrl, accessToken) {
    document.getElementById('step-up-form').action = stepUpUrl;
    document.getElementById('step-up-jwt').value = accessToken;
    document.getElementById('step-up-md').value = 'tokenized';

    function onChallenge(event) {
        if (event.data && event.data.type === '3ds-challenge-complete') {
            window.removeEventListener('message', onChallenge);
            var modal = bootstrap.Modal.getInstance(document.getElementById('threeDsModal'));
            if (modal) modal.hide();

            var s = window._tokenized3dsState;
            s.btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Validating authentication...';

            // For default card, use card-suffix validate; for flex, use token validate
            var validateUrl = s.mode === 'default' ? '/api/3ds/validate' : '/api/3ds/token/validate';
            var validateBody = s.mode === 'default'
                ? { authenticationTransactionId: event.data.transactionId || s.authTransactionId, cardSuffix: '1091', amount: s.amount, currency: 'ZAR' }
                : { authenticationTransactionId: event.data.transactionId || s.authTransactionId, cardNumber: '4000000000001091', cardType: '001', expirationMonth: '12', expirationYear: '2028', amount: s.amount, currency: 'ZAR' };

            callApi(validateUrl, 'POST', validateBody).then(function(result) {
                if (result.ok && result.data.status === 'AUTHENTICATION_SUCCESSFUL') {
                    tokenized3dsFinalPay(s.mode, s.transientToken, s.amount, result.data.authenticationInformation || {}, s.btn, s.total);
                } else {
                    var el = document.getElementById('flexResult');
                    if (el) { el.style.display = 'block'; el.innerHTML = '<div class="alert alert-danger"><strong>Verification Failed</strong></div>'; }
                    s.btn.disabled = false;
                    s.btn.innerHTML = '<i class="bi bi-lock me-2"></i>Pay with Tokenized Card';
                }
            });
        }
    }
    window.addEventListener('message', onChallenge);

    var modal = new bootstrap.Modal(document.getElementById('threeDsModal'));
    modal.show();
    document.getElementById('step-up-form').submit();
}

function tokenized3dsFinalPay(mode, transientToken, amount, authInfo, btn, total) {
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

    var payUrl, payBody;
    if (mode === 'default') {
        payUrl = '/api/tokens/pay';
        payBody = { customerId: getSavedCustomerId(), amount: parseFloat(amount), currency: 'ZAR', threeDsData: authInfo };
    } else {
        payUrl = '/api/tokenized-checkout/pay';
        payBody = { transientToken: transientToken, amount: parseFloat(amount), currency: 'ZAR', threeDsData: authInfo };
    }

    callApi(payUrl, 'POST', payBody).then(function(result) {
        handleTokenizedCheckoutResult(result, total, btn);
    });
}

function tokenized3dsFallbackPay(mode, transientToken, amount, btn, total) {
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing payment...';

    var payUrl, payBody;
    if (mode === 'default') {
        payUrl = '/api/tokens/pay';
        payBody = { customerId: getSavedCustomerId(), amount: parseFloat(amount), currency: 'ZAR' };
    } else {
        payUrl = '/api/tokenized-checkout/pay';
        payBody = { transientToken: transientToken, amount: parseFloat(amount), currency: 'ZAR' };
    }

    callApi(payUrl, 'POST', payBody).then(function(result) {
        handleTokenizedCheckoutResult(result, total, btn);
    });
}

function handleTokenizedCheckoutResult(result, total, btn) {
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
            + '<div><div class="fw-semibold" style="font-size:.9rem;color:#6f42c1;">Tokenized Card</div></div></div>'
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

// --- Apple Pay (Simulated) ---

function renderApplePayForm() {
    var total = getTotal();
    return '<div class="wiz-card" style="border-top:3px solid #000;">'
        + '<div class="d-flex align-items-center gap-2 mb-3">'
        + '<div style="width:40px;height:40px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;">'
        + '<svg width="18" height="22" viewBox="0 0 17 21" fill="#fff"><path d="M13.545 10.239c-.022-2.234 1.823-3.306 1.906-3.358-.037-.054-1.492-.887-2.956-.887-.777 0-1.504.228-2.106.228-.63 0-1.396-.223-2.143-.223-1.785 0-3.541 1.205-3.541 3.608 0 1.506.584 3.1 1.302 4.131.588.846 1.296 1.793 2.222 1.758.865-.035 1.2-.564 2.247-.564 1.039 0 1.341.564 2.258.546.966-.018 1.576-.862 2.147-1.714.413-.602.723-1.267.893-1.567-.02-.009-1.712-.657-1.729-2.612zM11.916 5.167c.463-.575.775-1.356.69-2.147-.666.027-1.488.457-1.964 1.017-.42.496-.8 1.307-.698 2.072.744.058 1.506-.38 1.972-.942z"/></svg></div>'
        + '<div><div class="fw-bold">Apple Pay</div>'
        + '</div></div>'
        // Wallet card
        + '<div style="background:linear-gradient(135deg,#1c1c1e 0%,#3a3a3c 100%);border-radius:12px;padding:20px;color:#fff;margin-bottom:16px;position:relative;overflow:hidden;">'
        + '<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>'
        + '<div style="position:absolute;bottom:-30px;left:-10px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>'
        + '<div class="d-flex justify-content-between align-items-start mb-4">'
        + '<span style="font-size:.75rem;opacity:.8;letter-spacing:1px;">APPLE WALLET</span>'
        + '<svg width="16" height="20" viewBox="0 0 17 21" fill="rgba(255,255,255,0.6)"><path d="M13.545 10.239c-.022-2.234 1.823-3.306 1.906-3.358-.037-.054-1.492-.887-2.956-.887-.777 0-1.504.228-2.106.228-.63 0-1.396-.223-2.143-.223-1.785 0-3.541 1.205-3.541 3.608 0 1.506.584 3.1 1.302 4.131.588.846 1.296 1.793 2.222 1.758.865-.035 1.2-.564 2.247-.564 1.039 0 1.341.564 2.258.546.966-.018 1.576-.862 2.147-1.714.413-.602.723-1.267.893-1.567-.02-.009-1.712-.657-1.729-2.612zM11.916 5.167c.463-.575.775-1.356.69-2.147-.666.027-1.488.457-1.964 1.017-.42.496-.8 1.307-.698 2.072.744.058 1.506-.38 1.972-.942z"/></svg></div>'
        + '<div style="font-size:1.3rem;letter-spacing:3px;margin-bottom:16px;">'
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span style="opacity:.5;">\u2022\u2022\u2022\u2022</span> '
        + '<span>4242</span></div>'
        + '<div class="d-flex justify-content-between align-items-end">'
        + '<div><div style="font-size:.6rem;opacity:.6;text-transform:uppercase;">Card Holder</div>'
        + '<div style="font-size:.85rem;">Demo Customer</div></div>'
        + '<div style="text-align:right;"><div style="font-size:.6rem;opacity:.6;text-transform:uppercase;">Expires</div>'
        + '<div style="font-size:.85rem;">09/28</div></div>'
        + '<div style="text-align:right;font-weight:bold;font-size:1.1rem;font-style:italic;">VISA</div>'
        + '</div></div>'
        // Amount
        + '<div class="text-center mb-3">'
        + '<div class="text-muted" style="font-size:.8rem;">Amount to pay</div>'
        + '<div class="fw-bold fs-4">' + fmt(total) + '</div></div>'
        // Auth method selector
        + '<div class="d-flex gap-2 mb-3">'
        + '<button class="flex-fill border-0 py-2 rounded-2 fw-semibold apAuthOpt" data-method="faceid" onclick="selectAppleAuthMethod(\'faceid\')" style="background:#000;color:#fff;font-size:.8rem;">Face ID</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold apAuthOpt" data-method="touchid" onclick="selectAppleAuthMethod(\'touchid\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">Touch ID</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold apAuthOpt" data-method="passcode" onclick="selectAppleAuthMethod(\'passcode\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">Passcode</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold apAuthOpt" data-method="watch" onclick="selectAppleAuthMethod(\'watch\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">Watch</button>'
        + '</div>'
        // Confirm button
        + '<button class="w-100 border-0 py-3 rounded-2 fw-bold d-flex align-items-center justify-content-center gap-2" id="apBtn" onclick="authenticateApplePay()" style="background:#000;color:#fff;font-size:.95rem;border-radius:8px;">'
        + '<span id="apAuthIcon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h-1a2 2 0 0 0-2 2v1m0 10v1a2 2 0 0 0 2 2h1m10-16h1a2 2 0 0 1 2 2v1m0 10v1a2 2 0 0 1-2 2h-1"/><circle cx="12" cy="10" r="3"/><path d="M12 13c-2.5 0-4 1.5-4 3v1h8v-1c0-1.5-1.5-3-4-3z"/></svg></span>'
        + '<span id="apAuthLabel">Confirm with Face ID</span></button>'
        + '<div id="apResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

var _appleAuthMethod = 'faceid';

var _appleAuthConfig = {
    faceid: {
        label: 'Confirm with Face ID',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h-1a2 2 0 0 0-2 2v1m0 10v1a2 2 0 0 0 2 2h1m10-16h1a2 2 0 0 1 2 2v1m0 10v1a2 2 0 0 1-2 2h-1"/><circle cx="12" cy="10" r="3"/><path d="M12 13c-2.5 0-4 1.5-4 3v1h8v-1c0-1.5-1.5-3-4-3z"/></svg>',
        authMsg: 'Scanning face...'
    },
    touchid: {
        label: 'Confirm with Touch ID',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 2 0 3.7 1 4.8 2.5"/><path d="M10 19c.5-2.5 1-5 1-7 0-1.7 1.3-3 3-3s3 1.3 3 3c0 3-1 6-2 8"/><path d="M17.5 22c.5-1.5 1-3.5 1.5-6"/></svg>',
        authMsg: 'Scanning fingerprint...'
    },
    passcode: {
        label: 'Confirm with Passcode',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
        authMsg: 'Verifying passcode...'
    },
    watch: {
        label: 'Double-click Side Button',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="4"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M18 8h1m-1 4h1"/></svg>',
        authMsg: 'Waiting for Apple Watch...'
    }
};

function selectAppleAuthMethod(method) {
    _appleAuthMethod = method;
    var cfg = _appleAuthConfig[method];
    document.getElementById('apAuthIcon').innerHTML = cfg.icon;
    document.getElementById('apAuthLabel').textContent = cfg.label;
    var opts = document.querySelectorAll('.apAuthOpt');
    for (var i = 0; i < opts.length; i++) {
        if (opts[i].getAttribute('data-method') === method) {
            opts[i].style.background = '#000';
            opts[i].style.color = '#fff';
        } else {
            opts[i].style.background = '#e9ecef';
            opts[i].style.color = '#333';
        }
    }
}

function authenticateApplePay() {
    if (getCartCount() === 0) {
        var el = document.getElementById('apResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    var cfg = _appleAuthConfig[_appleAuthMethod];
    var btn = document.getElementById('apBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> ' + cfg.authMsg;

    setTimeout(function() {
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Authenticated — Processing payment...';
        submitApplePay();
    }, 1500);
}

function submitApplePay() {
    var btn = document.getElementById('apBtn');
    var total = getTotal();

    var req = {
        dpan: '4242424242424242',
        expirationMonth: '09',
        expirationYear: '2028',
        cryptogram: 'EHuWW9PiBkWvqE5juRwDzAUFBAk=',
        cardType: '001',
        amount: parseFloat(total.toFixed(2)),
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
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Amount Paid</span><span class="fw-bold fs-5" style="color:var(--cs-primary);">' + fmt(total) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Reference</span><span class="fw-semibold" style="font-family:monospace;">#' + esc(ref) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Date</span><span class="fw-semibold">' + esc(dateStr) + '</span></div>'
                + '<div class="d-flex justify-content-between mb-2"><span class="text-muted">Time</span><span class="fw-semibold">' + esc(timeStr) + '</span></div>'
                + '<hr><div class="d-flex align-items-center gap-3">'
                + '<div style="font-size:1.4rem;"><svg width="18" height="22" viewBox="0 0 17 21" fill="#000"><path d="M13.545 10.239c-.022-2.234 1.823-3.306 1.906-3.358-.037-.054-1.492-.887-2.956-.887-.777 0-1.504.228-2.106.228-.63 0-1.396-.223-2.143-.223-1.785 0-3.541 1.205-3.541 3.608 0 1.506.584 3.1 1.302 4.131.588.846 1.296 1.793 2.222 1.758.865-.035 1.2-.564 2.247-.564 1.039 0 1.341.564 2.258.546.966-.018 1.576-.862 2.147-1.714.413-.602.723-1.267.893-1.567-.02-.009-1.712-.657-1.729-2.612zM11.916 5.167c.463-.575.775-1.356.69-2.147-.666.027-1.488.457-1.964 1.017-.42.496-.8 1.307-.698 2.072.744.058 1.506-.38 1.972-.942z"/></svg></div>'
                + '<div><div class="fw-semibold" style="font-size:.9rem;">Apple Pay</div>'
                + '<div class="text-muted" style="font-size:.8rem;">Visa ending in 4242</div></div></div>'
                + '</div>'
                + '<button class="btn btn-outline-primary w-100 mt-3" onclick="window.location.href=\'/\'">'
                + '<i class="bi bi-bag me-2"></i>Continue Shopping</button>';
        } else {
            var el = document.getElementById('apResult');
            el.style.display = 'block';
            el.innerHTML = '<div class="alert alert-danger"><strong>Payment Failed</strong><br>'
                + esc(result.data.message || 'Could not process payment.') + '</div>';
            btn.disabled = false;
            btn.innerHTML = 'Confirm with Face ID';
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
        + '<span>1091</span></div>'
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
        // Auth method selector
        + '<div class="d-flex gap-2 mb-3">'
        + '<button class="flex-fill border-0 py-2 rounded-2 fw-semibold spAuthOpt" data-method="fingerprint" onclick="selectSamsungAuthMethod(\'fingerprint\')" style="background:#1428A0;color:#fff;font-size:.8rem;">Fingerprint</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold spAuthOpt" data-method="iris" onclick="selectSamsungAuthMethod(\'iris\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">Iris Scan</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold spAuthOpt" data-method="pin" onclick="selectSamsungAuthMethod(\'pin\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">PIN</button>'
        + '<button class="flex-fill py-2 rounded-2 fw-semibold spAuthOpt" data-method="face" onclick="selectSamsungAuthMethod(\'face\')" style="background:#e9ecef;color:#333;border:none;font-size:.8rem;">Face</button>'
        + '</div>'
        // Confirm button
        + '<button class="w-100 border-0 py-3 rounded-2 fw-bold d-flex align-items-center justify-content-center gap-2" id="spBtn" onclick="authenticateSamsungPay()" style="background:#1428A0;color:#fff;font-size:.95rem;">'
        + '<span id="spAuthIcon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 2 0 3.7 1 4.8 2.5"/><path d="M10 19c.5-2.5 1-5 1-7 0-1.7 1.3-3 3-3s3 1.3 3 3c0 3-1 6-2 8"/><path d="M17.5 22c.5-1.5 1-3.5 1.5-6"/></svg></span>'
        + '<span id="spAuthLabel">Confirm with Fingerprint</span></button>'
        + '<div id="spResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

var _samsungAuthMethod = 'fingerprint';

var _samsungAuthConfig = {
    fingerprint: {
        label: 'Confirm with Fingerprint',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 2 0 3.7 1 4.8 2.5"/><path d="M10 19c.5-2.5 1-5 1-7 0-1.7 1.3-3 3-3s3 1.3 3 3c0 3-1 6-2 8"/><path d="M17.5 22c.5-1.5 1-3.5 1.5-6"/></svg>',
        authMsg: 'Scanning fingerprint...'
    },
    iris: {
        label: 'Confirm with Iris Scan',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
        authMsg: 'Scanning iris...'
    },
    pin: {
        label: 'Confirm with PIN',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
        authMsg: 'Verifying PIN...'
    },
    face: {
        label: 'Confirm with Face',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h-1a2 2 0 0 0-2 2v1m0 10v1a2 2 0 0 0 2 2h1m10-16h1a2 2 0 0 1 2 2v1m0 10v1a2 2 0 0 1-2 2h-1"/><circle cx="12" cy="10" r="3"/><path d="M12 13c-2.5 0-4 1.5-4 3v1h8v-1c0-1.5-1.5-3-4-3z"/></svg>',
        authMsg: 'Scanning face...'
    }
};

function selectSamsungAuthMethod(method) {
    _samsungAuthMethod = method;
    var cfg = _samsungAuthConfig[method];
    document.getElementById('spAuthIcon').innerHTML = cfg.icon;
    document.getElementById('spAuthLabel').textContent = cfg.label;
    var opts = document.querySelectorAll('.spAuthOpt');
    for (var i = 0; i < opts.length; i++) {
        if (opts[i].getAttribute('data-method') === method) {
            opts[i].style.background = '#1428A0';
            opts[i].style.color = '#fff';
        } else {
            opts[i].style.background = '#e9ecef';
            opts[i].style.color = '#333';
        }
    }
}

function authenticateSamsungPay() {
    if (getCartCount() === 0) {
        var el = document.getElementById('spResult');
        el.style.display = 'block';
        el.innerHTML = '<div class="alert alert-warning">Your cart is empty. Please add items before paying.</div>';
        return;
    }

    var cfg = _samsungAuthConfig[_samsungAuthMethod];
    var btn = document.getElementById('spBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> ' + cfg.authMsg;

    setTimeout(function() {
        btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Authenticated — Processing payment...';
        submitSamsungPay();
    }, 1500);
}

function submitSamsungPay() {
    var btn = document.getElementById('spBtn');

    var req = {
        dpan: '4000000000001091',
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
