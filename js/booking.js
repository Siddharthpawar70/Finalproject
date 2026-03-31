document.addEventListener('DOMContentLoaded', () => {
    // Stage 0: Auth Check (PHP session state mirrored to localStorage by login.js)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('You must be logged in to make a booking.');
        window.location.href = 'login.html';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // Stage 1: Populate Destinations
    const destSelect = document.getElementById('booking-dest');
    
    async function initDestinations() {
        if (!destSelect) return;
        
        // 1. Define Popular/Gallery Destinations (Hardcoded for fallback if DB is empty)
        const popularDestinations = [
            { name: "Agra, India", price: 15500, category: "India" },
            { name: "Goa, India", price: 12500, category: "India" },
            { name: "Kerala, India", price: 18500, category: "India" },
            { name: "Kashmir, India", price: 21500, category: "India" },
            { name: "Rajasthan, India", price: 16500, category: "India" },
            { name: "Manali, India", price: 14500, category: "India" },
            { name: "Shimla, India", price: 13500, category: "India" },
            { name: "Leh Ladakh, India", price: 28500, category: "India" },
            { name: "Varanasi, India", price: 11500, category: "India" },
            { name: "Paris, France", price: 145000, category: "International" },
            { name: "London, UK", price: 155000, category: "International" },
            { name: "Dubai, UAE", price: 85000, category: "International" },
            { name: "Singapore", price: 75000, category: "International" },
            { name: "Tokyo, Japan", price: 125000, category: "International" },
            { name: "New York, USA", price: 185000, category: "International" },
            { name: "Sydney, Australia", price: 165000, category: "International" },
            { name: "Rome, Italy", price: 135000, category: "International" },
            { name: "Barcelona, Spain", price: 115000, category: "International" },
            { name: "Amsterdam, Netherlands", price: 95000, category: "International" },
            { name: "Cairo, Egypt", price: 105000, category: "International" }
        ];

        // 2. Collect Hardcoded Data
        let hardcoded = (typeof allDestinations !== 'undefined') ? allDestinations : [];
        if (typeof packageData !== 'undefined') {
            // Normalize categories to match our headers
            const normalizedPackages = packageData.map(p => ({
                ...p,
                type: 'package',
                category: p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Packages'
            }));
            hardcoded = [...hardcoded, ...normalizedPackages];
        }
        // Merge popular destinations into hardcoded
        hardcoded = [...popularDestinations, ...hardcoded];

        let customInventory = JSON.parse(localStorage.getItem('customInventory') || '[]');
        
        // 3. Fetch Live data from DB (both Destinations and Packages)
        try {
            const [destRes, pkgRes] = await Promise.all([
                fetch(window.API_BASE_URL + 'packages_api.php?action=get_destinations'),
                fetch(window.API_BASE_URL + 'packages_api.php?action=get_packages')
            ]);
            
            const destData = await destRes.json();
            const pkgData = await pkgRes.json();

            if (destData.status === 'success' && destData.destinations) {
                const dbDests = destData.destinations.map(d => ({ ...d, type: 'destination' }));
                customInventory = [...dbDests, ...customInventory];
            }
            if (pkgData.status === 'success' && pkgData.packages) {
                const dbPkgs = pkgData.packages.map(p => ({ 
                    ...p, 
                    type: 'package',
                    category: p.category || 'Packages' 
                }));
                customInventory = [...dbPkgs, ...customInventory];
            }
        } catch (e) { 
            console.warn('Booking: Failed to fetch live data from server.', e); 
        }

        // 4. Merge and deduplicate by name
        const inventoryMap = new Map();
        hardcoded.forEach(item => {
            if (item.name) inventoryMap.set(item.name.toLowerCase(), item);
        });
        customInventory.forEach(item => {
            if (item.name) inventoryMap.set(item.name.toLowerCase(), item);
        });
        
        const dataSource = Array.from(inventoryMap.values());

        if (dataSource.length > 0) {
            // Grouping logic for categories
            const mainCategories = ['India', 'International', 'Packages'];
            const packageSubCategories = ['Honeymoon', 'Family', 'Solo', 'Wildlife', 'Spiritual', 'Luxury', 'Budget', 'Group', 'Weekend', 'Cultural', 'Educational', 'Corporate', 'Cruise'];

            const categories = [...new Set(dataSource.map(d => {
                let cat = d.category || 'General';
                // If it's explicitly a package or in subcategories, group under 'Packages'
                if (d.type === 'package' || packageSubCategories.includes(cat)) return 'Packages';
                return cat;
            }))];
            
            const sortedCategories = categories.sort((a, b) => {
                const order = { 'India': 1, 'International': 2, 'Packages': 3, 'General': 4 };
                return (order[a] || 99) - (order[b] || 99);
            });

            destSelect.innerHTML = '<option value="" disabled selected>Select destination or package...</option>';

            sortedCategories.forEach(cat => {
                const group = document.createElement('optgroup');
                group.label = cat === 'India' ? 'Explore India' : 
                             (cat === 'International' ? 'International Getaways' : 
                             (cat === 'Packages' ? 'Special Travel Packages' : cat));
                
                const filtered = dataSource.filter(d => {
                    let itemCat = d.category || 'General';
                    if (cat === 'Packages' && (d.type === 'package' || packageSubCategories.includes(itemCat))) return true;
                    // If the item doesn't map to Packages, check if it matches the current category
                    return itemCat === cat;
                });

                filtered.sort((a, b) => a.name.localeCompare(b.name));
                
                filtered.forEach(dest => {
                    const opt = document.createElement('option');
                    opt.value = dest.name;
                    opt.dataset.price = dest.price;
                    
                    // Dynamic currency for the label
                    const cur = localStorage.getItem('ght_currency') || 'INR';
                    const symbol = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' }[cur] || '₹';
                    const rate = { 'INR': 1, 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094 }[cur] || 1;
                    const convertedPrice = Math.round(dest.price * rate);
                    
                    opt.textContent = `${dest.name} (${symbol} ${convertedPrice.toLocaleString()}/-)`;
                    group.appendChild(opt);
                });
                
                if (group.children.length > 0) {
                    destSelect.appendChild(group);
                }
            });

            // Re-bind currency switcher to refresh dropdown labels if it exists
            const switcher = document.getElementById('currency-switcher');
            if (switcher && !switcher.dataset.bookingBound) {
                switcher.addEventListener('change', () => {
                    // We need to refresh the labels without losing selection
                    const currentVal = destSelect.value;
                    initDestinations(); // Simple way is to re-init, though it's async
                    setTimeout(() => { destSelect.value = currentVal; }, 100);
                });
                switcher.dataset.bookingBound = "true";
            }

            const urlParams = new URLSearchParams(window.location.search);
            const preSelectedDest = urlParams.get('dest');
            if (preSelectedDest) {
                destSelect.value = preSelectedDest;
                setTimeout(() => { if (typeof updateSummary === 'function') updateSummary(); }, 100);
            }
        }
    }

    initDestinations();

    // Stage 2: Constants and State
    let currentStep = 1;
    let activeMode = 'flight';
    let selectedVehicleId = 'bc1';

    const vehicleData = [
        { id: 'bc1', name: 'Standard Sedan', type: 'Car', price: 2000 },
        { id: 'suv1', name: 'Toyota Innova', type: 'Car', price: 3500 },
        { id: 'bus1', name: 'Mini Bus (12 Seater)', type: 'Bus', price: 8000 },
        { id: 'bus2', name: 'Luxury Coach', type: 'Bus', price: 15000 }
    ];

    // UI Elements
    const steps = document.querySelectorAll('.form-section');
    const indicators = document.querySelectorAll('.step-item');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const bookingForm = document.getElementById('mainBookingForm');
    const modeOptions = document.querySelectorAll('.mode-option');
    const modeDetailsUI = document.getElementById('mode-details-ui');
    const adultInput = document.getElementById('adult-count');
    const childInput = document.getElementById('child-count');
    const passengerContainer = document.getElementById('passenger-details-container');
    const passengerList = document.getElementById('passenger-list');

    function updatePassengerFields() {
        const adults = parseInt(adultInput.value) || 1;
        const kids = parseInt(childInput.value) || 0;
        const totalPax = adults + kids;

        if (totalPax > 1) {
            passengerContainer.style.display = 'block';
            passengerList.innerHTML = '';
            // We start from 2 because the 1st one is the main booker
            for (let i = 2; i <= totalPax; i++) {
                const div = document.createElement('div');
                div.className = 'form-group';
                div.innerHTML = `
                    <label>Passenger ${i} Full Name</label>
                    <input type="text" class="form-control extra-passenger-name" placeholder="Passenger ${i} Name" required>
                `;
                passengerList.appendChild(div);
            }
        } else {
            passengerContainer.style.display = 'none';
            passengerList.innerHTML = '';
        }
    }

    if (adultInput) adultInput.addEventListener('change', updatePassengerFields);
    if (childInput) childInput.addEventListener('change', updatePassengerFields);

    function updateModeUI() {
        if (activeMode === 'flight') {
            modeDetailsUI.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                 <div class="form-group">
                    <label>Departure Airport</label>
                    <input type="text" id="flight-departure" class="form-control" placeholder="City or Airport name" required>
                 </div>
                 <div class="form-group">
                    <label>Seat Class</label>
                    <select id="flight-class" class="form-control">
                        <option>Economy</option>
                        <option>Premium Economy</option>
                        <option>Business Class</option>
                        <option>First Class</option>
                    </select>
                 </div>
            </div>`;
        } else if (activeMode === 'train') {
            modeDetailsUI.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                 <div class="form-group">
                    <label>Boarding Station</label>
                    <input type="text" id="train-boarding" class="form-control" placeholder="From Station" required>
                 </div>
                 <div class="form-group">
                    <label>Seat Type</label>
                    <select id="train-seat" class="form-control">
                        <option>Sleeper (SL)</option>
                        <option>AC 3 Tier (3A)</option>
                        <option>AC 2 Tier (2A)</option>
                        <option>AC First Class (1A)</option>
                        <option>Second Sitting (2S)</option>
                    </select>
                 </div>
            </div>`;
        } else if (activeMode === 'car') {
            modeDetailsUI.innerHTML = `
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                 <div class="form-group">
                    <label>Pickup Location</label>
                    <input type="text" id="car-pickup" class="form-control" placeholder="Pick from address" required>
                 </div>
                 <div class="form-group">
                    <label>Drop Location</label>
                    <input type="text" id="car-drop" class="form-control" placeholder="Drop off address" required>
                 </div>
            </div>`;
        }
    }

    function updatePaymentUI() {
        const payUI = document.getElementById('payment-details-ui');
        if (!payUI) return;
        const method = document.querySelector('input[name="pay-method"]:checked').value;

        if (method === 'upi') {
            payUI.innerHTML = `
                <div class="form-group">
                    <label>UPI ID</label>
                    <input type="text" id="pay-upi-id" class="form-control" placeholder="username@bank" required>
                </div>`;
        } else if (method === 'card') {
            payUI.innerHTML = `
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Card Holder Name</label>
                        <input type="text" id="pay-card-name" class="form-control" placeholder="As on card" required>
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Card Number</label>
                        <input type="text" id="pay-card-num" class="form-control" placeholder="1234 5678 9101 1121" required>
                    </div>
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="text" id="pay-card-expiry" class="form-control" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="password" id="pay-card-cvv" class="form-control" placeholder="***" required>
                    </div>
                </div>`;
        } else if (method === 'net') {
            payUI.innerHTML = `
                <div class="form-group">
                    <label>Select Bank</label>
                    <select id="pay-bank" class="form-control">
                        <option>HDFC Bank</option>
                        <option>SBI</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra</option>
                    </select>
                </div>`;
        } else if (method === 'cash') {
            payUI.innerHTML = `
                <div class="form-group">
                    <p style="color: #666; font-size: 0.9rem;"><i class="fas fa-info-circle"></i> Cash Payment Option: You can pay at our local office or during pickup. A confirmation token will be generated.</p>
                </div>`;
        }
    }

    function updateSummary() {
        const name = document.getElementById('cust-name') ? document.getElementById('cust-name').value : '-';
        const destSelect = document.getElementById('booking-dest');
        const selectedDest = destSelect.options[destSelect.selectedIndex];
        const date = document.getElementById('booking-date').value;
        const adults = parseInt(adultInput.value) || 1;
        const kids = parseInt(childInput.value) || 0;
        const totalPax = adults + kids;

        // Price Calculation (Dummy/Estimated)
        const basePrice = selectedDest && selectedDest.dataset.price ? parseInt(selectedDest.dataset.price) : 0;
        let transportCost = 0;

        if (activeMode === 'flight') transportCost = 5000 * totalPax;
        else if (activeMode === 'train') transportCost = 1500 * totalPax;
        else if (activeMode === 'car') {
            const v = vehicleData.find(v => v.id === selectedVehicleId);
            transportCost = v ? v.price : 2000;
        }

        // Basic Math
        let totalCost = (basePrice * adults) + (basePrice * 0.5 * kids) + transportCost;

        // Auto Seasonal/Festival/User Discount Integration
        let discountAmount = 0;
        let discountPercent = 0;
        let offerName = "Manual Discount";

        if (typeof DiscountSystem !== 'undefined') {
            const calc = DiscountSystem.calculateFinalPrice(totalCost);
            discountAmount = totalCost - calc.final;
            discountPercent = calc.percent;
            offerName = calc.offerText;
            
            // Auto Update Dropdown Element
            const discountSelect = document.getElementById('discount-offer');
            if (discountSelect) {
                let found = false;
                for (let i = 0; i < discountSelect.options.length; i++) {
                    if (discountSelect.options[i].text.includes(offerName) || discountSelect.options[i].value == discountPercent) {
                        discountSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const newOpt = document.createElement('option');
                    newOpt.value = discountPercent;
                    newOpt.text = `Auto Applied: ${offerName} (${discountPercent}%)`;
                    discountSelect.add(newOpt);
                    discountSelect.selectedIndex = discountSelect.options.length - 1;
                }
                discountSelect.disabled = true; // Lock dropdown when auto-applied
            }
        } else {
            // Fallback to legacy manual select if DiscountSystem is missing
            const discountSelect = document.getElementById('discount-offer');
            const offer = discountSelect ? discountSelect.value : '0';
            if (offer === '10') discountPercent = 10;
            else if (offer === '15') discountPercent = 15;
            else if (offer === '20') discountPercent = 20;
            discountAmount = totalCost * (discountPercent/100);
        }

        const finalAmount = Math.max(0, totalCost - discountAmount);

        // Update UI
        if (document.getElementById('sum-name')) document.getElementById('sum-name').innerText = name || '-';
        if (document.getElementById('sum-route')) document.getElementById('sum-route').innerText = destSelect.value ? `To ${destSelect.value}` : '-';
        if (document.getElementById('sum-date')) document.getElementById('sum-date').innerText = date || '-';
        if (document.getElementById('sum-mode')) document.getElementById('sum-mode').innerText = activeMode.charAt(0).toUpperCase() + activeMode.slice(1);
        if (document.getElementById('sum-travelers')) document.getElementById('sum-travelers').innerText = `${adults} Adult(s), ${kids} Child(ren)`;
        if (document.getElementById('sum-discount')) document.getElementById('sum-discount').innerText = `${offerName} (${discountPercent}% Off)`;
        
        const sumTotalEl = document.getElementById('sum-total');
        if (sumTotalEl) {
            sumTotalEl.dataset.basePrice = finalAmount; // Fix caching issue
            sumTotalEl.innerText = '₹ ' + finalAmount.toLocaleString();
        }

        // Apply currency conversion to the newly calculated total
        if (window.updatePricesOnPage) window.updatePricesOnPage();

        return { total: finalAmount, base: totalCost, discount: discountAmount };
    }

    function renderSteps() {
        if (!steps || steps.length === 0) return;

        steps.forEach((s, i) => {
            if (i === currentStep - 1) {
                s.style.display = 'block';
                s.classList.add('active');
            } else {
                s.style.display = 'none';
                s.classList.remove('active');
            }
        });

        indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentStep - 1));

        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

        if (currentStep === 3) {
            if (nextBtn) nextBtn.style.display = 'none';
            const finalBtnContainer = document.getElementById('final-btns');
            if (finalBtnContainer) {
                finalBtnContainer.style.display = 'flex';
                // Show/Hide "Pay Now" based on method
                const method = document.querySelector('input[name="pay-method"]:checked').value;
                const payNow = document.getElementById('payNowBtn');
                if (payNow) payNow.style.display = (method === 'cash') ? 'none' : 'block';
            }
            updateSummary();
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            const finalBtnContainer = document.getElementById('final-btns');
            if (finalBtnContainer) finalBtnContainer.style.display = 'none';
        }
    }

    // Event Listeners
    modeOptions.forEach(opt => {
        opt.addEventListener('click', function () {
            if (this.querySelector('input')) return; // Ignore clicks on radio buttons in step 3
            if (currentStep === 3) return; // Don't switch mode in step 3 via visual clicks unless intended (design is distinct)

            modeOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            activeMode = this.dataset.mode;
            updateModeUI();
        });
    });

    // Payment Method Radio Listeners
    const payMethodRadios = document.querySelectorAll('input[name="pay-method"]');
    payMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updatePaymentUI();
            renderSteps(); // To refresh button visibility
        });
    });

    // Discount Selector Listener
    const discountSelect = document.getElementById('discount-offer');
    if (discountSelect) {
        discountSelect.addEventListener('change', updateSummary);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (currentStep === 1) {
            if (!document.getElementById('cust-name').value || !document.getElementById('cust-phone').value || !document.getElementById('booking-dest').value || !document.getElementById('booking-date').value) {
                alert('Please fill in all basic information including destination and date.');
                return;
            }
            // Check dynamic passenger names
            const extraInputs = document.querySelectorAll('.extra-passenger-name');
            for (let input of extraInputs) {
                if (!input.value.trim()) {
                    alert('Please fill in all passenger names.');
                    return;
                }
            }
        }
        if (currentStep === 2) {
            // Validate mode specific fields
            if (activeMode === 'flight') {
                if (!document.getElementById('flight-departure').value) { alert('Please enter departure airport.'); return; }
            } else if (activeMode === 'train') {
                if (!document.getElementById('train-boarding').value) { alert('Please enter boarding station.'); return; }
            } else if (activeMode === 'car') {
                if (!document.getElementById('car-pickup').value || !document.getElementById('car-drop').value) { alert('Please enter pickup and drop locations.'); return; }
            }
        }
        currentStep++;
        renderSteps();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        currentStep--;
        renderSteps();
    });

    // ----------------------------------------------------------------
    // PAYMENT FLOW
    // ----------------------------------------------------------------

    // Collect form data into a booking payload object
    function collectBookingPayload(summary) {
        let transportDetails = {};
        if (activeMode === 'flight') {
            transportDetails = {
                departure: (document.getElementById('flight-departure') || {}).value || '',
                class: (document.getElementById('flight-class') || {}).value || 'Economy'
            };
        } else if (activeMode === 'car') {
            transportDetails = {
                pickup: (document.getElementById('car-pickup') || {}).value || '',
                drop: (document.getElementById('car-drop') || {}).value || ''
            };
        } else if (activeMode === 'train') {
            transportDetails = {
                boarding: (document.getElementById('train-boarding') || {}).value || '',
                seatType: (document.getElementById('train-seat') || {}).value || 'Sleeper'
            };
        }

        const discountEl = document.getElementById('discount-offer');
        const discountName = discountEl ? discountEl.options[discountEl.selectedIndex].text : 'No Discount';
        const payMethod = document.querySelector('input[name="pay-method"]:checked').value;
        const extraPassengers = Array.from(document.querySelectorAll('.extra-passenger-name')).map(i => i.value);
        const allPassengers = [document.getElementById('cust-name').value, ...extraPassengers];

        return {
            action: 'create',
            name: document.getElementById('cust-name').value,
            passengers: allPassengers,
            mobile: document.getElementById('cust-phone').value,
            email: document.getElementById('cust-email').value,
            userEmail: currentUser.email || document.getElementById('cust-email').value,
            dest: document.getElementById('booking-dest').value,
            date: document.getElementById('booking-date').value,
            adults: parseInt(adultInput.value) || 1,
            children: parseInt(childInput.value) || 0,
            mode: activeMode,
            transportDetails,
            notes: (document.getElementById('special-requests') || {}).value || '',
            offer: discountName,
            total: summary.total,
            paymentMethod: payMethod.toUpperCase()
        };
    }

    // Submit booking to DB and return booking_ref
    async function submitBookingToDB(payload) {
        const res = await fetch(window.API_BASE_URL + 'booking_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    }

    // Redirect to receipt page after successful payment
    function redirectToReceipt(bookingRef, payload, paymentId) {
        const receiptData = {
            ...payload,
            booking_ref: bookingRef,
            payment_id: paymentId || 'N/A',
            paid_at: new Date().toISOString()
        };
        localStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.location.href = 'receipt.html';
    }

    // ---- Handle "Pay Now" (Stripe) button ----
    const payNowBtn = document.getElementById('payNowBtn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const summary = updateSummary();
            const payload = collectBookingPayload(summary);

            payNowBtn.disabled = true;
            payNowBtn.innerText = 'Processing…';

            try {
                // Step 1: Save booking to DB (as pending payment)
                payload.paymentMethod = 'STRIPE';
                const dbData = await submitBookingToDB(payload);

                if (dbData.status !== 'success') {
                    alert('Booking creation failed: ' + (dbData.message || 'Unknown error'));
                    payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
                    return;
                }

                const bookingRef = dbData.booking_ref;
                localStorage.setItem('latestBooking', JSON.stringify({ ...payload, id: bookingRef }));

                // Step 2: Create Stripe PaymentIntent
                const intentRes = await fetch(window.API_BASE_URL + 'payment_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create_intent',
                        amount: summary.total,
                        currency: 'inr',
                        booking_ref: bookingRef
                    })
                });
                const intentData = await intentRes.json();

                if (intentData.status !== 'success') {
                    alert('Payment setup failed: ' + (intentData.message || 'Unknown'));
                    payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
                    return;
                }

                // Step 3: Stripe Elements or mock confirm
                if (intentData.mock) {
                    // MOCK MODE — Stripe SDK not installed / no real key
                    const mockPayId = 'mock_pi_' + Date.now();
                    showStripeModal(summary.total, bookingRef, async () => {
                        // Mock payment verified — redirect to receipt directly
                        redirectToReceipt(bookingRef, payload, mockPayId);
                    });
                    payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
                    return;
                }

                // Real Stripe confirm using Stripe.js
                if (typeof Stripe === 'undefined') {
                    alert('Stripe.js not loaded. Please check your internet connection.');
                    payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
                    return;
                }

                const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE'); // <-- Replace with real Stripe publishable key
                const { paymentIntent, error } = await stripe.confirmCardPayment(intentData.client_secret, {
                    payment_method: {
                        card: { token: 'tok_visa' }, // Stripe test token
                        billing_details: { name: payload.name, email: payload.email }
                    }
                });

                if (error) {
                    alert('Payment failed: ' + error.message);
                    payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
                } else if (paymentIntent.status === 'succeeded') {
                    // Redirect to receipt directly — payment_api.php was removed
                    redirectToReceipt(bookingRef, payload, paymentIntent.id);
                }

            } catch (err) {
                console.error(err);
                alert('Payment error. If running locally, please open via XAMPP (http://localhost/Global-Horizon-Tour-main/), not file:// protocol.');
                payNowBtn.disabled = false; payNowBtn.innerText = 'Pay Now';
            }
        });
    }

    // ---- Handle "Confirm Booking" (non-cash payment) button ----
    if (bookingForm) bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const summary = updateSummary();
        const payload = collectBookingPayload(summary);

        const submitBtnEl = document.getElementById('submitBtn');
        if (submitBtnEl) { submitBtnEl.disabled = true; submitBtnEl.innerText = 'Confirming...'; }

        try {
            const data = await submitBookingToDB(payload);

            if (data.status === 'success') {
                localStorage.setItem('latestBooking', JSON.stringify({ ...payload, id: data.booking_ref }));
                redirectToReceipt(data.booking_ref, payload, 'CASH');
            } else {
                alert('Booking failed: ' + (data.message || 'Unknown error'));
                if (submitBtnEl) { submitBtnEl.disabled = false; submitBtnEl.innerText = 'Confirm Booking'; }
            }
        } catch (err) {
            alert('Server error. Please ensure XAMPP is running and visit via http://localhost/GHT/');
            if (submitBtnEl) { submitBtnEl.disabled = false; submitBtnEl.innerText = 'Confirm Booking'; }
        }
    });

    // ---- Stripe Mock Modal ----
    function showStripeModal(amount, bookingRef, onSuccess) {
        const overlay = document.createElement('div');
        overlay.id = 'stripe-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:#fff;border-radius:20px;padding:2.5rem;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" style="height:28px;" alt="Stripe">
                    <span style="font-size:0.8rem;color:#666;background:#f0f0f0;padding:3px 8px;border-radius:20px;">TEST MODE</span>
                </div>
                <p style="color:#022c43;font-weight:700;font-size:1.1rem;margin-bottom:0.3rem;">Total: ₹${amount.toLocaleString('en-IN')}</p>
                <p style="color:#888;font-size:0.85rem;margin-bottom:1.5rem;">Ref: ${bookingRef}</p>
                <div style="margin-bottom:1.2rem;">
                    <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;color:#022c43;">Card Number (Test)</label>
                    <input type="text" value="4242 4242 4242 4242" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;" readonly>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                    <div>
                        <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;color:#022c43;">Expiry</label>
                        <input type="text" value="12/28" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;" readonly>
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;color:#022c43;">CVV</label>
                        <input type="text" value="424" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;" readonly>
                    </div>
                </div>
                <button id="stripe-pay-confirm" style="width:100%;background:#635bff;color:white;border:none;padding:14px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
                    Pay ₹${amount.toLocaleString('en-IN')} Securely
                </button>
                <button id="stripe-pay-cancel" style="width:100%;background:none;border:none;padding:10px;color:#888;cursor:pointer;margin-top:8px;font-size:0.9rem;">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('stripe-pay-confirm').addEventListener('click', async () => {
            const btn = document.getElementById('stripe-pay-confirm');
            btn.disabled = true;
            btn.innerText = 'Verifying…';
            overlay.remove();
            await onSuccess();
        });

        document.getElementById('stripe-pay-cancel').addEventListener('click', () => {
            overlay.remove();
        });
    }


    // Initialize
    updateModeUI();
    updatePaymentUI();
    // Ensure correct step on load
    renderSteps();
});
