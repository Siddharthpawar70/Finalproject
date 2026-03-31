// Forgot Password Logic
document.addEventListener('DOMContentLoaded', () => {
    const forgotStep1 = document.getElementById('forgotStep1');
    const forgotStep2 = document.getElementById('forgotStep2');
    const forgotStep3 = document.getElementById('forgotStep3');

    const step1Div = document.getElementById('step1');
    const step2Div = document.getElementById('step2');
    const step3Div = document.getElementById('step3');

    let targetUserEmail = '';

    // Step 1: Request OTP
    if (forgotStep1) {
        forgotStep1.addEventListener('submit', function (e) {
            e.preventDefault();
            const identifier = document.getElementById('forgotId').value;
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = users.find(u => u.email === identifier || u.phone === identifier);

            if (user) {
                targetUserEmail = user.email;
                const submitBtn = this.querySelector('button');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Sending...';

                setTimeout(() => {
                    alert(`OTP sent to your contact details (Simulated: 123456)`);
                    step1Div.style.display = 'none';
                    step2Div.style.display = 'block';
                }, 1000);
            } else {
                alert('Account not found! Please check your details.');
            }
        });
    }

    // Step 2: Verify OTP
    if (forgotStep2) {
        forgotStep2.addEventListener('submit', function (e) {
            e.preventDefault();
            const otp = document.getElementById('otpInput').value;

            if (otp === '123456') {
                const submitBtn = this.querySelector('button');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Verifying...';

                setTimeout(() => {
                    step2Div.style.display = 'none';
                    step3Div.style.display = 'block';
                }, 800);
            } else {
                alert('Invalid OTP. Please try again.');
            }
        });
    }

    // Step 3: Set New Password
    if (forgotStep3) {
        forgotStep3.addEventListener('submit', function (e) {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                alert('Passwords do not match!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userIndex = users.findIndex(u => u.email === targetUserEmail);

            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('registeredUsers', JSON.stringify(users));

                const submitBtn = this.querySelector('button');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Resetting...';

                setTimeout(() => {
                    alert('Password reset successful! Redirecting to login...');
                    window.location.href = 'login.html';
                }, 1200);
            } else {
                alert('Something went wrong. Please try again.');
                window.location.reload();
            }
        });
    }
});
