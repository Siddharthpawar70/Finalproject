// Gallery Page Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Zoom effect / Lightbox simulation logic for gallery images
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.zIndex = '10';
        });

        item.addEventListener('mouseleave', () => {
            item.style.zIndex = '1';
        });

        // Add a click-to-expand feature if needed
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                console.log(`Zooming into: ${img.alt}`);
                // Future implementation: Fullscreen Lightbox
            }
        });
    });

    // 2. Filter logic (if category buttons are added)
    // Categories: Beach, Hills, Culture, International
});
