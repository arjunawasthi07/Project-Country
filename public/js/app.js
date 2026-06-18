// API Endpoints Config
const API_URL = '/api';

// Application State
let token = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentSearch = '';

// DOM Elements
const authModal = document.getElementById('auth-modal');
const dashboardSection = document.getElementById('dashboard-section');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const navSearchWrapper = document.getElementById('nav-search-wrapper');
const userProfile = document.getElementById('user-profile');
const guestActions = document.getElementById('guest-actions');
const userNameDisplay = document.getElementById('user-name-display');
const userAvatarInitial = document.getElementById('user-avatar-initial');

// Forms & Inputs
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const searchInput = document.getElementById('search-input');
const countryForm = document.getElementById('country-form');

// Modals
const countryModal = document.getElementById('country-modal');
const deleteModal = document.getElementById('delete-modal');
const modalTitle = document.getElementById('modal-title');
const countryIdInput = document.getElementById('country-id');
const countryNameInput = document.getElementById('country-name');
const countryCapitalInput = document.getElementById('country-capital');
const countryPopulationInput = document.getElementById('country-population');
const deleteCountryNameSpan = document.getElementById('delete-country-name');

// Buttons
const logoutBtn = document.getElementById('logout-btn');
const openAuthBtn = document.getElementById('open-auth-btn');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const emptyAddBtn = document.getElementById('empty-add-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Lists / Grids / Containers
const countriesGrid = document.getElementById('countries-grid');
const emptyState = document.getElementById('empty-state');
const countryCountSpan = document.getElementById('country-count');
const toastContainer = document.getElementById('toast-container');

// Upload Elements
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('country-flag');
const previewContainer = document.getElementById('preview-container');
const flagPreview = document.getElementById('flag-preview');
const uploadPrompt = document.getElementById('upload-prompt');
const removePreviewBtn = document.getElementById('remove-preview-btn');

// State tracking variables
let deleteTargetId = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuth();
});

function checkAuth() {
  if (token && currentUser) {
    // Logged in state
    userProfile.classList.remove('hidden');
    guestActions.classList.add('hidden');
    openAddModalBtn.classList.remove('hidden');
    
    // User display
    userNameDisplay.innerText = currentUser.name;
    userAvatarInitial.innerText = currentUser.name.charAt(0).toUpperCase();
    
    // Hide auth modal if open
    authModal.classList.remove('active-modal');
  } else {
    // Logged out / Guest state
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    userProfile.classList.add('hidden');
    guestActions.classList.remove('hidden');
    openAddModalBtn.classList.add('hidden');
    
    showLoginCard();
  }

  // Fetch countries (always visible to everyone)
  fetchCountries();
}

// ==========================================
// API CLIENT CALLS
// ==========================================

// Fetch countries (supports search filtering)
async function fetchCountries() {
  try {
    const res = await fetch(`${API_URL}/countries?search=${encodeURIComponent(currentSearch)}`);
    if (!res.ok) {
      throw new Error('Could not retrieve countries data');
    }
    const data = await res.json();
    renderCountries(data);
  } catch (error) {
    showToast('Fetch Error', error.message, 'error');
  }
}

// Render country cards in the grid
function renderCountries(countries) {
  countriesGrid.innerHTML = '';
  countryCountSpan.innerText = countries.length;

  if (countries.length === 0) {
    countriesGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    
    // Customize empty state button based on auth state
    if (token && currentUser) {
      emptyAddBtn.classList.remove('hidden');
    } else {
      emptyAddBtn.classList.add('hidden');
    }
    return;
  }

  emptyState.classList.add('hidden');
  countriesGrid.classList.remove('hidden');

  const isAuthenticated = !!(token && currentUser);

  countries.forEach(country => {
    const card = document.createElement('div');
    card.className = 'country-card';
    
    const formattedPopulation = Number(country.population).toLocaleString();
    const flagSrc = country.flag || 'https://placehold.co/300x170/1c274c/ffffff?text=No+Flag';

    card.innerHTML = `
      <div class="card-flag-wrapper">
        <img class="card-flag" src="${flagSrc}" alt="${country.countryName} flag" onerror="this.src='https://placehold.co/300x170/1c274c/ffffff?text=Image+Load+Error'">
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(country.countryName)}</h3>
        <div class="card-details">
          <p><i class="fa-solid fa-city"></i> <strong>Capital:</strong> ${escapeHTML(country.capital)}</p>
          <p><i class="fa-solid fa-users"></i> <strong>Population:</strong> ${formattedPopulation}</p>
        </div>
      </div>
      ${isAuthenticated ? `
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm edit-country-btn" data-id="${country._id}">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm delete-country-btn" data-id="${country._id}" data-name="${escapeHTML(country.countryName)}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      ` : ''}
    `;

    countriesGrid.appendChild(card);
  });

  if (isAuthenticated) {
    // Bind Actions
    document.querySelectorAll('.edit-country-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openEditModal(e.currentTarget.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.delete-country-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-name');
        openDeleteModal(id, name);
      });
    });
  }
}

// User Registration
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (password.length < 6) {
    showToast('Validation Error', 'Password must be at least 6 characters long', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    showToast('Success', 'Registration completed. Logging in...', 'success');
    
    // Automatically perform login
    await loginUserFlow(email, password);
  } catch (error) {
    showToast('Registration Error', error.message, 'error');
  }
}

// User Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  await loginUserFlow(email, password);
}

async function loginUserFlow(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login credentials incorrect');
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    showToast('Success', 'Logged in successfully', 'success');
    checkAuth();
    
    // Clear forms
    loginForm.reset();
    registerForm.reset();
  } catch (error) {
    showToast('Login Error', error.message, 'error');
  }
}

// Save Country (Create or Update)
async function handleSaveCountry(e) {
  e.preventDefault();
  
  const id = countryIdInput.value;
  const name = countryNameInput.value.trim();
  const capital = countryCapitalInput.value.trim();
  const population = countryPopulationInput.value;
  const file = fileInput.files[0];

  if (!name || !capital || !population) {
    showToast('Validation Error', 'Please complete all required fields', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('countryName', name);
  formData.append('capital', capital);
  formData.append('population', population);
  if (file) {
    formData.append('flag', file);
  }

  const isEditing = !!id;
  const url = isEditing ? `${API_URL}/countries/${id}` : `${API_URL}/countries`;
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save country details');
    }

    showToast('Success', isEditing ? 'Country statistics updated' : 'Country successfully added', 'success');
    closeCountryModal();
    fetchCountries();
  } catch (error) {
    showToast('Operation Failed', error.message, 'error');
  }
}

// Delete Country
async function handleConfirmDelete() {
  if (!deleteTargetId) return;

  try {
    const response = await fetch(`${API_URL}/countries/${deleteTargetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete country');
    }

    showToast('Deleted', 'Country successfully removed', 'success');
    closeDeleteModal();
    fetchCountries();
  } catch (error) {
    showToast('Delete Error', error.message, 'error');
  }
}

// ==========================================
// DRAG & DROP & UPLOAD EVENT HANDLERS
// ==========================================
function setupUploadHandlers() {
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFilePreview(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      handleFilePreview(fileInput.files[0]);
    }
  });

  removePreviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadField();
  });
}

function handleFilePreview(file) {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      flagPreview.src = e.target.result;
      previewContainer.classList.remove('hidden');
      uploadPrompt.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    showToast('Upload Error', 'Only image files are allowed', 'warning');
    resetUploadField();
  }
}

function resetUploadField() {
  fileInput.value = '';
  flagPreview.src = '';
  previewContainer.classList.add('hidden');
  uploadPrompt.classList.remove('hidden');
}

// ==========================================
// MODAL & UI ANIMATION CONTROL
// ==========================================
function openAddModal() {
  countryForm.reset();
  countryIdInput.value = '';
  modalTitle.innerText = 'Add Country Details';
  resetUploadField();
  countryModal.classList.add('active-modal');
}

async function openEditModal(id) {
  try {
    const res = await fetch(`${API_URL}/countries/${id}`);
    if (!res.ok) throw new Error('Failed to retrieve country data');
    const country = await res.json();
    
    countryIdInput.value = country._id;
    countryNameInput.value = country.countryName;
    countryCapitalInput.value = country.capital;
    countryPopulationInput.value = country.population;
    
    modalTitle.innerText = `Edit Details for ${country.countryName}`;
    resetUploadField();

    if (country.flag) {
      flagPreview.src = country.flag;
      previewContainer.classList.remove('hidden');
      uploadPrompt.classList.add('hidden');
    }

    countryModal.classList.add('active-modal');
  } catch (error) {
    showToast('Loading Failed', error.message, 'error');
  }
}

function closeCountryModal() {
  countryModal.classList.remove('active-modal');
  countryForm.reset();
}

function openDeleteModal(id, name) {
  deleteTargetId = id;
  deleteCountryNameSpan.innerText = name;
  deleteModal.classList.add('active-modal');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active-modal');
  deleteTargetId = null;
}

// ==========================================
// NAVIGATION & EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Open Auth modal
  openAuthBtn.addEventListener('click', () => {
    authModal.classList.add('active-modal');
  });

  // Close Auth modal
  closeAuthModalBtn.addEventListener('click', () => {
    authModal.classList.remove('active-modal');
  });

  // Toggle forms inside Auth Modal
  document.getElementById('to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterCard();
  });
  
  document.getElementById('to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginCard();
  });

  // Submit events
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  countryForm.addEventListener('submit', handleSaveCountry);

  // Buttons Action
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    showToast('Logged Out', 'Successfully logged out', 'success');
    checkAuth();
  });

  openAddModalBtn.addEventListener('click', openAddModal);
  emptyAddBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeCountryModal);
  cancelModalBtn.addEventListener('click', closeCountryModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Search filter dynamic input
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    fetchCountries();
  });

  // Drag Drop Setup
  setupUploadHandlers();

  // Close modals when clicking outside contents
  window.addEventListener('click', (e) => {
    if (e.target === countryModal) closeCountryModal();
    if (e.target === deleteModal) closeDeleteModal();
    if (e.target === authModal) authModal.classList.remove('active-modal');
  });
}

function showLoginCard() {
  loginCard.classList.add('active-card');
  registerCard.classList.remove('active-card');
  document.getElementById('auth-modal-title').innerText = 'Sign In';
}

function showRegisterCard() {
  loginCard.classList.remove('active-card');
  registerCard.classList.add('active-card');
  document.getElementById('auth-modal-title').innerText = 'Register';
}

// ==========================================
// HELPERS
// ==========================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <i class="fa-solid fa-xmark toast-close"></i>
  `;

  toastContainer.appendChild(toast);

  // Click to close
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}
