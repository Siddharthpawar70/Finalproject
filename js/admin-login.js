// Admin Login Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const toggleAdminPassword = document.getElementById('toggleAdminPassword');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminError = document.getElementById('adminError');

    const getStoredUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    };

    async function loginViaBackend(payload) {
        const res = await fetch(window.API_BASE_URL + 'login_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Backend admin login failed (${res.status})`);
        }

        return res.json();
    }

    function loginViaLocalStorage(payload) {
        const loginIdLower = payload.loginId.toLowerCase();
        const user = getStoredUsers().find(u =>
            ((u.email || '').toLowerCase() === loginIdLower || (u.phone || '').toLowerCase() === loginIdLower) &&
            u.password === payload.password
        );

        if (!user) {
            return { status: 'error', message: 'Invalid admin credentials.' };
        }

        if ((user.role || '').toLowerCase() !== 'admin') {
            return { status: 'error', message: 'Access Denied: Not an administrator account.' };
        }

        return {
            status: 'success',
            user: {
                name: user.name,
                email: user.email,
                role: 'admin'
            }
        };
    }

    // Toggle Password Visibility
    if (toggleAdminPassword) {
        toggleAdminPassword.addEventListener('click', function () {
            const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            adminError.style.display = 'none';

            const loginId = document.getElementById('adminId').value;
            const password = adminPasswordInput.value;

            const submitBtn = this.querySelector('button');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Verifying Credentials...';

            try {
                let data;
                try {
                    data = await loginViaBackend({ loginId, password });
                } catch (backendError) {
                    console.warn('Backend unavailable, using local admin login fallback:', backendError);
                    data = loginViaLocalStorage({ loginId, password });
                }

                if (data.status === 'success') {
                    if (data.user.role === 'admin') {
                        localStorage.setItem('isAdminLoggedIn', 'true');
                        localStorage.setItem('adminSession', JSON.stringify({
                            name: data.user.name,
                            email: data.user.email,
                            role: 'ADMIN_ACCESS',
                            loginTime: new Date().toLocaleString()
                        }));
                        window.location.href = 'admin.html';
                    } else {
                        adminError.innerText = 'Access Denied: Not an administrator account.';
                        adminError.style.display = 'block';
                    }
                } else {
                    adminError.innerText = data.message || 'Invalid admin credentials';
                    adminError.style.display = 'block';
                }
            } catch (err) {
                adminError.innerText = 'Unable to login right now. Please try again.';
                adminError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Secure Login';
            }
        });
    }
});
