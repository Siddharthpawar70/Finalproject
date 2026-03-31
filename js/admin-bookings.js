// Admin Bookings Management - PHP Backend Connected
document.addEventListener('DOMContentLoaded', async () => {
    const bookingBody = document.getElementById('admin-booking-body');
    const emptyState = document.getElementById('empty-bookings');

    async function renderBookings() {
        bookingBody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:#999;">Loading bookings...</td></tr>';

        try {
            const res = await fetch(window.API_BASE_URL + 'booking_api.php?action=get_all');
            const data = await res.json();

            bookingBody.innerHTML = '';
            const bookings = data.bookings || [];

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
            bookingBody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:#e74c3c;">Failed to load bookings. Is the PHP backend running?</td></tr>';
        }
    }

    window.cancelBooking = async (ref) => {
        if (confirm(`Are you sure you want to cancel booking ${ref}?`)) {
            try {
                const res = await fetch(window.API_BASE_URL + 'admin_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_booking', booking_ref: ref, status: 'cancelled' })
                });
                const data = await res.json();
                alert(data.message || 'Booking cancelled.');
                renderBookings();
            } catch (err) {
                alert('Failed to cancel booking. Server error.');
            }
        }
    };

    renderBookings();
});
