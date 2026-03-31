document.addEventListener('DOMContentLoaded', async () => {
    // 1. AUTH CHECK
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 2. TAB MANAGEMENT
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) s.classList.add('active');
            });
        });
    });

    // 3. RENDER PROFILE
    function updateUI() {
        const u = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('sidebar-name').innerText = u.name;
        document.getElementById('sidebar-initials').innerText = u.name.charAt(0).toUpperCase();
        document.getElementById('dash-greeting-name').innerText = u.name;
        
        document.getElementById('edit-name').value = u.name;
        document.getElementById('edit-email').value = u.email;
        document.getElementById('edit-phone').value = u.phone || '';
        document.getElementById('edit-country').value = u.country || '';
        document.getElementById('edit-city').value = u.city || '';
    }
    updateUI();

    // 4. EDIT PROFILE LOGIC
    const profileForm = document.getElementById('edit-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedUser = {
                ...currentUser,
                name: document.getElementById('edit-name').value,
                phone: document.getElementById('edit-phone').value,
                country: document.getElementById('edit-country').value,
                city: document.getElementById('edit-city').value
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            showToast("Profile updated successfully!");
            updateUI();
        });
    }

    // 5. BOOKINGS LOGIC - Fetch from PHP Backend
    const bookingsList = document.getElementById('user-bookings-list');
    const statsTotal = document.getElementById('stat-total-trips');
    const statsActive = document.getElementById('stat-active-trips');
    const statsRefunds = document.getElementById('stat-refunds');

    let myBookings = [];

    async function fetchBookings() {
        try {
            const res = await fetch(window.API_BASE_URL + 'booking_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_user', userEmail: currentUser.email })
            });
            const data = await res.json();
            myBookings = data.bookings || [];
        } catch (err) {
            myBookings = [];
            console.error('Failed to fetch bookings from backend. Falling back to localStorage:', err);
        }
        renderBookings();
    }

    function renderBookings() {
        if (!bookingsList) return;
        
        if (statsTotal) statsTotal.innerText = myBookings.length;
        if (statsActive) statsActive.innerText = myBookings.filter(b => b.status !== 'cancelled').length;
        if (statsRefunds) statsRefunds.innerText = myBookings.filter(b => b.status === 'cancelled').length;

        if (myBookings.length === 0) {
            bookingsList.innerHTML = `<div class="profile-card" style="text-align:center; padding: 4rem;">
                <i class="fas fa-suitcase-rolling" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem; display: block;"></i>
                <p>No trip bookings found. Time to plan one?</p>
                <a href="packages.html" class="btn-update" style="display:inline-block; margin-top: 1rem; text-decoration:none;">Explore Packages</a>
            </div>`;
            return;
        }

        bookingsList.innerHTML = '';
        myBookings.forEach(booking => {
            const total = parseFloat(booking.total_amount) || 0;
            const ref = booking.booking_ref;
            const dest = booking.destination;
            const date = booking.travel_date;
            const status = booking.status || 'confirmed';
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
            const statusClass = status === 'cancelled' ? 'status-cancelled' : (status === 'confirmed' ? 'status-confirmed' : 'status-pending');

            const item = document.createElement('div');
            item.className = 'booking-item';
            item.innerHTML = `
                <div class="booking-main">
                    <div class="booking-icon"><i class="fas fa-map-marked-alt"></i></div>
                    <div class="booking-info">
                        <h4>${dest}</h4>
                        <p><i class="far fa-calendar-alt"></i> ${date} | Ref: <strong>${ref}</strong></p>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap: 2rem;">
                    <div class="booking-price">
                        <span style="display:block; font-size: 0.75rem; color: #888;">Trip Cost</span>
                        <span style="font-weight: 700; color: #333;">₹ ${total.toLocaleString()}</span>
                    </div>
                    <span class="booking-status ${statusClass}">${statusLabel}</span>
                    <div class="booking-actions">
                        ${status !== 'cancelled' ? `
                            <button class="btn-sm" onclick="viewTicket('${ref}', '${dest}', '${date}', ${total})">View Ticket</button>
                            <button class="btn-sm" style="background: #27ae60; color: white;" onclick="viewReceipt('${ref}')">View Receipt</button>
                            <button class="btn-sm cancel" onclick="openCancelModal('${ref}', '${dest}', ${total})">Cancel</button>
                        ` : `
                            <div style="text-align: right;">
                                <span style="display:block; font-size: 0.7rem; color: #e74c3c; font-weight:700;">REFUND COMPLETED</span>
                            </div>
                        `}
                    </div>
                </div>
            `;
            bookingsList.appendChild(item);
        });
    }

    await fetchBookings();

    // 6. CANCELLATION MODAL LOGIC
    const modal = document.getElementById('cancelModal');
    let selectedBookingRef = null;

    window.openCancelModal = (ref, pkg, refund) => {
        selectedBookingRef = ref;
        document.getElementById('cancel-pkg-name').innerText = pkg;
        document.getElementById('cancel-id').innerText = ref;
        document.getElementById('cancel-refund-amount').innerText = refund.toLocaleString();
        modal.style.display = 'block';
    };

    const confirmBtn = document.getElementById('finalConfirmCancel');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(window.API_BASE_URL + 'booking_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'cancel', booking_ref: selectedBookingRef })
                });
                const data = await res.json();
                showToast(data.message || "Booking Cancelled Successfully!");
                modal.style.display = 'none';
                await fetchBookings();
                await fetchNotifications();
            } catch (err) {
                alert('Failed to cancel booking. Server error.');
            }
        });
    }

    window.viewTicket = (ref, dest, date, total) => {
        localStorage.setItem('latestBooking', JSON.stringify({ id: ref, dest, date, total }));
        window.location.href = 'ticket.html';
    };

    window.viewReceipt = (ref) => {
        window.location.href = `receipt.html?ref=${ref}`;
    };

    // 7. NOTIFICATIONS LOGIC - Fetch from PHP Backend
    const notifList = document.getElementById('notifications-list');

    async function fetchNotifications() {
        if (!notifList) return;
        try {
            const res = await fetch(window.API_BASE_URL + `notifications_api.php?action=get&email=${encodeURIComponent(currentUser.email)}`);
            const data = await res.json();
            const notifs = data.notifications || [];
            
            notifList.innerHTML = '';
            if (notifs.length === 0) {
                notifList.innerHTML = '<div style="text-align:center; padding: 2rem; color: #999;">No notifications yet.</div>';
                return;
            }
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = 'notif-item';
                div.innerHTML = `
                    <div class="notif-icon"><i class="fas fa-bell" style="color: #f39c12;"></i></div>
                    <div class="notif-content">
                        <h5>${n.title}</h5>
                        <p>${n.message}</p>
                        <span class="notif-time">${n.created_at}</span>
                    </div>
                `;
                notifList.appendChild(div);
            });
        } catch (err) {
            console.error('Notifications fetch error:', err);
        }
    }
    await fetchNotifications();

    // 8. HELPERS
    function showToast(msg) {
        const toast = document.getElementById('global-toast');
        toast.innerText = msg;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    // 9. LOGOUT
    const logoutAction = async (e) => {
        if(e) e.preventDefault();
        try { await fetch(window.API_BASE_URL + 'logout_api.php'); } catch(err) {}
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };

    document.getElementById('logout-btn').onclick = logoutAction;
    document.getElementById('sidebar-logout').onclick = logoutAction;

    // Close Modals
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
    document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
});
