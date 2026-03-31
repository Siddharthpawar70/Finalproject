// Admin Dashboard Logic - PHP Backend Connected
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Refresh Button
    const refreshBtn = document.querySelector('.data-section button');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loadDashboardStats().then(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh';
            });
        });
    }

    // 2. Sidebar Navigation Highlighting
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 3. Load Dashboard Stats from PHP Backend
    async function loadDashboardStats() {
        try {
            // Fetch stats
            const statsRes = await fetch(window.API_BASE_URL + 'admin_api.php?action=stats');
            const stats = await statsRes.json();

            const regUsersVal = document.getElementById('reg-users-count');
            if (regUsersVal) regUsersVal.innerText = (stats.totalUsers || 0).toLocaleString();

            const totalBookingsVal = document.querySelector('.stats-grid div:first-child .stat-value');
            if (totalBookingsVal) totalBookingsVal.innerText = stats.totalBookings || 0;

            const revenueVal = document.querySelector('.stats-grid div:nth-child(2) .stat-value');
            if (revenueVal) revenueVal.innerText = '₹ ' + parseFloat(stats.totalRevenue || 0).toLocaleString();

            // Fetch recent bookings for dashboard table
            const bookingsRes = await fetch(window.API_BASE_URL + 'booking_api.php?action=get_all');
            const bookingsData = await bookingsRes.json();
            const allBookings = bookingsData.bookings || [];

            const dashTableBody = document.querySelector('.data-table-container tbody');
            if (dashTableBody) {
                const recent = allBookings.slice(0, 5);
                const emptyEl = document.querySelector('.empty-state');
                if (recent.length > 0) {
                    if (emptyEl) emptyEl.style.display = 'none';
                    dashTableBody.innerHTML = '';
                    recent.forEach(b => {
                        const total = parseFloat(b.total_amount) || 0;
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${b.booking_ref}</td>
                            <td>${b.cust_name}</td>
                            <td>${b.destination}</td>
                            <td>${b.travel_date}</td>
                            <td>₹ ${total.toLocaleString()}</td>
                            <td><span style="color: ${b.status === 'confirmed' ? '#27ae60' : '#e74c3c'};">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></td>
                        `;
                        dashTableBody.appendChild(tr);
                    });
                } else {
                    if (emptyEl) emptyEl.style.display = 'block';
                }
            }

            // Inventory stat (keep from localStorage for custom items)
            const inventoryVal = document.querySelector('.stats-grid div:last-child .stat-value');
            if (inventoryVal) {
                const customInventory = JSON.parse(localStorage.getItem('customInventory') || '[]');
                if (customInventory.length > 0) {
                    inventoryVal.innerText = customInventory.length;
                }
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    // 4. Logout
    const logoutBtn = document.querySelector('.btn-logout, #admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out from the admin session?')) {
                try {
                    await fetch(window.API_BASE_URL + 'logout_api.php');
                } catch (err) { /* ignore */ }
                localStorage.removeItem('isAdminLoggedIn');
                localStorage.removeItem('adminSession');
                window.location.href = 'admin-login.html';
            }
        });
    }

    await loadDashboardStats();
});
