// Travel Assistance & Team Expert Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Assistant Section Toggle (Used in about.html)
    const assistantBtn = document.getElementById('show-assistant-btn');
    const assistantSection = document.getElementById('assistant-section');

    if (assistantBtn && assistantSection) {
        assistantBtn.addEventListener('click', function () {
            const isHidden = assistantSection.style.display === 'none' || !assistantSection.style.display;

            if (isHidden) {
                assistantSection.style.display = 'block';
                setTimeout(() => {
                    assistantSection.style.opacity = '1';
                    assistantSection.style.transform = 'translateY(0)';
                }, 10);
                this.innerHTML = '<i class="fas fa-times mr-2"></i> Hide Assistants';
                this.style.background = '#7f8c8d';
                assistantSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                assistantSection.style.opacity = '0';
                assistantSection.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    assistantSection.style.display = 'none';
                }, 500);
                this.innerHTML = '<i class="fas fa-user-tie mr-2"></i> Meet Our Travel Assistants';
                this.style.background = ''; // Resets to primary via CSS
            }
        });
    }

    // 2. Expert Card Interaction (Alert System)
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        card.addEventListener('click', () => {
            const name = card.querySelector('h4').innerText;
            const specialty = card.querySelector('.specialty')?.innerText || 'Travel Expert';

            // Custom premium alert simulation
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 0.3s;';

            overlay.innerHTML = `
                <div style="background:white;padding:2rem;border-radius:15px;text-align:center;max-width:400px;transform:scale(0.8);transition:transform 0.3s;">
                    <i class="fas fa-user-check" style="font-size:3rem;color:#022c43;margin-bottom:1rem;"></i>
                    <h2 style="color:#022c43;margin-bottom:0.5rem;">Connecting...</h2>
                    <p style="color:#666;margin-bottom:1.5rem;">You are now connecting with <strong>${name}</strong>, our <strong>${specialty}</strong>. They will reach out to your registered email shortly.</p>
                    <button id="close-connect" style="background:#f39c12;color:#022c43;border:none;padding:0.8rem 2rem;border-radius:8px;font-weight:700;cursor:pointer;">Great!</button>
                </div>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.children[0].style.transform = 'scale(1)';
            }, 10);

            overlay.querySelector('#close-connect').addEventListener('click', () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            });
        });
    });
});
