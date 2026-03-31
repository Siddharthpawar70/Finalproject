// HorizonBot - Intelligent AI Travel Assistant for Global Horizons Travel
document.addEventListener('DOMContentLoaded', () => {

    // 1. Inject Chatbot UI into the page
    const chatbotHTML = `
        <div class="chatbot-launcher" id="chatbotBtn">
            <i class="fas fa-comment-dots"></i>
        </div>
        <div class="chatbot-window" id="chatbotWindow">
            <div class="chatbot-header">
                <div class="info">
                    <div class="globo-avatar">🤖</div>
                    <div>
                        <h4>HorizonBot</h4>
                        <p>Online & Ready</p>
                    </div>
                </div>
                <div class="close-btn" id="closeChatBtn"><i class="fas fa-times"></i></div>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <!-- Messages will appear here -->
            </div>
            <div class="chatbot-input-area">
                <input type="text" id="chatbotInput" placeholder="Type your message..." autocomplete="off">
                <button id="chatbotSendBtn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSendBtn = document.getElementById('chatbotSendBtn');

    let chatOpen = false;
    let initialMessageSent = false;

    // Toggle Chat Window
    chatbotBtn.addEventListener('click', () => {
        chatOpen = !chatOpen;
        chatbotWindow.style.display = chatOpen ? 'flex' : 'none';
        chatbotBtn.style.display = chatOpen ? 'none' : 'flex';
        
        if (chatOpen && !initialMessageSent) {
            handleInitialSequence();
            initialMessageSent = true;
        }
        if (chatOpen) chatbotInput.focus();
    });

    closeChatBtn.addEventListener('click', () => {
        chatOpen = false;
        chatbotWindow.style.display = 'none';
        chatbotBtn.style.display = 'flex';
    });

    async function handleInitialSequence() {
        showTypingIndicator();
        await new Promise(r => setTimeout(r, 1000));
        hideTypingIndicator();
        sendBotMessage("Hello! 👋 Welcome to **Global Horizon Tour**. I'm your AI travel assistant.");
        
        await new Promise(r => setTimeout(r, 800));
        showTypingIndicator();
        await new Promise(r => setTimeout(r, 1200));
        hideTypingIndicator();
        sendBotMessage("To help you get started, here are some of our core services:");
        showServices();
    }

    function showServices() {
        const servicesDiv = document.createElement('div');
        servicesDiv.className = 'services-container';
        servicesDiv.innerHTML = `
            <div class="service-card" onclick="handleServiceClick('Explore Destinations')">
                <i class="fas fa-globe-americas"></i>
                <span>150+ Destinations</span>
            </div>
            <div class="service-card" onclick="handleServiceClick('Custom Tours')">
                <i class="fas fa-map-marked-alt"></i>
                <span>Custom Tours</span>
            </div>
            <div class="service-card" onclick="handleServiceClick('24/7 Support')">
                <i class="fas fa-headset"></i>
                <span>24/7 Support</span>
            </div>
            <div class="service-card" onclick="handleServiceClick('Personalized Itinerary')">
                <i class="fas fa-magic"></i>
                <span>Personalized</span>
            </div>
        `;
        chatbotMessages.appendChild(servicesDiv);
        scrollToBottom();

        // Add Quick Replies after services
        setTimeout(() => {
            const quickReplies = ['View Packages', 'How to Book?', 'Contact Us'];
            showQuickReplies(quickReplies);
        }, 500);
    }

    window.handleServiceClick = (service) => {
        appendMessage(service, 'user');
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const response = generateAIResponse(service);
            sendBotMessage(response);
        }, 1000);
    };

    function showQuickReplies(replies) {
        const qrDiv = document.createElement('div');
        qrDiv.className = 'quick-replies';
        replies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.innerText = reply;
            btn.onclick = () => {
                appendMessage(reply, 'user');
                showTypingIndicator();
                setTimeout(() => {
                    hideTypingIndicator();
                    const response = generateAIResponse(reply);
                    sendBotMessage(response);
                    // Add follow-up quick replies if needed
                }, 800);
            };
            qrDiv.appendChild(btn);
        });
        chatbotMessages.appendChild(qrDiv);
        scrollToBottom();
    }

    // Send Message Event
    chatbotSendBtn.addEventListener('click', handleUserMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    function handleUserMessage() {
        const text = chatbotInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatbotInput.value = '';
        
        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();
            const response = generateAIResponse(text);
            sendBotMessage(response);
        }, 800 + Math.random() * 700);
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        chatbotMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function sendBotMessage(text) {
        appendMessage(text, 'bot');
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot typing-indicator-container';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        chatbotMessages.appendChild(indicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // AI Logic mapping based on rules
    function generateAIResponse(input) {
        let msg = input.toLowerCase();

        // Greetings & Identity
        if (/(hello|hi|hey|greetings|howdy)/i.test(msg)) {
            return "Hello again! 👋 Ready to explore 150+ global destinations? How can I help you today?";
        }
        if (/(who are you|your name|what are you)/i.test(msg)) {
            return "I am **HorizonBot**, an intelligent AI travel assistant for Global Horizons Travel. I'm here to help you explore find the perfect travel package!";
        }

        // Services specific triggers
        if (/(explore destinations|150\+ destinations|where can i go)/i.test(msg)) {
            return "We cover 150+ destinations! 🌍 Popular picks include **Paris, Dubai, Maldives, Switzerland, and Tokyo**. <br><br>Would you like to see our <a href='destinations.html' style='color:var(--accent); font-weight:700;'>Full Destination List</a>?";
        }
        if (/(custom tours|bespoke|tailored)/i.test(msg)) {
            return "Our **Bespoke World Tours** start from ₹50,000. You choose the destination, and we handle the rest! <br><br>Check the 'Custom Plan' section on the <a href='packages.html' style='color:var(--accent); font-weight:700;'>Packages Page</a>.";
        }
        if (/(24\/7 support|help|contact)/i.test(msg)) {
            return `<strong>📞 Reach us 24/7:</strong><br>
                    Phone: +91 1234566781<br>
                    Email: contact@ghtravel.com<br>
                    Our team is always ready to assist you!`;
        }
        if (/(personalized|itinerary|plan)/i.test(msg)) {
            return "We provide personalized itineraries for all our travelers! Our experts curate every detail to match your style. 🎨";
        }

        // Company Details
        if (/(about|company|overview|who is global|what is global|tagline)/i.test(msg)) {
            return "At Global Horizons Travel, our tagline is: *Explore Beyond Borders – Your Journey, Our Passion 🌍* We offer 150+ global destinations and custom tours.";
        }

        // Package Categories
        if (/(honeymoon|romantic|couple)/i.test(msg)) {
            return `For a **Honeymoon**, I recommend:<br>• **Maldives:** ₹2,85,000/couple<br>• **Santorini:** ₹3,45,000/couple<br>• **Paris:** ₹1,95,000/couple`;
        }
        if (/(family|kids|children)/i.test(msg)) {
            return `For **Family Getaways**:<br>• **Disneyland Paris:** ₹1,85,000/person<br>• **Singapore Discovery:** ₹1,45,000/person`;
        }
        if (/(book|how to book|booking)/i.test(msg)) {
          return 'Ready to book? Visit our <a href="booking.html" style="color:var(--accent); font-weight:700;">Booking Page</a> to get started!';
        }

        // Generic / Fallback
        return "I'm not entirely sure, but I can help you find destinations, packages, or guide you to contact our 24/7 support team! Would you like me to recommend a destination based on your budget or travel style?";
    }
});
