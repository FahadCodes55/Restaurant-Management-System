let kdsTickets = [];

if (typeof realDatabaseOrders !== 'undefined' && realDatabaseOrders.length > 0) {
    kdsTickets = realDatabaseOrders.map(order => {

        let formattedItems = [];
        if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
            formattedItems = order.order_items.map(i => ({
                name: i.name || i.title || "Item",
                qty: i.qty || i.quantity || 1
            }));
        } else {
            formattedItems = [{ name: "Standard Kitchen Order", qty: 1 }];
        }

        let dbStatus = String(order.status || "").toLowerCase().trim();
        let uiStatus = "queued";

        if (dbStatus === "prep" || dbStatus === "in-preparation" || dbStatus === "cooking") {
            uiStatus = "prep";
        }

        let initialElapsed = 0;
        if (order.created_at) {
            const createdTime = new Date(order.created_at).getTime();
            const now = new Date().getTime();
            initialElapsed = Math.floor((now - createdTime) / 1000);
            if (initialElapsed < 0) initialElapsed = 0;
        }

        return {
            id: `TICK-${order.id}`,
            dbId: order.id,
            origin: order.dining_table || "Takeaway",
            type: order.fulfillment_type || "Dine-In",
            items: formattedItems,
            notes: order.customer_name ? `Customer: ${order.customer_name}` : "",
            targetMinutes: 15,
            elapsedSeconds: initialElapsed,
            status: uiStatus,
            isSupplemental: order.is_supplemental || false,
        };
    });
}

// Render Kitchen Tickets
function renderTickets() {
    const container = document.getElementById('ticketsContainer');
    if (!container) return;
    container.innerHTML = '';

    let prepCount = 0;
    let pendingCount = 0;

    kdsTickets.forEach((ticket, idx) => {
        if (ticket.status === 'prep') prepCount++;
        if (ticket.status === 'queued') pendingCount++;

        const totalTargetSec = ticket.targetMinutes * 60;
        const isLate = ticket.elapsedSeconds >= totalTargetSec;

        const mins = Math.floor(ticket.elapsedSeconds / 60);
        const secs = ticket.elapsedSeconds % 60;
        const formattedTime = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const card = document.createElement('div');
        card.className = `kds-ticket ${isLate ? 'urgent' : ''} ${ticket.status === 'ready' ? 'ready' : ''}`;

        let itemsHtml = ticket.items.map(item => `
            <li>
                <span>${item.name}</span>
                <strong style="color:var(--accent-amber);">x${item.qty}</strong>
            </li>
        `).join('');

        const supplementalBadge = ticket.isSupplemental
            ? `<span style="background: #f59e0b; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600;">ADD-ON</span>`
            : '';

        card.innerHTML = `
            <div>
                <div class="ticket-header">
                    <div>
                        <span class="ticket-table-tag">${ticket.origin}</span>
                        ${supplementalBadge}
                        <div style="margin-top: 4px;"><span class="ticket-channel">${ticket.type}</span></div>
                    </div>
                    <div class="ticket-timer-badge ${isLate ? 'late' : ''}">
                        ${formattedTime} / ${ticket.targetMinutes}m
                    </div>
                </div>

                <ul class="ticket-items-list">
                    ${itemsHtml}
                </ul>

                ${ticket.notes ? `<div class="ticket-notes"><strong>Note:</strong> ${ticket.notes}</div>` : ''}
            </div>

            <div class="ticket-footer-actions">
                ${ticket.status === 'queued'
                    ? `<form action="/order-prep/${ticket.dbId}/" method="POST" style="margin: 0; width: 100%;">
                           <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken') || ''}">
                           <button type="submit" class="btn-kds prep" style="width: 100%;">Start Cooking</button>
                       </form>`
                    : `<form action="/order_complete/${ticket.dbId}/" method="POST" style="margin: 0; width: 100%;">
                           <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken') || ''}">
                           <button type="submit" class="btn-kds complete" style="width: 100%;">Mark Ready</button>
                       </form>`
                }
            </div>
        `;
        container.appendChild(card);
    });

    const pendingElem = document.getElementById('kdsPendingCount');
    const prepElem = document.getElementById('kdsPrepCount');
    if (pendingElem) pendingElem.innerText = pendingCount;
    if (prepElem) prepElem.innerText = prepCount;
}

// Timer for visual elapsed time tracking
setInterval(() => {
    kdsTickets.forEach(t => {
        if (t.status !== 'ready') {
            t.elapsedSeconds += 1;
        }
    });
    renderTickets();
}, 1000);

function updateTicketStatus(index, newStatus) {
    kdsTickets[index].status = newStatus;
    renderTickets();
}

// Helper to grab Django CSRF token for secure form posts
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Render Floor Seating Monitor (Pulls from Admin floor data if present)
function renderFloorPanel() {
    const tables = (typeof realDatabaseTables !== 'undefined' && realDatabaseTables.length > 0)
        ? realDatabaseTables
        : [{ name: "No Tables Registered", status: "available", party: "Please add in Admin" }];

    const grid = document.getElementById('kdsFloorGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let occupiedCount = 0;

    tables.forEach(t => {
        const isOccupied = (t.status === 'occupied');
        if (isOccupied) occupiedCount++;

        const el = document.createElement('div');
        el.className = `kds-floor-card ${isOccupied ? 'occupied' : 'free'}`;
        el.innerHTML = `
            <strong>${t.name}</strong>
            <span>${isOccupied ? '🍽️ Dining' : '🟢 Sanitized'}</span>
            <span style="font-size: 10px; opacity: 0.8;">${t.party || 'Empty'}</span>
        `;
        grid.appendChild(el);
    });

    const activeDineElem = document.getElementById('kdsActiveDineCount');
    if (activeDineElem) {
        activeDineElem.innerText = `${occupiedCount} Tables Dining`;
    }
}

function logoutKitchen() {
    window.location.href = "/";
}

// Initial Run
renderTickets();
renderFloorPanel();