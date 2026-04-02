// Registration Page Logic - Connected to PHP Backend (with local fallback)
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('regConfirmPassword');
    const strengthIndicator = document.getElementById('passwordStrength');

    const getStoredUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    };

    const saveStoredUsers = (users) => {
        localStorage.setItem('registeredUsers', JSON.stringify(users));
    };

    const syncUserToLocalStorage = (payload, status = 'pending') => {
        const users = getStoredUsers();
        const emailLower = (payload.email || '').toLowerCase();
        const exists = users.some(u => (u.email || '').toLowerCase() === emailLower);

        if (exists) {
            return;
        }

        users.push({
            id: Date.now(),
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            country: payload.country,
            city: payload.city,
            password: payload.password,
            role: 'user',
            status,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        saveStoredUsers(users);
    };

    async function registerViaBackend(payload) {
        const res = await fetch(window.API_BASE_URL + 'register_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Backend registration failed (${res.status})`);
        }

        return res.json();
    }

    function registerViaLocalStorage(payload) {
        const users = getStoredUsers();
        const emailExists = users.some(u => (u.email || '').toLowerCase() === payload.email.toLowerCase());

        if (emailExists) {
            return {
                status: 'error',
                message: 'An account with this email already exists.'
            };
        }

        users.push({
            id: Date.now(),
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            country: payload.country,
            city: payload.city,
            password: payload.password,
            role: 'user',
            status: 'approved',
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        saveStoredUsers(users);

        return {
            status: 'success',
            message: 'Registration successful! You can now log in.'
        };
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const country = document.getElementById('regCountry').value.trim();
            const city = document.getElementById('regCity').value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const terms = document.getElementById('terms');

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match! Please try again.');
                return;
            }
            if (!terms.checked) {
                alert('You must agree to the Terms of Service.');
                return;
            }

            const submitBtn = document.getElementById('regSubmit');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Registering...';

            const payload = { name, email, phone, country, city, password };

            try {
                let data;
                try {
                    data = await registerViaBackend(payload);
                } catch (backendError) {
                    console.warn('Backend unavailable, using local registration fallback:', backendError);
                    data = registerViaLocalStorage(payload);
                }

                alert(data.message || (data.status === 'success' ? 'Registration successful!' : 'Registration failed.'));

                if (data.status === 'success') {
                    // Keep a local copy so admin/customer screens still work if backend becomes unavailable later.
                    const normalizedStatus = (data.user && data.user.status) || 'pending';
                    syncUserToLocalStorage(payload, normalizedStatus);
                    window.location.href = 'login.html';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Create My Account';
                }
            } catch (err) {
                alert('Registration failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerText = 'Create My Account';
            }
        });
    }

    // Password strength indicator
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', function () {
            const val = this.value;
            if (val.length === 0) {
                strengthIndicator.innerText = '';
                this.style.borderColor = '';
            } else if (val.length < 6) {
                strengthIndicator.innerText = 'Weak (min 6 chars)';
                strengthIndicator.style.color = '#e74c3c';
                this.style.borderColor = '#e74c3c';
            } else if (val.length < 10) {
                strengthIndicator.innerText = 'Medium';
                strengthIndicator.style.color = '#f39c12';
                this.style.borderColor = '#f39c12';
            } else {
                strengthIndicator.innerText = 'Strong';
                strengthIndicator.style.color = '#2ecc71';
                this.style.borderColor = '#2ecc71';
            }
        });
    }
});
