// Login Page Logic - Connected to PHP Backend (with local fallback)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

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
            throw new Error(`Backend login failed (${res.status})`);
        }

        return res.json();
    }

    function loginViaLocalStorage(payload) {
        const loginIdLower = payload.loginId.toLowerCase();
        const user = getStoredUsers().find(u =>
            (u.email || '').toLowerCase() === loginIdLower ||
            (u.phone || '').toLowerCase() === loginIdLower
        );

        if (!user || user.password !== payload.password) {
            return { status: 'error', message: 'Invalid email/phone or password.' };
        }

        if (user.status === 'blocked' || user.status === 'pending') {
            return { status: 'error', message: `Account is ${user.status}. Contact support.` };
        }

        return {
            status: 'success',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                city: user.city,
                role: user.role || 'user',
                status: user.status || 'approved'
            }
        };
    }

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
                let data;
                try {
                    data = await loginViaBackend({ loginId, password });
                } catch (backendError) {
                    console.warn('Backend unavailable, using local login fallback:', backendError);
                    data = loginViaLocalStorage({ loginId, password });
                }

                if (data.status === 'success') {
                    if (rememberMe) {
                        localStorage.setItem('rememberedUserId', loginId);
                    } else {
                        localStorage.removeItem('rememberedUserId');
                    }

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
                loginError.innerText = 'Unable to login right now. Please try again.';
                loginError.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerText = 'Login to Account';
            }
        });
    }
});
