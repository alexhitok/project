/**
 * DogMeetDog – script.js
 * Main application logic for the dog meetup app.
 * Uses localStorage to persist liked dogs and user-added dogs.
 */

/* =========================================================
   SAMPLE DATA
   ========================================================= */
const SAMPLE_DOGS = [
  {
    id: 'dog-1',
    name: 'Бела',
    age: 3,
    district: 'Лозенец',
    size: 'средно',
    temperament: 'игриво',
    goal: 'разходка',
    description: 'Бела е игриво и дружелюбно куче, което обожава разходки в Южен парк. Добре се разбира с всички кучета.',
    photo: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=600',
    isUserAdded: false,
  },
  {
    id: 'dog-2',
    name: 'Роки',
    age: 5,
    district: 'Младост',
    size: 'голямо',
    temperament: 'спокойно',
    goal: 'социализация',
    description: 'Роки е голямо, спокойно куче. Обича бавни разходки и срещи с кучета от подобен темперамент.',
    photo: 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=600',
    isUserAdded: false,
  },
  {
    id: 'dog-3',
    name: 'Луна',
    age: 2,
    district: 'Център',
    size: 'малко',
    temperament: 'социално',
    goal: 'игра',
    description: 'Луна е малко и изключително социално кученце. Търси приятели за игра в Борисовата градина.',
    photo: 'https://images.pexels.com/photos/8721342/pexels-photo-8721342.jpeg?auto=compress&cs=tinysrgb&w=600',
    isUserAdded: false,
  },
  {
    id: 'dog-4',
    name: 'Макс',
    age: 4,
    district: 'Люлин',
    size: 'голямо',
    temperament: 'игриво',
    goal: 'разходка',
    description: 'Макс е енергично голямо куче, което обича дълги разходки. Идеален партньор за активни собственици.',
    photo: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=600',
    isUserAdded: false,
  },
  {
    id: 'dog-5',
    name: 'Нора',
    age: 1,
    district: 'Изток',
    size: 'средно',
    temperament: 'страхливо',
    goal: 'социализация',
    description: 'Нора е млада и малко срамежлива кучка. Нуждае се от спокойни, постепенни запознанства с нови приятели.',
    photo: 'https://images.pexels.com/photos/1642228/pexels-photo-1642228.jpeg?auto=compress&cs=tinysrgb&w=600',
    isUserAdded: false,
  },
];

/* =========================================================
   STATE
   ========================================================= */
let allDogs = [];        // All dogs (sample + user-added)
let filteredDogs = [];   // Dogs after applying filters
let currentIndex = 0;   // Index in filteredDogs currently shown
let likedDogs = [];      // Dogs the user liked
let map;                 // Leaflet map instance
let messages = {};       // Chat history per dog ID
let activeChatId = null; // Currently selected dog ID for chat

/* =========================================================
   LOCAL STORAGE KEYS
   ========================================================= */
const LS_USER_DOGS   = 'dmd_user_dogs';
const LS_LIKED_DOGS  = 'dmd_liked_dogs';
const LS_MESSAGES    = 'dogMeetDogMessages';

/* =========================================================
   DEMO DATA FOR CHAT
   ========================================================= */
const DEMO_CHAT_MESSAGES = {
  'dog-1': [{ text: 'Здравей! Искате ли разходка в Южен парк?', sentByMe: false }],
  'dog-2': [{ text: 'Роки е свободен за спокойна разходка този уикенд.', sentByMe: false }],
  'dog-3': [{ text: 'Луна много обича малки кучета и игра.', sentByMe: false }],
  'dog-4': [{ text: 'Макс търси активна разходка следобед.', sentByMe: false }],
  'dog-5': [{ text: 'Нора е малко страхлива, но иска спокойна социализация.', sentByMe: false }],
};

/* =========================================================
   INIT
   ========================================================= */

/**
 * Initialize the app: load data from localStorage, render UI.
 */
function init() {
  loadFromLocalStorage();
  filteredDogs = [...allDogs];
  renderCurrentDog();
  renderMatches();
  updateStats();
  // We initialize map only if/when discover section is active
}

/**
 * Initialize Leaflet map centered on Sofia.
 */
function initMap() {
  if (map) return; // Already initialized

  map = L.map('sofiaMap').setView([42.6977, 23.3219], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Sample locations/dogs markers
  const locations = [
    { name: 'Южен парк', coords: [42.6685, 23.3094], type: 'park' },
    { name: 'Борисова градина', coords: [42.6841, 23.3364], type: 'park' },
    { name: 'Бела', coords: [42.6750, 23.3250], type: 'dog' },
    { name: 'Роки', coords: [42.6450, 23.3750], type: 'dog' },
    { name: 'Луна', coords: [42.6950, 23.3250], type: 'dog' }
  ];

  locations.forEach(loc => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${loc.type === 'park' ? '#5aad7a' : '#d97a42'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    L.marker(loc.coords, { icon: icon })
      .addTo(map)
      .bindPopup(`<div class="map-popup"><strong>${loc.name}</strong><span>${loc.type === 'park' ? 'Популярно място за разходка' : 'Куче наблизо'}</span></div>`);
  });
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

/** Load all dogs, liked dogs and messages from localStorage. */
function loadFromLocalStorage() {
  try {
    const userDogsRaw  = localStorage.getItem(LS_USER_DOGS);
    const likedDogsRaw = localStorage.getItem(LS_LIKED_DOGS);
    const messagesRaw  = localStorage.getItem(LS_MESSAGES);

    const userDogs   = userDogsRaw  ? JSON.parse(userDogsRaw)  : [];
    const savedLiked = likedDogsRaw ? JSON.parse(likedDogsRaw) : [];
    const savedMsgs  = messagesRaw  ? JSON.parse(messagesRaw)  : {};

    allDogs   = [...SAMPLE_DOGS, ...userDogs];
    likedDogs = savedLiked;
    messages  = savedMsgs;
  } catch (e) {
    allDogs   = [...SAMPLE_DOGS];
    likedDogs = [];
    messages  = {};
  }
}

/** Save chat messages to localStorage. */
function saveMessages() {
  localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
}

/** Save user-added dogs to localStorage. */
function saveUserDogs() {
  const userDogs = allDogs.filter(d => d.isUserAdded);
  localStorage.setItem(LS_USER_DOGS, JSON.stringify(userDogs));
}

/** Save liked dogs to localStorage. */
function saveLikedDogs() {
  localStorage.setItem(LS_LIKED_DOGS, JSON.stringify(likedDogs));
}

/* =========================================================
   NAVIGATION
   ========================================================= */

/**
 * Navigate to a named section.
 * @param {string} sectionName - 'home' | 'discover' | 'add' | 'matches'
 */
function navigate(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target section
  let targetId = 'section-' + sectionName;
  if (sectionName === 'messages') targetId = 'messages-section';
  
  const section = document.getElementById(targetId);
  if (section) section.classList.add('active');

  // Activate nav item
  const navBtn = document.getElementById('nav-' + sectionName);
  if (navBtn) navBtn.classList.add('active');

  // Trigger map init if discover
  if (sectionName === 'discover') {
    setTimeout(() => {
      initMap();
      if (map) map.invalidateSize();
    }, 100);
  }

  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;

  // Re-render if navigating to specific sections
  if (sectionName === 'matches') renderMatches();
  if (sectionName === 'messages') renderMessagesList();
}

/* =========================================================
   DOG CARD RENDERING
   ========================================================= */

/** Render the current dog card based on currentIndex in filteredDogs. */
function renderCurrentDog() {
  const container   = document.getElementById('dog-card-container');
  const noDogs      = document.getElementById('no-dogs-msg');
  const allDone     = document.getElementById('all-done-msg');
  const actionBtns  = document.getElementById('action-buttons');

  // No dogs match filters
  if (filteredDogs.length === 0) {
    container.innerHTML = '';
    noDogs.classList.remove('hidden');
    allDone.classList.add('hidden');
    actionBtns.classList.add('hidden');
    return;
  }

  // All dogs have been seen
  if (currentIndex >= filteredDogs.length) {
    container.innerHTML = '';
    noDogs.classList.add('hidden');
    allDone.classList.remove('hidden');
    actionBtns.classList.add('hidden');
    return;
  }

  // Show current dog card
  noDogs.classList.add('hidden');
  allDone.classList.add('hidden');
  actionBtns.classList.remove('hidden');

  const dog = filteredDogs[currentIndex];
  const remaining = filteredDogs.length - currentIndex;

  container.innerHTML = buildDogCard(dog, currentIndex + 1, filteredDogs.length);
}

/**
 * Build HTML string for a dog card.
 * @param {Object} dog - Dog object
 * @param {number} pos - 1-based position
 * @param {number} total - Total dogs in current filter
 * @returns {string} HTML string
 */
function buildDogCard(dog, pos, total) {
  const photoEl = dog.photo
    ? `<img class="dog-card-photo" src="${dog.photo}" alt="${escapeHtml(dog.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
       <div class="dog-card-photo-placeholder" style="display:none">
         ${pawSvg(48)}
       </div>`
    : `<div class="dog-card-photo-placeholder">${pawSvg(48)}</div>`;

  const ageLabel = dog.age === 1 ? '1 година' : `${dog.age} год.`;

  return `
    <div class="dog-card">
      <div class="dog-card-photo-wrap">
        ${photoEl}
      </div>
      <div class="dog-card-body">
        <div class="dog-card-counter">${pos} от ${total}</div>
        <div class="dog-card-top">
          <div>
            <div class="dog-card-name">${escapeHtml(dog.name)}</div>
            <div class="dog-card-age">${ageLabel}</div>
          </div>
          <div class="dog-card-district">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(dog.district)}
          </div>
        </div>
        <div class="dog-card-tags">
          <span class="tag tag-size">${sizeIcon(dog.size)} ${escapeHtml(dog.size)}</span>
          <span class="tag tag-temp">${escapeHtml(dog.temperament)}</span>
          <span class="tag tag-goal">${escapeHtml(dog.goal)}</span>
        </div>
        ${dog.description
          ? `<p class="dog-card-desc">${escapeHtml(dog.description)}</p>`
          : ''}
      </div>
    </div>
  `;
}

/** Return a size icon char based on size string. */
function sizeIcon(size) {
  if (size === 'малко')  return '&#x25CF; &#x25CB;';
  if (size === 'средно') return '&#x25CF; &#x25CF;';
  if (size === 'голямо') return '&#x25CF; &#x25CF; &#x25CF;';
  return '';
}

/** Return a simple paw SVG string. */
function pawSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="20" rx="7" ry="9" fill="currentColor" opacity="0.4"/>
    <ellipse cx="44" cy="20" rx="7" ry="9" fill="currentColor" opacity="0.4"/>
    <ellipse cx="12" cy="34" rx="5" ry="7" fill="currentColor" opacity="0.4"/>
    <ellipse cx="52" cy="34" rx="5" ry="7" fill="currentColor" opacity="0.4"/>
    <ellipse cx="32" cy="44" rx="14" ry="12" fill="currentColor" opacity="0.5"/>
  </svg>`;
}

/* =========================================================
   DISCOVER ACTIONS
   ========================================================= */

/** Skip the current dog and move to the next. */
function skipDog() {
  if (currentIndex >= filteredDogs.length) return;
  currentIndex++;
  renderCurrentDog();
}

/**
 * Like the current dog: add to likedDogs, save, advance to next.
 */
function likeDog() {
  if (currentIndex >= filteredDogs.length) return;

  const dog = filteredDogs[currentIndex];

  // Avoid duplicates
  if (!likedDogs.find(d => d.id === dog.id)) {
    likedDogs.push(dog);
    saveLikedDogs();
    updateBadge();
    updateStats();
  }

  currentIndex++;
  renderCurrentDog();
}

/**
 * Show an invite toast for the current dog.
 */
function inviteDog() {
  if (currentIndex >= filteredDogs.length) return;
  showToast('Поканата е подготвена!');
}

/**
 * Reset the discover index to show all dogs again.
 */
function resetDiscoverIndex() {
  currentIndex = 0;
  renderCurrentDog();
}

/* =========================================================
   FILTERS
   ========================================================= */

/** 
 * Apply the current filter selections and re-render. 
 * This function is called every time a dropdown value changes.
 */
function applyFilters() {
  const districtValue    = document.getElementById('filter-district').value;
  const sizeValue        = document.getElementById('filter-size').value;
  const temperamentValue = document.getElementById('filter-temperament').value;

  // Filter the allDogs array based on the selected values
  filteredDogs = allDogs.filter(dog => {
    // If no value is selected (empty string), it counts as a match
    const matchDistrict    = !districtValue    || dog.district === districtValue;
    const matchSize        = !sizeValue        || dog.size === sizeValue;
    const matchTemperament = !temperamentValue || dog.temperament === temperamentValue;
    
    return matchDistrict && matchSize && matchTemperament;
  });

  // Always reset to the first dog in the filtered results
  currentIndex = 0;
  renderCurrentDog();
}

/** 
 * Reset all filter dropdowns to "Всички" and re-apply filters. 
 */
function resetFilters() {
  document.getElementById('filter-district').value    = '';
  document.getElementById('filter-size').value        = '';
  document.getElementById('filter-temperament').value = '';
  applyFilters();
}

/* =========================================================
   ADD DOG FORM
   ========================================================= */

/** Handle add-dog form submission. */
function handleAddDog(event) {
  event.preventDefault();

  const name        = document.getElementById('dog-name').value.trim();
  const age         = parseInt(document.getElementById('dog-age').value, 10);
  const district    = document.getElementById('dog-district').value;
  const size        = document.getElementById('dog-size').value;
  const temperament = document.getElementById('dog-temperament').value;
  const goalEl      = document.querySelector('input[name="dog-goal"]:checked');
  const description = document.getElementById('dog-desc').value.trim();

  if (!goalEl) return; // validation handled by required attribute fallback

  const newDog = {
    id: 'dog-user-' + Date.now(),
    name,
    age,
    district,
    size,
    temperament,
    goal: goalEl.value,
    description,
    photo: '',      // User-added dogs have no photo for now
    isUserAdded: true,
  };

  // Add to allDogs and update filteredDogs
  allDogs.push(newDog);
  filteredDogs = [...allDogs];  // Reset filter after adding
  currentIndex = allDogs.length - 1; // Point to newly added dog in discover

  saveUserDogs();
  updateStats();

  // Show success message and reset form
  document.getElementById('add-dog-form').reset();
  document.getElementById('char-count').textContent = '0 / 200';
  showSuccessBanner();
}

/** Show and auto-hide the success banner. */
function showSuccessBanner() {
  const banner = document.getElementById('add-success');
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 4000);
}

/* =========================================================
   MATCHES
   ========================================================= */

/** Render the liked dogs grid. */
function renderMatches() {
  const grid    = document.getElementById('matches-grid');
  const empty   = document.getElementById('matches-empty');
  const countEl = document.getElementById('matches-count');

  countEl.textContent = likedDogs.length;

  if (likedDogs.length === 0) {
    empty.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = likedDogs.map(dog => buildMatchCard(dog)).join('');
}

/**
 * Build HTML for a compact match card.
 * @param {Object} dog
 * @returns {string}
 */
function buildMatchCard(dog) {
  const photoEl = dog.photo
    ? `<img class="match-card-photo" src="${dog.photo}" alt="${escapeHtml(dog.name)}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
       <div class="match-card-photo-placeholder" style="display:none">${pawSvg(32)}</div>`
    : `<div class="match-card-photo-placeholder">${pawSvg(32)}</div>`;

  return `
    <div class="match-card">
      ${photoEl}
      <div class="match-card-body">
        <div class="match-card-name">${escapeHtml(dog.name)}</div>
        <div class="match-card-meta">${dog.age} год. · ${escapeHtml(dog.district)}</div>
        <span class="match-card-tag">${escapeHtml(dog.goal)}</span>
      </div>
    </div>
  `;
}

/* =========================================================
   STATS & BADGE
   ========================================================= */

/** Update the homepage stats numbers. */
function updateStats() {
  document.getElementById('stat-dogs').textContent = allDogs.length;
  const uniqueDistricts = new Set(allDogs.map(d => d.district));
  document.getElementById('stat-districts').textContent = uniqueDistricts.size;
  document.getElementById('stat-liked').textContent = likedDogs.length;
}

/** Update the matches badge on the nav. */
function updateBadge() {
  const badge = document.getElementById('matches-badge');
  if (likedDogs.length > 0) {
    badge.textContent = likedDogs.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/* =========================================================
   TOAST NOTIFICATION
   ========================================================= */

let toastTimer = null;

/**
 * Show a temporary toast message.
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById('invite-toast');
  toast.querySelector('span') ? null : null; // already has text node from HTML
  // Update text while keeping the icon
  const icon = toast.querySelector('svg');
  toast.innerHTML = '';
  if (icon) toast.appendChild(icon);
  toast.appendChild(document.createTextNode(' ' + message));

  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

/* =========================================================
   FORM HELPERS
   ========================================================= */

/** Update the character counter for the description textarea. */
document.addEventListener('DOMContentLoaded', () => {
  const textarea  = document.getElementById('dog-desc');
  const charCount = document.getElementById('char-count');

  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length} / 200`;
    });
  }
});

/* =========================================================
   MESSAGES & CHAT LOGIC
   ========================================================= */

/** 
 * Conversation creation:
 * Conversations are created dynamically for each dog in the "likedDogs" array.
 * We look up chat history in the "messages" state or fallback to "DEMO_CHAT_MESSAGES".
 */
function renderMessagesList() {
  const listContainer = document.getElementById('conversation-list');
  const chatWindow    = document.getElementById('active-chat-window');
  const layout        = document.getElementById('chat-layout');

  // Reset view
  layout.classList.remove('chat-active');
  chatWindow.classList.add('hidden');
  activeChatId = null;

  if (likedDogs.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Все още нямаш разговори</h3>
        <p>Харесай куче, за да започнеш чат.</p>
        <button class="btn btn-primary" onclick="navigate('discover')">Открий кучета</button>
      </div>
    `;
    return;
  }

  // Build the list of conversations
  listContainer.innerHTML = likedDogs.map(dog => {
    // Get last message from history or demo
    const history = messages[dog.id] || DEMO_CHAT_MESSAGES[dog.id] || [];
    const lastMsg = history.length > 0 ? history[history.length - 1].text : 'Започни чат...';

    return `
      <div class="conv-item" onclick="openChat('${dog.id}')">
        <div class="conv-avatar">🐾</div>
        <div class="conv-info">
          <div class="conv-name-row">
            <span class="conv-name">${escapeHtml(dog.name)}</span>
            <span class="conv-district">${escapeHtml(dog.district)}</span>
          </div>
          <div class="conv-last-msg">${escapeHtml(lastMsg)}</div>
        </div>
      </div>
    `;
  }).join('');
}

/** 
 * Opening a conversation:
 * Finds the dog data in likedDogs and switches the UI to chat mode.
 * On mobile, we use "chat-active" class to swap views.
 * @param {string} dogId 
 */
function openChat(dogId) {
  const dog = likedDogs.find(d => d.id === dogId);
  if (!dog) return;

  activeChatId = dogId;
  const layout     = document.getElementById('chat-layout');
  const chatWindow = document.getElementById('active-chat-window');
  
  // UI setup
  layout.classList.add('chat-active');
  chatWindow.classList.remove('hidden');
  document.getElementById('chat-with-name').textContent     = dog.name;
  document.getElementById('chat-with-district').textContent = dog.district;
  
  renderChatMessages();
  
  // Scroll to bottom of messages
  const msgContainer = document.getElementById('chat-messages');
  setTimeout(() => {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }, 50);
}

/** Render messages for the active conversation. */
function renderChatMessages() {
  if (!activeChatId) return;

  const container = document.getElementById('chat-messages');
  // Combine demo messages with actual sent messages
  const demoMsgs = DEMO_CHAT_MESSAGES[activeChatId] || [];
  const userMsgs = messages[activeChatId] || [];
  
  const allMsgs = [...demoMsgs, ...userMsgs];

  container.innerHTML = allMsgs.map(msg => `
    <div class="msg-bubble ${msg.sentByMe ? 'msg-right' : 'msg-left'}">
      ${escapeHtml(msg.text)}
    </div>
  `).join('');
}

/** 
 * Sending a new message:
 * 1. Prevents default form submit.
 * 2. Adds the text to the current dog's entry in the "messages" object.
 * 3. Saves "messages" to localStorage via LS_MESSAGES key.
 * 4. Re-renders the message bubbles.
 */
function handleSendMessage(event) {
  event.preventDefault();
  if (!activeChatId) return;

  const input = document.getElementById('chat-input');
  const text  = input.value.trim();

  if (!text) return;

  // Initialize history for this dog if not exists
  if (!messages[activeChatId]) {
    messages[activeChatId] = [];
  }

  // Add new message
  messages[activeChatId].push({
    text: text,
    sentByMe: true,
    timestamp: Date.now()
  });

  // Persist: saving to localStorage
  saveMessages();

  // Update UI
  input.value = '';
  renderChatMessages();

  // Scroll to bottom
  const msgContainer = document.getElementById('chat-messages');
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

/** Go back to conversation list (mobile view). */
function backToConversations() {
  const layout = document.getElementById('chat-layout');
  layout.classList.remove('chat-active');
  activeChatId = null;
  renderMessagesList();
}

/* =========================================================
   SECURITY HELPER
   ========================================================= */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
   START
   ========================================================= */
init();

// Restore badge count on load
updateBadge(); 
