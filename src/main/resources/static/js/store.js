// store.js — cart, products and checkout wizard

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
    if (clean.length < 4) return '****';
    return '**** **** **** ' + clean.slice(-4);
}

function maskPhone(phone) {
    if (!phone || phone.length < 4) return phone || '';
    return '***' + phone.slice(-4);
}

function detectCardBrand(num) {
    var n = (num || '').replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^6(?:011|5)/.test(n)) return 'discover';
    return n.length > 0 ? 'unknown' : '';
}

function cardBrandHtml(brand) {
    if (!brand) return '';
    var labels = { visa: 'VISA', mastercard: 'MC', amex: 'AMEX', discover: 'DISC', unknown: '?' };
    return '<span class="card-brand-badge ' + brand + '">' + (labels[brand] || '') + '</span>';
}

function updateCardBrand(inputId, targetId) {
    var input = document.getElementById(inputId);
    var target = document.getElementById(targetId);
    if (input && target) target.innerHTML = cardBrandHtml(detectCardBrand(input.value));
}

function generateOrderNumber() { return 'CS-' + Date.now(); }
function generateTrackingNumber() { return '' + Math.floor(10000000000 + Math.random() * 90000000000); }

function futureDate(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

function goToCheckout(method) {
    if (getCartCount() === 0) return;
    window.location.href = '/checkout?method=' + method;
}

// --- checkout wizard ---

var W = {
    method: 'card',
    step: 1,
    contact: { email: '', phone: '' },
    payment: {},
    billing: { firstName: '', lastName: '', country: 'South Africa', address: '', apt: '', city: '', state: '', zip: '' },
    shipping: { firstName: '', lastName: '', country: 'South Africa', address: '', apt: '', city: '', state: '', zip: '' },
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

// step 1: contact

function renderContactForm() {
    return '<div class="wiz-card">'
        + '<div class="wiz-label">CONTACT DETAILS</div>'
        + '<div class="mb-3">'
        + '<label class="wiz-field-label">Email <span class="text-danger">*</span></label>'
        + '<input type="email" id="contactEmail" class="form-control wiz-input" value="' + esc(W.contact.email) + '" placeholder="you@example.com" required>'
        + '</div>'
        + '<div class="mb-3">'
        + '<label class="wiz-field-label">Phone number <span class="text-danger">*</span></label>'
        + '<input type="tel" id="contactPhone" class="form-control wiz-input" value="' + esc(W.contact.phone) + '" placeholder="e.g. 082 123 4567" required>'
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
        + '<div style="font-size:.95rem;">' + esc(maskPhone(W.contact.phone)) + '</div>'
        + '</div>';
}

function continueContact() {
    var email = document.getElementById('contactEmail').value.trim();
    var phone = document.getElementById('contactPhone').value.trim();
    if (!email) { document.getElementById('contactEmail').focus(); return; }
    if (!phone) { document.getElementById('contactPhone').focus(); return; }
    W.contact.email = email;
    W.contact.phone = phone;
    W.step = 2;
    renderWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// step 2: payment

function renderPaymentForm() {
    var html = '';

    if (W.method === 'card') {
        html += renderCardForm();
        html += renderBillingForm();
        html += renderShippingForm();
    } else if (W.method === 'wallet') {
        html += renderWalletForm();
        html += renderBillingForm();
        html += renderShippingForm();
    } else if (W.method === 'eft') {
        html += renderEftForm();
        html += renderBillingForm();
        html += renderShippingForm();
    } else if (W.method === 'token') {
        html += renderTokenForm();
        html += renderBillingForm();
        html += renderShippingForm();
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
        + '<label class="wiz-field-label">Card number <span class="text-danger">*</span></label>'
        + '<div class="input-group">'
        + '<input type="text" id="payCardNumber" class="form-control wiz-input" value="' + esc(pay.cardNumber || '') + '" placeholder="Card number" maxlength="19" autocomplete="cc-number" oninput="updateCardBrand(\'payCardNumber\',\'cardBrandTag\')">'
        + '<span class="input-group-text" id="cardBrandTag">' + (cardBrandHtml(detectCardBrand(pay.cardNumber || '')) || '<i class="bi bi-credit-card-2-back"></i>') + '</span>'
        + '</div></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">CVV <span class="text-danger">*</span></label>'
        + '<input type="password" id="payCvv" class="form-control wiz-input" value="' + esc(pay.cvv || '') + '" maxlength="4" placeholder="***" autocomplete="cc-csc">'
        + '<div class="form-text" style="font-size:.75rem;">3 or 4 digits</div></div>'
        + '</div>'
        + '<div class="row g-3 mb-2">'
        + '<div class="col-6"><label class="wiz-field-label">First name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || '') + '" placeholder="First name"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payLastName" class="form-control wiz-input" value="' + esc(pay.lastName || '') + '" placeholder="Last name"></div>'
        + '</div></div>';
}

function renderWalletForm() {
    var pay = W.payment;
    var sel = pay.walletType || 'GOOGLE_PAY';
    return '<div class="wiz-card">'
        + '<div class="wiz-label">WALLET DETAILS</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Choose Wallet</label>'
        + '<div class="wallet-tiles">'
        + '<div class="wallet-tile google-pay' + (sel === 'GOOGLE_PAY' ? ' selected' : '') + '" onclick="selectWallet(\'GOOGLE_PAY\',this)">'
        + '<span class="wallet-icon"><i class="bi bi-google"></i></span>Google Pay</div>'
        + '<div class="wallet-tile apple-pay' + (sel === 'APPLE_PAY' ? ' selected' : '') + '" onclick="selectWallet(\'APPLE_PAY\',this)">'
        + '<span class="wallet-icon"><i class="bi bi-apple"></i></span>Apple Pay</div>'
        + '<div class="wallet-tile samsung-pay' + (sel === 'SAMSUNG_PAY' ? ' selected' : '') + '" onclick="selectWallet(\'SAMSUNG_PAY\',this)">'
        + '<span class="wallet-icon"><i class="bi bi-phone"></i></span>Samsung Pay</div>'
        + '</div>'
        + '<input type="hidden" id="payWalletType" value="' + sel + '">'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Card number <span class="text-danger">*</span></label>'
        + '<div class="input-group">'
        + '<input type="text" id="payWalletToken" class="form-control wiz-input" value="' + esc(pay.tokenData || '') + '" placeholder="Card number" maxlength="19" oninput="updateCardBrand(\'payWalletToken\',\'walletBrandTag\')">'
        + '<span class="input-group-text" id="walletBrandTag">' + (cardBrandHtml(detectCardBrand(pay.tokenData || '')) || '<i class="bi bi-credit-card-2-back"></i>') + '</span>'
        + '</div></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payWalletExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '') + '</select></div>'
        + '<div class="col-6"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payWalletExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '') + '</select></div>'
        + '</div>'
        + '</div>';
}

function selectWallet(type, el) {
    var tiles = el.parentNode.querySelectorAll('.wallet-tile');
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.remove('selected');
    el.classList.add('selected');
    document.getElementById('payWalletType').value = type;
    W.payment.walletType = type;
}

function renderEftForm() {
    var pay = W.payment;
    return '<div class="wiz-card">'
        + '<div class="wiz-label">BANK ACCOUNT DETAILS</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">Routing Number (ABA) <span class="text-danger">*</span></label>'
        + '<input type="text" id="payRouting" class="form-control wiz-input" value="' + esc(pay.routingNumber || '') + '" placeholder="9 digits"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Account Number <span class="text-danger">*</span></label>'
        + '<input type="text" id="payAccount" class="form-control wiz-input" value="' + esc(pay.accountNumber || '') + '" placeholder="Account number"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Account Type</label>'
        + '<select id="payAccountType" class="form-select wiz-input">'
        + '<option value="C"' + (pay.accountType === 'C' || !pay.accountType ? ' selected' : '') + '>Checking</option>'
        + '<option value="S"' + (pay.accountType === 'S' ? ' selected' : '') + '>Savings</option>'
        + '</select></div>'
        + '<div class="row g-3 mb-2">'
        + '<div class="col-6"><label class="wiz-field-label">First name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payEftFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || '') + '" placeholder="First name"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payEftLastName" class="form-control wiz-input" value="' + esc(pay.lastName || '') + '" placeholder="Last name"></div>'
        + '</div></div>';
}

function renderTokenForm() {
    var pay = W.payment;
    if (W.savedCustomerId) {
        return '<div class="wiz-card">'
            + '<div class="wiz-label">SAVED CARD</div>'
            + '<div class="d-flex align-items-center gap-3 py-2">'
            + '<i class="bi bi-check-circle-fill text-success fs-4"></i>'
            + '<div><div class="fw-semibold">Card saved</div>'
            + '<div class="text-muted" style="font-size:.9rem;">' + maskCard(W.payment.cardNumber) + '</div></div>'
            + '</div></div>';
    }
    return '<div class="wiz-card">'
        + '<div class="wiz-label">SAVE YOUR CARD</div>'
        + '<p class="text-muted" style="font-size:.9rem;">Save your card details to skip this step next time.</p>'
        + '<div class="mb-3"><label class="wiz-field-label">Card number <span class="text-danger">*</span></label>'
        + '<div class="input-group">'
        + '<input type="text" id="payTokenCard" class="form-control wiz-input" value="' + esc(pay.cardNumber || '') + '" placeholder="Card number" maxlength="19" autocomplete="cc-number" oninput="updateCardBrand(\'payTokenCard\',\'tokenBrandTag\')">'
        + '<span class="input-group-text" id="tokenBrandTag">' + (cardBrandHtml(detectCardBrand(pay.cardNumber || '')) || '<i class="bi bi-credit-card-2-back"></i>') + '</span>'
        + '</div></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-4"><label class="wiz-field-label">Expiry month</label>'
        + '<select id="payTokenExpMonth" class="form-select wiz-input">' + monthOptions(pay.expMonth || '') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">Expiry year</label>'
        + '<select id="payTokenExpYear" class="form-select wiz-input">' + yearOptions(pay.expYear || '') + '</select></div>'
        + '<div class="col-4"><label class="wiz-field-label">CVV</label>'
        + '<input type="password" id="payTokenCvv" class="form-control wiz-input" value="' + esc(pay.cvv || '') + '" maxlength="4" placeholder="***" autocomplete="cc-csc">'
        + '<div class="form-text" style="font-size:.75rem;">3 or 4 digits</div></div>'
        + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payTokenFirstName" class="form-control wiz-input" value="' + esc(pay.firstName || '') + '" placeholder="First name"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name <span class="text-danger">*</span></label>'
        + '<input type="text" id="payTokenLastName" class="form-control wiz-input" value="' + esc(pay.lastName || '') + '" placeholder="Last name"></div>'
        + '</div>'
        + '<button class="wiz-btn w-100" id="btnSaveCard" onclick="saveCardToken()">'
        + '<i class="bi bi-lock-fill me-1"></i> Save Card</button>'
        + '<div id="tokenError" class="mt-2"></div>'
        + '</div>';
}

function renderInvoiceForm() {
    var pay = W.payment;
    var due = new Date(); due.setDate(due.getDate() + 14);
    return '<div class="wiz-card">'
        + '<div class="wiz-label">INVOICE DETAILS</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Description</label>'
        + '<input type="text" id="payInvoiceDesc" class="form-control wiz-input" value="' + esc(pay.description || '') + '" placeholder="Order description"></div>'
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
        + '<input type="text" id="payLinkDesc" class="form-control wiz-input" value="' + esc(pay.description || '') + '" placeholder="Payment description"></div>'
        + '<div class="form-text">A hosted payment URL will be generated.</div>'
        + '</div>';
}

function renderAddressForm(prefix, label, data) {
    return '<div class="wiz-card mt-3">'
        + '<div class="wiz-label">' + label + '</div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First name <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'FirstName" class="form-control wiz-input" value="' + esc(data.firstName) + '" placeholder="First name"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'LastName" class="form-control wiz-input" value="' + esc(data.lastName) + '" placeholder="Last name"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Country</label>'
        + '<select id="' + prefix + 'Country" class="form-select wiz-input">'
        + '<option' + (data.country === 'South Africa' ? ' selected' : '') + '>South Africa</option>'
        + '<option' + (data.country === 'USA' ? ' selected' : '') + '>USA</option>'
        + '<option' + (data.country === 'United Kingdom' ? ' selected' : '') + '>United Kingdom</option>'
        + '</select></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Address <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'Address" class="form-control wiz-input" value="' + esc(data.address) + '" placeholder="Street address"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Apartment, suite, floor etc</label>'
        + '<input type="text" id="' + prefix + 'Apt" class="form-control wiz-input" value="' + esc(data.apt) + '" placeholder="Optional"></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">City <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'City" class="form-control wiz-input" value="' + esc(data.city) + '" placeholder="City"></div>'
        + '<div class="col-6"><label class="wiz-field-label">State / Province <span class="text-danger">*</span></label>'
        + '<select id="' + prefix + 'State" class="form-select wiz-input">' + provinceOptions(data.state) + '</select></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Postal Code <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'Zip" class="form-control wiz-input" value="' + esc(data.zip) + '" placeholder="Postal code"></div>'
        + '</div>';
}

function renderBillingForm() {
    return renderAddressForm('billing', 'BILLING ADDRESS', W.billing);
}

function renderShippingForm() {
    return '<div class="wiz-card mt-3">'
        + '<div class="d-flex justify-content-between align-items-center">'
        + '<div class="wiz-label mb-0">SHIPPING ADDRESS</div>'
        + '</div>'
        + '<div class="form-check mt-2 mb-3">'
        + '<input class="form-check-input" type="checkbox" id="shippingSame"' + (W.shippingSame ? ' checked' : '') + ' onchange="toggleShipping()">'
        + '<label class="form-check-label" for="shippingSame">Same as billing address</label>'
        + '</div>'
        + '<div id="shippingFields" style="' + (W.shippingSame ? 'display:none' : '') + '">'
        + renderAddressFields('shipping', W.shipping)
        + '</div></div>';
}

function renderAddressFields(prefix, data) {
    return '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">First name <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'FirstName" class="form-control wiz-input" value="' + esc(data.firstName) + '" placeholder="First name"></div>'
        + '<div class="col-6"><label class="wiz-field-label">Last name <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'LastName" class="form-control wiz-input" value="' + esc(data.lastName) + '" placeholder="Last name"></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Country</label>'
        + '<select id="' + prefix + 'Country" class="form-select wiz-input">'
        + '<option' + (data.country === 'South Africa' ? ' selected' : '') + '>South Africa</option>'
        + '<option' + (data.country === 'USA' ? ' selected' : '') + '>USA</option>'
        + '<option' + (data.country === 'United Kingdom' ? ' selected' : '') + '>United Kingdom</option>'
        + '</select></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Address <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'Address" class="form-control wiz-input" value="' + esc(data.address) + '" placeholder="Street address"></div>'
        + '<div class="mb-3"><label class="wiz-field-label">Apartment, suite, floor etc</label>'
        + '<input type="text" id="' + prefix + 'Apt" class="form-control wiz-input" value="' + esc(data.apt) + '" placeholder="Optional"></div>'
        + '<div class="row g-3 mb-3">'
        + '<div class="col-6"><label class="wiz-field-label">City <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'City" class="form-control wiz-input" value="' + esc(data.city) + '" placeholder="City"></div>'
        + '<div class="col-6"><label class="wiz-field-label">State / Province <span class="text-danger">*</span></label>'
        + '<select id="' + prefix + 'State" class="form-select wiz-input">' + provinceOptions(data.state) + '</select></div>'
        + '</div>'
        + '<div class="mb-3"><label class="wiz-field-label">Postal Code <span class="text-danger">*</span></label>'
        + '<input type="text" id="' + prefix + 'Zip" class="form-control wiz-input" value="' + esc(data.zip) + '" placeholder="Postal code"></div>';
}

function toggleShipping() {
    var same = document.getElementById('shippingSame').checked;
    document.getElementById('shippingFields').style.display = same ? 'none' : '';
}

function renderPaymentSummary() {
    var summary = '';
    if (W.method === 'card') {
        var cardBrand = cardBrandHtml(detectCardBrand(W.payment.cardNumber));
        summary = '<div class="d-flex align-items-center gap-2">' + (cardBrand || '<i class="bi bi-credit-card-2-front fs-5"></i>') + ' <span>' + maskCard(W.payment.cardNumber) + '</span></div>';
    } else if (W.method === 'wallet') {
        var wNames = { GOOGLE_PAY: 'Google Pay', APPLE_PAY: 'Apple Pay', SAMSUNG_PAY: 'Samsung Pay' };
        var walletBrand = cardBrandHtml(detectCardBrand(W.payment.tokenData));
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-wallet2 fs-5"></i> <span>' + (wNames[W.payment.walletType] || 'Wallet') + ' — ' + maskCard(W.payment.tokenData) + '</span> ' + walletBrand + '</div>';
    } else if (W.method === 'eft') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-bank fs-5"></i> <span>Account ending in ' + (W.payment.accountNumber || '').slice(-4) + '</span></div>';
    } else if (W.method === 'token') {
        var tokenBrand = cardBrandHtml(detectCardBrand(W.payment.cardNumber));
        summary = '<div class="d-flex align-items-center gap-2">' + (tokenBrand || '<i class="bi bi-shield-check fs-5"></i>') + ' <span>Saved card — ' + maskCard(W.payment.cardNumber) + '</span></div>';
    } else if (W.method === 'invoice') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-receipt fs-5"></i> <span>Invoice</span></div>';
    } else if (W.method === 'paymentLink') {
        summary = '<div class="d-flex align-items-center gap-2"><i class="bi bi-link-45deg fs-5"></i> <span>Payment Link</span></div>';
    }

    var html = '<div class="wiz-card wiz-summary">'
        + '<div class="d-flex justify-content-between align-items-start">'
        + '<div class="wiz-label mb-0">PAYMENT DETAILS</div>'
        + '<a class="wiz-edit" onclick="editStep(2)">Edit</a></div>'
        + '<div class="mt-2">' + summary + '</div></div>';

    // billing summary
    if (W.method === 'card' || W.method === 'eft' || W.method === 'wallet' || W.method === 'token') {
        var b = W.billing;
        html += '<div class="wiz-card wiz-summary">'
            + '<div class="d-flex justify-content-between align-items-start">'
            + '<div class="wiz-label mb-0">BILLING ADDRESS</div>'
            + '<a class="wiz-edit" onclick="editStep(2)">Edit</a></div>'
            + '<div class="mt-2" style="font-size:.95rem;">'
            + esc(b.firstName) + ' ' + esc(b.lastName) + '<br>'
            + esc(b.address) + (b.apt ? ', ' + esc(b.apt) : '') + '<br>'
            + esc(b.city) + ', ' + esc(b.state) + ' ' + esc(b.zip)
            + '</div></div>';

        var s = W.shippingSame ? b : W.shipping;
        html += '<div class="wiz-card wiz-summary">'
            + '<div class="d-flex justify-content-between align-items-start">'
            + '<div class="wiz-label mb-0">SHIPPING ADDRESS</div>'
            + '<a class="wiz-edit" onclick="editStep(2)">Edit</a></div>'
            + '<div class="mt-2" style="font-size:.95rem;">'
            + (W.shippingSame ? '<span class="text-muted">Same as billing</span>' :
                esc(s.firstName) + ' ' + esc(s.lastName) + '<br>'
                + esc(s.address) + (s.apt ? ', ' + esc(s.apt) : '') + '<br>'
                + esc(s.city) + ', ' + esc(s.state) + ' ' + esc(s.zip))
            + '</div></div>';
    }

    return html;
}

// save step 2 data

function saveAddressFromForm(prefix) {
    return {
        firstName: document.getElementById(prefix + 'FirstName').value.trim(),
        lastName: document.getElementById(prefix + 'LastName').value.trim(),
        country: document.getElementById(prefix + 'Country').value,
        address: document.getElementById(prefix + 'Address').value.trim(),
        apt: document.getElementById(prefix + 'Apt').value.trim(),
        city: document.getElementById(prefix + 'City').value.trim(),
        state: document.getElementById(prefix + 'State').value,
        zip: document.getElementById(prefix + 'Zip').value.trim()
    };
}

function continuePayment() {
    if (W.method === 'card') {
        var cn = document.getElementById('payCardNumber').value.trim();
        if (!cn) { document.getElementById('payCardNumber').focus(); return; }
        W.payment = {
            cardNumber: cn,
            expMonth: document.getElementById('payExpMonth').value,
            expYear: document.getElementById('payExpYear').value,
            cvv: document.getElementById('payCvv').value,
            firstName: document.getElementById('payFirstName').value.trim(),
            lastName: document.getElementById('payLastName').value.trim()
        };
        W.billing = saveAddressFromForm('billing');
        W.shippingSame = document.getElementById('shippingSame').checked;
        if (!W.shippingSame) W.shipping = saveAddressFromForm('shipping');
    } else if (W.method === 'wallet') {
        var wt = document.getElementById('payWalletToken').value.trim();
        if (!wt) { document.getElementById('payWalletToken').focus(); return; }
        W.payment = {
            walletType: document.getElementById('payWalletType').value,
            tokenData: wt,
            expMonth: document.getElementById('payWalletExpMonth').value,
            expYear: document.getElementById('payWalletExpYear').value
        };
        W.billing = saveAddressFromForm('billing');
        W.shippingSame = document.getElementById('shippingSame').checked;
        if (!W.shippingSame) W.shipping = saveAddressFromForm('shipping');
    } else if (W.method === 'eft') {
        W.payment = {
            routingNumber: document.getElementById('payRouting').value.trim(),
            accountNumber: document.getElementById('payAccount').value.trim(),
            accountType: document.getElementById('payAccountType').value,
            firstName: document.getElementById('payEftFirstName').value.trim(),
            lastName: document.getElementById('payEftLastName').value.trim()
        };
        W.billing = saveAddressFromForm('billing');
        W.shippingSame = document.getElementById('shippingSame').checked;
        if (!W.shippingSame) W.shipping = saveAddressFromForm('shipping');
    } else if (W.method === 'token') {
        if (!W.savedCustomerId) { return; }
        W.billing = saveAddressFromForm('billing');
        W.shippingSame = document.getElementById('shippingSame').checked;
        if (!W.shippingSame) W.shipping = saveAddressFromForm('shipping');
    } else if (W.method === 'invoice') {
        W.payment = {
            description: document.getElementById('payInvoiceDesc').value.trim(),
            dueDate: document.getElementById('payInvoiceDue').value
        };
    } else if (W.method === 'paymentLink') {
        W.payment = {
            description: document.getElementById('payLinkDesc').value.trim()
        };
    }

    W.step = 3;
    renderWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveCardToken() {
    var btn = document.getElementById('btnSaveCard');
    var cn = document.getElementById('payTokenCard').value.trim();
    if (!cn) { document.getElementById('payTokenCard').focus(); return; }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    var cvv = document.getElementById('payTokenCvv') ? document.getElementById('payTokenCvv').value.trim() : '';
    W.payment = {
        cardNumber: cn,
        expMonth: document.getElementById('payTokenExpMonth').value,
        expYear: document.getElementById('payTokenExpYear').value,
        cvv: cvv,
        firstName: document.getElementById('payTokenFirstName').value.trim(),
        lastName: document.getElementById('payTokenLastName').value.trim()
    };

    var body = {
        cardNumber: W.payment.cardNumber,
        expirationMonth: W.payment.expMonth,
        expirationYear: W.payment.expYear,
        firstName: W.payment.firstName,
        lastName: W.payment.lastName,
        email: W.contact.email
    };
    if (cvv) body.securityCode = cvv;
    callApi('/api/tokens/customers', 'POST', body).then(function(result) {
        if (result.ok && result.data.transactionId) {
            W.savedCustomerId = result.data.transactionId;
            renderWizard();
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Save Card';
            document.getElementById('tokenError').innerHTML =
                '<div class="alert alert-danger py-2 small">' + esc(result.data.message || 'Failed to save card') + '</div>';
        }
    });
}

// step 3: review

function renderReview() {
    var html = '';

    html += '<div class="wiz-card">'
        + '<div class="form-check">'
        + '<input class="form-check-input" type="checkbox" id="saveInfoCheck">'
        + '<label class="form-check-label" for="saveInfoCheck">Remember my details</label>'
        + '</div></div>';

    html += '<div class="wiz-card">'
        + '<div class="wiz-label">CONFIRM</div>'
        + '<p class="text-center text-muted mb-3">Please review your details before continuing.</p>'
        + '<button class="wiz-btn w-100" id="confirmBtn" onclick="submitPayment()">'
        + '<i class="bi bi-lock-fill me-2"></i>' + esc(METHOD_LABELS[W.method] || 'Pay Now')
        + '</button></div>';

    return html;
}

// submit

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
            cryptogram: 'none',
            amount: parseFloat(total.toFixed(2)),
            currency: 'ZAR'
        });
    } else if (W.method === 'eft') {
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

    // clear sensitive data from memory after submitting
    var cardNum = W.payment.cardNumber;
    var cvv = W.payment.cvv;

    promise.then(function(result) {
        // wipe PAN and CVV from state immediately
        if (W.payment.cardNumber) W.payment.cardNumber = maskCard(cardNum);
        delete W.payment.cvv;

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

// confirmation page

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

    html += '<div class="row g-4">';
    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Order Details</h6>'
        + '<div class="text-muted small">Order Number: <span class="text-dark">' + orderNum + '</span></div>'
        + '<div class="text-muted small">Total: <span class="text-dark fw-semibold">' + fmt(getTotal()) + '</span></div>'
        + '</div>';

    var shipAddr = W.shippingSame ? W.billing : W.shipping;
    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Shipping Address</h6>'
        + '<div class="text-muted small">' + esc(shipAddr.firstName) + ' ' + esc(shipAddr.lastName) + '</div>'
        + '<div class="text-muted small">' + esc(shipAddr.address) + '</div>'
        + '<div class="text-muted small">' + esc(shipAddr.city) + ', ' + esc(shipAddr.state) + ' ' + esc(shipAddr.zip) + '</div>'
        + '<div class="text-muted small mt-1">Tracking: <span class="text-dark">' + trackingNum + '</span></div>'
        + '</div>';

    html += '<div class="col-md-4">'
        + '<h6 class="fw-bold">Payment</h6>'
        + '<div class="text-muted small">Status: <span class="text-success fw-semibold">' + esc(data.status || 'AUTHORIZED') + '</span></div>';
    if (data.transactionId) {
        html += '<div class="text-muted small">Reference: <span class="text-dark">' + esc(data.transactionId) + '</span></div>';
    }
    html += '<div class="text-muted small">Method: <span class="text-dark">' + esc(METHOD_LABELS[W.method] || W.method) + '</span></div>';
    html += '</div></div>';

    html += '<hr class="my-4">';
    html += '<div class="text-center"><a href="/" class="btn btn-accent px-5 py-2" onclick="clearCart()">Continue Shopping</a></div>';

    document.getElementById('confirmationContent').innerHTML = html;
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// form helpers

function monthOptions(selected) {
    var html = '<option value="">Month</option>';
    for (var m = 1; m <= 12; m++) {
        var val = (m < 10 ? '0' : '') + m;
        html += '<option value="' + val + '"' + (val === selected ? ' selected' : '') + '>' + val + '</option>';
    }
    return html;
}

function yearOptions(selected) {
    var html = '<option value="">Year</option>';
    var now = new Date().getFullYear();
    for (var y = now; y <= now + 15; y++) {
        html += '<option value="' + y + '"' + ('' + y === selected ? ' selected' : '') + '>' + y + '</option>';
    }
    return html;
}

function provinceOptions(selected) {
    var provinces = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
    var html = '<option value="">Select province</option>';
    for (var i = 0; i < provinces.length; i++) {
        html += '<option' + (provinces[i] === selected ? ' selected' : '') + '>' + provinces[i] + '</option>';
    }
    return html;
}

// --- init ---

document.addEventListener('DOMContentLoaded', function() { updateCartBadge(); });
