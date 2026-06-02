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

// Auth state
let users = [];
let currentUser = null;

/* =========================================================
   GEODATA & MAP CONFIG
   ========================================================= */
let map;
let dogMarkers = L.layerGroup();
let parkMarkers = L.layerGroup();

const districtCoordinates = {
  'Лозенец': [42.6759, 23.3239],
  'Младост': [42.6454, 23.3747],
  'Люлин': [42.7167, 23.2543],
  'Център': [42.6977, 23.3219],
  'Овча купел': [42.6821, 23.2528],
  'Надежда': [42.7295, 23.3025],
  'Студентски град': [42.6500, 23.3445],
  'Дружба': [42.6606, 23.3973],
  'Красно село': [42.6828, 23.2882],
  'Изток': [42.6695, 23.3525]
};

const parks = [
  { name: 'Южен парк', coords: [42.6727, 23.3089] },
  { name: 'Борисова градина', coords: [42.6863, 23.3430] },
  { name: 'Западен парк', coords: [42.7048, 23.2716] },
  { name: 'Парк Заимов', coords: [42.6993, 23.3377] },
  { name: 'Северен парк', coords: [42.7338, 23.3085] }
];

/* =========================================================
   LOCAL STORAGE KEYS
   ========================================================= */
const LS_ALL_DOGS         = 'dmd_all_dogs';
const LS_LIKED_DOGS       = 'dmd_liked_dogs';
const LS_USERS            = 'dogMeetDogUsers';
const LS_CURRENT_USER     = 'dogMeetDogCurrentUser';

/* =========================================================
   DEMO USERS
   ========================================================= */
const DEMO_USERS = [
  {
    email: 'user@dogmeetdog.bg',
    password: 'user123',
    role: 'user',
    name: 'Демо потребител',
    district: 'Лозенец'
  },
  {
    email: 'admin@dogmeetdog.bg',
    password: 'admin123',
    role: 'admin',
    name: 'Администратор',
    district: 'Център'
  }
];

/* =========================================================
   INIT
   ========================================================= */

/**
 * Initialize the app: load data from localStorage, render UI.
 */
function init() {
  loadFromLocalStorage();
  
  // Check if session exists
  if (currentUser) {
    showMainApp();
  } else {
    showAuth();
  }
}

/**
 * Show the main application sections and hide auth.
 */
function showMainApp() {
  document.getElementById('section-auth').classList.add('hidden');
  document.getElementById('app-main-content').classList.remove('hidden');
  document.getElementById('app-bottom-nav').classList.remove('hidden');
  document.getElementById('user-profile-header').classList.remove('hidden');
  
  const displayEmail = currentUser.name || currentUser.email;
  document.getElementById('current-user-display').textContent = displayEmail;

  // Show/Hide admin nav based on role
  const adminBtn = document.getElementById('nav-admin');
  if (currentUser.role === 'admin') {
    adminBtn.classList.remove('hidden');
  } else {
    adminBtn.classList.add('hidden');
  }

  // Initial UI render
  // Filter dogs to exclude hidden/deleted (only for non-admin view if you want, 
  // but let's just make Discover show approved/userAdded dogs)
  refreshDogList();
  
  renderCurrentDog();
  renderMatches();
  updateStats();
  updateBadge();
  
  // Initialize the Sofia map
  initMap();
  
  navigate('home');
}

/**
 * Refresh the dogs list based on active/hidden status.
 */
function refreshDogList() {
  // Only show approved dogs in the Discover section
  filteredDogs = allDogs.filter(d => d.status === 'approved');
  currentIndex = 0;
}

/**
 * Show the login/signup section and hide main app.
 */
function showAuth() {
  document.getElementById('section-auth').classList.remove('hidden');
  document.getElementById('app-main-content').classList.add('hidden');
  document.getElementById('app-bottom-nav').classList.add('hidden');
  document.getElementById('user-profile-header').classList.add('hidden');
  
  // Ensure we are on auth section
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-auth').classList.add('active');
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

/** Load user-added dogs, liked dogs and users from localStorage. */
function loadFromLocalStorage() {
  try {
    // 1. Load Dogs
    const userDogsRaw  = localStorage.getItem(LS_USER_DOGS);
/** Load all dogs, liked dogs and users from localStorage. */
function loadFromLocalStorage() {
  try {
    // 1. Load Dogs
    const allDogsRaw = localStorage.getItem(LS_ALL_DOGS);
    if (allDogsRaw) {
      allDogs = JSON.parse(allDogsRaw);
    } else {
      // First time: use sample dogs and mark them approved
      allDogs = SAMPLE_DOGS.map(d => ({ ...d, status: 'approved' }));
      localStorage.setItem(LS_ALL_DOGS, JSON.stringify(allDogs));
    }

    const likedDogsRaw = localStorage.getItem(LS_LIKED_DOGS);
    likedDogs = likedDogsRaw ? JSON.parse(likedDogsRaw) : [];

    // 2. Load Users
    const usersRaw = localStorage.getItem(LS_USERS);
    if (!usersRaw) {
      users = [...DEMO_USERS];
      localStorage.setItem(LS_USERS, JSON.stringify(users));
    } else {
      users = JSON.parse(usersRaw);
    }

    // 3. Load Session
    const sessionRaw = localStorage.getItem(LS_CURRENT_USER);
    currentUser = sessionRaw ? JSON.parse(sessionRaw) : null;

  } catch (e) {
    console.error('Error loading from localStorage', e);
    allDogs = SAMPLE_DOGS.map(d => ({ ...d, status: 'approved' }));
    likedDogs = [];
    users = [...DEMO_USERS];
  }
}

/** Save all dogs to localStorage. */
function saveUserDogs() {
  localStorage.setItem(LS_ALL_DOGS, JSON.stringify(allDogs));
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
 * @param {string} sectionName - 'home' | 'discover' | 'add' | 'matches' | 'admin'
 */
function navigate(sectionName) {
  // Security check for admin
  if (sectionName === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Нямаш достъп до админ панела.');
      return;
    }
  }

  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    if (section) section.classList.add('active');

    // Leaflet map needs a resize trigger if it was hidden when initialized
    if (sectionName === 'discover' && map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

  // Activate nav item
  const navBtn = document.getElementById('nav-' + sectionName);
  if (navBtn) navBtn.classList.add('active');

  // Scroll to top
  const mainContent = document.getElementById('app-main-content');
  if (mainContent) mainContent.scrollTop = 0;

  // Re-render specific logic
  if (sectionName === 'matches') renderMatches();
  if (sectionName === 'admin') renderAdminDashboard();
}

/* =========================================================
   AUTH LOGIC
   ========================================================= */

/** 
 * HOW LOGIN WORKS:
 * We check if a user with the given email and password exists in the 'users' array (loaded from localStorage).
 * If found, we store the user object in 'currentUser' and save it to localStorage under 'dogMeetDogCurrentUser'
 * to maintain the session after page refresh.
 */
function handleLogin(event) {
  // ... existing code ...

  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('auth-error');

  // Find user
  const user = users.find(u => u.email === email && u.password === pass);

  if (user) {
    currentUser = user;
    localStorage.setItem(LS_CURRENT_USER, JSON.stringify(currentUser));
    showMainApp();
    errorMsg.classList.add('hidden');
  } else {
    errorMsg.textContent = 'Грешен имейл или парола.';
    errorMsg.classList.remove('hidden');
  }
}

/** Handles user signup. */
function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const district = document.getElementById('signup-district').value;
  const safety = document.getElementById('signup-safety').checked;
  const errorMsg = document.getElementById('auth-error');

  if (pass !== confirm) {
    errorMsg.textContent = 'Паролите не съвпадат.';
    errorMsg.classList.remove('hidden');
    return;
  }

  // Check if exists
  const exists = users.find(u => u.email === email);
  if (exists) {
    errorMsg.textContent = 'Потребител с този имейл вече съществува.';
    errorMsg.classList.remove('hidden');
    return;
  }

  const newUser = {
    name,
    email,
    password: pass,
    district,
    role: 'user'
  };

  users.push(newUser);
  localStorage.setItem(LS_USERS, JSON.stringify(users));
  
  // Auto-login
  currentUser = newUser;
  localStorage.setItem(LS_CURRENT_USER, JSON.stringify(currentUser));
  
  showMainApp();
  alert('Профилът е създаден успешно! Добре дошли.');
}

/** Logs out the current user. */
function handleLogout() {
  currentUser = null;
  localStorage.removeItem(LS_CURRENT_USER);
  showAuth();
}

/* =========================================================
   ADMIN LOGIC
   ========================================================= */

/** Renders the admin dashboard with stats and dog list. */
function renderAdminDashboard() {
  // Update stats
  document.getElementById('admin-total-users').textContent = users.length;
  document.getElementById('admin-total-dogs').textContent = allDogs.length;
  document.getElementById('admin-total-likes').textContent = likedDogs.length;
  document.getElementById('admin-pending-dogs').textContent = allDogs.filter(d => d.status === 'pending').length;

  const listContainer = document.getElementById('admin-dogs-list');
  listContainer.innerHTML = allDogs.map(dog => buildAdminDogRow(dog)).join('');
}

/** Builds a single row for the admin dog list. */
function buildAdminDogRow(dog) {
  const statusClass = `tag-${dog.status || 'approved'}`;
  const statusLabel = dog.status === 'pending' ? 'Чакащо' : (dog.status === 'hidden' ? 'Скрито' : 'Одобрено');
  
  return `
    <div class="admin-dog-row">
      <img src="${dog.photo || 'https://via.placeholder.com/50'}" class="admin-dog-thumb" alt="" />
      <div class="admin-dog-info">
        <div class="admin-dog-name">${escapeHtml(dog.name)}</div>
        <div class="admin-dog-meta">${escapeHtml(dog.district)} · ${dog.age}г.</div>
        <span class="admin-tag ${statusClass}">${statusLabel}</span>
      </div>
      <div class="admin-dog-actions">
        ${dog.status !== 'approved' ? `<button class="admin-btn btn-approve" onclick="adminAction('${dog.id}', 'approve')">Одобри</button>` : ''}
        ${dog.status !== 'hidden' ? `<button class="admin-btn btn-hide" onclick="adminAction('${dog.id}', 'hide')">Скрий</button>` : ''}
        <button class="admin-btn btn-delete" onclick="adminAction('${dog.id}', 'delete')">Изтрий</button>
      </div>
    </div>
  `;
}

/** Handles admin actions on dogs. */
function adminAction(dogId, action) {
  const dogIndex = allDogs.findIndex(d => d.id === dogId);
  if (dogIndex === -1) return;

  if (action === 'delete') {
    if (confirm('Сигурни ли сте, че искате да изтриете този профил?')) {
      allDogs.splice(dogIndex, 1);
      // Also remove from liked
      likedDogs = likedDogs.filter(d => d.id !== dogId);
      saveLikedDogs();
    }
  } else if (action === 'approve') {
    allDogs[dogIndex].status = 'approved';
  } else if (action === 'hide') {
    allDogs[dogIndex].status = 'hidden';
  }

  saveUserDogs(); // Re-use the save function which saves current allDogs minus samples if we were strict, 
                  // but here let's actually make sure we save carefully.
  
  renderAdminDashboard();
  updateStats();
  refreshDogList();
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

  // Filter the allDogs array (only approved ones) based on the selected values
  filteredDogs = allDogs.filter(dog => {
    if (dog.status !== 'approved') return false;
    
    // If no value is selected (empty string), it counts as a match
    const matchDistrict    = !districtValue    || dog.district === districtValue;
    const matchSize        = !sizeValue        || dog.size === sizeValue;
    const matchTemperament = !temperamentValue || dog.temperament === temperamentValue;
    
    return matchDistrict && matchSize && matchTemperament;
  });

  // Always reset to the first dog in the filtered results
  currentIndex = 0;
  renderCurrentDog();

  // Update map markers to show only dogs matching the new filter
  renderDogMarkers();
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
    status: 'pending' // New dogs start as pending for admin approval
  };

  // Add to allDogs
  allDogs.push(newDog);
  
  saveUserDogs();
  applyFilters(); // Apply filter to see the new dog and update map
  updateStats();

  // Show success message and reset form
  document.getElementById('add-dog-form').reset();
  document.getElementById('char-count').textContent = '0 / 200';
  
  // Custom success banner for adding a dog
  const banner = document.getElementById('add-success');
  banner.querySelector('p').textContent = 'Твоят профил ще се появи в "Открий" след одобрение от админ.';
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
