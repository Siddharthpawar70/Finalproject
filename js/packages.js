// Enhanced Packages Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('packageSearch');
    const filterChips = document.querySelectorAll('.filter-chip');
    const packageItems = document.querySelectorAll('.package-item');
    const noResults = document.getElementById('noResults');
    const toggleCustomFormBtn = document.getElementById('toggle-custom-form');
    const customFormSection = document.getElementById('custom-plan-section');

    let currentCategory = 'all';
    let searchTerm = '';

    // Function to filter packages
    const filterPackages = () => {
        let visibleCount = 0;

        packageItems.forEach(item => {
            const content = item.innerText.toLowerCase();
            const tag = item.querySelector('.tag');
            const itemCategory = tag ? tag.classList[1] : ''; // e.g. 'honeymoon'
            
            const matchesSearch = content.includes(searchTerm);
            const matchesCategory = currentCategory === 'all' || itemCategory === currentCategory;

            if (matchesSearch && matchesCategory) {
                item.style.display = 'grid';
                item.style.animation = 'fadeIn 0.5s ease forwards';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/Hide no results
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    };

    // Search Event
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            filterPackages();
        });
    }

    // Category Filter Event
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentCategory = chip.getAttribute('data-category');
            filterPackages();

            // Smooth scroll to top of list if not already there
            window.scrollTo({
                top: document.querySelector('.filter-section').offsetTop - 100,
                behavior: 'smooth'
            });
        });
    });

    // Bespoke Form Toggle
    if (toggleCustomFormBtn && customFormSection) {
        toggleCustomFormBtn.addEventListener('click', () => {
            const isVisible = customFormSection.style.display === 'block';
            customFormSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                customFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Form submission simulation
    const bespokeForm = document.getElementById('bespokeForm');
    if (bespokeForm) {
        bespokeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('🎉 Thank you! Your customized plan request has been sent to our expert consultants. We will reach out to you within 24 hours.');
            bespokeForm.reset();
            customFormSection.style.display = 'none';
        });
    }
});

// CSS for staggered animation if not already present
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
