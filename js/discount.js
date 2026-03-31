/**
 * Dynamic Seasonal & User-Based Discount System
 */

const DiscountSystem = {
    getSeasonOffer(month) {
        // month is 0-11
        // Mar(2) - Jun(5) -> Summer
        if (month >= 2 && month <= 5) return { name: "Summer Sale", discount: 0.10, icon: "☀️" };
        // Jul(6) - Sep(8) -> Monsoon
        if (month >= 6 && month <= 8) return { name: "Monsoon Offer", discount: 0.20, icon: "🌧️" };
        // Oct(9) -> Off-Season
        if (month === 9) return { name: "Off-Season Sale", discount: 0.25, icon: "🍂" };
        // Nov(10) - Feb(1) -> Winter
        return { name: "Winter Offer", discount: 0.15, icon: "❄️" };
    },

    getFestivalOffer(month, date) {
        // Diwali: approx end of Oct / Nov
        if (month === 10 && (date >= 1 && date <= 5)) return { name: "Diwali Offer", discount: 0.20, icon: "🪔" };
        // Christmas: Dec 24-26
        if (month === 11 && (date >= 24 && date <= 26)) return { name: "Christmas Offer", discount: 0.15, icon: "🎄" };
        // New Year: Dec 31, Jan 1-2
        if ((month === 11 && date === 31) || (month === 0 && date <= 2)) return { name: "New Year Offer", discount: 0.25, icon: "🎆" };
        return null; // No festival
    },

    getUserOffer() {
        // Mock user check
        const bookingsStr = localStorage.getItem('userBookings');
        let hasBooked = false;
        if (bookingsStr) {
            try {
                const bookings = JSON.parse(bookingsStr);
                hasBooked = bookings.length > 0;
            } catch (e) {}
        }
        
        if (!hasBooked) {
            return { name: "First Time User", discount: 0.10 };
        }
        return { name: "Returning User", discount: 0.05 };
    },

    getCombinedOffer() {
        const now = new Date();
        const month = now.getMonth();
        const date = now.getDate();

        const season = this.getSeasonOffer(month);
        const festival = this.getFestivalOffer(month, date);
        const user = this.getUserOffer();

        // Priority to Festival if active, otherwise Season
        let baseOffer = festival ? festival : season;
        
        let totalDiscount = baseOffer.discount + user.discount;
        
        // Safety cap at 50%
        if (totalDiscount > 0.50) totalDiscount = 0.50;

        return {
            baseName: baseOffer.name,
            discount: totalDiscount,
            percent: Math.round(totalDiscount * 100),
            icon: baseOffer.icon
        };
    },

    calculateFinalPrice(originalPrice, offer) {
        // If offer not passed (e.g. from booking.js), auto-compute it
        if (!offer) offer = this.getCombinedOffer();
        const percent = offer.percent ?? Math.round((offer.discount || 0) * 100);
        const finalPrice = Math.round(originalPrice * (1 - (offer.discount || 0)));
        return {
            original: originalPrice,
            final: finalPrice,
            percent: percent,
            offerText: offer.baseName || offer.name || 'Seasonal Discount'
        };
    },

    formatPrice(price) {
        return "₹" + price.toLocaleString('en-IN');
    },

    initTimer() {
        let endTime = localStorage.getItem('discountEndTime');
        if (!endTime) {
            // 2 days from now in ms
            endTime = new Date().getTime() + (2 * 24 * 60 * 60 * 1000);
            localStorage.setItem('discountEndTime', endTime);
        }

        const timerInterval = setInterval(() => {
            const now = new Date().getTime();
            let distance = endTime - now;
            
            if (distance < 0) {
                // reset for continuous offer demo logic
                endTime = now + (2 * 24 * 60 * 60 * 1000);
                localStorage.setItem('discountEndTime', endTime);
                distance = endTime - now;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            
            const timerEls = document.querySelectorAll(".offer-timer-display");
            timerEls.forEach(el => {
                let displayStr = `Offer ends in ${days} days`;
                if(days === 0) {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    displayStr = `Offer ends in ${hours} hours`;
                }
                el.innerText = displayStr;
            });
        }, 1000);
    },

    applyToPage() {
        const offer = this.getCombinedOffer();

        // Check if banner already exists
        if (!document.getElementById('discount-global-banner')) {
            const banner = document.createElement('div');
            banner.id = 'discount-global-banner';
            banner.style.cssText = "background: #e74c3c; color: white; text-align: center; padding: 12px; font-weight: 600; font-size: 0.95rem; position: sticky; top: 0; z-index: 9999; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);";
            banner.innerHTML = `🎉 Seasonal Offers Applied Automatically | <i class="fas fa-clock"></i> <span class="offer-timer-display">Offer ends in 2 days</span>`;
            document.body.prepend(banner);

            this.initTimer();
        }

        // Apply dynamically to Elements containing Prices
        const selectors = [
            '.price-box .price-value',       // packages.html
            '.destination-card .price',      // destinations.html
            '.card .price',                  // general cards
            '#total-cost',                   // booking.html total
            '#summary-price'                 // booking.html summary
        ];

        const priceElements = document.querySelectorAll(selectors.join(', '));
        
        priceElements.forEach(el => {
            if (el.hasAttribute('data-discount-applied')) return;

            // Save original styles/classes if any (useful for layout keeping)
            const parent = el.parentElement;

            let originalPrice = 0;
            const text = el.innerText;
            const match = text.match(/[0-9,]+/);
            
            if (match) {
                originalPrice = parseInt(match[0].replace(/,/g, ''));
            }

            if (originalPrice > 0) {
                const calc = this.calculateFinalPrice(originalPrice, offer);
                
                // Keep suffix (e.g. " / Person")
                const suffixMatch = text.match(/\s*\/\s*[a-zA-Z]+/);
                const suffix = suffixMatch ? suffixMatch[0] : "";

                // Determine styling class tweaks if needed
                el.innerHTML = `
                    <div style="font-size: 0.85rem; color: #7f8c8d; text-decoration: line-through; margin-bottom: 2px;">
                        ${this.formatPrice(calc.original)}${suffix}
                    </div>
                    <div style="color: #e74c3c; font-weight: 800; font-size: 1.25em;">
                        ${this.formatPrice(calc.final)}${suffix}
                    </div>
                    <div style="display:inline-block; background:#ffeaa7; color:#d35400; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; margin-top:8px; border:1px solid #fdcb6e;">
                        🔥 ${offer.percent}% OFF – ${offer.baseName}
                    </div>
                `;
                
                el.setAttribute('data-discount-applied', 'true');

                // If element is an input value (like total cost in booking form), adjust logic
                if (el.tagName === 'INPUT' || el.tagName === 'SPAN' && el.id === 'total-cost') {
                    // Specific logic for form inputs on booking if needed
                    // In booking.js, calculation might overwrite this, so we should expose the function globally
                }
            }
        });
    }
};

window.DiscountSystem = DiscountSystem; // Export for external use (e.g., booking form calculations)

document.addEventListener('DOMContentLoaded', () => {
    // Only apply if the user is not an admin viewing user pages
    if (!window.location.pathname.includes('admin')) {
        setTimeout(() => {
            DiscountSystem.applyToPage();
        }, 800); // 800ms delay to allow destinations and packages to fully inject into DOM if they use JS
    }
});
