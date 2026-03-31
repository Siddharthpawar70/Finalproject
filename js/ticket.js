const bookingData = JSON.parse(localStorage.getItem('latestBooking'));
const ticketList = document.getElementById('ticket-list'); // This is the container

if (!bookingData) {
    document.getElementById('no-booking').style.display = 'block';
    document.getElementById('ticket-area').style.display = 'none';
} else {
    // Hide no booking message, show ticket area
    document.getElementById('no-booking').style.display = 'none';
    document.getElementById('ticket-area').style.display = 'block';

    // Update the success message area if present
    if (document.getElementById('conf-email')) document.getElementById('conf-email').textContent = bookingData.email || '-';
    if (document.getElementById('conf-mobile')) document.getElementById('conf-mobile').textContent = bookingData.mobile || '-';

    // Format Date
    const travelDate = new Date(bookingData.date);
    const formattedDate = travelDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Mode formatting
    const modeDisplay = bookingData.mode.charAt(0).toUpperCase() + bookingData.mode.slice(1);

    // Get list of passengers (support legacy bookings where only 'name' exists)
    const passengers = bookingData.passengers || [bookingData.name];

    let fullTicketsHTML = '';

    passengers.forEach((passengerName, index) => {
        const ticketID = `${bookingData.id}-${(index + 1).toString().padStart(2, '0')}`;
        
        fullTicketsHTML += `
            <div class="ticket-card" style="flex-direction: column; padding: 2rem;">
                <div class="ticket-header" style="text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 2rem; color: var(--primary);">Passenger Ticket</h2>
                    <div style="color: #666; margin-top: 5px;">Ticket No: <strong>${ticketID}</strong>  |  Booking ID: <strong>${bookingData.id}</strong></div>
                </div>

                <div class="ticket-grid" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Row 1 -->
                    <div><span class="label">Passenger Name</span><span class="value">${passengerName}</span></div>
                    <div><span class="label">Phone Number</span><span class="value">${bookingData.mobile}</span></div>

                    <!-- Row 2 -->
                    <div><span class="label">Email ID</span><span class="value">${bookingData.email || '-'}</span></div>
                    <div><span class="label">Traveler #${index + 1} of ${passengers.length}</span><span class="value">${index + 1} / ${passengers.length}</span></div>

                    <!-- Row 3 -->
                    <div><span class="label">Travel Mode</span><span class="value">${modeDisplay}</span></div>
                    <div><span class="label">Destination</span><span class="value">${bookingData.dest}</span></div>

                    <!-- Row 4 -->
                    <div><span class="label">Travel Date</span><span class="value">${formattedDate}</span></div>
                    <div>
                        <span class="label">
                            ${bookingData.mode === 'flight' ? 'Departure Airport' : (bookingData.mode === 'train' ? 'Boarding Station' : 'Pickup Location')}
                        </span>
                        <span class="value">
                            ${bookingData.transportDetails ? (bookingData.transportDetails.departure || bookingData.transportDetails.boarding || bookingData.transportDetails.pickup || '-') : (bookingData.from || '-')}
                        </span>
                    </div>

                    <!-- Row 5 -->
                    <div>
                        <span class="label">
                            ${bookingData.mode === 'flight' ? 'Seat Class' : (bookingData.mode === 'train' ? 'Seat Type' : 'Drop Location')}
                        </span>
                        <span class="value">
                            ${bookingData.transportDetails ? (bookingData.transportDetails.class || bookingData.transportDetails.seatType || bookingData.transportDetails.drop || '-') : (bookingData.details || '-')}
                        </span>
                    </div>
                    <div><span class="label">Payment Option</span><span class="value">${bookingData.paymentMethod || bookingData.payment || 'Demo'}</span></div>
                    
                    <!-- Row 6 -->
                    <div><span class="label">Discount / Offer</span><span class="value" style="color: var(--accent);">${bookingData.offer || 'None'}</span></div>
                    <div><span class="label">Booking Status</span><span class="value" style="color: #27ae60;">Confirmed</span></div>
                    
                    <!-- Row 7 -->
                    <div style="grid-column: span 2;"><span class="label">Special Notes</span><span class="value" style="font-size: 0.8rem;">${bookingData.notes || 'None'}</span></div>
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <div class="barcode"></div>
                    <small>Official Travel Document - ${passengerName}</small>
                </div>
            </div>
        `;
    });

    ticketList.innerHTML = fullTicketsHTML;
}
