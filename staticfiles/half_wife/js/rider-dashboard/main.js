// 1. Read real data injected strictly from Django templates
let fleet = (typeof realDatabaseRiders !== 'undefined' && realDatabaseRiders.length > 0)
    ? realDatabaseRiders
    : [];

let readyOrders = (typeof realDatabaseReadyOrders !== 'undefined' && realDatabaseReadyOrders.length > 0)
    ? realDatabaseReadyOrders
    : [];

// Rely purely on Django database data—no local session storage ghost data
let activeDeliveries = (typeof realDatabaseActiveDeliveries !== 'undefined' && realDatabaseActiveDeliveries.length > 0)
    ? realDatabaseActiveDeliveries
    : [];

function saveData() {
    // Instead of using sessionStorage, reload the page so it fetches the fresh state from Django
    location.reload();
}

function renderAll() {
    renderRiders();
    renderDispatch();
    renderTracking();
}

// 1. Render Active Riders (Updated to handle database property names)
function renderRiders() {
    const container = document.getElementById('ridersListContainer');
    if (!container) return;
    container.innerHTML = '';

    let idleCount = 0;
    fleet.forEach(rider => {
        const isOnDuty = rider.status.toLowerCase() === 'on duty' || rider.status.toLowerCase() === 'ready' || rider.status.toLowerCase() === 'idle';
        if (isOnDuty) idleCount++;

        const initials = rider.name.split(' ').map(n => n[0]).join('').substring(0, 2);

        const card = document.createElement('div');
        card.className = `rider-card ${isOnDuty ? 'idle' : 'busy'}`;
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="rider-avatar-bubble">${initials}</div>
                <div>
                    <strong style="display: block; font-size: 13px; color: #000;">${rider.name}</strong>
                    <span style="font-size: 11px; color: #000;">🛵 ${rider.role || 'Fleet Courier'}</span>
                </div>
            </div>
            <span class="status-pill ${isOnDuty ? 'available' : 'sold-out'}" style="font-size: 10px;">
                ${isOnDuty ? '● Ready' : '○ En Route'}
            </span>
        `;
        container.appendChild(card);
    });

    const activeCountElem = document.getElementById('activeRidersCount');
    if (activeCountElem) activeCountElem.innerText = `${idleCount} Available`;
}

// 2. Render Order Dispatch Center
function renderDispatch() {
    const container = document.getElementById('dispatchOrdersContainer');
    if (!container) return;
    container.innerHTML = '';

    if (readyOrders.length === 0) {
        container.innerHTML = `<div style="font-size: 13px; color: #64748b; text-align: center; padding: 24px;">No packed orders waiting for pickup.</div>`;
        return;
    }

    readyOrders.forEach((order, index) => {
    // ✅ Only 'completed' means food is ready to hand to a rider
    const canDispatch = order.status === 'completed';

    const idleRiders = fleet.filter(r =>
        r.status.toLowerCase() === 'on duty' ||
        r.status.toLowerCase() === 'ready' ||
        r.status.toLowerCase() === 'idle'
    );

    const card = document.createElement('div');
    card.className = 'dispatch-ticket';

    let riderOptions = idleRiders.map(r =>
        `<option value="${r.name}">${r.name} (${r.role || 'Courier'})</option>`
    ).join('');
    if (idleRiders.length === 0) {
        riderOptions = `<option value="">No idle couriers available</option>`;
    }

    // Status badge reflects the kitchen state
    let statusBadge = '';
    if (order.status === 'ready') {
        statusBadge = `<span style="font-size:10px; background:#6b7280; color:#fff; padding:2px 8px; border-radius:4px; margin-left:6px;">⏳ Not Started</span>`;
    } else if (order.status === 'prep') {
        statusBadge = `<span style="font-size:10px; background:#f59e0b; color:#fff; padding:2px 8px; border-radius:4px; margin-left:6px;">🍳 Cooking…</span>`;
    } else if (order.status === 'completed') {
        statusBadge = `<span style="font-size:10px; background:#10b981; color:#fff; padding:2px 8px; border-radius:4px; margin-left:6px;">✅ Ready to Dispatch</span>`;
    }

    // Button label reflects state
    let buttonLabel = 'Dispatch';
    if (order.status === 'ready') buttonLabel = 'Not Started';
    else if (order.status === 'prep') buttonLabel = 'Cooking…';

    const buttonDisabled = (!canDispatch || idleRiders.length === 0) ? 'disabled' : '';

    card.innerHTML = `
        <div class="dispatch-ticket-head">
            <div>
                <strong style="color: #38bdf8; font-family: monospace;">${order.id}</strong>
                ${statusBadge}
                <div style="font-size: 12px; color: #000; margin-top: 2px;">📍 ${order.address}</div>
            </div>
            <span style="font-size: 13px; font-weight: 700; color: #10b981;">${order.total}</span>
        </div>

        <div style="font-size: 12px; color: #000;">📦 ${order.items}</div>

        <div class="dispatch-assign-row">
            <select class="dispatch-select" id="riderSelect-${index}" ${canDispatch ? '' : 'disabled'}>
                ${riderOptions}
            </select>
            <button class="btn-primary"
                    style="padding: 6px 12px; font-size: 12px;"
                    onclick="assignOrder(${index})"
                    ${buttonDisabled}>
                ${buttonLabel}
            </button>
        </div>
    `;
    container.appendChild(card);
});
}

// Assign Order to Selected Rider
function assignOrder(orderIndex) {
    const order = readyOrders[orderIndex];

    const select = document.getElementById(`riderSelect-${orderIndex}`);
    const riderName = select.value;
    if (!riderName) return;

    fetch('/dispatch-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            orderId: order.id,
            riderName: riderName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const rider = fleet.find(r => r.name === riderName);
            if (rider) {
                rider.status = 'busy';
            }

            activeDeliveries.unshift({
                orderId: order.id,
                riderName: riderName,
                address: order.address,
                status: 'picked-up',
                estTime: '15 mins'
            });

            readyOrders.splice(orderIndex, 1);
            saveData();
        } else {
            // If the kitchen changed the status or it's out of sync, alert and reload automatically to pull fresh data
            alert(data.message);
            location.reload();
        }
    })
    .catch(error => {
        console.error('Dispatch Error:', error);
        alert('Failed to connect to dispatch server.');
    });
}


function markOrderReady(orderId) {
    // 1. Send the updated status to your Django backend
    fetch('/update-order-status/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            orderId: orderId,
            status: 'ready'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 2. Once saved successfully in the database, reload or update the UI
            location.reload();
        } else {
            alert('Failed to update status: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
}

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

// 3. Render Delivery Status Tracker
function renderTracking() {
    const container = document.getElementById('trackingContainer');
    if (!container) return;
    container.innerHTML = '';

    const transitCountElem = document.getElementById('inTransitCount');
    if (transitCountElem) transitCountElem.innerText = `${activeDeliveries.length} Active`;

    if (activeDeliveries.length === 0) {
        container.innerHTML = `<div style="font-size: 13px; color: #64748b; text-align: center; padding: 24px;">No active orders on the road right now.</div>`;
        return;
    }

    activeDeliveries.forEach((del, idx) => {
        const card = document.createElement('div');
        card.className = 'tracking-card';

        const isPicked = del.status === 'picked-up';
        const isOnWay = del.status === 'on-the-way';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #000; font-size: 14px;">${del.orderId}</strong>
                    <div style="font-size: 12px; color: #38bdf8;">🛵 ${del.riderName}</div>
                </div>
                <span style="font-size: 11px; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                    ${del.estTime}
                </span>
            </div>

            <div style="font-size: 12px; color: #000;">📍 ${del.address}</div>

            <div class="tracker-timeline">
                <div class="timeline-step done">Kitchen Packed</div>
                <div class="timeline-step ${isPicked ? 'active' : 'done'}">Courier Picked Up</div>
                <div class="timeline-step ${isOnWay ? 'active' : ''}">On The Way to Doorstep</div>
            </div>

            <div style="display: flex; gap: 8px;">
                ${isPicked
                    ? `<button class="btn-kds prep" style="font-size: 11px; padding: 6px;" onclick="advanceDelivery(${idx}, 'on-the-way')">Mark On The Way</button>`
                    : `<button class="btn-kds complete" style="font-size: 11px; padding: 6px;" onclick="advanceDelivery(${idx}, 'delivered')">Mark Delivered</button>`
                }
            </div>
        `;
        container.appendChild(card);
    });
}

// Advance Delivery Timeline & Free Up Rider (Updated to sync with Django backend)
function advanceDelivery(index, nextStatus) {
    const del = activeDeliveries[index];

    // Send update request to Django backend API
    fetch('/update-delivery-status/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            orderId: del.orderId,
            status: nextStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            if (nextStatus === 'delivered') {
                const rider = fleet.find(r => r.name === del.riderName);
                if (rider) {
                    rider.status = 'On Duty';
                }
                alert(`Order [${del.orderId}] has been successfully delivered by ${del.riderName}!`);
                activeDeliveries.splice(index, 1);
            } else {
                del.status = nextStatus;
                del.estTime = '5 mins';
            }
            saveData();
        } else {
            alert('Failed to update delivery status: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Delivery Status Update Error:', error);
        alert('Failed to connect to server.');
    });
}

function logoutRider() {
    window.location.href = "portal-login.html";
}

// Initialize All Modules
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
});