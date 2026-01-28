// ANISHA - Advanced Neural Intelligent System for Human Assistance
// Main JavaScript File

// Global State
const state = {
    aiName: 'ANISHA',
    userName: '',
    isListening: false,
    isSpeaking: false,
    isWakeWordEnabled: true,
    soundEnabled: true,
    currentMode: 'general',
    conversation: [],
    memory: {
        preferences: {},
        conversationCount: 0
    },
    apiConfig: {
        key: '',
        endpoint: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat'
    }
};

// DOM Elements
const elements = {
    // Core UI
    aiName: document.getElementById('ai-name'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    conversation: document.getElementById('conversation'),
    userInput: document.getElementById('user-input'),
    voiceBtn: document.getElementById('voice-btn'),
    voiceIndicator: document.getElementById('voice-indicator'),
    sendBtn: document.getElementById('send-btn'),
    
    // Control buttons
    soundToggle: document.getElementById('sound-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    settingsBtn: document.getElementById('settings-btn'),
    wakeToggle: document.getElementById('wake-toggle'),
    wakeStatus: document.getElementById('wake-status'),
    quickHelp: document.getElementById('quick-help'),
    clearChat: document.getElementById('clear-chat'),
    exportChat: document.getElementById('export-chat'),
    
    // Mode buttons
    programmingModeBtn: document.getElementById('programming-mode-btn'),
    astronomyModeBtn: document.getElementById('astronomy-mode-btn'),
    
    // Memory elements
    memoryName: document.getElementById('memory-name'),
    memoryConversations: document.getElementById('memory-conversations'),
    memoryPreferences: document.getElementById('memory-preferences'),
    setNameBtn: document.getElementById('set-name-btn'),
    refreshMemory: document.getElementById('refresh-memory'),
    resetMemoryBtn: document.getElementById('reset-memory-btn'),
    
    // Modals
    settingsModal: document.getElementById('settings-modal'),
    helpModal: document.getElementById('help-modal'),
    settingsClose: document.getElementById('settings-close'),
    helpClose: document.getElementById('help-close'),
    
    // Settings inputs
    aiNameInput: document.getElementById('ai-name-input'),
    apiKeyInput: document.getElementById('api-key-input'),
    userNameInput: document.getElementById('user-name-input'),
    aiModel: document.getElementById('ai-model'),
    aiPersonality: document.getElementById('ai-personality'),
    voiceSpeed: document.getElementById('voice-speed'),
    voicePitch: document.getElementById('voice-pitch'),
    soundEffects: document.getElementById('sound-effects'),
    saveAiName: document.getElementById('save-ai-name'),
    saveApiKey: document.getElementById('save-api-key'),
    saveUserName: document.getElementById('save-user-name'),
    saveSettings: document.getElementById('save-settings'),
    resetSettings: document.getElementById('reset-settings'),
    
    // Sound elements
    soundWake: document.getElementById('sound-wake'),
    soundSend: document.getElementById('sound-send'),
    soundReceive: document.getElementById('sound-receive'),
    soundMode: document.getElementById('sound-mode'),
    soundError: document.getElementById('sound-error')
};

// Speech Recognition and Synthesis
let recognition = null;
let synthesis = null;
let wakeWordRecognition = null;

// Initialize the application
function init() {
    loadStateFromStorage();
    setupEventListeners();
    initializeSpeech();
    createStarfield();
    updateUI();
    addMessage('ai', "Hello! I'm ANISHA, your Advanced Neural Intelligent System for Human Assistance. How can I help you today?");
    
    // Check if API key is set
    if (!state.apiConfig.key) {
        setTimeout(() => {
            addMessage('ai', "I notice you haven't set up your API key yet. Please go to Settings to add your DeepSeek or OpenAI API key to enable full functionality.");
        }, 2000);
    }
}

// Load state from localStorage
function loadStateFromStorage() {
    const savedState = localStorage.getItem('anisha_state');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(state, parsed);
    }
    
    // Update UI from state
    elements.aiName.textContent = state.aiName;
    elements.aiNameInput.value = state.aiName;
    
    if (state.userName) {
        elements.memoryName.textContent = state.userName;
        elements.userNameInput.value = state.userName;
    }
    
    elements.memoryConversations.textContent = state.memory.conversationCount;
    elements.wakeStatus.textContent = `Wake Word: ${state.isWakeWordEnabled ? 'Enabled' : 'Disabled'}`;
    
    // Update sound toggle icon
    elements.soundToggle.innerHTML = state.soundEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
}

// Save state to localStorage
function saveStateToStorage() {
    localStorage.setItem('anisha_state', JSON.stringify(state));
}

// Set up event listeners
function setupEventListeners() {
    // Send message on button click
    elements.sendBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    elements.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Voice input
    elements.voiceBtn.addEventListener('click', toggleVoiceInput);
    
    // Control buttons
    elements.soundToggle.addEventListener('click', toggleSound);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.settingsBtn.addEventListener('click', () => openModal('settings-modal'));
    elements.wakeToggle.addEventListener('click', toggleWakeWord);
    elements.quickHelp.addEventListener('click', () => openModal('help-modal'));
    elements.clearChat.addEventListener('click', clearConversation);
    elements.exportChat.addEventListener('click', exportConversation);
    
    // Mode buttons
    elements.programmingModeBtn.addEventListener('click', () => switchMode('programming'));
    elements.astronomyModeBtn.addEventListener('click', () => switchMode('astronomy'));
    
    // Memory buttons
    elements.setNameBtn.addEventListener('click', promptUserName);
    elements.refreshMemory.addEventListener('click', updateMemoryDisplay);
    elements.resetMemoryBtn.addEventListener('click', resetMemory);
    
    // Modal close buttons
    elements.settingsClose.addEventListener('click', () => closeModal('settings-modal'));
    elements.helpClose.addEventListener('click', () => closeModal('help-modal'));
    
    // Settings save buttons
    elements.saveAiName.addEventListener('click', saveAiName);
    elements.saveApiKey.addEventListener('click', saveApiKey);
    elements.saveUserName.addEventListener('click', saveUserName);
    elements.saveSettings.addEventListener('click', saveAllSettings);
    elements.resetSettings.addEventListener('click', resetSettingsToDefault);
    
    // Settings real-time updates
    elements.voiceSpeed.addEventListener('input', updateVoiceSpeed);
    elements.voicePitch.addEventListener('input', updateVoicePitch);
    elements.soundEffects.addEventListener('change', toggleSoundEffects);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Initialize speech recognition and synthesis
function initializeSpeech() {
    // Check for browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.userInput.value = transcript;
            
            // Check for wake word in the transcript
            if (transcript.toLowerCase().includes('hey anisha') || transcript.toLowerCase().includes('hey anisha')) {
                const command = transcript.toLowerCase().replace('hey anisha', '').replace('hey anisha', '').trim();
                if (command) {
                    elements.userInput.value = command;
                    sendMessage();
                } else {
                    // Just wake word, start listening again
                    playSound('wake');
                    setStatus('listening');
                    setTimeout(() => recognition.start(), 500);
                }
            } else {
                // No wake word, process as direct command
                sendMessage();
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setStatus('error', 'Voice recognition error');
            setTimeout(() => setStatus('ready'), 2000);
        };
        
        recognition.onend = () => {
            if (state.isListening && state.isWakeWordEnabled) {
                // Restart recognition for continuous listening
                setTimeout(() => recognition.start(), 100);
            } else {
                elements.voiceIndicator.classList.remove('active');
                state.isListening = false;
            }
        };
    } else {
        console.warn('Speech recognition not supported in this browser');
        elements.voiceBtn.style.display = 'none';
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        synthesis = window.speechSynthesis;
    }
}

// Toggle voice input
function toggleVoiceInput() {
    if (!recognition) {
        addMessage('ai', 'Voice input is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    if (state.isListening) {
        recognition.stop();
        state.isListening = false;
        elements.voiceIndicator.classList.remove('active');
        setStatus('ready');
    } else {
        playSound('wake');
        setStatus('listening');
        recognition.start();
        state.isListening = true;
        elements.voiceIndicator.classList.add('active');
    }
}

// Toggle wake word detection
function toggleWakeWord() {
    state.isWakeWordEnabled = !state.isWakeWordEnabled;
    elements.wakeStatus.textContent = `Wake Word: ${state.isWakeWordEnabled ? 'Enabled' : 'Disabled'}`;
    
    if (state.isWakeWordEnabled && !state.isListening) {
        // Start listening for wake word
        recognition.start();
        state.isListening = true;
    } else if (!state.isWakeWordEnabled && state.isListening) {
        // Stop listening
        recognition.stop();
        state.isListening = false;
        elements.voiceIndicator.classList.remove('active');
    }
    
    saveStateToStorage();
    playSound('mode');
}

// Toggle sound effects
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    elements.soundToggle.innerHTML = state.soundEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
    saveStateToStorage();
    playSound('send'); // Play sound to demonstrate
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        body.removeAttribute('data-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        body.setAttribute('data-theme', 'light');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Switch mode (programming, astronomy, general)
function switchMode(mode) {
    state.currentMode = mode;
    playSound('mode');
    
    let message = '';
    switch(mode) {
        case 'programming':
            message = "Programming mode activated. I can now help you with coding in HTML, CSS, JavaScript, Python, and more. What would you like to build?";
            break;
        case 'astronomy':
            message = "Astronomy mode activated. I can now explain space concepts, celestial events, and discuss 2026 astronomy events. What would you like to know about?";
            break;
        default:
            message = "General conversation mode activated. How can I assist you?";
    }
    
    addMessage('ai', message);
    setStatus('speaking');
    speakText(message);
    
    // Update UI to show active mode
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.textContent = btn.dataset.mode === mode ? 'Active' : 'Activate';
    });
}

// Send message to AI
async function sendMessage() {
    const message = elements.userInput.value.trim();
    if (!message) return;
    
    // Add user message to UI
    addMessage('user', message);
    elements.userInput.value = '';
    playSound('send');
    
    // Show typing indicator
    showTypingIndicator();
    setStatus('thinking');
    
    // Prepare API request
    const requestBody = {
        model: state.apiConfig.model,
        messages: [
            { role: 'system', content: getSystemPrompt() },
            ...state.conversation.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
    };
    
    try {
        // Check if API key is set
        if (!state.apiConfig.key) {
            throw new Error('API key not set. Please add your API key in Settings.');
        }
        
        const response = await fetch(state.apiConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiConfig.key}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response to UI
        addMessage('ai', aiResponse);
        playSound('receive');
        
        // Speak the response
        setStatus('speaking');
        speakText(aiResponse);
        
        // Update conversation count in memory
        state.memory.conversationCount++;
        updateMemoryDisplay();
        saveStateToStorage();
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        setStatus('error', 'API Error');
        
        // Show error message
        const errorMessage = error.message.includes('API key') ? 
            error.message : 
            "I'm having trouble connecting to the AI service. Please check your API key and internet connection.";
        
        addMessage('ai', errorMessage);
        playSound('error');
        
        setTimeout(() => setStatus('ready'), 3000);
    }
}

// Get system prompt based on current mode
function getSystemPrompt() {
    const basePrompt = `You are ${state.aiName}, an advanced AI assistant with a calm, intelligent, and slightly emotional but professional female personality. The user's name is ${state.userName || 'the user'}.`;
    
    switch(state.currentMode) {
        case 'programming':
            return `${basePrompt} You are now in programming assistant mode. Help with writing, debugging, and explaining code in HTML, CSS, JavaScript, Python, and other languages. Provide step-by-step explanations and complete code examples.`;
        case 'astronomy':
            return `${basePrompt} You are now in astronomy mode. Explain space concepts, celestial events, and discuss 2026 astronomy events in an engaging way. Use current scientific understanding and make complex topics accessible.`;
        default:
            return `${basePrompt} Be helpful, supportive, and engaging in general conversation.`;
    }
}

// Add message to conversation UI
function addMessage(sender, text) {
    const messageId = Date.now();
    const message = {
        id: messageId,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add to state
    state.conversation.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: text
    });
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    messageEl.id = `msg-${messageId}`;
    
    const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const senderName = sender === 'user' ? (state.userName || 'You') : state.aiName;
    
    messageEl.innerHTML = `
        <div class="message-avatar">
            ${sender === 'ai' ? '<div class="avatar-pulse"></div>' : ''}
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="message-sender">${senderName}</div>
            <div class="message-text">${formatMessageText(text)}</div>
            <div class="message-time">${message.timestamp}</div>
        </div>
    `;
    
    elements.conversation.appendChild(messageEl);
    
    // Scroll to bottom
    elements.conversation.scrollTop = elements.conversation.scrollHeight;
    
    // If AI message, add typing animation
    if (sender === 'ai') {
        typeMessageText(messageEl.querySelector('.message-text'), text);
    }
}

// Format message text (convert markdown-like syntax)
function formatMessageText(text) {
    // Convert **bold** to <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code` to <code>
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Type message text with animation
function typeMessageText(element, text) {
    element.innerHTML = '';
    let i = 0;
    const speed = 20; // milliseconds per character
    
    function typeWriter() {
        if (i < text.length) {
            // Get next character
            const char = text.charAt(i);
            
            // Handle special formatting
            if (char === '*' && text.charAt(i+1) === '*') {
                // Bold text
                let end = text.indexOf('**', i+2);
                if (end !== -1) {
                    const boldText = text.substring(i+2, end);
                    element.innerHTML += `<strong>${boldText}</strong>`;
                    i = end + 2;
                    typeWriter();
                    return;
                }
            } else if (char === '`') {
                // Code text
                let end = text.indexOf('`', i+1);
                if (end !== -1) {
                    const codeText = text.substring(i+1, end);
                    element.innerHTML += `<code>${codeText}</code>`;
                    i = end + 1;
                    typeWriter();
                    return;
                }
            }
            
            // Regular character
            element.innerHTML += char === '\n' ? '<br>' : char;
            i++;
            setTimeout(typeWriter, speed);
            
            // Scroll to bottom as we type
            elements.conversation.scrollTop = elements.conversation.scrollHeight;
        }
    }
    
    typeWriter();
}

// Show typing indicator
function showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'message ai-message';
    typingEl.id = 'typing-indicator';
    
    typingEl.innerHTML = `
        <div class="message-avatar">
            <div class="avatar-pulse"></div>
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-sender">${state.aiName}</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    elements.conversation.appendChild(typingEl);
    elements.conversation.scrollTop = elements.conversation.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
        typingEl.remove();
    }
}

// Speak text using speech synthesis
function speakText(text) {
    if (!synthesis || state.isSpeaking) return;
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(elements.voiceSpeed.value);
    utterance.pitch = parseFloat(elements.voicePitch.value);
    utterance.volume = 1;
    
    // Select a female voice if available
    const voices = synthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || voice.name.includes('woman') || voice.name.includes('Woman')
    );
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    // Event handlers
    utterance.onstart = () => {
        state.isSpeaking = true;
        // Add pulsing animation to AI core
        document.querySelector('.ai-core').style.animation = 'pulse-ring 1s infinite';
    };
    
    utterance.onend = () => {
        state.isSpeaking = false;
        setStatus('ready');
        // Remove pulsing animation
        document.querySelector('.ai-core').style.animation = '';
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        state.isSpeaking = false;
        setStatus('ready');
        document.querySelector('.ai-core').style.animation = '';
    };
    
    // Speak
    synthesis.speak(utterance);
}

// Set status indicator
function setStatus(status, customText = '') {
    const statusDot = elements.statusDot;
    const statusText = elements.statusText;
    
    switch(status) {
        case 'ready':
            statusDot.style.background = 'var(--success-color)';
            statusDot.style.boxShadow = '0 0 10px var(--success-color)';
            statusText.textContent = 'Ready';
            break;
        case 'listening':
            statusDot.style.background = 'var(--warning-color)';
            statusDot.style.boxShadow = '0 0 10px var(--warning-color)';
            statusText.textContent = 'Listening...';
            break;
        case 'thinking':
            statusDot.style.background = 'var(--primary-color)';
            statusDot.style.boxShadow = '0 0 10px var(--primary-color)';
            statusText.textContent = 'Thinking...';
            break;
        case 'speaking':
            statusDot.style.background = 'var(--secondary-color)';
            statusDot.style.boxShadow = '0 0 10px var(--secondary-color)';
            statusText.textContent = 'Speaking...';
            break;
        case 'error':
            statusDot.style.background = 'var(--error-color)';
            statusDot.style.boxShadow = '0 0 10px var(--error-color)';
            statusText.textContent = customText || 'Error';
            break;
    }
}

// Play sound effect
function playSound(type) {
    if (!state.soundEnabled) return;
    
    const sound = elements[`sound-${type}`];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound play failed:', e));
    }
}

// Update UI based on state
function updateUI() {
    // Update AI name in UI
    elements.aiName.textContent = state.aiName;
    
    // Update memory display
    updateMemoryDisplay();
    
    // Update voice speed/pitch display
    document.getElementById('voice-speed-value').textContent = elements.voiceSpeed.value;
    document.getElementById('voice-pitch-value').textContent = elements.voicePitch.value;
}

// Update memory display
function updateMemoryDisplay() {
    elements.memoryName.textContent = state.userName || 'Not set';
    elements.memoryConversations.textContent = state.memory.conversationCount;
    
    // Count preferences
    const prefCount = Object.keys(state.memory.preferences).length;
    elements.memoryPreferences.textContent = prefCount > 0 ? `${prefCount} set` : 'Default';
}

// Prompt for user name
function promptUserName() {
    const name = prompt('Please enter your name:', state.userName || '');
    if (name !== null) {
        state.userName = name.trim();
        elements.memoryName.textContent = state.userName;
        elements.userNameInput.value = state.userName;
        saveStateToStorage();
        addMessage('ai', `Nice to meet you, ${state.userName}! I'll remember your name for our future conversations.`);
    }
}

// Reset memory
function resetMemory() {
    if (confirm('Are you sure you want to reset your memory? This will clear your name and preferences.')) {
        state.userName = '';
        state.memory.preferences = {};
        state.memory.conversationCount = 0;
        
        updateMemoryDisplay();
        saveStateToStorage();
        addMessage('ai', 'Memory has been reset. How can I help you today?');
    }
}

// Clear conversation
function clearConversation() {
    if (confirm('Are you sure you want to clear the conversation?')) {
        elements.conversation.innerHTML = '';
        state.conversation = [];
        
        // Add welcome message back
        addMessage('ai', "Hello! I'm ANISHA, your Advanced Neural Intelligent System for Human Assistance. How can I help you today?");
    }
}

// Export conversation
function exportConversation() {
    const conversationText = state.conversation.map(msg => 
        `${msg.role === 'user' ? (state.userName || 'You') : state.aiName}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ANISHA-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    playSound('mode');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Save AI name
function saveAiName() {
    const newName = elements.aiNameInput.value.trim();
    if (newName && newName !== state.aiName) {
        state.aiName = newName;
        elements.aiName.textContent = newName;
        saveStateToStorage();
        playSound('mode');
        alert(`AI name changed to ${newName}`);
    }
}

// Save API key
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (apiKey) {
        state.apiConfig.key = apiKey;
        saveStateToStorage();
        playSound('mode');
        alert('API key saved successfully!');
    } else {
        alert('Please enter a valid API key.');
    }
}

// Save user name
function saveUserName() {
    const userName = elements.userNameInput.value.trim();
    if (userName && userName !== state.userName) {
        state.userName = userName;
        elements.memoryName.textContent = userName;
        saveStateToStorage();
        playSound('mode');
        alert(`Your name has been saved as ${userName}`);
    }
}

// Save all settings
function saveAllSettings() {
    // Save AI model
    state.apiConfig.model = elements.aiModel.value;
    
    // Save personality (not fully implemented, but stored)
    state.memory.preferences.personality = elements.aiPersonality.value;
    
    saveStateToStorage();
    closeModal('settings-modal');
    playSound('mode');
    addMessage('ai', 'Settings have been saved successfully.');
}

// Reset settings to default
function resetSettingsToDefault() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        // Reset state to defaults
        state.aiName = 'ANISHA';
        state.apiConfig.model = 'deepseek-chat';
        state.memory.preferences = {};
        
        // Reset UI elements
        elements.aiNameInput.value = state.aiName;
        elements.aiModel.value = state.apiConfig.model;
        elements.aiPersonality.value = 'calm';
        elements.voiceSpeed.value = 1;
        elements.voicePitch.value = 1;
        elements.soundEffects.checked = true;
        
        // Update display
        updateUI();
        saveStateToStorage();
        playSound('mode');
        
        alert('Settings have been reset to default values.');
    }
}

// Update voice speed display
function updateVoiceSpeed() {
    document.getElementById('voice-speed-value').textContent = elements.voiceSpeed.value;
}

// Update voice pitch display
function updateVoicePitch() {
    document.getElementById('voice-pitch-value').textContent = elements.voicePitch.value;
}

// Toggle sound effects from checkbox
function toggleSoundEffects() {
    state.soundEnabled = elements.soundEffects.checked;
    elements.soundToggle.innerHTML = state.soundEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
    saveStateToStorage();
}

// Create animated starfield
function createStarfield() {
    const starfield = document.getElementById('starfield');
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size and opacity
        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.7 + 0.3;
        
        // Random animation duration and delay
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 5;
        
        star.style.position = 'absolute';
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.backgroundColor = 'white';
        star.style.borderRadius = '50%';
        star.style.opacity = opacity.toString();
        star.style.boxShadow = '0 0 10px white';
        star.style.animation = `twinkle ${duration}s infinite ${delay}s`;
        
        starfield.appendChild(star);
    }
    
    // Add CSS for twinkle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+/ for help
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        openModal('help-modal');
    }
    
    // Esc to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // Ctrl+Enter to send message
    if (e.ctrlKey && e.key === 'Enter') {
        sendMessage();
    }
});
