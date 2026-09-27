let selectedPaymentMethod = 'Counter Cash';


function toggleFulfillmentFields() {
    const fulfillmentTypeElement = document.getElementById('fulfillmentType');
    if (!fulfillmentTypeElement) return;

    const fulfillmentType = fulfillmentTypeElement.value;
    const tableGroup = document.getElementById('tableSelectionGroup');
    const addressGroup = document.getElementById('addressInputGroup');
    const tableSelect = document.getElementById('custTableSelect');
    const addressInput = document.getElementById('custAddressInput');

    if (fulfillmentType === 'Delivery') {
        if (tableGroup) tableGroup.style.display = 'none';
        if (addressGroup) addressGroup.style.display = 'block';
        if (tableSelect) tableSelect.removeAttribute('required');
        if (addressInput) addressInput.setAttribute('required', 'true');
    } else {
        if (tableGroup) tableGroup.style.display = 'block';
        if (addressGroup) addressGroup.style.display = 'none';
        if (tableSelect) tableSelect.setAttribute('required', 'true');
        if (addressInput) addressInput.removeAttribute('required');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    toggleFulfillmentFields();
});

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

function setPayment(method) {
    selectedPaymentMethod = method;
    document.getElementById('selectedPaymentType').value = method;

    document.getElementById('payCounter').classList.remove('active');
    document.getElementById('payCard').classList.remove('active');
    if (method === 'Counter Cash') {
        document.getElementById('payCounter').classList.add('active');
    } else {
        document.getElementById('payCard').classList.add('active');
    }
}

function generateReceipt(event) {
    event.preventDefault();

    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            throw new Error('Server checkout failed.');
        }

        const name = document.getElementById('custName').value || 'Walk-in Guest';
        const phone = document.getElementById('custPhone').value || 'N/A';
        const fulfillment = document.getElementById('fulfillmentType').value;

        let address = 'Walk-in Table';
        if (fulfillment === 'Delivery') {
            const addressInput = document.getElementById('custAddressInput');
            address = addressInput ? addressInput.value : 'Home Delivery';
        } else {
            const tableSelect = document.getElementById('custTableSelect');
            address = tableSelect ? tableSelect.value : 'Dine-In';
        }

        const orderId = 'HW-' + (data.order_id || Math.floor(100000 + Math.random() * 900000));
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const paymentMethod = selectedPaymentMethod;

        const orderList = (typeof serverOrderItems !== 'undefined' && Array.isArray(serverOrderItems))
            ? serverOrderItems
            : [];

        let subtotal = 0;
        let itemsSummaryParts = [];
        const tableBody = document.getElementById('receiptTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';

            orderList.forEach(item => {
                const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.qty) || 1);
                subtotal += itemTotal;
                itemsSummaryParts.push(`${item.name} x${item.qty}`);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>PKR ${itemTotal.toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        const tax = subtotal * 0.05;
        const grandTotal = subtotal + tax;

        if (orderList.length > 0 && tableBody) {
            const taxRow = document.createElement('tr');
            taxRow.innerHTML = `<td><strong>5% GST Tax</strong></td><td>1</td><td>PKR ${tax.toFixed(2)}</td>`;
            tableBody.appendChild(taxRow);
        }

        const receiptInfo = document.getElementById('receiptInfo');
        if (receiptInfo) {
            receiptInfo.innerHTML = `
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>Customer:</strong> ${name} (${phone})<br>
                <strong>Location:</strong> ${address}<br>
                <strong>Fulfillment:</strong> ${fulfillment}<br>
                <strong>Payment Method:</strong> ${paymentMethod}<br>
                <strong>Timestamp:</strong> ${timestamp}
            `;
        }

        const totalPaidElem = document.getElementById('receiptTotalPaid');
        if (totalPaidElem) {
            totalPaidElem.innerText = `PKR ${grandTotal.toFixed(2)}`;
        }

        const modal = document.getElementById('receiptModal');
        if (modal) {
            modal.classList.add('open');
            modal.style.display = 'flex';
        }
    })
    .catch(error => {
        console.error('Checkout Error:', error);
        alert('An error occurred during checkout processing.');
    });
}

function closeReceipt() {
    document.getElementById('receiptModal').classList.remove('open');
    window.location.href = "/menu/";
}