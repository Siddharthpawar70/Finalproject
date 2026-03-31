// Destinations Page Price Sync Logic
document.addEventListener('DOMContentLoaded', async () => {
    let customInventory = JSON.parse(localStorage.getItem('customInventory') || '[]');
    const sourceData = (typeof allDestinations !== 'undefined') ? allDestinations : [];

    // Fetch Live Data from Database to supplement/override static data
    try {
        const destRes = await fetch(window.API_BASE_URL + 'packages_api.php?action=get_destinations');
        const destData = await destRes.json();
        if (destData.status === 'success') {
            // Merge database destinations into customInventory for syncing
            const dbDestinations = destData.destinations.map(d => ({...d, type: 'destination'}));
            // Use a Map to ensure unique items by name, prioritizing DB items
            const mergedMap = new Map();
            customInventory.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
            dbDestinations.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
            customInventory = Array.from(mergedMap.values());
        }
    } catch (err) {
        console.warn('Could not fetch live destinations:', err);
    }

    // Helper to find data by title
    function findData(title) {
        if (!title) return null;
        const lowerTitle = title.toLowerCase();
        
        // Check Admin Overrides / Live DB Data First
        let match = customInventory.find(inv => 
            lowerTitle.includes(inv.name.toLowerCase()) || 
            inv.name.toLowerCase().includes(lowerTitle)
        );
        if (match) return match;

        // Check Hardcoded Data Second
        match = sourceData.find(d => 
            lowerTitle.includes(d.name.toLowerCase()) || 
            d.name.toLowerCase().includes(lowerTitle)
        );
        return match;
    }

    // 1. Update prices in modals (Details View)
    const priceValues = document.querySelectorAll('.sidebar-price .value');
    priceValues.forEach(val => {
        const container = val.closest('.modal-body');
        if (container) {
            const title = container.querySelector('.banner-text h1')?.innerText;
            const data = findData(title);
            if (data) {
                const symbol = data.category === 'International' ? '$' : '₹';
                val.innerText = `${symbol} ${data.price.toLocaleString()} /- `;
            }
        }
    });

    // 2. Update prices in main card grid (Gallery View)
    // Looking for tags like <span class="price"> or within h3/p if they mention price
    const cards = document.querySelectorAll('.card, .destination-card, .item');
    cards.forEach(card => {
        const title = card.querySelector('h3, h1')?.innerText;
        const data = findData(title);
        if (data) {
            // Some cards might not show price directly, but if they do, update it
            const priceEl = card.querySelector('.price, .item-price, .value');
            if (priceEl) {
                const symbol = data.category === 'International' ? '$' : '₹';
                priceEl.innerText = `${symbol} ${data.price.toLocaleString()} `;
            }
        }
    });
});
