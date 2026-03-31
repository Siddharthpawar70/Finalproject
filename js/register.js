// Registration Page Logic - Connected to PHP Backend
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('regConfirmPassword');
    const strengthIndicator = document.getElementById('passwordStrength');

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

            try {
                const res = await fetch(window.API_BASE_URL + 'register_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, country, city, password })
                });
                const data = await res.json();

                alert(data.message || (data.status === 'success' ? 'Registration successful!' : 'Registration failed.'));

                if (data.status === 'success') {
                    window.location.href = 'login.html';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Create My Account';
                }
            } catch (err) {
                alert('Server error. Please ensure the PHP backend is running.');
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
