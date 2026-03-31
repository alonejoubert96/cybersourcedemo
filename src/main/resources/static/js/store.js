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

function renderTokenForm() {
    return '<div class="wiz-card">'
        + '<div class="wiz-label">SAVED CARD — STORE &amp; PAY</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Step 1: Store your card securely. Step 2: Pay using the stored token.</p>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-12"><label class="wiz-field-label">Card Number <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokCardNumber" class="form-control wiz-input" placeholder="4111 1111 1111 1111" maxlength="19"></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Exp Month</label>'
        + '<input type="text" id="tokExpMonth" class="form-control wiz-input" placeholder="12" maxlength="2"></div>'
        + '<div class="col-4"><label class="wiz-field-label">Exp Year</label>'
        + '<input type="text" id="tokExpYear" class="form-control wiz-input" placeholder="2028" maxlength="4"></div>'
        + '<div class="col-4"><label class="wiz-field-label">CVV</label>'
        + '<input type="text" id="tokCvv" class="form-control wiz-input" placeholder="123" maxlength="4"></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First Name <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokFirstName" class="form-control wiz-input" placeholder="John"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last Name <span class="text-danger">*</span></label>'
        + '<input type="text" id="tokLastName" class="form-control wiz-input" placeholder="Doe"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Email <span class="text-danger">*</span></label>'
        + '<input type="email" id="tokEmail" class="form-control wiz-input" placeholder="john@example.com"></div>'
        + '<button class="wiz-btn w-100" id="tokenStoreBtn" onclick="submitTokenStore()">'
        + '<i class="bi bi-shield-check me-2"></i>Store Card &amp; Pay</button>'
        + '<div id="tokenResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitTokenStore() {
    var btn = document.getElementById('tokenStoreBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Storing card...';

    var req = {
        cardNumber: document.getElementById('tokCardNumber').value.trim(),
        expirationMonth: document.getElementById('tokExpMonth').value.trim(),
        expirationYear: document.getElementById('tokExpYear').value.trim(),
        securityCode: document.getElementById('tokCvv').value.trim(),
        firstName: document.getElementById('tokFirstName').value.trim(),
        lastName: document.getElementById('tokLastName').value.trim(),
        email: document.getElementById('tokEmail').value.trim()
    };

    callApi('/api/tokens/customers', 'POST', req).then(function(result) {
        if (result.ok && result.data.transactionId) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Charging token...';
            var customerId = result.data.transactionId;
            return callApi('/api/tokens/pay', 'POST', {
                customerId: customerId,
                amount: parseFloat(getTotal().toFixed(2)),
                currency: 'ZAR'
            }).then(function(payResult) {
                showTokenResult(payResult, customerId);
            });
        } else {
            showTokenResult(result, null);
        }
    });
}

function showTokenResult(result, customerId) {
    var el = document.getElementById('tokenResult');
    el.style.display = 'block';
    var btn = document.getElementById('tokenStoreBtn');
    if (result.ok) {
        el.innerHTML = '<div class="alert alert-success">'
            + '<strong>' + esc(result.data.status) + '</strong> — ' + esc(result.data.message)
            + (result.data.transactionId ? '<br><small>Transaction: ' + esc(result.data.transactionId) + '</small>' : '')
            + (customerId ? '<br><small>Customer ID: ' + esc(customerId) + '</small>' : '')
            + '</div>';
        btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Payment Complete';
    } else {
        el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Store Card &amp; Pay';
    }
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
        + '<p class="text-muted" style="font-size:.9rem;">A secure hosted payment link will be created.</p>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="linkDesc" class="form-control wiz-input" value="CyberShop Payment" placeholder="Payment description"></div>'
        + '<button class="wiz-btn w-100" id="linkBtn" onclick="submitPaymentLink()">'
        + '<i class="bi bi-link-45deg me-2"></i>Create Payment Link</button>'
        + '<div id="linkResult" class="mt-3" style="display:none;"></div>'
        + '</div>';
}

function submitPaymentLink() {
    var btn = document.getElementById('linkBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating link...';

    var req = {
        description: document.getElementById('linkDesc').value.trim() || 'CyberShop Payment',
        amount: parseFloat(getTotal().toFixed(2)),
        currency: 'ZAR'
    };

    callApi('/api/payment-links', 'POST', req).then(function(result) {
        var el = document.getElementById('linkResult');
        el.style.display = 'block';
        if (result.ok) {
            el.innerHTML = '<div class="alert alert-success">'
                + '<strong>' + esc(result.data.status) + '</strong> — ' + esc(result.data.message)
                + (result.data.transactionId ? '<br><small>Link ID: ' + esc(result.data.transactionId) + '</small>' : '')
                + '</div>';
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Link Created';
        } else {
            el.innerHTML = '<div class="alert alert-danger"><strong>Error</strong> — ' + esc(result.data.message || 'Unknown error') + '</div>';
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-link-45deg me-2"></i>Create Payment Link';
        }
    });
}

function wizardBack() {
    window.location.href = '/cart';
}

// --- init ---

document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });
