/**
 * CyberSource Demo - Common UI Utilities
 */

async function callApi(url, method, body) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        const data = await res.json();
        return { ok: res.ok, data };
    } catch (err) {
        return { ok: false, data: { status: 'ERROR', message: err.message } };
    }
}

function showResult(containerId, result) {
    const el = document.getElementById(containerId);
    el.style.display = 'block';
    const d = result.data;
    if (result.ok) {
        let html = '<div class="alert alert-success mb-0">'
            + '<div class="d-flex justify-content-between align-items-start">'
            + '<div><strong class="fs-5">' + esc(d.status) + '</strong>'
            + '<p class="mb-1">' + esc(d.message) + '</p></div>'
            + '<span class="badge bg-success">HTTP ' + d.httpStatus + '</span></div>';
        if (d.transactionId) {
            html += '<div class="mt-2 p-2 bg-light border rounded d-flex align-items-center gap-2">'
                + '<code class="flex-grow-1" style="word-break:break-all">' + esc(d.transactionId) + '</code>'
                + '<button class="btn btn-sm btn-outline-secondary copy-btn" data-copy="' + esc(d.transactionId) + '">Copy</button></div>';
        }
        if (d.details) {
            var entries = Object.entries(d.details).filter(function(e) { return e[1] !== null && e[1] !== ''; });
            if (entries.length > 0) {
                html += '<div class="mt-2"><small>';
                entries.forEach(function(e) {
                    html += '<strong>' + esc(e[0]) + ':</strong> <code>' + esc(String(e[1])) + '</code><br>';
                });
                html += '</small></div>';
            }
        }
        html += '</div>';
        el.innerHTML = html;
    } else {
        var errHtml = '<div class="alert alert-danger mb-0">'
            + '<strong>Error</strong> &mdash; ' + esc(d.message || 'Unknown error');
        if (d.details && d.details.responseBody) {
            errHtml += '<pre class="mt-2 p-2 bg-light border rounded mb-0" style="white-space:pre-wrap;font-size:0.85em">'
                + esc(d.details.responseBody) + '</pre>';
        }
        errHtml += '</div>';
        el.innerHTML = errHtml;
    }

    el.querySelectorAll('.copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            navigator.clipboard.writeText(btn.dataset.copy);
            btn.textContent = 'Copied!';
            setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
        });
    });
}

function esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function setLoading(btn, loading) {
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processing...';
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText;
    }
}
