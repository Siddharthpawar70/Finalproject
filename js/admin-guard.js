// Admin Access Guard for Security
(function() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    const currentAdminPage = window.location.pathname.split('/').pop() || 'admin.html';

    // Role-Based Access: Secure Access to all Admin Pages
    const adminPagesList = [
        'admin.html',
        'admin-bookings.html',
        'admin-customers.html',
        'admin-prices.html',
        'admin-settings.html'
    ];

    if (adminPagesList.includes(currentAdminPage) && !isAdminLoggedIn) {
        // Only admin can access these; redirect normal users to admin login
        window.location.href = 'admin-login.html';
    }
})();
