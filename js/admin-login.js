// Admin Login Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const toggleAdminPassword = document.getElementById('toggleAdminPassword');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminError = document.getElementById('adminError');

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
                const res = await fetch(window.API_BASE_URL + 'login_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, password })
                });
                const data = await res.json();

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
                adminError.innerText = 'Connection error. Is the backend running?';
                adminError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Secure Login';
            }
        });
    }
});
