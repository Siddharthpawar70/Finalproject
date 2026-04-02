// Admin Customers Management - PHP Backend Connected
document.addEventListener('DOMContentLoaded', async () => {
    const customerListBody = document.getElementById('customer-list-body');
    const emptyState = document.getElementById('empty-customers');
    const USERS_KEY = 'registeredUsers';

    const getStoredUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    };

    const saveStoredUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    async function fetchCustomersFromBackend() {
        const res = await fetch(window.API_BASE_URL + 'admin_api.php?action=get_users');
        if (!res.ok) {
            throw new Error(`Failed to fetch users (${res.status})`);
        }
        const data = await res.json();
        if (data.status === 'error') {
            throw new Error(data.message || 'Backend returned error while loading users.');
        }
        return data.users || [];
    }

    async function renderCustomers() {
        customerListBody.innerHTML = '<tr><td colspan="7" style="padding:2rem; text-align:center; color:#999;">Loading customers...</td></tr>';

        try {
            let users;
            try {
                users = await fetchCustomersFromBackend();
            } catch (backendError) {
                console.warn('Customers backend unavailable, using local fallback:', backendError);
                users = getStoredUsers();
            }

            customerListBody.innerHTML = '';

            users = (users || []).filter(u => (u.role || 'user') !== 'admin');

            if (users.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;"><strong>${user.name}</strong></td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">${user.email}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">${user.phone || 'N/A'}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">${user.city || ''}${user.city && user.country ? ', ' : ''}${user.country || 'N/A'}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee; font-size: 0.85rem; color: #666;">${user.created_at || 'N/A'}</td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee;">
                        <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; 
                            background: ${user.status === 'approved' ? '#e8f5e9' : (user.status === 'blocked' ? '#ffebee' : '#fff3e0')}; 
                            color: ${user.status === 'approved' ? '#2e7d32' : (user.status === 'blocked' ? '#c62828' : '#ef6c00')};">
                            ${user.status}
                        </span>
                    </td>
                    <td style="padding: 1.2rem; border-bottom: 1px solid #eee; text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${user.status !== 'approved' ?
                        `<button onclick="updateUserStatus(${user.id}, 'approved')" style="background: #2ecc71; color: #fff; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;"><i class="fas fa-check"></i> Approve</button>` :
                        `<button onclick="updateUserStatus(${user.id}, 'blocked')" style="background: #e74c3c; color: #fff; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;"><i class="fas fa-ban"></i> Block</button>`
                    }
                        </div>
                    </td>
                `;
                customerListBody.appendChild(tr);
            });
        } catch (err) {
            customerListBody.innerHTML = '<tr><td colspan="7" style="padding:2rem; text-align:center; color:#e67e22;">Unable to load from server. Please refresh and try again.</td></tr>';
        }
    }

    window.updateUserStatus = async (userId, newStatus) => {
        try {
            let updatedViaBackend = false;
            try {
                const res = await fetch(window.API_BASE_URL + 'admin_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_status', userId, status: newStatus })
                });
                if (!res.ok) {
                    throw new Error(`Failed to update user (${res.status})`);
                }
                const data = await res.json();
                if (data.status === 'error') {
                    throw new Error(data.message || 'Status update failed.');
                }
                updatedViaBackend = true;
                alert(data.message || 'Status updated.');
            } catch (backendError) {
                console.warn('Status update backend unavailable, using local fallback:', backendError);
            }

            if (!updatedViaBackend) {
                const users = getStoredUsers();
                const nextUsers = users.map(user => {
                    if (String(user.id) === String(userId)) {
                        return { ...user, status: newStatus };
                    }
                    return user;
                });
                saveStoredUsers(nextUsers);
                alert(`Status updated to ${newStatus} (local mode).`);
            }

            renderCustomers();
        } catch (err) {
            alert('Failed to update status right now. Please try again.');
        }
    };

    renderCustomers();
});
