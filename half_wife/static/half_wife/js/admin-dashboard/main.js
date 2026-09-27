function switchTab(tab) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));

        if (tab === 'menu') {
            document.getElementById('menuTab').classList.add('active');
            document.getElementById('menuTabBtn').classList.add('active');
        } else if (tab === 'staff') {
            document.getElementById('staffTab').classList.add('active');
            document.getElementById('staffTabBtn').classList.add('active');
        } else if (tab === 'floor') {
            document.getElementById('floorTab').classList.add('active');
            document.getElementById('floorTabBtn').classList.add('active');
            renderFloorGrid();
            updateFloorStats();
        } else if (tab === 'analytics') {
            document.getElementById('analyticsTab').classList.add('active');
            document.getElementById('analyticsTabBtn').classList.add('active');
            renderAnalytics();
        }
    }


    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('open');
                }
            });
        });
    });

    // ================= 1. MENU CATALOG ENGINE =================

    function openDishModal() {
        document.getElementById('dishForm').action = "/admin-dashboard/";
        document.getElementById('modalFormTitle').innerText = "Add New Menu Item";
        document.getElementById('dishForm').reset();
        document.getElementById('dishId').value = '';
        document.getElementById('dishImg').required = true;
        document.getElementById('dishModal').classList.add('open');
    }

    function closeDishModal() {
        document.getElementById('dishModal').classList.remove('open');
    }

    function editDish(id, name, category, price, description, tag, status) {
        document.getElementById('dishForm').action = `/menu-edit/${id}/`;
        document.getElementById('modalFormTitle').innerText = "Edit Menu Item";
        document.getElementById('dishId').value = id;
        document.getElementById('dishName').value = name;
        document.getElementById('dishPrice').value = price;
        document.getElementById('dishCategory').value = category;
        document.getElementById('dishDesc').value = description || '';

        const tagInput = document.getElementById('dishTag');
        if (tagInput) tagInput.value = tag || '';

        const statusInput = document.getElementById('dishStatus');
        if (statusInput) statusInput.value = status || 'Available';

        document.getElementById('dishImg').required = false;
        document.getElementById('dishModal').classList.add('open');
    }

    function filterMenuTable() {
        const input = document.getElementById('tableSearch');
        const filter = input.value.toLowerCase().trim();
        const tableBody = document.getElementById('menuTableBody');
        const rows = tableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells.length < 2) continue;

            const dishCell = rows[i].cells[0];
            const categoryCell = rows[i].cells[1];

            const dishText = dishCell ? (dishCell.textContent || dishCell.innerText).toLowerCase() : "";
            const categoryText = categoryCell ? (categoryCell.textContent || categoryCell.innerText).toLowerCase() : "";

            if (dishText.includes(filter) || categoryText.includes(filter)) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    // ================= 2. STAFF DIRECTORY & HIRING =================

    function openStaffModal(isEdit = false) {
        document.getElementById('staffModal').classList.add('open');
        if (!isEdit) {
            document.getElementById('staffModalTitle').innerText = "Onboard New Employee";
            document.getElementById('staffForm').reset();
            document.getElementById('staffId').value = '';
            document.getElementById('staffForm').action = "/hireEmployee/";
        }
    }

    function closeStaffModal() {
        document.getElementById('staffModal').classList.remove('open');
    }

    function editStaff(id, name, role, salary, email, password, dutyStatus) {
        document.getElementById('staffForm').action = `/edit-employee/${id}/`;
        document.getElementById('staffModalTitle').innerText = "Edit Employee Profile";
        document.getElementById('staffId').value = id;
        document.getElementById('staffName').value = name;
        document.getElementById('staffRole').value = role;
        document.getElementById('staffSalary').value = salary;
        document.getElementById('staffEmail').value = email;
        document.getElementById('staffPassword').value = password;

        const dutyStatusInput = document.getElementById('staffDutyStatus');
        if (dutyStatusInput) {
            dutyStatusInput.value = dutyStatus || 'On Duty';
        }

        document.getElementById('staffModal').classList.add('open');
    }

    function filterStaffTable() {
        const input = document.getElementById('staffSearch');
        const filter = input.value.toLowerCase();
        const tableBody = document.getElementById('staffTableBody');
        const rows = tableBody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].cells.length < 2) continue;

            const nameText = rows[i].cells[0].textContent || rows[i].cells[0].innerText;
            const roleText = rows[i].cells[1].textContent || rows[i].cells[1].innerText;
            if (nameText.toLowerCase().indexOf(filter) > -1 || roleText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    // ================= 3. FLOOR & TABLES ENGINE =================

    function updateFloorStats() {
        const tableBody = document.getElementById('floorTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        let totalSeats = 0;
        let totalTables = 0;
        let occupiedCount = 0;
        let availableCount = 0;

        rows.forEach(row => {
            if (row.cells.length < 3) return;
            totalTables++;

            const capacityText = row.cells[1].innerText;
            const capacityMatch = capacityText.match(/\d+/);
            if (capacityMatch) {
                totalSeats += parseInt(capacityMatch[0]);
            }

            const statusText = row.cells[2].innerText.toLowerCase();
            if (statusText.includes('occupied')) {
                occupiedCount++;
            } else {
                availableCount++;
            }
        });

        const seatStat = document.getElementById('statTotalSeats');
        const tableStat = document.getElementById('statTotalTables');
        const occupiedStat = document.getElementById('statOccupiedTables');
        const availableStat = document.getElementById('statAvailableTables');

        if (seatStat) seatStat.innerText = `${totalSeats} Seats`;
        if (tableStat) tableStat.innerText = totalTables;
        if (occupiedStat) occupiedStat.innerText = occupiedCount;
        if (availableStat) availableStat.innerText = availableCount;
    }

    function updateTableStatus(buttonElement, newStatus, tableKey) {
        const card = buttonElement.closest('.table-card');
        const statusTitleBox = card.querySelector('div[style*="background: #F9FAFB"] div:first-child');
        const statusDescBox = card.querySelector('div[style*="background: #F9FAFB"] div:last-child');

        let descriptionText = '';

        if (newStatus === 'AVAILABLE') {
            card.style.borderTop = '4px solid #10B981';
            if (statusTitleBox) {
                statusTitleBox.style.color = '#10B981';
                statusTitleBox.textContent = 'AVAILABLE';
            }
            descriptionText = 'Empty & Sanitized';
            if (statusDescBox) {
                statusDescBox.textContent = descriptionText;
            }
        } else if (newStatus === 'OCCUPIED') {
            const guests = prompt("Enter guest name or party count:", "Walk-in guests • Just seated");
            card.style.borderTop = '4px solid #EF4444';
            if (statusTitleBox) {
                statusTitleBox.style.color = '#EF4444';
                statusTitleBox.textContent = 'OCCUPIED';
            }
            descriptionText = guests ? guests : "Walk-in guests • Just seated";
            if (statusDescBox) {
                statusDescBox.textContent = descriptionText;
            }
        }
        const tableState = {
            status: newStatus,
            border: newStatus === 'AVAILABLE' ? '4px solid #10B981' : '4px solid #EF4444',
            color: newStatus === 'AVAILABLE' ? '#10B981' : '#EF4444',
            desc: descriptionText
        };
        localStorage.setItem('table_state_' + tableKey, JSON.stringify(tableState));

        recalculateFloorStats();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const cards = document.querySelectorAll('.table-card');

        cards.forEach(card => {
            const nameElement = card.querySelector('strong');
            if (!nameElement) return;

            const tableKey = nameElement.textContent.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
            const savedData = localStorage.getItem('table_state_' + tableKey);

            if (savedData) {
                const state = JSON.parse(savedData);
                const statusTitleBox = card.querySelector('div[style*="background: #F9FAFB"] div:first-child');
                const statusDescBox = card.querySelector('div[style*="background: #F9FAFB"] div:last-child');

                card.style.borderTop = state.border;
                if (statusTitleBox) {
                    statusTitleBox.style.color = state.color;
                    statusTitleBox.textContent = state.status;
                }
                if (statusDescBox) {
                    statusDescBox.textContent = state.desc;
                }
            }
        });

        recalculateFloorStats();
    });

    function recalculateFloorStats() {
        const cards = document.querySelectorAll('.table-card');
        let occupiedCount = 0;
        let availableCount = 0;

        cards.forEach(card => {
            const statusTitleBox = card.querySelector('div[style*="background: #F9FAFB"] div:first-child');
            if (statusTitleBox) {
                const statusText = statusTitleBox.textContent.trim().toUpperCase();
                if (statusText.includes('OCCUPIED')) {
                    occupiedCount++;
                } else if (statusText.includes('AVAILABLE')) {
                    availableCount++;
                }
            }
        });

        const occupiedElem = document.getElementById('statOccupiedTables');
        const availableElem = document.getElementById('statAvailableTables');

        if (occupiedElem) occupiedElem.innerText = occupiedCount;
        if (availableElem) availableElem.innerText = availableCount;
    }

    function openTableModal() {
        document.getElementById('tableModal').classList.add('open');
        document.getElementById('tableForm').reset();
    }

    function closeTableModal() {
        document.getElementById('tableModal').classList.remove('open');
    }

    // ================= 4. LIVE SALES & ANALYTICS ENGINE =================

    // Single unified salesData declaration from Django backend
    let salesData = [];
    const dataContainer = document.getElementById('sales-data-container');
    if (dataContainer && dataContainer.dataset.orders) {
    try {
        salesData = JSON.parse(dataContainer.dataset.orders);
    } catch (e) {
        console.error("Error parsing sales data:", e);
        salesData = [];
    }
}

    function saveAndRenderSales() {
        renderAnalytics();
    }

    function renderAnalytics() {
        updateSalesStats();
        renderHourlyChart();
        renderCategoryBreakdown();
    }

    function updateSalesStats() {
        const totalSales = salesData.reduce((acc, curr) => acc + parseFloat(curr.total), 0);
        const count = salesData.length;
        const avg = count ? (totalSales / count).toFixed(2) : '0.00';
        const netProfit = (totalSales * 0.32).toFixed(2);

        if (document.getElementById('statTotalSales')) {
            document.getElementById('statTotalSales').innerText = `PKR ${totalSales.toFixed(2)}`;
            document.getElementById('statOrderCount').innerText = count;
            document.getElementById('statAvgOrder').innerText = `PKR ${avg}`;
            document.getElementById('statNetProfit').innerText = `PKR ${netProfit}`;
        }
    }

    function renderHourlyChart() {
        const container = document.getElementById('hourlyChartContainer');
        if (!container) return;
        container.innerHTML = '';

        const hourMap = {
            '11 AM': 0, '12 PM': 0, '1 PM': 0, '2 PM': 0,
            '3 PM': 0, '4 PM': 0, '5 PM': 0
        };

        salesData.forEach(sale => {
            const timeStr = (sale.time || "").toUpperCase();
            const total = parseFloat(sale.total) || 0;

            if (timeStr.includes('11:')) {
                hourMap['11 AM'] += total;
            } else if (timeStr.includes('12:')) {
                hourMap['12 PM'] += total;
            } else if (timeStr.includes('01:') || timeStr.includes('1:')) {
                hourMap['1 PM'] += total;
            } else if (timeStr.includes('02:') || timeStr.includes('2:')) {
                hourMap['2 PM'] += total;
            } else if (timeStr.includes('03:') || timeStr.includes('3:')) {
                hourMap['3 PM'] += total;
            } else if (timeStr.includes('04:') || timeStr.includes('4:')) {
                hourMap['4 PM'] += total;
            } else if (timeStr.includes('05:') || timeStr.includes('5:')) {
                hourMap['5 PM'] += total;
            } else {
                hourMap['1 PM'] += total;
            }
        });

        const hours = Object.keys(hourMap).map(label => ({ label, val: hourMap[label] }));
        const maxVal = Math.max(...hours.map(h => h.val), 100);

        hours.forEach(h => {
            const col = document.createElement('div');
            col.className = 'chart-col';
            const pct = Math.round((h.val / maxVal) * 100);

            col.innerHTML = `
                <span style="font-size:10px; font-weight:700; color:var(--text-muted);">PKR ${h.val.toFixed(0)}</span>
                <div class="chart-bar-fill" style="height: ${h.val > 0 ? Math.max(pct, 12) : 0}%;"></div>
                <span class="chart-label">${h.label}</span>
            `;
            container.appendChild(col);
        });
    }

    function renderCategoryBreakdown() {
        const container = document.getElementById('categoryBreakdownContainer');
        if (!container) return;
        container.innerHTML = '';

        const categoryTotals = {
            "Fire Grills & Steaks": 0,
            "Chef's Signature Burgers": 0,
            "Wood-Fired Pizza": 0,
            "Salads & Beverages": 0
        };

        let totalRevenueAllCategories = 0;

        salesData.forEach(sale => {
            const summary = (sale.itemsSummary || "").toLowerCase();
            const saleTotal = parseFloat(sale.total) || 0;

            if (summary.includes('ribeye') || summary.includes('steak') || summary.includes('grill') || summary.includes('thali')) {
                categoryTotals["Fire Grills & Steaks"] += saleTotal;
            } else if (summary.includes('burger') || summary.includes('truffle')) {
                categoryTotals["Chef's Signature Burgers"] += saleTotal;
            } else if (summary.includes('pizza') || summary.includes('basil')) {
                categoryTotals["Wood-Fired Pizza"] += saleTotal;
            } else {
                categoryTotals["Salads & Beverages"] += saleTotal;
            }

            totalRevenueAllCategories += saleTotal;
        });

        const categories = Object.keys(categoryTotals).map(name => {
            const rev = categoryTotals[name];
            const percent = totalRevenueAllCategories > 0 ? Math.round((rev / totalRevenueAllCategories) * 100) : 0;
            return {
                name: name,
                percent: percent,
                rev: `PKR ${rev.toFixed(0)}`
            };
        });

        categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'category-progress-item';
            item.style.marginBottom = '14px';
            item.innerHTML = `
                <div class="category-progress-header" style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                    <span style="font-weight: 500; color: var(--text-main);">${cat.name}</span>
                    <span style="color: var(--primary-green); font-weight: 600;">${cat.rev} (${cat.percent}%)</span>
                </div>
                <div class="progress-track" style="background: #E2E8F0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                    <div class="progress-fill" style="background: #0D3324; height: 100%; width: ${cat.percent}%; transition: width 0.4s ease;"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function recordMockSale() {
        const randId = `HW-${Math.floor(1000 + Math.random() * 9000)}`;
        const channels = ["Dine-In (Main Hall)", "Direct Delivery", "Takeaway Counter", "Garden Terrace"];
        const itemsList = ["Truffle Burger x1", "Fire-Kissed Ribeye x1", "Basil Pizza x1", "Artisan Salad x2"];
        const methods = ["Credit Card", "Cash on Delivery", "Bank Transfer"];

        const newSale = {
            id: randId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channel: channels[Math.floor(Math.random() * channels.length)],
            itemsSummary: itemsList[Math.floor(Math.random() * itemsList.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            total: parseFloat((15 + Math.random() * 45).toFixed(2))
        };

        salesData.push(newSale);
        saveAndRenderSales();
    }

    function logoutAdmin() {
        window.location.href = "/";
    }

    document.addEventListener("DOMContentLoaded", function() {
        const messageContainer = document.getElementById("message-container");

        if (messageContainer) {
            setTimeout(function() {
                messageContainer.style.opacity = "0";
                setTimeout(function() {
                    messageContainer.remove();
                }, 500);
            }, 1500);
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        renderAnalytics();
        recalculateFloorStats();
    });

    function toggleStaffPassword() {
        const passwordInput = document.getElementById('staffPassword');
        const eyeIcon = document.getElementById('staffEyeIcon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            passwordInput.type = 'password';
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    }