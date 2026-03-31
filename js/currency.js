/**
 * currency.js - Handles currency switching, localStorage saving, and dynamic price updating across the DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    const currencySwitcher = document.getElementById('currency-switcher');
    
    // Hardcoded conversion rates for simplicity
    const rates = {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0094
    };

    const symbols = {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£'
    };

    function updatePricesOnPage() {
        const selectedCurrency = localStorage.getItem('ght_currency') || 'INR';
        const rate = rates[selectedCurrency] || 1;
        const symbol = symbols[selectedCurrency] || '₹';

        // Expanded selectors to catch prices everywhere, excluding options which have their own formatting in booking.js
        const priceElements = document.querySelectorAll('.price, .price-tag, .pkg-price, [data-price]:not(option), .price-value, .sidebar-price .value, #sum-total, .admin-price');
        
        priceElements.forEach(el => {
            let basePrice;
            
            // 1. Try data-base-price first (most reliable)
            if (el.dataset.basePrice) {
                basePrice = parseFloat(el.dataset.basePrice);
            } 
            // 2. Try [data-price] attribute (used in some places)
            else if (el.dataset.price) {
                basePrice = parseFloat(el.dataset.price);
                el.dataset.basePrice = basePrice; // Store for future flips
            }
            // 3. Parse text content
            else {
                const text = el.innerText.trim();
                // Regex to find numbers, handling commas (e.g., 4,85,000)
                const cleanText = text.replace(/,/g, '');
                const match = cleanText.match(/(\d+(\.\d+)?)/);
                if (match) {
                    basePrice = parseFloat(match[0]);
                    el.dataset.basePrice = basePrice;
                    
                    // Specific logic for "/ Couple" or "/ Person" suffixes
                    if (text.includes('/')) {
                        const split = text.split('/');
                        el.dataset.suffix = split[split.length - 1].trim();
                    }
                    // Specific logic for "From" prefix
                    if (text.toLowerCase().startsWith('from')) {
                        el.dataset.prefix = 'From ';
                    }
                }
            }

            if (basePrice !== undefined && !isNaN(basePrice)) {
                const converted = (basePrice * rate).toLocaleString(undefined, {
                    maximumFractionDigits: 0
                });
                
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix ? ` / ${el.dataset.suffix}` : '';
                el.innerText = `${prefix}${symbol} ${converted}${suffix}`;
            }
        });
    }

    if (currencySwitcher) {
        currencySwitcher.value = localStorage.getItem('ght_currency') || 'INR';
        
        currencySwitcher.addEventListener('change', (e) => {
            localStorage.setItem('ght_currency', e.target.value);
            updatePricesOnPage();
        });
    }

    // Run once on load
    setTimeout(updatePricesOnPage, 500);
    
    // Expose window.updatePricesOnPage
    window.updatePricesOnPage = updatePricesOnPage;
});
