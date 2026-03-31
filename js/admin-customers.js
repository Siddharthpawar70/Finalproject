// Admin Customers Management - PHP Backend Connected
document.addEventListener('DOMContentLoaded', async () => {
    const customerListBody = document.getElementById('customer-list-body');
    const emptyState = document.getElementById('empty-customers');

    async function renderCustomers() {
        customerListBody.innerHTML = '<tr><td colspan="7" style="padding:2rem; text-align:center; color:#999;">Loading customers...</td></tr>';

        try {
            const res = await fetch(window.API_BASE_URL + 'admin_api.php?action=get_users');
            const data = await res.json();

            customerListBody.innerHTML = '';

            const users = (data.users || []).filter(u => u.role !== 'admin');

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
            customerListBody.innerHTML = '<tr><td colspan="7" style="padding:2rem; text-align:center; color:#e74c3c;">Failed to load customers. Is the PHP backend running?</td></tr>';
        }
    }

    window.updateUserStatus = async (userId, newStatus) => {
        try {
            const res = await fetch(window.API_BASE_URL + 'admin_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', userId, status: newStatus })
            });
            const data = await res.json();
            alert(data.message || 'Status updated.');
            renderCustomers();
        } catch (err) {
            alert('Failed to update status. Server error.');
        }
    };

    renderCustomers();
});
