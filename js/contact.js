// Contact & Feedback Page Logic - PHP Backend Connected
document.addEventListener('DOMContentLoaded', () => {
    // 1. Contact Info Hover
    const contactLinks = document.querySelectorAll('.contact p strong');
    contactLinks.forEach(link => {
        link.parentElement.addEventListener('mouseenter', () => { link.style.color = '#f39c12'; });
        link.parentElement.addEventListener('mouseleave', () => { link.style.color = 'inherit'; });
    });

    // 2. Click to copy for phone/email
    const contactInfo = document.querySelectorAll('.contact-info p');
    contactInfo.forEach(p => {
        p.style.cursor = 'pointer';
        p.title = 'Click to copy';
        p.addEventListener('click', () => {
            const text = p.innerText.split(':')[1]?.trim() || p.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = p.innerHTML;
                p.innerHTML = `<strong>Copied!</strong> ${text}`;
                setTimeout(() => { p.innerHTML = originalText; }, 2000);
            });
        });
    });

    // 3. Feedback Form - Submit to PHP Backend
    const feedbackForm = document.getElementById('mainFeedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name    = document.getElementById('fb-name').value.trim();
            const email   = document.getElementById('fb-email').value.trim();
            const message = document.getElementById('fb-message').value.trim();
            const rating  = document.getElementById('fb-rating').value;

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending...';

            try {
                const res = await fetch(window.API_BASE_URL + 'contact_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        subject: `Feedback (Rating: ${rating}/5)`,
                        message
                    })
                });
                const data = await res.json();
                alert(data.message || 'Thank you for your feedback!');
                feedbackForm.reset();
                resetStars();
            } catch (err) {
                alert('Failed to submit feedback. Please ensure the backend server is running.');
            }
            submitBtn.disabled = false;
            submitBtn.innerText = 'Share Your Experience';
        });
    }

    // 4. Star Rating Logic
    const stars = document.querySelectorAll('.star-rating i');
    const ratingInput = document.getElementById('fb-rating');

    stars.forEach(star => {
        star.addEventListener('mouseover', () => highlightStars(star.getAttribute('data-rating')));
        star.addEventListener('mouseout', () => highlightStars(ratingInput.value));
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            ratingInput.value = rating;
            highlightStars(rating);
        });
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            star.style.color = star.getAttribute('data-rating') <= rating ? '#f39c12' : '#ddd';
        });
    }

    function resetStars() {
        ratingInput.value = 5;
        highlightStars(5);
    }

    if (ratingInput) highlightStars(ratingInput.value);
});
