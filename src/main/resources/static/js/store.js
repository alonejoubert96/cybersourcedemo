/**
 * CyberShop — Store, Cart & Checkout Wizard
 */

// ══════════════════════════════════════════
// SECTION 1: Products & Cart
// ══════════════════════════════════════════

var PRODUCTS = [
    { id: 1, name: 'Wireless Headphones', price: 79.99, icon: 'bi-headphones', color: '#6f42c1', desc: 'Premium noise-cancelling over-ear headphones with 30hr battery' },
    { id: 2, name: 'Smart Watch',         price: 199.99, icon: 'bi-smartwatch',  color: '#0d6efd', desc: 'Fitness tracking, heart rate monitor, GPS and notifications' },
    { id: 3, name: 'Laptop Stand',        price: 49.99,  icon: 'bi-laptop',      color: '#198754', desc: 'Ergonomic aluminum adjustable stand for any laptop' },
    { id: 4, name: 'USB-C Hub',           price: 39.99,  icon: 'bi-usb-drive',   color: '#dc3545', desc: '7-in-1 multiport adapter: HDMI, USB 3.0, SD, ethernet' },
    { id: 5, name: 'Mechanical Keyboard', price: 129.99, icon: 'bi-keyboard',    color: '#fd7e14', desc: 'RGB backlit hot-swappable switches, full-size layout' },
    { id: 6, name: 'Portable Charger',    price: 29.99,  icon: 'bi-battery-charging', color: '#20c997', desc: '20,000mAh fast-charging power bank with dual USB-C' }
];

var TAX_RATE = 0.08;

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

// ══════════════════════════════════════════
// SECTION 2: Utilities
// ══════════════════════════════════════════

function esc(str) { if (!str) return ''; var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function callApi(url, method, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res) {
        return res.json().then(function(data) { return { ok: res.ok, data: data }; });
    }).catch(function(err) { return { ok: false, data: { status: 'ERROR', message: err.message } }; });
}

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

function maskEmail(email) {
    if (!email) return '';
    var parts = email.split('@');
    if (parts.length !== 2) return email;
    var local = parts[0];
    return local.substring(0, Math.min(2, local.length)) + '***@' + parts[1];
}

function maskCard(num) {
    if (!num) return '';
    var clean = num.replace(/\s/g, '');
    return '.... ' + clean.slice(-4);
}

function generateOrderNumber() { return 'CS-' + Date.now(); }
function generateTrackingNumber() { return '' + Math.floor(10000000000 + Math.random() * 90000000000); }

function futureDate(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ══════════════════════════════════════════
// SECTION 3: Product Grid (index.html)
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// SECTION 4: Cart Page (cart.html)
// ══════════════════════════════════════════

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

function goToCheckout(method) {
    if (getCartCount() === 0) return;
    window.location.href = '/checkout?method=' + method;
}

// ══════════════════════════════════════════
// SECTION 5: Checkout Wizard (checkout.html)
// ══════════════════════════════════════════

var W = {
    method: 'card',
    step: 1,
    contact: { email: 'customer@example.com', phone: '0821234567' },
    payment: {},
    billing: { firstName: 'Viktor', lastName: 'Vaughn', country: 'South Africa', address: '123 Main Street', apt: '', city: 'Cape Town', state: 'Western Cape', zip: '8001' },
    shippingSame: true,
    savedCustomerId: null,
    apiResult: null
};

var METHOD_LABELS = {
    card: 'Card Payment', wallet: 'Digital Wallet', eft: 'Bank Transfer',
    token: 'Saved Card', invoice: 'Pay by Invoice', paymentLink: 'Payment Link'
};

function initCheckout() {
    var params = new URLSearchParams(window.location.search);
    W.method = params.get('method') || 'card';
    W.step = 1;
    W.savedCustomerId = null;
    W.apiResult = null;
    if (getCartCount() === 0) { window.location.href = '/cart'; return; }
    renderWizard();
    updateCartBadge();
}

function renderWizard() {
    var html = '';

    // Step 1: Contact Details
    if (W.step === 1) {
        html += renderContactForm();
    } else {
        html += renderContactSummary();
    }

    // Step 2: Payment Details (visible from step 2 onward)
    if (W.step >= 2) {
        if (W.step === 2) {
            html += renderPaymentForm();
        } else {
            html += renderPaymentSummary();
        }
    }

    // Step 3: Review & Confirm
    if (W.step >= 3) {
        html += renderReview();
    }

    document.getElementById('wizardContent').innerHTML = html;
}

function wizardBack() {
    if (W.step > 1) { W.step--; renderWizard(); }
    else { window.location.href = '/cart'; }
}

function editStep(step) {
    W.step = step;
    renderWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 1: Contact Details ──

function renderContactForm() {
    return '<div class="wiz-card">'
        + '<div class="wiz-label">CONTACT DETAILS</div>'
        + '<div class="mb-3">'
        + '<label class="wiz-field-label">Email</label>'
        + '<input type="email" id="contactEmail" class="form-control wiz-input" value="' + esc(W.contact.email) + '">'
        + '</div>'
        + '<div class="mb-3">'
        + '<label class="wiz-field-label">Phone number</label>'
        + '<input type="tel" id="contactPhone" class="form-control wiz-input" value="' + esc(W.contact.phone) + '">'
        + '</div>'
        + '<div class="text-center mt-4">'
        + '<button class="wiz-btn" onclick="continueContact()">Continue</button>'
        + '</div>'
        + '</div>';
}

function renderContactSummary() {
    return '<div class="wiz-card wiz-summary">'
        + '<div class="d-flex justify-content-between align-items-start">'
        + '<div class="wiz-label mb-0">CONTACT DETAILS</div>'
        + '<a class="wiz-edit" onclick="editStep(1)">Edit</a>'
        + '</div>'
        + '<div class="mt-2" style="font-size:.95rem;">' + esc(maskEmail(W.contact.email)) + '</div>'
        + '<div style="font-size:.95rem;">' + esc(W.contact.phone) + '</div>'
        + '</div>';
}

function continueContact() {
    var email = document.getElementById('contactEmail').value.trim();
    var phone = document.getElementById('contactPhone').value.trim();
    if (!email) { document.getElementById('contactEmail').focus(); return; }
    W.contact.email = email;
    W.contact.phone = phone;
    W.step = 2;
    renderWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 2: Payment Details ──

function renderPaymentForm() {
    var html = '';

    if (W.method === 'card') {
        html += renderCardForm();
        html += renderBillingForm();
    } else if (W.method === 'wallet') {
        html += renderWalletForm();
    } else if (W.method === 'eft') {
        html += renderEftForm();
        html += renderBillingForm();
    } else if (W.method === 'token') {
        html += renderTokenForm();
    } else if (W.method === 'invoice') {
        html += renderInvoiceForm();
    } else if (W.method === 'paymentLink') {
        html += renderPaymentLinkForm();
    }

    html += '<div class="text-center mt-4">'
        + '<button class="wiz-btn" id="step2ContinueBtn" onclick="continuePayment()">Continue</button>'
        + '</div>';

    return html;
}

function renderCardForm() {
    var pay = W.payment;
    return '<div class="wiz-card">'
        + '<div class="wiz-label">PAYMENT DETAILS</div>'
        + '<div class="mb-3">'
        + '<label class="wiz-field-label">Card number</label>'
        + '<div class="input-group">'
        + '<input type="text" id="payCardNumber" class="form-control wiz-input" value="' + esc(pay.cardNumber || '4111111111111111') + '" placeholder="13 to 20 digits" maxlength="19">'
        + '<span class="input-group-text"><i class="bi bi-credit-card-2-back"></i></span>'
        + '</div></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '12') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '2031') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">Security code</label>'
        + '<input type="text" id="payCvv" class="form-control wiz-input" value="' + esc(pay.cvv || '123') + '" maxlength="4">'
        + '<div class="form-text" style="font-size:.75rem;">3 digits on back of card</div></div>'
        + '</div>'
        + '<div class="row g-3 mb-2">'
        + '<div class="col-6"><label class="wiz-field-label">First name</label>'
        + '<input type="text" id="payFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || W.billing.firstName) + '"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name</label>'
        + '<input type="text" id="payLastName" class="form-control wiz-input" value="' + esc(pay.lastName || W.billing.lastName) + '"></div>'
        + '</div></div>';
}

function renderWalletForm() {
    var pay = W.payment;
    return '<div class="wiz-card">'
        + '<div class="wiz-label">WALLET DETAILS</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Wallet Provider</label>'
        + '<select id="payWalletType" class="form-select wiz-input">'
        + '<option value="GOOGLE_PAY"' + (pay.walletType === 'GOOGLE_PAY' ? ' selected' : '') + '>Google Pay</option>'
        + '<option value="APPLE_PAY"' + (pay.walletType === 'APPLE_PAY' ? ' selected' : '') + '>Apple Pay</option>'
        + '<option value="SAMSUNG_PAY"' + (pay.walletType === 'SAMSUNG_PAY' ? ' selected' : '') + '>Samsung Pay</option>'
        + '</select></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Token Data (DPAN)</label>'
        + '<input type="text" id="payWalletToken" class="form-control wiz-input" value="' + esc(pay.tokenData || '4111111111111111') + '">'
        + '<div class="form-text">In production this comes from the wallet SDK.</div></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payWalletExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '12') + '</select></div>'
        + '<div class="col-6"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payWalletExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '2026') + '</select></div>'
        + '</div>'
        + '<div class="mb-2"><label class="wiz-field-label">Cryptogram</label>'
        + '<input type="text" id="payWalletCrypto" class="form-control wiz-input" value="' + esc(pay.cryptogram || 'EHuWW9PiBkWvqE5juRwDzAUFBAk=') + '"></div>'
        + '</div>';
}

function renderEftForm() {
    var pay = W.payment;
    return '<div class="wiz-card">'
        + '<div class="wiz-label">BANK ACCOUNT DETAILS</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Routing Number (ABA)</label>'
        + '<input type="text" id="payRouting" class="form-control wiz-input" value="' + esc(pay.routingNumber || '121042882') + '"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Account Number</label>'
        + '<input type="text" id="payAccount" class="form-control wiz-input" value="' + esc(pay.accountNumber || '4100') + '"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Account Type</label>'
        + '<select id="payAccountType" class="form-select wiz-input">'
        + '<option value="C"' + (pay.accountType === 'C' || !pay.accountType ? ' selected' : '') + '>Checking</option>'
        + '<option value="S"' + (pay.accountType === 'S' ? ' selected' : '') + '>Savings</option>'
        + '</select></div>'
        + '<div class="row g-3 mb-2">'
        + '<div class="col-6"><label class="wiz-field-label">First name</label>'
        + '<input type="text" id="payEftFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || W.billing.firstName) + '"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name</label>'
        + '<input type="text" id="payEftLastName" class="form-control wiz-input" value="' + esc(pay.lastName || W.billing.lastName) + '"></div>'
        + '</div></div>';
}

function renderTokenForm() {
    var pay = W.payment;
    if (W.savedCustomerId) {
        return '<div class="wiz-card">'
            + '<div class="wiz-label">SAVED CARD</div>'
            + '<div class="d-flex align-items-center gap-3 py-2">'
            + '<i class="bi bi-check-circle-fill text-success fs-4"></i>'
            + '<div><div class="fw-semibold">Card saved successfully</div>'
            + '<div class="text-muted" style="font-size:.9rem;">Customer ID: <code>' + esc(W.savedCustomerId) + '</code></div></div>'
            + '</div></div>';
    }
    return '<div class="wiz-card">'
        + '<div class="wiz-label">SAVE YOUR CARD</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Securely save your card for this and future payments.</p>'
        + '<div class="mb-3"><label class="wiz-field-label">Card number</label>'
        + '<input type="text" id="payTokenCard" class="form-control wiz-input" value="' + esc(pay.cardNumber || '4111111111111111') + '"></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payTokenExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '12') + '</select></div>'
        + '<div class="col-6"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payTokenExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '2031') + '</select></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First name</label>'
        + '<input type="text" id="payTokenFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || W.billing.firstName) + '"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name</label>'
        + '<input type="text" id="payTokenLastName" class="form-control wiz-input" value="' + esc(pay.lastName || W.billing.lastName) + '"></div>'
        + '</div>'
        + '<button class="wiz-btn w-100" id="btnSaveCard" onclick="saveCardToken()">'
        + '<i class="bi bi-shield-plus me-1"></i> Save Card Securely</button>'
        + '<div id="tokenError" class="mt-2"></div>'
        + '</div>';
}

function renderInvoiceForm() {
    var pay = W.payment;
    var due = new Date(); due.setDate(due.getDate() + 14);
    return '<div class="wiz-card">'
        + '<div class="wiz-label">INVOICE DETAILS</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="payInvoiceDesc" class="form-control wiz-input" value="' + esc(pay.description || 'CyberShop order') + '"></div>'
        + '<div class="mb-2"><label class="wiz-field-label">Due Date</label>'
        + '<input type="date" id="payInvoiceDue" class="form-control wiz-input" value="' + esc(pay.dueDate || due.toISOString().split('T')[0]) + '"></div>'
        + '<div class="form-text">An invoice will be created and sent to your email.</div>'
        + '</div>';
}

function renderPaymentLinkForm() {
    var pay = W.payment;
    return '<div class="wiz-card">'
        + '<div class="wiz-label">PAYMENT LINK DETAILS</div>'
        + '<div class="mb-2"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="payLinkDesc" class="form-control wiz-input" value="' + esc(pay.description || 'CyberShop order') + '"></div>'
        + '<div class="form-text">A shareable hosted payment URL will be generated.</div>'
        + '</div>';
}

function renderBillingForm() {
    var b = W.billing;
    return '<div class="wiz-card mt-3">'
        + '<div class="wiz-label">BILLING ADDRESS</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Country</label>'
        + '<select id="billingCountry" class="form-select wiz-input">'
        + '<option' + (b.country === 'South Africa' ? ' selected' : '') + '>South Africa</option>'
        + '<option' + (b.country === 'USA' ? ' selected' : '') + '>USA</option>'
        + '<option' + (b.country === 'United Kingdom' ? ' selected' : '') + '>United Kingdom</option>'
        + '</select></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Address</label>'
        + '<input type="text" id="billingAddress" class="form-control wiz-input" value="' + esc(b.address) + '"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Apartment, suite, floor etc</label>'
        + '<input type="text" id="billingApt" class="form-control wiz-input" value="' + esc(b.apt) + '"></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">City</label>'
        + '<input type="text" id="billingCity" class="form-control wiz-input" value="' + esc(b.city) + '"></div>'
        + '<div class="col-6"><label class="wiz-field-label">State / Province</label>'
        + '<select id="billingState" class="form-select wiz-input">' + provinceOptions(b.state) + '</select></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Zip Code</label>'
        + '<input type="text" id="billingZip" class="form-control wiz-input" value="' + esc(b.zip) + '"></div>'
        + '<div class="form-check">'
        + '<input class="form-check-input" type="checkbox" id="shippingSame"' + (W.shippingSame ? ' checked' : '') + '>'
        + '<label class="form-check-label" for="shippingSame">Shipping address is same as billing</label>'
        + '</div></div>';
}

function renderPaymentSummary() {
    var summary = '';
    if (W.method === 'card') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-credit-card-2-front fs-5"></i> <span>' + maskCard(W.payment.cardNumber) + '</span></div>';
    } else if (W.method === 'wallet') {
        var wNames = { GOOGLE_PAY: 'Google Pay', APPLE_PAY: 'Apple Pay', SAMSUNG_PAY: 'Samsung Pay' };
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-wallet2 fs-5"></i> <span>' + (wNames[W.payment.walletType] || 'Wallet') + '</span></div>';
    } else if (W.method === 'eft') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-bank fs-5"></i> <span>Account ending in ' + (W.payment.accountNumber || '').slice(-4) + '</span></div>';
    } else if (W.method === 'token') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-shield-check fs-5"></i> <span>Saved card &mdash; ' + maskCard(W.payment.cardNumber) + '</span></div>';
    } else if (W.method === 'invoice') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-receipt fs-5"></i> <span>Invoice &mdash; ' + esc(W.payment.description) + '</span></div>';
    } else if (W.method === 'paymentLink') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-link-45deg fs-5"></i> <span>Payment Link</span></div>';
    }

    var html = '<div class="wiz-card wiz-summary">'
        + '<div class="d-flex justify-content-between align-items-start">'
        + '<div class="wiz-label mb-0">PAYMENT DETAILS</div>'
        + '<a class="wiz-edit" onclick="editStep(2)">Edit</a></div>'
        + '<div class="mt-2">' + summary + '</div></div>';

    // Show shipping summary for methods with billing address
    if (W.method === 'card' || W.method === 'eft') {
        var b = W.billing;
        html += '<div class="wiz-card wiz-summary">'
            + '<div class="d-flex justify-content-between align-items-start">'
            + '<div class="wiz-label mb-0">SHIP TO</div>'
            + '<a class="wiz-edit" onclick="editStep(2)">Edit</a></div>'
            + '<div class="mt-2" style="font-size:.95rem;">'
            + esc(b.firstName) + ' ' + esc(b.lastName) + '<br>'
            + esc(b.address) + (b.apt ? ', ' + esc(b.apt) : '') + '<br>'
            + esc(b.city) + ', ' + esc(b.state) + ' ' + esc(b.zip)
            + '</div></div>';
    }

    return html;
}

// ── Step 2: Save data and continue ──

function continuePayment() {
    if (W.method === 'card') {
        W.payment = {
            cardNumber: document.getElementById('payCardNumber').value,
            expMonth: document.getElementById('payExpMonth').value,
            expYear: document.getElementById('payExpYear').value,
            cvv: document.getElementById('payCvv').value,
            firstName: document.getElementById('payFirstName').value,
            lastName: document.getElementById('payLastName').value
        };
        saveBillingFromForm();
    } else if (W.method === 'wallet') {
        W.payment = {
            walletType: document.getElementById('payWalletType').value,
            tokenData: document.getElementById('payWalletToken').value,
            expMonth: document.getElementById('payWalletExpMonth').value,
            expYear: document.getElementById('payWalletExpYear').value,
            cryptogram: document.getElementById('payWalletCrypto').value
        };
    } else if (W.method === 'eft') {
        W.payment = {
            routingNumber: document.getElementById('payRouting').value,
            accountNumber: document.getElementById('payAccount').value,
            accountType: document.getElementById('payAccountType').value,
            firstName: document.getElementById('payEftFirstName').value,
            lastName: document.getElementById('payEftLastName').value
        };
        saveBillingFromForm();
    } else if (W.method === 'token') {
        if (!W.savedCustomerId) { return; } // Must save card first
    } else if (W.method === 'invoice') {
        W.payment = {
            description: document.getElementById('payInvoiceDesc').value,
            dueDate: document.getElementById('payInvoiceDue').value
        };
    } else if (W.method === 'paymentLink') {
        W.payment = {
            description: document.getElementById('payLinkDesc').value
        };
    }

    W.step = 3;
    renderWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveBillingFromForm() {
    W.billing.country = document.getElementById('billingCountry').value;
    W.billing.address = document.getElementById('billingAddress').value;
    W.billing.apt = document.getElementById('billingApt').value;
    W.billing.city = document.getElementById('billingCity').value;
    W.billing.state = document.getElementById('billingState').value;
    W.billing.zip = document.getElementById('billingZip').value;
    W.shippingSame = document.getElementById('shippingSame').checked;
    // Sync first/last from payment form
    if (W.method === 'card') {
        W.billing.firstName = W.payment.firstName;
        W.billing.lastName = W.payment.lastName;
    } else if (W.method === 'eft') {
        W.billing.firstName = W.payment.firstName;
        W.billing.lastName = W.payment.lastName;
    }
}

function saveCardToken() {
    var btn = document.getElementById('btnSaveCard');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving card...';

    W.payment = {
        cardNumber: document.getElementById('payTokenCard').value,
        expMonth: document.getElementById('payTokenExpMonth').value,
        expYear: document.getElementById('payTokenExpYear').value,
        firstName: document.getElementById('payTokenFirstName').value,
        lastName: document.getElementById('payTokenLastName').value
    };

    callApi('/api/tokens/customers', 'POST', {
        cardNumber: W.payment.cardNumber,
        expirationMonth: W.payment.expMonth,
        expirationYear: W.payment.expYear,
        firstName: W.payment.firstName,
        lastName: W.payment.lastName,
        email: W.contact.email
    }).then(function(result) {
        if (result.ok && result.data.transactionId) {
            W.savedCustomerId = result.data.transactionId;
            renderWizard();
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-shield-plus me-1"></i> Save Card Securely';
            document.getElementById('tokenError').innerHTML =
                '<div class="alert alert-danger py-2 small">' + esc(result.data.message || 'Failed to save card') + '</div>';
        }
    });
}

// ── Step 3: Review & Confirm ──

function renderReview() {
    var html = '';

    // Save info checkbox
    html += '<div class="wiz-card">'
        + '<div class="form-check">'
        + '<input class="form-check-input" type="checkbox" id="saveInfoCheck">'
        + '<label class="form-check-label" for="saveInfoCheck">Save my information for future purchases</label>'
        + '</div></div>';

    // Confirm section
    html += '<div class="wiz-card">'
        + '<div class="wiz-label">CONFIRM</div>'
        + '<p class="text-center text-muted mb-3">Please review and confirm your payment information before you continue.</p>'
        + '<button class="wiz-btn w-100" id="confirmBtn" onclick="submitPayment()">'
        + '<i class="bi bi-lock-fill me-2"></i>' + esc(METHOD_LABELS[W.method] || 'Pay Now')
        + '</button></div>';

    return html;
}

// ── Submit Payment ──

function submitPayment() {
    var btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Processing...';

    var total = getTotal();
    var promise;

    if (W.method === 'card') {
        promise = callApi('/api/payments/card/sale', 'POST', {
            cardNumber: W.payment.cardNumber,
            expirationMonth: W.payment.expMonth,
            expirationYear: W.payment.expYear,
            securityCode: W.payment.cvv,
            firstName: W.payment.firstName,
            lastName: W.payment.lastName,
            email: W.contact.email,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        });
    } else if (W.method === 'wallet') {
        promise = callApi('/api/payments/wallet/' + W.payment.walletType, 'POST', {
            tokenData: W.payment.tokenData,
            expirationMonth: W.payment.expMonth,
            expirationYear: W.payment.expYear,
            cryptogram: W.payment.cryptogram,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        });
    } else if (W.method === 'eft') {
        // ACH/eCheck is US-only — sandbox requires USD
        promise = callApi('/api/payments/eft', 'POST', {
            routingNumber: W.payment.routingNumber,
            accountNumber: W.payment.accountNumber,
            accountType: W.payment.accountType,
            firstName: W.payment.firstName,
            lastName: W.payment.lastName,
            email: W.contact.email,
            amount: parseFloat(total.toFixed(2)),
            currency: 'USD'
        });
    } else if (W.method === 'token') {
        promise = callApi('/api/tokens/pay', 'POST', {
            customerId: W.savedCustomerId,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        });
    } else if (W.method === 'invoice') {
        promise = callApi('/api/invoices', 'POST', {
            customerEmail: W.contact.email,
            customerName: W.billing.firstName + ' ' + W.billing.lastName,
            description: W.payment.description,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR',
            dueDate: W.payment.dueDate || null
        }).then(function(result) {
            if (result.ok && result.data.transactionId) {
                return callApi('/api/invoices/' + result.data.transactionId + '/send', 'POST', {}).then(function(sendResult) {
                    if (sendResult.ok) {
                        sendResult.data.message = 'Invoice created and sent to ' + W.contact.email;
                        sendResult.data.details = sendResult.data.details || {};
                        sendResult.data.details.invoiceId = result.data.transactionId;
                    }
                    return sendResult;
                });
            }
            return result;
        });
    } else if (W.method === 'paymentLink') {
        promise = callApi('/api/payment-links', 'POST', {
            description: W.payment.description,
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        });
    }

    promise.then(function(result) {
        if (result.ok) {
            W.apiResult = result.data;
            showConfirmation();
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill me-2"></i>' + esc(METHOD_LABELS[W.method]);
            var errHtml = '<div class="alert alert-danger mt-3">'
                + '<strong>Payment Failed</strong><p class="mb-0">' + esc(result.data.message || 'An error occurred.') + '</p></div>';
            btn.insertAdjacentHTML('afterend', errHtml);
        }
    });
}

// ── Confirmation ──

function showConfirmation() {
    document.getElementById('checkoutPage').style.display = 'none';
    document.getElementById('confirmationPage').style.display = 'block';

    var cart = getCart();
    var data = W.apiResult;
    var orderNum = generateOrderNumber();
    var trackingNum = generateTrackingNumber();

    var html = '<div class="d-flex justify-content-between align-items-start mb-2">'
        + '<div><span class="fw-bold fs-4" style="color:var(--cs-primary);">CyberShop</span></div>'
        + '<span class="fs-3 fw-bold text-success">Order Received</span></div>';

    html += '<div class="text-primary mb-4">Arrives by ' + futureDate(7) + '</div>';
    html += '<hr>';

    // Items
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        html += '<div class="d-flex align-items-center gap-3 my-3">'
            + '<div class="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width:70px;height:70px;background:linear-gradient(135deg,' + item.color + ',' + item.color + 'aa);color:#fff;font-size:1.8rem;">'
            + '<i class="bi ' + item.icon + '"></i></div>'
            + '<div class="flex-grow-1">'
            + '<div class="fw-bold">' + esc(item.name) + '</div>'
            + '<div class="text-muted" style="font-size:.9rem;">' + esc(item.desc) + '</div>'
            + '<div class="text-primary" style="font-size:.9rem;">Quantity: ' + item.qty + '</div></div>'
            + '<div class="fw-bold fs-5">' + fmt(item.price * item.qty) + '</div></div>';
    }

    html += '<hr class="my-4">';

    // Three columns
    html += '<div class="row g-4">';

    // Order Details
    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Order Details</h6>'
        + '<div class="text-muted small">Order Number: <span class="text-dark">' + orderNum + '</span></div>'
        + '<div class="text-muted small">Total: <span class="text-dark fw-semibold">' + fmt(getTotal()) + '</span></div>'
        + '</div>';

    // Shipping Address
    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Shipping Address</h6>'
        + '<div class="text-muted small">Type: <span class="text-dark">Standard</span></div>'
        + '<div class="text-muted small">Tracking Number: <span class="text-dark">' + trackingNum + '</span></div>'
        + '</div>';

    // Payment Information
    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Payment Information</h6>'
        + '<div class="text-muted small">Status: <span class="text-success fw-semibold">' + esc(data.status || 'AUTHORIZED') + '</span></div>';
    if (data.transactionId) {
        html += '<div class="text-muted small">Transaction Reference #: <span class="text-dark">' + esc(data.transactionId) + '</span></div>';
    }
    if (data.details) {
        var entries = Object.entries(data.details).filter(function(e) { return e[1] !== null && e[1] !== ''; });
        for (var i = 0; i < entries.length; i++) {
            html += '<div class="text-muted small">' + esc(entries[i][0]) + ': <span class="text-dark">' + esc(String(entries[i][1])) + '</span></div>';
        }
    }
    html += '</div></div>';

    html += '<hr class="my-4">';
    html += '<div class="text-center"><a href="/" class="btn btn-accent px-5 py-2" onclick="clearCart()">Continue Shopping</a></div>';

    document.getElementById('confirmationContent').innerHTML = html;
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Form Helpers ──

function monthOptions(selected) {
    var html = '';
    for (var m = 1; m <= 12; m++) {
        var val = (m < 10 ? '0' : '') + m;
        html += '<option value="' + val + '"' + (val === selected ? ' selected' : '') + '>' + val + '</option>';
    }
    return html;
}

function yearOptions(selected) {
    var html = '';
    var now = new Date().getFullYear();
    for (var y = now; y <= now + 15; y++) {
        html += '<option value="' + y + '"' + ('' + y === selected ? ' selected' : '') + '>' + y + '</option>';
    }
    return html;
}

function provinceOptions(selected) {
    var provinces = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
    var html = '';
    for (var i = 0; i < provinces.length; i++) {
        html += '<option' + (provinces[i] === selected ? ' selected' : '') + '>' + provinces[i] + '</option>';
    }
    return html;
}

// ══════════════════════════════════════════
// SECTION 6: Init
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });
