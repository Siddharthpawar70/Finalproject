// About Page Core Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mission/Values Section Animation
    const infoSections = document.querySelectorAll('.about-intro, .mission-vision');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // We'll use CSS to handle the transitions based on this class
            }
        });
    }, { threshold: 0.2 });

    infoSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transition = 'all 0.8s ease-out';
        revealObserver.observe(section);
    });

    // 2. Company History Stats (Counter)
    // If we add stats counters like "10 Years", "50k Happy Clients"

});
