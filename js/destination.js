// Destinations Page Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Destination Search/Filter Placeholder
    // This could be expanded if a search bar is added to destinations.html

    // 2. Modal interactions are currently handled by CSS checkbox hack
    // But we can add JS for better UX (like closing on Escape key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.details-check:checked');
            openModals.forEach(modal => {
                modal.checked = false;
            });
        }
    });

    // 3. Log view of destination details (Analytics simulation)
    const detailButtons = document.querySelectorAll('.show-details-btn');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const destName = btn.closest('.destination-card, .item')?.querySelector('h3, h1')?.innerText;
            if (destName) {
                console.log(`User viewing details for: ${destName}`);
            }
        });
    });

    // 4. Booking Button Link Handling
    const bookingButtons = document.querySelectorAll('a[href="booking.html"]');
    bookingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // We can pre-select the destination in the booking form using session storage
            const destSection = btn.closest('.details-modal');
            if (destSection) {
                const destTitle = destSection.querySelector('h1')?.innerText;
                if (destTitle) {
                    sessionStorage.setItem('selectedDest', destTitle);
                }
            }
        });
    });
});
