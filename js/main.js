// Site-wide JavaScript for Global Horizons Travel
// API_BASE_URL: Dynamically resolves backend path for XAMPP/local server
window.API_BASE_URL = (function() {
    const proto = window.location.protocol;
    const host  = window.location.host;
    const path  = window.location.pathname;
    // When served via file:// protocol, default to localhost with project folder
    if (proto === 'file:') {
        return 'http://localhost/Global-Horizon-Tour-main/backend/';
    }
    // When served via a web server, resolve backend relative to project root
    const root = path.substring(0, path.lastIndexOf('/') + 1);
    return root + 'backend/';
})();

document.addEventListener('DOMContentLoaded', () => {
    // 0. Login Wall — only redirect if on a page that requires login
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const publicPages = [
        'login.html', 'register.html', 'forgot-password.html', 'admin-login.html',
        'admin.html', 'admin-bookings.html', 'admin-customers.html', 'admin-prices.html', 'admin-settings.html',
        'index.html', 'about.html', 'contact.html', 'gallery.html', 
        'destinations.html', 'packages.html', 'documentation.html',
        'feedback.html', 'travel-assistant.html', ''
    ];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!isLoggedIn && !publicPages.includes(currentPage)) {
        window.location.href = 'login.html';
        return;
    }

    // Verify User Status if logged in
    if (isLoggedIn) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUser = users.find(u => u.email === currentUser.email);

        if (updatedUser && (updatedUser.status === 'blocked' || updatedUser.status === 'pending')) {
            alert('Your account access has been revoked by the administrator.');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
            return;
        }
    }
    // 1. Smooth Scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Navbar Background Change on Scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(2, 44, 67, 0.95)';
                navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = 'var(--primary)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // 3. Simple Animation Observer
    const animatedElements = document.querySelectorAll('.benefit-card, .destination-card, .package-item');
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // 4. Documentation Print Helper
    const printBtn = document.querySelector('.print-btn-fixed');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // 5. Destination Search Logic
    const searchInput = document.getElementById('dest-search');
    const searchBtn = document.getElementById('search-btn');

    const handleSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (window.location.pathname.includes('destinations.html')) {
            filterDestinations(query);
        } else if (query) {
            window.location.href = `destinations.html?search=${encodeURIComponent(query)}`;
        }
    };

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // Helper to filter destinations on the current page
    function filterDestinations(query) {
        const cards = document.querySelectorAll('.card, .destination-card, .item');
        const showMoreContainers = document.querySelectorAll('.show-more-container');
        
        // Hide "Show More" buttons during search
        showMoreContainers.forEach(container => {
            container.style.display = query ? 'none' : 'block';
        });

        cards.forEach(card => {
            if (!query) {
                card.style.display = ''; // Revert to CSS default (handles show-more nth-child logic)
                return;
            }
            const title = card.querySelector('h3, h1')?.innerText.toLowerCase();
            const desc = card.querySelector('p')?.innerText.toLowerCase();
            if (title?.includes(query) || desc?.includes(query)) {
                card.style.display = 'block';
                card.style.animation = 'fadeInCard 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });

        // Hide section headers if no cards are visible
        const grids = document.querySelectorAll('.grid');
        grids.forEach(grid => {
            const sectionHeader = grid.previousElementSibling;
            if (sectionHeader && (sectionHeader.tagName === 'H2' || sectionHeader.tagName === 'H1')) {
                const visibleCards = Array.from(grid.children).filter(child => child.style.display !== 'none');
                sectionHeader.style.display = (visibleCards.length > 0 || !query) ? 'block' : 'none';
            }
        });
    }

    // Check for search query in URL on load (for destinations.html)
    if (window.location.pathname.includes('destinations.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery && searchInput) {
            searchInput.value = searchQuery;
            filterDestinations(searchQuery.toLowerCase());
        }
    }

    // 6. Dynamic Navbar User State
    const updateNavbarForUser = () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userDropdown = document.querySelector('.user-dropdown .dropdown-content');

        if (isLoggedIn && currentUser.name && userDropdown) {
            userDropdown.innerHTML = `
                <div style="padding: 10px 15px; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #666;">
                    Hello, <strong>${currentUser.name.split(' ')[0]}</strong>
                </div>
                <a href="profile.html"><i class="fas fa-id-card"></i> My Profile</a>
                <a href="ticket.html"><i class="fas fa-ticket-alt"></i> My Tickets</a>
                <a href="#" id="dyn-logout-btn" style="color: #e74c3c;"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;

            // Re-attach logout listener
            const logoutBtn = document.getElementById('dyn-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('currentUser');
                    window.location.href = 'index.html';
                });
            }
        }
    };

    // 7. Mobile Menu Handler
    const initMobileMenu = () => {
        const nav = document.querySelector('.navbar');
        const navLinks = document.querySelector('.nav-links');

        if (nav && navLinks) {
            // Check if toggle already exists
            let mobileToggle = document.querySelector('.mobile-toggle');
            if (!mobileToggle) {
                mobileToggle = document.createElement('button');
                mobileToggle.className = 'mobile-toggle';
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                nav.appendChild(mobileToggle);
            }

            mobileToggle.onclick = (e) => {
                e.stopPropagation();
                navLinks.classList.toggle('active');
                mobileToggle.innerHTML = navLinks.classList.contains('active')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            };

            // Handle mobile dropdowns
            const dropdowns = navLinks.querySelectorAll('.booking-dropdown, .user-dropdown');
            dropdowns.forEach(dd => {
                const btn = dd.querySelector('.dropbtn, .user-icon-btn');
                const content = dd.querySelector('.dropdown-content');
                if (btn && content) {
                    btn.onclick = (e) => {
                        if (window.innerWidth <= 768) {
                            e.preventDefault();
                            e.stopPropagation();
                            content.classList.toggle('show-mobile');
                            // Toggle display manually if classes aren't enough
                            content.style.display = content.style.display === 'block' ? 'none' : 'block';
                        }
                    };
                }
            });

            // Close menu when clicking outside
            document.onclick = (e) => {
                if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            };

            // Close menu when clicking on a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.onclick = () => {
                    navLinks.classList.remove('active');
                    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                };
            });
        }
    };

    // 8. Apply Site Settings from Admin
    const applySiteSettings = () => {
        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        if (settings.heroTitle) {
            const heroEl = document.getElementById('home-hero-title');
            if (heroEl) heroEl.innerText = settings.heroTitle;
        }
        if (settings.phone) {
            const phoneEl = document.getElementById('contact-phone');
            if (phoneEl) phoneEl.innerText = '📞 ' + settings.phone;
        }
        if (settings.email) {
            const emailEl = document.getElementById('contact-email');
            if (emailEl) emailEl.innerText = '📧 ' + settings.email;
        }
        if (settings.footerText) {
            const footerEl = document.getElementById('footer-copyright');
            if (footerEl) footerEl.innerText = settings.footerText;
        }
    };

    updateNavbarForUser();
    initMobileMenu();
    applySiteSettings();
});
