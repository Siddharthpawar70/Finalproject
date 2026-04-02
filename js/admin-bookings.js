// Admin Bookings Management - PHP Backend Connected
document.addEventListener('DOMContentLoaded', async () => {
    const bookingBody = document.getElementById('admin-booking-body');
    const emptyState = document.getElementById('empty-bookings');
    const BOOKINGS_KEY = 'adminBookings';

    const getStoredBookings = () => {
        try {
            const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
            if (Array.isArray(bookings) && bookings.length > 0) {
                return bookings;
            }
        } catch {}

        const derived = [];
        const latestBooking = JSON.parse(localStorage.getItem('latestBooking') || 'null');
        if (latestBooking) {
            derived.push({
                booking_ref: latestBooking.id || `BK-${Date.now()}`,
                cust_name: latestBooking.name || 'Guest',
                cust_email: latestBooking.email || latestBooking.userEmail || 'N/A',
                destination: latestBooking.dest || 'Trip',
                travel_date: latestBooking.date || 'N/A',
                total_amount: latestBooking.total || 0,
                adults: latestBooking.adults || 1,
                children: latestBooking.children || 0,
                status: 'confirmed'
            });
        }

        return derived;
    };

    const saveStoredBookings = (bookings) => {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    };

    async function fetchBookingsFromBackend() {
        const res = await fetch(window.API_BASE_URL + 'booking_api.php?action=get_all');
        if (!res.ok) {
            throw new Error(`Failed to fetch bookings (${res.status})`);
        }
        const data = await res.json();
        if (data.status === 'error') {
            throw new Error(data.message || 'Backend returned error while loading bookings.');
        }
        return data.bookings || [];
    }

    async function renderBookings() {
        bookingBody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:#999;">Loading bookings...</td></tr>';

        try {
            let bookings;
            try {
                bookings = await fetchBookingsFromBackend();
            } catch (backendError) {
                console.warn('Bookings backend unavailable, using local fallback:', backendError);
                bookings = getStoredBookings();
            }

            bookingBody.innerHTML = '';
            bookings = bookings || [];

            if (bookings.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            bookings.forEach(booking => {
                const total = parseFloat(booking.total_amount) || 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;"><strong>${booking.booking_ref}</strong></td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">
                        <div>${booking.cust_name}</div>
                        <div style="font-size: 0.75rem; color: #888;">${booking.cust_email}</div>
                        <div style="font-size: 0.7rem; color: #666; margin-top: 4px;">
                            <i class="fas fa-users"></i> ${(parseInt(booking.adults)||1) + (parseInt(booking.children)||0)} Traveler(s)
                        </div>
                    </td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">${booking.destination}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee; font-size: 0.85rem;">${booking.travel_date}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee; font-weight: 600; color: #2e7d32;">
                        ₹ ${total.toLocaleString()}
                    </td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">
                        <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                            background: ${booking.status === 'confirmed' ? '#e8f5e9' : (booking.status === 'cancelled' ? '#ffebee' : '#e3f2fd')};
                            color: ${booking.status === 'confirmed' ? '#2e7d32' : (booking.status === 'cancelled' ? '#c62828' : '#1565c0')};">
                            ${booking.status}
                        </span>
                    </td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee; text-align: center;">
                        ${booking.status === 'confirmed' ?
                    `<button onclick="cancelBooking('${booking.booking_ref}')" style="background: #ffebee; color: #d32f2f; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i> Cancel
                        </button>` : '-'
                    }
                    </td>
                `;
                bookingBody.appendChild(tr);
            });
        } catch (err) {
            bookingBody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:#e67e22;">Unable to load from server. Please refresh and try again.</td></tr>';
        }
    }

    window.cancelBooking = async (ref) => {
        if (confirm(`Are you sure you want to cancel booking ${ref}?`)) {
            try {
                let cancelledViaBackend = false;
                try {
                    const res = await fetch(window.API_BASE_URL + 'admin_api.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'update_booking', booking_ref: ref, status: 'cancelled' })
                    });
                    if (!res.ok) {
                        throw new Error(`Failed to cancel booking (${res.status})`);
                    }
                    const data = await res.json();
                    if (data.status === 'error') {
                        throw new Error(data.message || 'Booking cancellation failed.');
                    }
                    cancelledViaBackend = true;
                    alert(data.message || 'Booking cancelled.');
                } catch (backendError) {
                    console.warn('Booking cancellation backend unavailable, using local fallback:', backendError);
                }

                if (!cancelledViaBackend) {
                    const bookings = getStoredBookings().map(booking => {
                        if (booking.booking_ref === ref) {
                            return { ...booking, status: 'cancelled' };
                        }
                        return booking;
                    });
                    saveStoredBookings(bookings);
                    alert('Booking cancelled (local mode).');
                }

                renderBookings();
            } catch (err) {
                alert('Failed to cancel booking right now. Please try again.');
            }
        }
    };

    renderBookings();
});
