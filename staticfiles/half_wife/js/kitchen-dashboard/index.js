const rawData = JSON.parse(document.getElementById('menu-data').textContent);

let menuList = rawData.map(item => ({
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    category: item.category,
    desc: item.desc || '',
    tag: item.tag || '',
    status: item.status || 'Available',
    img: item.img ? item.img : 'https://via.placeholder.com/150'
}));

function initDynamicFilters() {
    const container = document.getElementById('dynamicFiltersContainer');
    if (!container) return;

    // Extract unique categories from menuList
    const categories = [...new Set(menuList.map(d => d.category))];

    // Build the "All Menu" button dynamically with the true database count
    let html = `<button class="filter-pill active" onclick="setPosFilter(this, 'all')">All Menu (${menuList.length})</button>`;

    categories.forEach(cat => {
        if (cat) {
            html += `<button class="filter-pill" onclick="setPosFilter(this, '${cat.replace(/'/g, "\\'")}')">${cat}</button>`;
        }
    });

    container.innerHTML = html;
}

// Ensure current state initializes with the 24-item dataset
//let storedMenu = JSON.parse(localStorage.getItem('halfWifeAdminMenu'));
//if (!storedMenu || storedMenu.length < 10) {
//localStorage.setItem('halfWifeAdminMenu', JSON.stringify(defaultDishes));
//storedMenu = defaultDishes;
//}

//let menuList = storedMenu;
let currentFilter = 'all';
let activeOrder = [];

// Floor Table Setup
function initTables() {

//const tableSelect = document.getElementById('posTableSelect');
//const adminTables = JSON.parse(localStorage.getItem('halfWifeAdminTables')) || [
//    { name: "Table 01", type: "Dine-In" },
//    { name: "Table 02", type: "Dine-In" },
//    { name: "Booth 03", type: "Booth" },
//    { name: "Table 04", type: "VIP Corner" },
//    { name: "Terrace T1", type: "Outdoor" },
//    { name: "Terrace T2", type: "Outdoor" },
//    { name: "Takeaway #01", type: "Express Counter" }
//];

//tableSelect.innerHTML = adminTables.map(t =>
//    `<option value="${t.name}">${t.name} (${t.type})</option>`
//).join('');
//
updateTicketHeader();
}

// Helper to scroll carousel left or right
function scrollCarousel(catIndex, direction) {
const track = document.getElementById(`carousel-track-${catIndex}`);
if (track) {
    const scrollAmount = 260 * 2; // scroll 2 cards per click
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}
}

// Render POS Menu Grid (Grouped with Arrow Navs)
function renderMenuCatalog() {
const container = document.getElementById('posCatalogContainer');
const searchVal = document.getElementById('posSearchInput').value.toLowerCase().trim();
container.innerHTML = '';

const filtered = menuList.filter(d => {
    const matchesFilter = (currentFilter === 'all' || d.category === currentFilter);
    const matchesSearch = d.name.toLowerCase().includes(searchVal) || (d.desc && d.desc.toLowerCase().includes(searchVal));
    return matchesFilter && matchesSearch;
});

if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94A3B8; padding: 48px 0; font-size: 14px;">No dishes found matching your selection.</div>`;
    return;
}

const categories = {};
filtered.forEach(dish => {
    if (!categories[dish.category]) {
        categories[dish.category] = [];
    }
    categories[dish.category].push(dish);
});

Object.keys(categories).forEach((catName, catIdx) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'pos-category-group';
    groupEl.setAttribute('data-category', catName);

    const titleRow = document.createElement('div');
    titleRow.className = 'pos-category-title-row';
    titleRow.innerHTML = `
        <div class="pos-category-heading">
            <span>${catName}</span>
            <span class="pos-category-count">${categories[catName].length} items</span>
        </div>
    `;

    // Outer container with navigation arrows
    const carouselOuter = document.createElement('div');
    carouselOuter.className = 'pos-carousel-outer';

    carouselOuter.innerHTML = `
        <button type="button" class="pos-carousel-arrow left" onclick="scrollCarousel(${catIdx}, -1)" aria-label="Scroll Left">❮</button>
        <div class="pos-category-row-grid" id="carousel-track-${catIdx}"></div>
        <button type="button" class="pos-carousel-arrow right" onclick="scrollCarousel(${catIdx}, 1)" aria-label="Scroll Right">❯</button>
    `;

    const rowGrid = carouselOuter.querySelector(`#carousel-track-${catIdx}`);

    categories[catName].forEach(dish => {
        const isSoldOut = dish.status && dish.status.toLowerCase() === 'sold out';
        const card = document.createElement('div');
        card.className = `pos-dish-card ${isSoldOut ? 'sold-out' : ''}`;
        card.innerHTML = `
            <div class="pos-dish-img-box">
                <img src="${dish.img}" alt="${dish.name}" loading="lazy">
                ${isSoldOut ? `<span class="pos-dish-badge out-of-stock">Sold Out</span>` : (dish.tag ? `<span class="pos-dish-badge">${dish.tag}</span>` : '')}
            </div>
            <div class="pos-dish-info">
                <span class="pos-dish-title">${dish.name}</span>
                <p class="pos-dish-desc">${dish.desc || ''}</p>
                <span class="pos-dish-price">PKR ${dish.price.toFixed(2)}</span>
            </div>
            <button class="pos-add-btn" onclick="addItemToTicket('${dish.name.replace(/'/g, "\\'")}', ${dish.price})" ${isSoldOut ? 'disabled' : ''}>
                ${isSoldOut ? 'Unavailable' : '+ Tap to Order'}
            </button>
        `;
        rowGrid.appendChild(card);
    });

    groupEl.appendChild(titleRow);
    groupEl.appendChild(carouselOuter);
    container.appendChild(groupEl);
});
}

function setPosFilter(btn, category) {
document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
currentFilter = category;

renderMenuCatalog();

if (category !== 'all') {
    const targetSection = document.querySelector(`.pos-category-group[data-category="${category}"]`);
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
}

function filterPosDishes() {
    renderMenuCatalog();
    }

// Helper to grab CSRF token from cookies for Django security
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

// Updated sendTicketToKitchen to save order items & table into Django session
function sendTicketToKitchen() {
    if (activeOrder.length === 0) {
        alert("Please select at least one dish before checking out.");
        return;
    }

    // Safely look for either posTableSelect or custAddress
    const tableElement = document.getElementById('posTableSelect') || document.getElementById('custAddress');
    const selectedTable = tableElement ? tableElement.value : 'Main Dining Hall';

    // Send order data to Django session via fetch before changing pages
    fetch('/save-order-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            order_items: activeOrder,
            selected_table: selectedTable
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = "/checkout/";
        } else {
            alert('Failed to save order session on server.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the order. Check console.');
    });
}

function addItemToTicket(dishName, price) {
    const existing = activeOrder.find(item => item.name === dishName);
    if (existing) {
        existing.qty += 1;
    } else {
        activeOrder.push({
            name: dishName,
            price: price,
            qty: 1,
            sentToKitchen: false
        });
    }
    renderTicket();
    saveOrderStorage();
    if (window.innerWidth <= 640) {
        toggleMobileTicket(true);
    }
}

function changeQty(index, delta) {
    activeOrder[index].qty += delta;
    if (activeOrder[index].qty <= 0) {
        activeOrder.splice(index, 1);
    }
    renderTicket();
    saveOrderStorage(); // <-- Add this line
}

function renderTicket() {
const container = document.getElementById('posTicketList');
container.innerHTML = '';

let itemCount = 0;
let subtotal = 0;

if (activeOrder.length === 0) {
    container.innerHTML = `
        <div style="text-align: center; color: #94A3B8; padding: 40px 0; font-size: 13px;">
            No dishes selected.<br>Tap any dish on the menu to add.
        </div>
    `;
} else {
    activeOrder.forEach((item, idx) => {
    itemCount += item.qty;
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    const row = document.createElement('div');
    row.className = 'pos-order-row';
    row.innerHTML = `
        <div class="pos-order-item-info">
            <span class="pos-order-item-name" title="${item.name}">${item.name}</span>
            <span class="pos-order-item-unit">PKR ${item.price.toFixed(2)} each</span>
        </div>
        <div class="pos-qty-controls">
            <button type="button" class="btn-pos-step" onclick="changeQty(${idx}, -1)">−</button>
            <span class="pos-qty-num">${item.qty}</span>
            <button type="button" class="btn-pos-step" onclick="changeQty(${idx}, 1)">+</button>
        </div>
        <span class="pos-order-item-total">PKR ${itemTotal.toFixed(2)}</span>
    `;
    container.appendChild(row);
});
}

const tax = subtotal * 0.05;
const total = subtotal + tax;

document.getElementById('posSubtotal').innerText = `PKR ${subtotal.toFixed(2)}`;
document.getElementById('posTax').innerText = `PKR ${tax.toFixed(2)}`;
document.getElementById('posTotal').innerText = `PKR ${total.toFixed(2)}`;

// Sync Mobile Sticky Bar
document.getElementById('mobileItemCount').innerText = itemCount;
document.getElementById('mobileBarTotal').innerText = `PKR ${total.toFixed(2)}`;
}

function updateTicketHeader() {
const table = document.getElementById('posTableSelect').value;
document.getElementById('ticketTableLabel').innerText = table;
}

function clearTicket() {
    if (activeOrder.length === 0) return;
    if (confirm("Clear and reset current table order?")) {
        activeOrder = [];
        renderTicket();
        saveOrderStorage();
    }
}

function saveOrderStorage() {
    localStorage.setItem('activeOrder', JSON.stringify(activeOrder));
}

function sendAddOnToKitchen() {
    let activeOrder = JSON.parse(localStorage.getItem('activeOrder') || '[]');
    let newAddons = activeOrder.filter(item => !item.sentToKitchen);

    if (newAddons.length === 0) {
        alert("No new items to add. All items are already synced with the kitchen.");
        return;
    }

    const tableSelect = document.getElementById('posTableSelect');
    const currentTable = tableSelect && tableSelect.value ? tableSelect.value : 'Table 01';

    const addOnOrderId = 'HW-' + Math.floor(100000 + Math.random() * 900000);
    const supplementalTicket = {
        orderId: addOnOrderId,
        table: currentTable,
        type: "SUPPLEMENTAL ADD-ON",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: newAddons
    };

    let kitchenQueue = JSON.parse(localStorage.getItem('halfWifeKitchenQueue')) || [];
    kitchenQueue.push(supplementalTicket);
    localStorage.setItem('halfWifeKitchenQueue', JSON.stringify(kitchenQueue));
    fetch('/save-order-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            order_items: newAddons,
            selected_table: currentTable,
            order_id: addOnOrderId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            activeOrder.forEach(item => item.sentToKitchen = true);
            localStorage.setItem('activeOrder', JSON.stringify(activeOrder));

            window.location.href = "/checkout/";
        } else {
            alert('Failed to save add-on session on server.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while dispatching the add-on.');
    });
}

// MOBILE DRAWER TOGGLE (FIXED: Tolerates absent backdrop gracefully)
function toggleMobileTicket(show) {
const sidebar = document.getElementById('posTicketSidebar');
const backdrop = document.getElementById('posMobileBackdrop');
if (!sidebar) return;

if (show) {
    sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
} else {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}
}

// Initialize view
initTables();
initDynamicFilters();
renderMenuCatalog();