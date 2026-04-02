// Inventory & Prices Management Logic connected to MySQL Backend
document.addEventListener('DOMContentLoaded', () => {
    const inventoryBody = document.getElementById('inventory-body');
    const searchInput = document.getElementById('admin-search');
    const categoryFilter = document.getElementById('category-filter');
    const modal = document.getElementById('item-modal');
    const itemForm = document.getElementById('item-form');
    const addItemBtn = document.getElementById('add-item-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const INVENTORY_KEY = 'customInventory';

    let inventory = [];

    const getStoredInventory = () => {
        try {
            const items = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
            return Array.isArray(items) ? items : [];
        } catch {
            return [];
        }
    };

    const saveStoredInventory = (items) => {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
    };

    async function fetchInventoryFromBackend() {
        const res = await fetch((window.API_BASE_URL || '../backend/') + 'admin_api.php?action=get_inventory');
        if (!res.ok) {
            throw new Error(`Inventory fetch failed (${res.status})`);
        }
        const data = await res.json();
        if (data.status !== 'success') {
            throw new Error(data.message || 'Inventory API returned an error.');
        }
        return data.inventory || [];
    }

    // 1. Fetch Inventory from DB
    async function loadInventory() {
        try {
            inventoryBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading data from database...</td></tr>';
            try {
                inventory = await fetchInventoryFromBackend();
            } catch (backendError) {
                console.warn('Inventory backend unavailable, using local fallback:', backendError);
                inventory = getStoredInventory();
            }
            renderInventory();
        } catch (err) {
            console.error('Failed to load inventory:', err);
            inventoryBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#e67e22;">Unable to load from server. Please refresh and try again.</td></tr>';
        }
    }

    // 2. Rendering
    function renderInventory() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryVal = categoryFilter.value;

        const filtered = inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                (item.category || '').toLowerCase().includes(searchTerm) ||
                (item.type || '').toLowerCase().includes(searchTerm);
            
            let matchesCategory = true;
            if (categoryVal === 'Package') {
                // "Special Packages" filter (by type)
                matchesCategory = item.type === 'package';
            } else if (categoryVal !== 'all') {
                // Specific category filter (e.g. India, honeymoon, etc.)
                matchesCategory = (item.category || '').toLowerCase() === categoryVal.toLowerCase();
            }
            
            return matchesSearch && matchesCategory;
        });

        inventoryBody.innerHTML = '';

        if (filtered.length === 0) {
            inventoryBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No items found matching your criteria.</td></tr>';
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            
            // Determine display category and type badge
            const isPackage = item.type === 'package';
            const categoryClass = (item.category || 'other').toLowerCase();
            const typeClass = isPackage ? 'type-pkg' : 'type-dest';
            
            tr.innerHTML = `
                <td>
                    <strong>${item.name}</strong> 
                    <span style="font-size: 0.7rem; color: #888; display: block;">ID: ${item.id}</span>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span class="tag ${categoryClass}">${item.category || 'Uncategorized'}</span>
                        <span class="type-badge ${typeClass}">${isPackage ? 'PACKAGE' : 'DESTINATION'}</span>
                    </div>
                </td>
                <td class="admin-price">₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
                <td>${item.airport || '—'}</td>
                <td>${item.railway || '—'}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit-btn" onclick="editItem(${item.id}, '${item.type}')" title="Edit Item"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-btn" onclick="deleteItem(${item.id}, '${item.type}')" title="Delete Item"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            inventoryBody.appendChild(tr);
        });
    }

    // 3. Modal Controls
    addItemBtn.onclick = () => {
        document.getElementById('modal-title').innerText = 'Add New Item';
        itemForm.reset();
        document.getElementById('item-id').value = '';
        
        // Add type selector if not exists
        let typeDiv = document.getElementById('type-selector-div');
        if (!typeDiv) {
            typeDiv = document.createElement('div');
            typeDiv.id = 'type-selector-div';
            typeDiv.className = 'form-group';
            typeDiv.innerHTML = `
                <label>Item Type</label>
                <select id="itemType" class="form-control" required>
                    <option value="destination">Destination</option>
                    <option value="package">Package</option>
                </select>
            `;
            itemForm.insertBefore(typeDiv, itemForm.firstChild);
        } else {
            document.getElementById('itemType').value = 'destination';
            document.getElementById('itemType').disabled = false;
        }
        
        modal.style.display = 'block';
    };

    closeModalBtns.forEach(btn => {
        btn.onclick = () => modal.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };

    // 4. Form Submission (Add/Edit)
    itemForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const submitBtn = itemForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const id = document.getElementById('item-id').value;
        const typeEl = document.getElementById('itemType');
        const type = typeEl ? typeEl.value : 'destination';
        
        const payload = {
            action: id ? 'edit_inventory' : 'add_inventory',
            id: id,
            type: type,
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            price: document.getElementById('itemPrice').value,
            airport: document.getElementById('itemAirport').value,
            railway: document.getElementById('itemRailway').value
        };

        try {
            let savedViaBackend = false;
            try {
                const res = await fetch((window.API_BASE_URL || '../backend/') + 'admin_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    throw new Error(`Inventory save failed (${res.status})`);
                }
                const data = await res.json();
                if (data.status !== 'success') {
                    throw new Error(data.message || 'Save failed.');
                }
                savedViaBackend = true;
            } catch (backendError) {
                console.warn('Inventory save backend unavailable, using local fallback:', backendError);
            }

            if (!savedViaBackend) {
                const stored = getStoredInventory();
                const normalized = {
                    id: id ? (Number(id) || id) : Date.now(),
                    type,
                    name: payload.name,
                    category: payload.category,
                    price: payload.price,
                    airport: payload.airport,
                    railway: payload.railway
                };
                if (id) {
                    inventory = stored.map(item => String(item.id) === String(id)
                        ? { ...item, ...normalized }
                        : item
                    );
                } else {
                    inventory = [...stored, normalized];
                }
                saveStoredInventory(inventory);
            }

            modal.style.display = 'none';
            loadInventory();
        } catch (err) {
            alert('Unable to save item right now. Please try again.');
        }
        
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save Item';
    };

    // 5. Global Actions (Exposed to window for onclick)
    window.editItem = (id, type) => {
        const item = inventory.find(i => i.id == id && i.type === type);
        if (!item) return;

        document.getElementById('modal-title').innerText = 'Edit Item Details';
        document.getElementById('item-id').value = item.id;
        
        let typeDiv = document.getElementById('type-selector-div');
        if (!typeDiv) {
            typeDiv = document.createElement('div');
            typeDiv.id = 'type-selector-div';
            typeDiv.className = 'form-group';
            typeDiv.innerHTML = `
                <label>Item Type</label>
                <select id="itemType" class="form-control" required disabled>
                    <option value="destination">Destination</option>
                    <option value="package">Package</option>
                </select>
            `;
            itemForm.insertBefore(typeDiv, itemForm.firstChild);
        }
        
        document.getElementById('itemType').value = item.type;
        document.getElementById('itemType').disabled = true; // Block changing type on edit
        
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemAirport').value = item.airport || '';
        document.getElementById('itemRailway').value = item.railway || '';

        modal.style.display = 'block';
    };

    window.deleteItem = async (id, type) => {
        if (confirm('Are you sure you want to remove this item permanently from the database?')) {
            try {
                let deletedViaBackend = false;
                try {
                    const res = await fetch((window.API_BASE_URL || '../backend/') + 'admin_api.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete_inventory', id: id, type: type })
                    });
                    if (!res.ok) {
                        throw new Error(`Delete failed (${res.status})`);
                    }
                    const data = await res.json();
                    if (data.status !== 'success') {
                        throw new Error(data.message || 'Delete failed.');
                    }
                    deletedViaBackend = true;
                } catch (backendError) {
                    console.warn('Inventory delete backend unavailable, using local fallback:', backendError);
                }

                if (!deletedViaBackend) {
                    inventory = getStoredInventory().filter(item => !(String(item.id) === String(id) && item.type === type));
                    saveStoredInventory(inventory);
                }

                loadInventory();
            } catch(e) {
                alert('Unable to delete item right now. Please try again.');
            }
        }
    };

    // 6. Listeners
    searchInput.oninput = renderInventory;
    categoryFilter.onchange = renderInventory;

    loadInventory();
});
