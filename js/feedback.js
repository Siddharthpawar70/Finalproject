document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('mainFeedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you for your feedback! We appreciate your time.');
            this.reset();
        });
    }
});
