// Login Page Logic - Connected to PHP Backend
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    // Toggle Password Visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Load Remembered User
    const rememberedId = localStorage.getItem('rememberedUserId');
    if (rememberedId) {
        document.getElementById('loginId').value = rememberedId;
        document.getElementById('rememberMe').checked = true;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            loginError.style.display = 'none';

            const loginId = document.getElementById('loginId').value.trim();
            const password = passwordInput.value;
            const rememberMe = document.getElementById('rememberMe').checked;

            const submitBtn = document.getElementById('loginSubmit');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Authenticating...';

            try {
                const res = await fetch(window.API_BASE_URL + 'login_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, password })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    // Remember me
                    if (rememberMe) {
                        localStorage.setItem('rememberedUserId', loginId);
                    } else {
                        localStorage.removeItem('rememberedUserId');
                    }

                    // Store session info in localStorage for UI state
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(data.user));

                    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'profile.html';
                } else {
                    loginError.innerText = data.message || 'Login failed.';
                    loginError.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Login to Account';
                }
            } catch (err) {
                loginError.innerText = 'Server error. Please ensure the PHP backend is running.';
                loginError.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerText = 'Login to Account';
            }
        });
    }
});
