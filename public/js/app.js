/**
 * IGRID INNOVATION LAB - CLIENT APPLICATION LOGIC
 * Dynamic Project Management Dashboard with Executive Showcase, Kanban, Timeline, List, Table, BOM & Student Hub
 */

// Environment API Base URL (Dynamic Origin / Env Fallback)
const API_BASE_URL = (typeof window !== 'undefined' && window.location && window.location.origin)
  ? window.location.origin
  : '';

// Application State
const state = {
  projects: [],
  students: [],
  boms: [],
  domains: [],
  activeProjectTasks: [],
  currentView: 'board',
  filterDomain: 'All',
  filterTag: '',
  filterStatus: 'All',
  filterPriority: 'All',
  searchQuery: '',
  sortBy: 'due_date',
  activeProjectId: null,
  draggedCardId: null
};

// DOM Elements
const DOM = {
  // Navigation & Search
  globalSearch: document.getElementById('global-search'),
  clearSearch: document.getElementById('clear-search'),
  notifBtn: document.getElementById('notif-btn'),
  notifDropdown: document.getElementById('notif-dropdown'),
  notifBadge: document.getElementById('notif-badge'),
  notifList: document.getElementById('notif-list'),
  activityBtn: document.getElementById('activity-btn'),
  activityDropdown: document.getElementById('activity-dropdown'),
  activityFeedList: document.getElementById('activity-feed-list'),
  statsSummaryPill: document.getElementById('stats-summary-pill'),

  // Views & Tabs
  viewTabs: document.querySelectorAll('.tab-btn'),
  viewPanels: document.querySelectorAll('.view-panel'),
  domainPills: document.querySelectorAll('.domain-pill'),
  domainFilterPillsRoot: document.getElementById('domain-filter-pills'),
  hashtagCloud: document.getElementById('hashtag-cloud'),
  sortBtn: document.getElementById('sort-btn'),
  sortDropdown: document.getElementById('sort-dropdown'),
  sortLabel: document.getElementById('sort-label'),
  exportBtn: document.getElementById('export-btn'),
  exportDropdown: document.getElementById('export-dropdown'),
  printReportBtn: document.getElementById('print-report-btn'),
  filterBtn: document.getElementById('filter-btn'),
  filterDrawer: document.getElementById('filter-drawer'),
  closeFilterDrawer: document.getElementById('close-filter-drawer'),
  btnApplyFilters: document.getElementById('btn-apply-filters'),
  btnResetFilters: document.getElementById('btn-reset-filters'),
  filterActiveDot: document.getElementById('filter-active-dot'),

  // Domain Management Modal
  addDomainModal: document.getElementById('add-domain-modal'),
  btnOpenAddDomain: document.getElementById('btn-open-add-domain'),
  closeAddDomainModal: document.getElementById('close-add-domain-modal'),
  btnCancelAddDomain: document.getElementById('btn-cancel-add-domain'),
  addDomainForm: document.getElementById('add-domain-form'),
  formDomain: document.getElementById('form-domain'),
  drawerDomainSelect: document.getElementById('drawer-domain-select'),

  // Task Management Modals
  taskModal: document.getElementById('task-modal'),
  closeTaskModal: document.getElementById('close-task-modal'),
  btnCancelTask: document.getElementById('btn-cancel-task'),
  taskForm: document.getElementById('task-form'),
  btnAddProjectTask: document.getElementById('btn-add-project-task'),
  taskInfoModal: document.getElementById('task-info-modal'),
  closeTaskInfoModal: document.getElementById('close-task-info-modal'),
  btnCloseTaskInfo: document.getElementById('btn-close-task-info'),

  // Executive Management Showcase
  execShowcaseGridRoot: document.getElementById('exec-showcase-grid-root'),
  execAvgProgress: document.getElementById('exec-avg-progress'),
  execAvgProgressBar: document.getElementById('exec-avg-progress-bar'),
  execApprovedBudget: document.getElementById('exec-approved-budget'),
  execPendingBomCount: document.getElementById('exec-pending-bom-count'),
  execStudentCount: document.getElementById('exec-student-count'),

  // Kanban Columns
  cardsInQueue: document.getElementById('cards-in_queue'),
  cardsInProgress: document.getElementById('cards-in_progress'),
  cardsTesting: document.getElementById('cards-testing'),
  cardsCompleted: document.getElementById('cards-completed'),
  countInQueue: document.getElementById('count-in_queue'),
  countInProgress: document.getElementById('count-in_progress'),
  countTesting: document.getElementById('count-testing'),
  countCompleted: document.getElementById('count-completed'),

  // Other Views
  timelineChartRoot: document.getElementById('timeline-chart-root'),
  listItemsRoot: document.getElementById('list-items-root'),
  tableBodyRoot: document.getElementById('table-body-root'),
  bomTbody: document.getElementById('bom-tbody'),
  bomStatPending: document.getElementById('bom-stat-pending'),
  bomStatApproved: document.getElementById('bom-stat-approved'),
  bomStatTotalItems: document.getElementById('bom-stat-total-items'),
  tabBomCount: document.getElementById('tab-bom-count'),
  showcaseGridRoot: document.getElementById('showcase-grid-root'),
  completedCountBanner: document.getElementById('completed-count-banner'),
  studentsGridRoot: document.getElementById('students-grid-root'),

  // Modals
  projectModal: document.getElementById('project-modal'),
  openAddTaskModal: document.getElementById('open-add-task-modal'),
  closeProjectModal: document.getElementById('close-project-modal'),
  cancelProjectBtn: document.getElementById('cancel-project-btn'),
  projectForm: document.getElementById('project-form'),
  modalProjectTitle: document.getElementById('modal-project-title'),

  // Detail Modal
  detailModal: document.getElementById('detail-modal'),
  closeDetailModal: document.getElementById('close-detail-modal'),
  btnCloseDetail: document.getElementById('btn-close-detail'),
  btnEditCurrentProject: document.getElementById('btn-edit-current-project'),
  btnDeleteProject: document.getElementById('btn-delete-project'),
  btnQuickAddBom: document.getElementById('btn-quick-add-bom'),
  addCommentForm: document.getElementById('add-comment-form'),

  // Spotlight Modal
  spotlightModal: document.getElementById('spotlight-modal'),
  closeSpotlightModal: document.getElementById('close-spotlight-modal'),
  btnCloseSpotlight: document.getElementById('btn-close-spotlight'),
  spotlightBodyRoot: document.getElementById('spotlight-body-root'),

  // BOM Modal
  bomModal: document.getElementById('bom-modal'),
  openAddBomModal: document.getElementById('open-add-bom-modal'),
  closeBomModal: document.getElementById('close-bom-modal'),
  cancelBomBtn: document.getElementById('cancel-bom-btn'),
  bomForm: document.getElementById('bom-form'),
  bomProjectCodeSelect: document.getElementById('bom-project-code'),

  // Student Modal
  studentModal: document.getElementById('student-modal'),
  openAddStudentModal: document.getElementById('open-add-student-modal'),
  closeStudentModal: document.getElementById('close-student-modal'),
  cancelStudentBtn: document.getElementById('cancel-student-btn'),
  studentForm: document.getElementById('student-form'),

  // Analytics Modal
  analyticsModal: document.getElementById('analytics-modal'),
  labAnalyticsBtn: document.getElementById('lab-analytics-btn'),
  closeAnalyticsModal: document.getElementById('close-analytics-modal'),
  btnCloseAnalytics: document.getElementById('btn-close-analytics'),
  analyticsKpiRoot: document.getElementById('analytics-kpi-root'),
  analyticsDomainBars: document.getElementById('analytics-domain-bars'),
  analyticsStatusBars: document.getElementById('analytics-status-bars'),

  // Toast Container
  toastContainer: document.getElementById('toast-container'),

  // Public Tunnel Elements
  publicTunnelBadge: document.getElementById('public-tunnel-badge'),
  publicTunnelText: document.getElementById('public-tunnel-text'),
  copyPublicLinkBtn: document.getElementById('copy-public-link-btn'),

  // Theme Toggle Elements
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeIconDark: document.getElementById('theme-icon-dark'),
  themeIconLight: document.getElementById('theme-icon-light'),
  themeLabel: document.getElementById('theme-label')
};

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
// Session Authorization Helper & Redirect Gate
function getSessionToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get('token');
  if (queryToken) {
    localStorage.setItem('igrid_session', queryToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    return queryToken;
  }
  return localStorage.getItem('igrid_session');
}

async function checkSessionOrRedirect() {
  const token = getSessionToken();
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  try {
    const res = await fetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      localStorage.removeItem('igrid_session');
      window.location.href = '/login';
      return false;
    }
    const data = await res.json();
    state.currentUser = data.user;
    updateUserNavbarUI();
    return true;
  } catch (err) {
    window.location.href = '/login';
    return false;
  }
}

async function authFetch(url, options = {}) {
  const token = getSessionToken();
  if (!token) {
    window.location.href = '/login';
    throw new Error('Unauthenticated');
  }

  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${token}`;
  options.headers = headers;

  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('igrid_session');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

function updateUserNavbarUI() {
  const userRoleBadge = document.getElementById('user-display-role');
  const userNameText = document.getElementById('user-display-name');
  const openAddStudentBtn = document.getElementById('open-add-student-modal');
  const openAddProjectBtn = document.getElementById('open-project-modal');

  if (state.currentUser) {
    const isAdmin = isUserAdmin();
    const displayName = state.currentUser.name || state.currentUser.email.split('@')[0];

    if (userNameText) userNameText.textContent = displayName;
    if (userRoleBadge) {
      userRoleBadge.textContent = isAdmin ? '👑 Admin Coordinator' : '🎓 Student Innovator';
      userRoleBadge.className = `badge ${isAdmin ? 'badge-primary' : 'badge-success'}`;
    }

    if (!isAdmin) {
      if (openAddStudentBtn) openAddStudentBtn.style.display = 'none';
      if (openAddProjectBtn) openAddProjectBtn.style.display = 'none';
    } else {
      if (openAddStudentBtn) openAddStudentBtn.style.display = 'inline-block';
      if (openAddProjectBtn) openAddProjectBtn.style.display = 'inline-block';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const authenticated = await checkSessionOrRedirect();
  if (!authenticated) return;

  initEventListeners();
  await loadAllData();
  initTunnelPoller();
  initChatbotWidget();
});

let chatHistory = [];

function parseMarkdownChat(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.4); padding:2px 5px; border-radius:4px; font-family:monospace;">$1</code>')
    .replace(/\n/g, '<br>');
  return html;
}

function initChatbotWidget() {
  const toggleBtn = document.getElementById('chatbot-toggle-btn');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send-btn');
  const messagesBox = document.getElementById('chatbot-messages');
  const scopedLabel = document.getElementById('chatbot-scoped-label');

  if (!toggleBtn || !panel) return;

  if (scopedLabel && state.currentUser) {
    const isAdmin = state.currentUser.email === 'kaviyaarumugam541@gmail.com' || state.currentUser.role === 'admin';
    scopedLabel.textContent = isAdmin ? '🌐 Admin Lab-Wide Context' : `👥 Scoped to User: ${state.currentUser.email}`;
  }

  toggleBtn.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  };

  closeBtn.onclick = () => {
    panel.style.display = 'none';
  };

  async function handleSendChat() {
    const query = input.value.trim();
    if (!query) return;

    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user-msg';
    userDiv.textContent = query;
    messagesBox.appendChild(userDiv);
    input.value = '';
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Add user message to history
    chatHistory.push({ role: 'user', content: query });

    // Append Loading Indicator
    const botLoading = document.createElement('div');
    botLoading.className = 'chat-msg bot-msg';
    botLoading.textContent = '⏳ Thinking...';
    messagesBox.appendChild(botLoading);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: chatHistory })
      });
      const data = await res.json();
      const reply = data.reply || 'No response from assistant.';
      botLoading.innerHTML = parseMarkdownChat(reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } catch(err) {
      botLoading.textContent = '⚠️ Failed to connect to AI assistant.';
    }

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  if (sendBtn) sendBtn.onclick = handleSendChat;
  if (input) {
    input.onkeyup = (e) => {
      if (e.key === 'Enter') handleSendChat();
    };
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('igrid_theme') || 'dark';
  applyTheme(savedTheme);

  if (DOM.themeToggleBtn) {
    DOM.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('igrid_theme', theme);

  if (DOM.themeIconDark && DOM.themeIconLight && DOM.themeLabel) {
    if (theme === 'light') {
      DOM.themeIconDark.style.display = 'none';
      DOM.themeIconLight.style.display = 'inline';
      DOM.themeLabel.textContent = 'Light';
    } else {
      DOM.themeIconDark.style.display = 'inline';
      DOM.themeIconLight.style.display = 'none';
      DOM.themeLabel.textContent = 'Dark';
    }
  }
}

async function loadAllData() {
  try {
    await fetchDomains();
    renderDomainsUI();
    await Promise.all([
      fetchProjects(),
      fetchStudents(),
      fetchBoms(),
      fetchNotifications(),
      fetchTunnelInfo()
    ]);
    renderAllViews();
    updateStatsSummary();
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Failed to load lab data from server', 'error');
  }
}

let activePublicUrl = '';
async function fetchTunnelInfo() {
  try {
    const res = await fetch('/tunnel_info.json?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data.public_url && data.public_url.startsWith('https://')) {
        activePublicUrl = data.public_url;
        if (DOM.publicTunnelText) {
          DOM.publicTunnelText.textContent = data.public_url.replace('https://', '');
          DOM.publicTunnelText.title = data.public_url;
        }
      }
    }
  } catch (e) {
    // Tunnel json might not be ready yet
  }
}

function initTunnelPoller() {
  setInterval(fetchTunnelInfo, 5000);
  if (DOM.copyPublicLinkBtn) {
    DOM.copyPublicLinkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const urlToCopy = activePublicUrl || window.location.origin;
      navigator.clipboard.writeText(urlToCopy).then(() => {
        showToast('Public Link copied to clipboard: ' + urlToCopy);
      }).catch(() => {
        prompt('Copy this link:', urlToCopy);
      });
    });
  }
}

// ----------------------------------------------------
// DOMAIN MANAGEMENT
// ----------------------------------------------------
async function fetchDomains() {
  try {
    const res = await authFetch('/api/domains');
    if (res.ok) {
      const data = await res.json();
      state.domains = (data || []).map(d => typeof d === 'string' ? { name: d, description: '' } : d);
      try {
        localStorage.setItem('igrid_domains', JSON.stringify(state.domains));
      } catch (e) {}
      return;
    }
  } catch (err) {
    console.warn('Failed to fetch domains from API:', err);
  }

  // Fallback to localStorage or defaults
  try {
    const local = localStorage.getItem('igrid_domains');
    if (local) {
      state.domains = JSON.parse(local);
      return;
    }
  } catch (e) {}

  state.domains = [
    { name: 'AI', description: 'AI & Computer Vision' },
    { name: 'Robotics', description: 'Robotics & Manipulators' },
    { name: 'Drones', description: 'Drones & UAVs' },
    { name: 'IoT', description: 'IoT & Smart Grid' },
    { name: 'Embedded', description: 'Embedded Systems & FPGA' }
  ];
}

function renderDomainsUI() {
  if (!state.domains || state.domains.length === 0) return;

  // 1. Form Domain Select (#form-domain)
  const formDomainSelect = DOM.formDomain || document.getElementById('form-domain');
  if (formDomainSelect) {
    const currentVal = formDomainSelect.value;
    let html = state.domains.map(d => {
      const name = d.name;
      let label = name;
      if (name === 'AI') label = 'AI & Computer Vision';
      else if (name === 'Robotics') label = 'Robotics & Manipulators';
      else if (name === 'Drones') label = 'Drones & UAVs';
      else if (name === 'IoT') label = 'IoT & Smart Grid';
      else if (name === 'Embedded') label = 'Embedded Systems & FPGA';
      else if (d.description) label = `${name} (${d.description})`;
      return `<option value="${escapeHTML(name)}">${escapeHTML(label)}</option>`;
    }).join('');
    html += '<option value="__add_new_domain__">➕ + Add New Domain</option>';
    formDomainSelect.innerHTML = html;

    if (currentVal && currentVal !== '__add_new_domain__' && state.domains.some(d => d.name === currentVal)) {
      formDomainSelect.value = currentVal;
    }
  }

  // 2. Main Domain Filter Pills (#domain-filter-pills)
  const filterPillsRoot = DOM.domainFilterPillsRoot || document.getElementById('domain-filter-pills');
  if (filterPillsRoot) {
    const knownDotClasses = {
      'AI': 'dot-ai',
      'Robotics': 'dot-rob',
      'Drones': 'dot-drn',
      'IoT': 'dot-iot',
      'Embedded': 'dot-emb'
    };

    let pillsHtml = `<button class="domain-pill ${state.filterDomain === 'All' ? 'active' : ''}" data-domain="All">All Domains</button>`;
    state.domains.forEach(d => {
      const name = d.name;
      const dotClass = knownDotClasses[name] || 'dot-ai';
      pillsHtml += `<button class="domain-pill ${state.filterDomain === name ? 'active' : ''}" data-domain="${escapeHTML(name)}"><span class="${dotClass}"></span> ${escapeHTML(name)}</button>`;
    });
    filterPillsRoot.innerHTML = pillsHtml;

    // Re-attach listeners to domain pills
    DOM.domainPills = document.querySelectorAll('.domain-pill');
    DOM.domainPills.forEach(pill => {
      pill.addEventListener('click', async () => {
        DOM.domainPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.filterDomain = pill.getAttribute('data-domain');
        await fetchProjects();
        renderAllViews();
      });
    });
  }

  // 3. Advanced Filter Drawer Select (#drawer-domain-select)
  const drawerSelect = DOM.drawerDomainSelect || document.getElementById('drawer-domain-select');
  if (drawerSelect) {
    let drawerHtml = '<option value="All">All Domains</option>';
    drawerHtml += state.domains.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)}</option>`).join('');
    drawerSelect.innerHTML = drawerHtml;
    drawerSelect.value = state.filterDomain || 'All';
  }
}

let lastSelectedDomainVal = 'AI';

function openAddDomainModal() {
  const formDomainSelect = DOM.formDomain || document.getElementById('form-domain');
  if (formDomainSelect && formDomainSelect.value !== '__add_new_domain__') {
    lastSelectedDomainVal = formDomainSelect.value;
  }
  const modal = DOM.addDomainModal || document.getElementById('add-domain-modal');
  if (modal) {
    const nameInput = document.getElementById('new-domain-name');
    const descInput = document.getElementById('new-domain-desc');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

function closeAddDomainModal(wasAdded = false) {
  const modal = DOM.addDomainModal || document.getElementById('add-domain-modal');
  if (modal) {
    modal.classList.remove('active');
    if (DOM.projectModal && !DOM.projectModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }
  const formDomainSelect = DOM.formDomain || document.getElementById('form-domain');
  if (!wasAdded && formDomainSelect) {
    if (formDomainSelect.value === '__add_new_domain__') {
      formDomainSelect.value = lastSelectedDomainVal || (state.domains[0] ? state.domains[0].name : 'AI');
    }
  }
}

async function handleAddDomainSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('new-domain-name');
  const descInput = document.getElementById('new-domain-desc');
  const name = (nameInput ? nameInput.value : '').trim();
  const description = (descInput ? descInput.value : '').trim();

  if (!name) {
    showToast('Please enter a domain name.', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  // Client-side case-insensitive duplicate check
  const exists = state.domains.some(d => d.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showToast('Domain name already exists.', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  try {
    const res = await authFetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (res.ok) {
      const data = await res.json();
      showToast(data.message || 'Domain added successfully.');
      closeAddDomainModal(true);
      await fetchDomains();
      renderDomainsUI();

      // Automatically select newly created domain for current project form
      const formDomainSelect = DOM.formDomain || document.getElementById('form-domain');
      if (formDomainSelect) {
        formDomainSelect.value = name;
        lastSelectedDomainVal = name;
      }
      updateStatsSummary();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Failed to add domain.', 'error');
    }
  } catch (err) {
    console.error('Error adding domain:', err);
    showToast('Network error while adding domain.', 'error');
  }
}

// API FETCHERS
async function fetchProjects() {
  const params = new URLSearchParams();
  if (state.filterDomain !== 'All') params.append('domain', state.filterDomain);
  if (state.filterStatus !== 'All') params.append('status', state.filterStatus);
  if (state.filterPriority !== 'All') params.append('priority', state.filterPriority);
  if (state.filterTag) params.append('tag', state.filterTag);
  if (state.searchQuery) params.append('search', state.searchQuery);
  if (state.sortBy) params.append('sort', state.sortBy);

  const res = await authFetch(`/api/projects?${params.toString()}`);
  state.projects = await res.json();
}

async function fetchStudents() {
  const res = await authFetch('/api/students');
  state.students = await res.json();
}

async function fetchBoms() {
  const res = await authFetch('/api/bom');
  state.boms = await res.json();
}

async function fetchNotifications() {
  const pendingBoms = state.boms.filter(b => b.status === 'Pending');
  const today = new Date().toISOString().split('T')[0];
  const overdueProjects = state.projects.filter(p => p.due_date && p.due_date < today && p.status !== 'completed');

  const totalAlerts = pendingBoms.length + overdueProjects.length;
  if (DOM.notifBadge) DOM.notifBadge.textContent = totalAlerts;
  if (DOM.tabBomCount) DOM.tabBomCount.textContent = pendingBoms.length;

  let html = '';
  if (pendingBoms.length === 0 && overdueProjects.length === 0) {
    html = '<div class="notif-item" style="color:var(--text-dim);">No pending alerts. All systems running smoothly!</div>';
  } else {
    pendingBoms.forEach(b => {
      html += `
        <div class="notif-item">
          <div style="font-weight:700; color:#fbbf24;">📦 BOM Approval Requisition</div>
          <div>${b.project_code}: ${b.item_name} (₹${Number(b.total_price).toLocaleString('en-IN')})</div>
          <div style="font-size:10px; color:var(--text-dim);">By ${b.submitted_by}</div>
        </div>
      `;
    });
    overdueProjects.forEach(p => {
      html += `
        <div class="notif-item">
          <div style="font-weight:700; color:#f87171;">⚠️ Milestone Overdue</div>
          <div>${p.project_code}: ${p.title}</div>
          <div style="font-size:10px; color:var(--text-dim);">Due: ${formatDate(p.due_date)}</div>
        </div>
      `;
    });
  }
  if (DOM.notifList) DOM.notifList.innerHTML = html;
}

// ----------------------------------------------------
// EVENT LISTENERS
// ----------------------------------------------------
function initEventListeners() {
  // Global Search with debounce
  let searchTimeout;
  DOM.globalSearch.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    DOM.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      await fetchProjects();
      renderAllViews();
    }, 200);
  });

  DOM.clearSearch.addEventListener('click', async () => {
    DOM.globalSearch.value = '';
    state.searchQuery = '';
    DOM.clearSearch.style.display = 'none';
    await fetchProjects();
    renderAllViews();
  });

  // Keyboard shortcut '/' to search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== DOM.globalSearch && !document.activeElement.matches('input, textarea, select')) {
      e.preventDefault();
      DOM.globalSearch.focus();
    }
  });

  // View Switcher Tabs
  DOM.viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      switchView(view);
    });
  });

  // Domain Filter Pills
  DOM.domainPills.forEach(pill => {
    pill.addEventListener('click', async () => {
      DOM.domainPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.filterDomain = pill.getAttribute('data-domain');
      await fetchProjects();
      renderAllViews();
    });
  });

  // Hashtag Cloud Filter
  if (DOM.hashtagCloud) {
    DOM.hashtagCloud.addEventListener('click', async (e) => {
      if (e.target.classList.contains('hashtag-chip')) {
        DOM.hashtagCloud.querySelectorAll('.hashtag-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        state.filterTag = e.target.getAttribute('data-tag');
        await fetchProjects();
        renderAllViews();
      }
    });
  }

  // Sort Dropdown
  DOM.sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.sortDropdown.classList.toggle('show');
  });

  DOM.sortDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', async () => {
      state.sortBy = item.getAttribute('data-sort');
      DOM.sortLabel.textContent = `Sort: ${item.textContent.split('(')[0].trim()}`;
      DOM.sortDropdown.classList.remove('show');
      await fetchProjects();
      renderAllViews();
    });
  });

  // Export Dropdown
  DOM.exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.exportDropdown.classList.toggle('show');
  });

  // Notifications Dropdown
  DOM.notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.notifDropdown.classList.toggle('show');
  });

  // Activity Dropdown
  DOM.activityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.activityDropdown.classList.toggle('show');
    renderRecentActivityFeed();
  });

  // Close dropdowns on outside click
  window.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
  });

  // Print Report Action
  DOM.printReportBtn.addEventListener('click', () => {
    window.print();
  });

  // Filter Drawer
  DOM.filterBtn.addEventListener('click', () => {
    DOM.filterDrawer.classList.add('open');
  });
  DOM.closeFilterDrawer.addEventListener('click', () => {
    DOM.filterDrawer.classList.remove('open');
  });
  DOM.btnApplyFilters.addEventListener('click', async () => {
    state.filterDomain = document.getElementById('drawer-domain-select').value;
    state.filterPriority = document.getElementById('drawer-priority-select').value;
    state.filterStatus = document.getElementById('drawer-status-select').value;
    state.filterTag = document.getElementById('drawer-tag-input').value.trim();

    DOM.filterActiveDot.style.display = (state.filterDomain !== 'All' || state.filterPriority !== 'All' || state.filterStatus !== 'All' || state.filterTag) ? 'block' : 'none';

    DOM.filterDrawer.classList.remove('open');
    await fetchProjects();
    renderAllViews();
    showToast('Filters applied successfully');
  });

  DOM.btnResetFilters.addEventListener('click', async () => {
    document.getElementById('drawer-domain-select').value = 'All';
    document.getElementById('drawer-priority-select').value = 'All';
    document.getElementById('drawer-status-select').value = 'All';
    document.getElementById('drawer-tag-input').value = '';
    state.filterDomain = 'All';
    state.filterPriority = 'All';
    state.filterStatus = 'All';
    state.filterTag = '';
    DOM.filterActiveDot.style.display = 'none';
    DOM.filterDrawer.classList.remove('open');
    await fetchProjects();
    renderAllViews();
    showToast('Filters reset to default');
  });

  // Domain Management Modal Actions
  if (DOM.btnOpenAddDomain) {
    DOM.btnOpenAddDomain.addEventListener('click', openAddDomainModal);
  }
  if (DOM.closeAddDomainModal) {
    DOM.closeAddDomainModal.addEventListener('click', () => closeAddDomainModal(false));
  }
  if (DOM.btnCancelAddDomain) {
    DOM.btnCancelAddDomain.addEventListener('click', () => closeAddDomainModal(false));
  }
  if (DOM.addDomainForm) {
    DOM.addDomainForm.addEventListener('submit', handleAddDomainSubmit);
  }
  if (DOM.formDomain) {
    DOM.formDomain.addEventListener('change', (e) => {
      if (e.target.value === '__add_new_domain__') {
        openAddDomainModal();
      } else {
        lastSelectedDomainVal = e.target.value;
      }
    });
  }

  // Project Modal Actions
  DOM.openAddTaskModal.addEventListener('click', () => openProjectModalForCreate());
  DOM.closeProjectModal.addEventListener('click', () => closeModal(DOM.projectModal));
  DOM.cancelProjectBtn.addEventListener('click', () => closeModal(DOM.projectModal));
  DOM.projectForm.addEventListener('submit', handleProjectFormSubmit);
  initEditFormLinkProtection();

  // Column quick add buttons
  document.querySelectorAll('.col-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const colStatus = btn.getAttribute('data-status');
      openProjectModalForCreate(colStatus);
    });
  });

  // Detail Modal Actions
  DOM.closeDetailModal.addEventListener('click', () => closeModal(DOM.detailModal));
  DOM.btnCloseDetail.addEventListener('click', () => closeModal(DOM.detailModal));
  DOM.btnEditCurrentProject.addEventListener('click', () => {
    const project = state.projects.find(p => p.id === state.activeProjectId);
    if (project) {
      closeModal(DOM.detailModal);
      openProjectModalForEdit(project);
    }
  });
  DOM.btnDeleteProject.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this project and all associated records?')) {
      await deleteProject(state.activeProjectId);
      closeModal(DOM.detailModal);
    }
  });

  DOM.btnQuickAddBom.addEventListener('click', () => {
    const project = state.projects.find(p => p.id === state.activeProjectId);
    if (project) {
      openBomModal(project.project_code);
    }
  });

  DOM.addCommentForm.addEventListener('submit', handleCommentSubmit);

  // Project Task Management Modal Actions & Global Event Delegation
  document.addEventListener('click', function(event) {
    const addTaskBtn = event.target.closest('.add-task-btn, #btn-add-project-task, .ref-gantt-add-btn, #btn-gantt-add-task');
    if (addTaskBtn) {
      event.preventDefault();
      event.stopPropagation();
      openTaskModalForCreate();
      return;
    }

    const editTaskBtn = event.target.closest('.btn-edit-task, [data-action="edit-task"]');
    if (editTaskBtn) {
      event.preventDefault();
      event.stopPropagation();
      const taskId = parseInt(editTaskBtn.getAttribute('data-task-id'), 10);
      if (taskId) openTaskModalForEdit(taskId);
      return;
    }

    const deleteTaskBtn = event.target.closest('.btn-delete-task, [data-action="delete-task"]');
    if (deleteTaskBtn) {
      event.preventDefault();
      event.stopPropagation();
      const taskId = parseInt(deleteTaskBtn.getAttribute('data-task-id'), 10);
      if (taskId) deleteTask(taskId);
      return;
    }
  });

  if (DOM.closeTaskModal) DOM.closeTaskModal.addEventListener('click', () => closeModal(DOM.taskModal));
  if (DOM.btnCancelTask) DOM.btnCancelTask.addEventListener('click', () => closeModal(DOM.taskModal));
  if (DOM.taskForm) DOM.taskForm.addEventListener('submit', handleTaskFormSubmit);

  const taskStartInput = document.getElementById('task-start-input');
  const taskEndInput = document.getElementById('task-end-input');
  const taskStartMonthInput = document.getElementById('task-start-month-input');
  const taskEndMonthInput = document.getElementById('task-end-month-input');

  if (taskStartMonthInput) taskStartMonthInput.addEventListener('change', syncDatesFromMonthDropdowns);
  if (taskEndMonthInput) taskEndMonthInput.addEventListener('change', syncDatesFromMonthDropdowns);

  if (taskStartInput) taskStartInput.addEventListener('change', () => { syncMonthDropdownsFromDates(); updateTaskDurationPreview(); });
  if (taskEndInput) taskEndInput.addEventListener('change', () => { syncMonthDropdownsFromDates(); updateTaskDurationPreview(); });

  if (DOM.closeTaskInfoModal) DOM.closeTaskInfoModal.addEventListener('click', () => closeModal(DOM.taskInfoModal));
  if (DOM.btnCloseTaskInfo) DOM.btnCloseTaskInfo.addEventListener('click', () => closeModal(DOM.taskInfoModal));

  // Spotlight Modal Actions
  DOM.closeSpotlightModal.addEventListener('click', () => closeModal(DOM.spotlightModal));
  DOM.btnCloseSpotlight.addEventListener('click', () => closeModal(DOM.spotlightModal));

  // BOM Modal Actions
  DOM.openAddBomModal.addEventListener('click', () => openBomModal());
  DOM.closeBomModal.addEventListener('click', () => closeModal(DOM.bomModal));
  DOM.cancelBomBtn.addEventListener('click', () => closeModal(DOM.bomModal));
  DOM.bomForm.addEventListener('submit', handleBomFormSubmit);

  // Student Modal Actions
  DOM.openAddStudentModal.addEventListener('click', () => openModal(DOM.studentModal));
  DOM.closeStudentModal.addEventListener('click', () => closeModal(DOM.studentModal));
  DOM.cancelStudentBtn.addEventListener('click', () => closeModal(DOM.studentModal));
  DOM.studentForm.addEventListener('submit', handleStudentFormSubmit);

  const closeStudentViewModal = document.getElementById('close-student-view-modal');
  if (closeStudentViewModal) closeStudentViewModal.addEventListener('click', () => closeModal(document.getElementById('student-view-modal')));

  const btnCloseStudentView = document.getElementById('btn-close-student-view');
  if (btnCloseStudentView) btnCloseStudentView.addEventListener('click', () => closeModal(document.getElementById('student-view-modal')));

  const closeStudentEditModal = document.getElementById('close-student-edit-modal');
  if (closeStudentEditModal) closeStudentEditModal.addEventListener('click', () => closeModal(document.getElementById('student-edit-modal')));

  const cancelStudentEditBtn = document.getElementById('cancel-student-edit-btn');
  if (cancelStudentEditBtn) cancelStudentEditBtn.addEventListener('click', () => closeModal(document.getElementById('student-edit-modal')));

  const studentEditForm = document.getElementById('student-edit-form');
  if (studentEditForm) studentEditForm.addEventListener('submit', handleStudentEditFormSubmit);

  // Student Search & Filter Listeners
  const studentSearchInput = document.getElementById('student-search-input');
  if (studentSearchInput) studentSearchInput.addEventListener('input', renderStudents);

  const studentDeptFilter = document.getElementById('student-dept-filter');
  if (studentDeptFilter) studentDeptFilter.addEventListener('change', renderStudents);

  const studentYearFilter = document.getElementById('student-year-filter');
  if (studentYearFilter) studentYearFilter.addEventListener('change', renderStudents);

  const studentStatusFilter = document.getElementById('student-status-filter');
  if (studentStatusFilter) studentStatusFilter.addEventListener('change', renderStudents);

  const studentSortBy = document.getElementById('student-sort-by');
  if (studentSortBy) studentSortBy.addEventListener('change', renderStudents);

  // Calendar Activity Modal Listeners
  const closeCalModal = document.getElementById('close-calendar-activity-modal');
  if (closeCalModal) closeCalModal.addEventListener('click', () => closeModal(document.getElementById('calendar-activity-modal')));

  const cancelCalBtn = document.getElementById('cancel-cal-activity-btn');
  if (cancelCalBtn) cancelCalBtn.addEventListener('click', () => closeModal(document.getElementById('calendar-activity-modal')));

  const calForm = document.getElementById('calendar-activity-form');
  if (calForm) calForm.addEventListener('submit', handleCalendarActivityFormSubmit);

  // Analytics Modal Actions
  DOM.labAnalyticsBtn.addEventListener('click', () => openAnalyticsModal());
  DOM.closeAnalyticsModal.addEventListener('click', () => closeModal(DOM.analyticsModal));
  DOM.btnCloseAnalytics.addEventListener('click', () => closeModal(DOM.analyticsModal));

  const btnRefreshAnalytics = document.getElementById('btn-refresh-analytics');
  if (btnRefreshAnalytics) btnRefreshAnalytics.addEventListener('click', loadAnalyticsData);

  const btnRetryAnalytics = document.getElementById('btn-retry-analytics');
  if (btnRetryAnalytics) btnRetryAnalytics.addEventListener('click', loadAnalyticsData);
}

function switchView(viewName) {
  DOM.viewTabs.forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-view') === viewName);
  });
  DOM.viewPanels.forEach(p => {
    p.classList.toggle('active', p.id === `view-${viewName}`);
  });
  state.currentView = viewName;
  renderAllViews();
}

// ----------------------------------------------------
// RENDERING FUNCTIONS
// ----------------------------------------------------
function renderAllViews() {
  renderKanban();
  renderExecutiveShowcase();
  renderTimeline();
  renderList();
  renderTable();
  renderBOM();
  renderCompleted();
  renderStudents();
  renderAnalytics();
  populateBomProjectSelect();
}

// 1. RENDER EXECUTIVE MANAGEMENT SHOWCASE (NEW COMPONENT)
function renderExecutiveShowcase() {
  if (!DOM.execShowcaseGridRoot) return;

  // Compute Executive KPIs
  const totalProjects = state.projects.length;
  const avgProgress = totalProjects > 0 ? Math.round(state.projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects) : 0;
  const approvedBudget = state.boms.filter(b => b.status === 'Approved').reduce((acc, b) => acc + (b.total_price || 0), 0);
  const pendingBOMs = state.boms.filter(b => b.status === 'Pending');

  if (DOM.execAvgProgress) DOM.execAvgProgress.textContent = `${avgProgress}%`;
  if (DOM.execAvgProgressBar) DOM.execAvgProgressBar.style.width = `${avgProgress}%`;
  if (DOM.execApprovedBudget) DOM.execApprovedBudget.textContent = `₹${approvedBudget.toLocaleString('en-IN')}`;
  if (DOM.execPendingBomCount) DOM.execPendingBomCount.textContent = `${pendingBOMs.length} Items`;
  if (DOM.execStudentCount) DOM.execStudentCount.textContent = `${state.students.length} Engineers`;

  if (state.projects.length === 0) {
    DOM.execShowcaseGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No innovation projects found for the current filters.</div>';
    return;
  }

  let html = '';
  state.projects.forEach(p => {
    const priorityBadge = p.priority === 'High' ? 'badge-high' : (p.priority === 'Normal' ? 'badge-normal' : 'badge-low');
    const defaultHero = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    const heroImg = p.image_url || defaultHero;

    // Team Lead Photo
    const leadPhoto = p.team_lead_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_lead || 'Lead')}&background=6366f1&color=fff`;

    // Team Member Avatars
    const members = Array.isArray(p.team_members) ? p.team_members : [];
    let memberAvatarsHTML = members.slice(0, 3).map(m => {
      const mName = typeof m === 'object' && m ? (m.name || 'Student') : String(m);
      const mRole = typeof m === 'object' && m ? (m.role || 'Member') : 'Member';
      const mPhoto = (typeof m === 'object' && m && m.photo) ? m.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=8b5cf6&color=fff`;
      return `<img src="${mPhoto}" class="avatar-badge" title="${escapeHTML(mName)} (${mRole})" alt="${escapeHTML(mName)}">`;
    }).join('');

    // Check if project has pending BOM
    const hasPendingBOM = p.bom_status === 'Submitted';

    // Media Links
    const mediaLinks = [];
    if (p.github_repo) mediaLinks.push(`<a href="${p.github_repo}" target="_blank" class="btn-media btn-media-github" title="View Code">🐙 GitHub</a>`);
    if (p.youtube_url) mediaLinks.push(`<a href="${p.youtube_url}" target="_blank" class="btn-media btn-media-youtube" title="Watch Demo Video">🎥 Video Demo</a>`);
    if (p.linkedin_url) mediaLinks.push(`<a href="${p.linkedin_url}" target="_blank" class="btn-media btn-media-linkedin" title="LinkedIn Showcase">💼 LinkedIn</a>`);
    if (p.doc_url) mediaLinks.push(`<a href="${p.doc_url}" target="_blank" class="btn-media btn-media-doc" title="Datasheet & Docs">📄 Docs</a>`);

    html += `
      <div class="exec-card">
        <!-- Hero Photo with Badges -->
        <div class="exec-card-hero">
          <img src="${heroImg}" alt="${escapeHTML(p.title)}" loading="lazy">
          <div class="exec-card-overlay">
            <div class="exec-card-top-badges">
              <span class="card-id-code">${p.project_code}</span>
              <div class="exec-progress-radial">
                <span class="pulse-indicator"></span>
                <span class="exec-progress-num">${p.progress || 0}%</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
              <span class="badge badge-blue">${p.domain}</span>
              <span class="badge ${priorityBadge}">${p.priority} Priority</span>
            </div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="exec-card-body">
          <h3 class="exec-card-title">${escapeHTML(p.title)}</h3>
          <p class="exec-card-desc">${escapeHTML(p.description || '')}</p>

          <!-- Team Lead Row -->
          <div class="exec-card-lead-row">
            <div class="exec-lead-info">
              <img src="${leadPhoto}" alt="${escapeHTML(p.team_lead || 'Lead')}" class="exec-lead-avatar">
              <div>
                <div class="exec-lead-name">${escapeHTML(p.team_lead || 'Student Lead')}</div>
                <div class="exec-lead-role">${escapeHTML(p.team_name || 'Innovation Group')}</div>
              </div>
            </div>
            <div class="avatar-group">
              ${memberAvatarsHTML}
            </div>
          </div>

          <!-- Immediate Action / Procurement Alert -->
          <div class="exec-action-alert">
            <div class="exec-action-alert-text">
              <strong>${hasPendingBOM ? '⚠️ BOM Requisition Pending:' : '⚡ Next Action Item:'}</strong>
              <div>${escapeHTML(p.immediate_action || 'Ongoing prototype development')}</div>
            </div>
            ${hasPendingBOM ? `<button class="btn btn-sm btn-primary" onclick="switchView('bom')">Review BOM</button>` : ''}
          </div>

          <!-- Media & Social Links -->
          ${mediaLinks.length > 0 ? `
            <div class="exec-media-links">
              ${mediaLinks.join('')}
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="exec-card-footer">
          <span style="font-size:12px; color:var(--text-dim);">Due: <strong>${formatDate(p.due_date)}</strong></span>
          <button class="btn btn-sm btn-primary" onclick="openSpotlightPresentation(${p.id})">
            <span>🔍 Spotlight View</span>
          </button>
        </div>
      </div>
    `;
  });

  DOM.execShowcaseGridRoot.innerHTML = html;
}

// 2. SPOTLIGHT PRESENTATION VIEW
async function openSpotlightPresentation(projectId) {
  try {
    const res = await fetch(`/api/projects/${projectId}`);
    const project = await res.json();

    document.getElementById('spotlight-code').textContent = `${project.project_code} - ${project.title}`;
    document.getElementById('spotlight-domain').textContent = project.domain;

    const defaultHero = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    const heroImg = project.image_url || defaultHero;
    const leadPhoto = project.team_lead_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.team_lead || 'Lead')}&background=6366f1&color=fff`;

    // Members list
    const members = Array.isArray(project.team_members) ? project.team_members : [];
    const membersHTML = members.map(m => {
      const mName = typeof m === 'object' && m ? (m.name || 'Student') : String(m);
      const mRole = typeof m === 'object' && m ? (m.role || 'Member') : 'Innovator';
      const mPhoto = (typeof m === 'object' && m && m.photo) ? m.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=8b5cf6&color=fff`;
      return `
        <div style="display:flex; align-items:center; gap:8px; background:var(--bg-card-sub); padding:6px 10px; border-radius:6px; border:1px solid var(--border-color);">
          <img src="${mPhoto}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-size:12px; font-weight:700; color:var(--text-main);">${escapeHTML(mName)}</div>
            <div style="font-size:10px; color:var(--text-dim);">${escapeHTML(mRole)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Media Links
    const mediaPills = [];
    if (project.github_repo) mediaPills.push(`<a href="${project.github_repo}" target="_blank" class="btn-media btn-media-github">🐙 GitHub Repository</a>`);
    if (project.youtube_url) mediaPills.push(`<a href="${project.youtube_url}" target="_blank" class="btn-media btn-media-youtube">🎥 YouTube Video Demo</a>`);
    if (project.linkedin_url) mediaPills.push(`<a href="${project.linkedin_url}" target="_blank" class="btn-media btn-media-linkedin">💼 LinkedIn Announcement</a>`);
    if (project.doc_url) mediaPills.push(`<a href="${project.doc_url}" target="_blank" class="btn-media btn-media-doc">📄 Technical Datasheet</a>`);

    // BOM Table in Spotlight
    const bomRows = (project.boms || []).map(b => `
      <tr>
        <td><strong>${escapeHTML(b.item_name)}</strong><br><small style="color:var(--text-dim);">${b.part_number || ''}</small></td>
        <td>${b.quantity}</td>
        <td style="color:#34d399; font-weight:700;">₹${Number(b.total_price).toLocaleString('en-IN')}</td>
        <td><span class="badge ${b.status === 'Approved' ? 'badge-normal' : 'badge-date'}">${b.status}</span></td>
      </tr>
    `).join('');

    DOM.spotlightBodyRoot.innerHTML = `
      <div class="spotlight-hero-media">
        <img src="${heroImg}" alt="${escapeHTML(project.title)}">
      </div>

      <div class="spotlight-grid">
        <div class="spotlight-details">
          <h2>${escapeHTML(project.title)}</h2>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.6;">${escapeHTML(project.description || '')}</p>

          <div class="detail-action-box">
            <strong>⚡ Critical Immediate Action Item / Blocker:</strong>
            <p style="margin-top:2px;">${escapeHTML(project.immediate_action || 'No critical blockers reported.')}</p>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span>Overall Milestone Progress</span>
              <strong>${project.progress || 0}%</strong>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${project.progress || 0}%;"></div>
            </div>
          </div>

          <div>
            <h4 style="font-size:13px; font-weight:700; margin-bottom:8px;">🔗 Project Media & Repository Access</h4>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${mediaPills.join('') || '<span style="color:var(--text-dim);">No external links added.</span>'}
            </div>
          </div>

          <div>
            <h4 style="font-size:13px; font-weight:700; margin-bottom:8px;">📦 Hardware BOM Requisitions</h4>
            <table class="data-table">
              <thead><tr><th>Component</th><th>Qty</th><th>Total Cost</th><th>Status</th></tr></thead>
              <tbody>${bomRows || '<tr><td colspan="4" style="text-align:center; color:var(--text-dim);">No BOM items submitted</td></tr>'}</tbody>
            </table>
          </div>
        </div>

        <div class="spotlight-sidebar">
          <div class="student-card">
            <span style="font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase;">TEAM LEAD</span>
            <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
              <img src="${leadPhoto}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
              <div>
                <h4 style="font-size:14px; font-weight:700; color:#fff;">${escapeHTML(project.team_lead || 'Lead')}</h4>
                <span style="font-size:11px; color:var(--text-dim);">${escapeHTML(project.team_name || 'Lab Group')}</span>
              </div>
            </div>
          </div>

          <div class="student-card">
            <span style="font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase; margin-bottom:6px;">STUDENT TEAM MEMBERS</span>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${membersHTML || '<div style="color:var(--text-dim); font-size:12px;">No members listed</div>'}
            </div>
          </div>

          <div class="student-card">
            <span style="font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase;">PROJECT DETAILS</span>
            <div style="font-size:12px; display:flex; flex-direction:column; gap:4px; margin-top:4px;">
              <div><strong>Status:</strong> ${formatStatus(project.status)}</div>
              <div><strong>Priority:</strong> ${project.priority}</div>
              <div><strong>Due Date:</strong> ${formatDate(project.due_date)}</div>
              <div><strong>BOM Status:</strong> ${project.bom_status}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    openModal(DOM.spotlightModal);
  } catch (err) {
    showToast('Failed to open spotlight presentation', 'error');
  }
}

// 3. RENDER KANBAN (EXACT MATCH TO REFERENCE IMAGE)
function renderKanban() {
  const cols = {
    in_queue: [],
    in_progress: [],
    testing: [],
    completed: []
  };

  state.projects.forEach(p => {
    if (cols[p.status]) {
      cols[p.status].push(p);
    }
  });

  DOM.countInQueue.textContent = cols.in_queue.length;
  DOM.countInProgress.textContent = cols.in_progress.length;
  DOM.countTesting.textContent = cols.testing.length;
  DOM.countCompleted.textContent = cols.completed.length;

  DOM.cardsInQueue.innerHTML = cols.in_queue.map(createCardHTML).join('');
  DOM.cardsInProgress.innerHTML = cols.in_progress.map(createCardHTML).join('');
  DOM.cardsTesting.innerHTML = cols.testing.map(createCardHTML).join('');
  DOM.cardsCompleted.innerHTML = cols.completed.map(createCardHTML).join('');

  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-tag-pill') || e.target.closest('.card-tag-pill')) return;
      const id = Number(card.getAttribute('data-id'));
      openProjectDetail(id);
    });
  });

  document.querySelectorAll('.card-tag-pill').forEach(pill => {
    pill.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tag = pill.getAttribute('data-tag');
      state.filterTag = tag;
      await fetchProjects();
      renderAllViews();
      showToast(`Filtering by tag ${tag}`);
    });
  });
}

function createCardHTML(p) {
  const priorityClass = p.priority === 'High' ? 'badge-high' : (p.priority === 'Normal' ? 'badge-normal' : 'badge-low');
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = p.due_date && p.due_date < today && p.status !== 'completed';
  const formattedDate = formatDate(p.due_date);

  const tagsList = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const tagsHTML = tagsList.map(t => `<span class="card-tag-pill" data-tag="${t}">${t}</span>`).join('');

  const members = Array.isArray(p.team_members) ? p.team_members : [];
  let avatarsHTML = '';
  if (members.length > 0) {
    avatarsHTML = members.slice(0, 3).map(m => {
      const mName = typeof m === 'object' && m ? (m.name || 'Student') : String(m);
      const mRole = typeof m === 'object' && m ? (m.role || 'Member') : 'Member';
      const mPhoto = (typeof m === 'object' && m && m.photo) ? m.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=6366f1&color=fff`;
      return `<img src="${mPhoto}" class="avatar-badge" title="${escapeHTML(mName)} (${mRole})" alt="${escapeHTML(mName)}">`;
    }).join('');
    if (members.length > 3) {
      avatarsHTML += `<div class="avatar-badge" style="background:#475569" title="More members">+${members.length - 3}</div>`;
    }
  } else {
    avatarsHTML = `<img src="${p.team_lead_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_lead || 'IG')}&background=6366f1&color=fff`}" class="avatar-badge" title="${escapeHTML(p.team_lead || 'Lead')}">`;
  }

  let bomIcon = '';
  if (p.bom_status === 'Approved') bomIcon = '<span style="color:#10b981;" title="BOM Approved">✓ BOM</span>';
  else if (p.bom_status === 'Submitted') bomIcon = '<span style="color:#f59e0b;" title="BOM Pending Review">⏳ BOM</span>';

  return `
    <div class="kanban-card" draggable="true" data-id="${p.id}" ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)">
      <div class="card-top-bar">
        <span class="card-id-code">${p.project_code}</span>
        <div class="card-badges-right">
          <span class="badge ${priorityClass}">${p.priority}</span>
          ${formattedDate ? `<span class="badge badge-due-date ${isOverdue ? 'overdue' : ''}">📅 ${formattedDate}</span>` : ''}
        </div>
      </div>

      <h4 class="card-title">${escapeHTML(p.title)}</h4>
      <p class="card-desc">${escapeHTML(p.description || '')}</p>

      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}

      ${p.immediate_action ? `
        <div class="card-action-item">
          <strong>⚡ Next:</strong> ${escapeHTML(p.immediate_action)}
        </div>
      ` : ''}

      <div class="card-progress-section">
        <div class="card-progress-bar-bg">
          <div class="card-progress-bar-fill" style="width: ${p.progress || 0}%;"></div>
        </div>
        <div class="card-status-sub">
          <span>${formatStatus(p.status)} (${p.progress || 0}%)</span>
          ${bomIcon}
        </div>
      </div>

      <div class="card-footer">
        <div class="avatar-group">
          ${avatarsHTML}
        </div>
        <div class="card-counters">
          <span class="counter-item" title="Comments">💬 ${p.comments_count || 0}</span>
          <span class="counter-item" title="BOM/Attachments">📎 ${p.attachments_count || 0}</span>
        </div>
      </div>
    </div>
  `;
}

// 4. RENDER TIMELINE
function renderTimeline() {
  if (!DOM.timelineChartRoot) return;
  if (state.projects.length === 0) {
    DOM.timelineChartRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No projects to display on timeline.</div>';
    return;
  }

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);
  const totalYearDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) + 1;

  const todayObj = new Date();
  let todayLeftPct = null;
  if (todayObj.getFullYear() === currentYear) {
    const todayDay = Math.round((todayObj - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    todayLeftPct = ((todayDay - 1) / totalYearDays) * 100;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let headerMonthsHTML = '';
  monthNames.forEach((m, idx) => {
    const colorClass = (idx % 2 === 0) ? 'th-blue' : 'th-orange';
    headerMonthsHTML += `<th class="ref-gantt-th-month ${colorClass}">${m}</th>`;
  });

  let monthGridBgHTML = '';
  monthNames.forEach(() => {
    monthGridBgHTML += `<div class="ref-grid-month-col"></div>`;
  });

  let rowsHTML = '';
  state.projects.forEach(p => {
    let pStart = p.start_date ? new Date(p.start_date) : new Date(currentYear, 0, 15);
    let pEnd = p.due_date ? new Date(p.due_date) : new Date(currentYear, 5, 30);

    if (isNaN(pStart.getTime())) pStart = new Date(currentYear, 0, 15);
    if (isNaN(pEnd.getTime())) pEnd = new Date(currentYear, 5, 30);

    const clampedStart = new Date(Math.max(startOfYear, Math.min(endOfYear, pStart)));
    const clampedEnd = new Date(Math.max(startOfYear, Math.min(endOfYear, pEnd)));

    const startDayOfYear = Math.round((clampedStart - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const endDayOfYear = Math.round((clampedEnd - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

    const leftPct = Math.max(0, Math.min(99, ((startDayOfYear - 1) / totalYearDays) * 100));
    const widthPct = Math.max(2, Math.min(100 - leftPct, ((endDayOfYear - startDayOfYear + 1) / totalYearDays) * 100));

    const statusClass = p.status === 'completed' ? 'bar-completed' : (p.status === 'testing' ? 'bar-pending' : 'bar-in_progress');

    rowsHTML += `
      <tr>
        <td class="ref-gantt-td-taskname" onclick="openProjectDetail(${p.id})" style="cursor:pointer;" title="${escapeHTML(p.title)}">
          ${escapeHTML(p.project_code)} - ${escapeHTML(p.title)}
        </td>
        <td colspan="12" class="ref-gantt-td-grid">
          <div class="ref-grid-bg">${monthGridBgHTML}</div>
          ${todayLeftPct !== null ? `<div class="ref-today-line" style="left:${todayLeftPct}%;" title="Today"></div>` : ''}
          <div class="ref-task-bar ${statusClass}" 
               style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%;"
               onclick="openProjectDetail(${p.id})"
               title="${escapeHTML(p.title)} | ${formatDateShort(pStart.toISOString().split('T')[0])} → ${formatDateShort(pEnd.toISOString().split('T')[0])}">
            <span class="ref-bar-marker">✓</span>
            <span class="ref-bar-label">${escapeHTML(p.title)} (${p.progress || 0}%)</span>
            <span class="ref-bar-marker">✓</span>
          </div>
        </td>
      </tr>
    `;
  });

  DOM.timelineChartRoot.innerHTML = `
    <div class="ref-gantt-panel">
      <div class="ref-gantt-header">
        <div>
          <h3 class="ref-gantt-title">Project Management Timeline</h3>
          <p class="ref-gantt-subtitle">IGRID Innovation Lab Master Project Schedule & Milestone Gantt Chart</p>
        </div>
      </div>

      <div class="ref-gantt-scroll-wrapper">
        <table class="ref-gantt-table">
          <thead>
            <tr>
              <th class="ref-gantt-th-taskname">Task Name</th>
              ${headerMonthsHTML}
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 5. RENDER LIST VIEW
function renderList() {
  if (!DOM.listItemsRoot) return;
  if (state.projects.length === 0) {
    DOM.listItemsRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No project records found.</div>';
    return;
  }

  let html = '';
  state.projects.forEach(p => {
    const priorityBadge = p.priority === 'High' ? '<span class="badge badge-high">High</span>' : (p.priority === 'Normal' ? '<span class="badge badge-normal">Normal</span>' : '<span class="badge badge-low">Low</span>');
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = p.due_date && p.due_date < today && p.status !== 'completed';

    html += `
      <div class="list-item-row" onclick="openProjectDetail(${p.id})">
        <div>
          <span class="list-code-badge">${p.project_code}</span>
        </div>
        <div class="list-main-col">
          <span class="list-title">${escapeHTML(p.title)}</span>
          <span class="list-tags-sub">${p.domain} • ${p.tags || ''}</span>
        </div>
        <div class="list-action-col">
          ${escapeHTML(p.immediate_action || 'No blocker specified')}
        </div>
        <div>
          <span style="font-weight:600; color:#fff;">${escapeHTML(p.team_lead || 'Lead')}</span>
          <div style="font-size:11px; color:var(--text-dim);">${escapeHTML(p.team_name || 'Lab Team')}</div>
        </div>
        <div>
          <span class="${isOverdue ? 'badge badge-high' : ''}">${formatDate(p.due_date)}</span>
        </div>
        <div>
          <span style="font-weight:700; color:#c7d2fe;">${p.progress || 0}%</span>
          <div style="width:60px; height:4px; background:#1e2744; border-radius:2px; margin-top:2px;">
            <div style="width:${p.progress || 0}%; height:100%; background:#6366f1; border-radius:2px;"></div>
          </div>
        </div>
        <div>
          <span class="badge badge-date">${p.bom_status || 'None'}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openProjectModalForEdit(${JSON.stringify(p).replace(/"/g, '&quot;')})">Edit</button>
        </div>
      </div>
    `;
  });

  DOM.listItemsRoot.innerHTML = html;
}

// 6. RENDER TABLE VIEW
function renderTable() {
  if (!DOM.tableBodyRoot) return;
  if (state.projects.length === 0) {
    DOM.tableBodyRoot.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:20px; color:var(--text-dim);">No data available</td></tr>';
    return;
  }

  let html = '';
  state.projects.forEach(p => {
    html += `
      <tr>
        <td class="table-code">${p.project_code}</td>
        <td><span class="table-title" onclick="openProjectDetail(${p.id})">${escapeHTML(p.title)}</span></td>
        <td><span class="badge badge-blue">${p.domain}</span></td>
        <td>
          <select onchange="updateProjectField(${p.id}, 'status', this.value)" style="padding:4px 8px; font-size:12px;">
            <option value="in_queue" ${p.status === 'in_queue' ? 'selected' : ''}>In Queue</option>
            <option value="in_progress" ${p.status === 'in_progress' ? 'selected' : ''}>On Progress</option>
            <option value="testing" ${p.status === 'testing' ? 'selected' : ''}>Testing</option>
            <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>
          <select onchange="updateProjectField(${p.id}, 'priority', this.value)" style="padding:4px 8px; font-size:12px;">
            <option value="High" ${p.priority === 'High' ? 'selected' : ''}>High</option>
            <option value="Normal" ${p.priority === 'Normal' ? 'selected' : ''}>Normal</option>
            <option value="Low" ${p.priority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </td>
        <td><strong>${p.progress || 0}%</strong></td>
        <td>${formatDate(p.due_date)}</td>
        <td>${p.team_lead || 'Lead'}</td>
        <td><span class="badge badge-date">${p.bom_status || 'N/A'}</span></td>
        <td>
          ${p.github_repo ? `<a href="${p.github_repo}" target="_blank" class="meta-link">🐙 Repo</a>` : '<span style="color:var(--text-dim)">-</span>'}
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openProjectDetail(${p.id})">View</button>
        </td>
      </tr>
    `;
  });

  DOM.tableBodyRoot.innerHTML = html;
}

// 7. RENDER BOM APPROVALS HUB
function renderBOM() {
  if (!DOM.bomTbody) return;

  const pending = state.boms.filter(b => b.status === 'Pending');
  const approvedTotal = state.boms.filter(b => b.status === 'Approved').reduce((acc, b) => acc + (b.total_price || 0), 0);

  DOM.bomStatPending.textContent = pending.length;
  DOM.bomStatApproved.textContent = `₹${approvedTotal.toLocaleString('en-IN')}`;
  DOM.bomStatTotalItems.textContent = state.boms.length;

  if (state.boms.length === 0) {
    DOM.bomTbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:var(--text-dim);">No BOM requisitions found</td></tr>';
    return;
  }

  let html = '';
  state.boms.forEach(b => {
    let statusBadge = '';
    if (b.status === 'Approved') statusBadge = '<span class="badge badge-normal">Approved</span>';
    else if (b.status === 'Pending') statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b;">Pending Review</span>';
    else if (b.status === 'Rejected') statusBadge = '<span class="badge badge-high">Rejected</span>';
    else statusBadge = `<span class="badge badge-blue">${b.status}</span>`;

    html += `
      <tr>
        <td class="table-code">${b.project_code}</td>
        <td>
          <strong>${escapeHTML(b.item_name)}</strong>
          ${b.datasheet_url ? `<br><a href="${b.datasheet_url}" target="_blank" style="font-size:10px; color:#60a5fa;">📄 Datasheet</a>` : ''}
        </td>
        <td><code style="color:#a5b4fc;">${b.part_number || '-'}</code></td>
        <td><span class="badge badge-date">${b.category || 'Component'}</span></td>
        <td><strong>${b.quantity}</strong></td>
        <td>₹${Number(b.unit_price).toLocaleString('en-IN')}</td>
        <td style="color:#34d399; font-weight:700;">₹${Number(b.total_price).toLocaleString('en-IN')}</td>
        <td>${escapeHTML(b.submitted_by || 'Student')}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:4px;">
            ${b.status === 'Pending' ? `
              <button class="btn btn-sm btn-primary" onclick="updateBomStatus(${b.id}, 'Approved')" title="Approve Requisition">✓ Approve</button>
              <button class="btn btn-sm btn-danger" onclick="updateBomStatus(${b.id}, 'Rejected')" title="Reject Requisition">✕ Reject</button>
            ` : `
              <button class="btn btn-sm btn-secondary" onclick="updateBomStatus(${b.id}, 'Pending')" title="Re-open Status">Reset</button>
            `}
          </div>
        </td>
      </tr>
    `;
  });

  DOM.bomTbody.innerHTML = html;
}

// 8. RENDER COMPLETED SHOWCASE ARCHIVE
function renderCompleted() {
  if (!DOM.showcaseGridRoot) return;
  const completedProjects = state.projects.filter(p => p.status === 'completed');
  DOM.completedCountBanner.textContent = `${completedProjects.length} Completed Projects`;

  if (completedProjects.length === 0) {
    DOM.showcaseGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No completed projects yet. Move projects to Completed to showcase them here!</div>';
    return;
  }

  let html = '';
  completedProjects.forEach(p => {
    const tagsList = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const tagsHTML = tagsList.map(t => `<span class="card-tag-pill">${t}</span>`).join('');

    html += `
      <div class="showcase-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="card-id-code">${p.project_code}</span>
          <span class="badge badge-normal">🏆 Showcase Ready</span>
        </div>
        <h3 style="font-size:16px; font-weight:700; color:#fff;">${escapeHTML(p.title)}</h3>
        <p style="font-size:12px; color:var(--text-muted);">${escapeHTML(p.description || '')}</p>
        
        <div style="background:rgba(16,22,38,0.8); padding:10px; border-radius:6px; font-size:12px; border-left:3px solid #10b981;">
          <strong style="color:#34d399;">Deliverables & Milestone:</strong>
          <p style="color:#e2e8f0; margin-top:2px;">${escapeHTML(p.deliverables || p.immediate_action || 'Completed system ready for lab showcase.')}</p>
        </div>

        ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; border-top:1px solid rgba(33,44,73,0.4);">
          <span style="font-size:11px; color:var(--text-dim);">Team: <strong>${p.team_name || p.team_lead}</strong></span>
          ${p.github_repo ? `<a href="${p.github_repo}" target="_blank" class="btn btn-sm btn-primary">🐙 View GitHub Code</a>` : ''}
        </div>
      </div>
    `;
  });

  DOM.showcaseGridRoot.innerHTML = html;
}

function isUserAdmin() {
  if (!state.currentUser) return false;
  const role = (state.currentUser.role || '').toLowerCase();
  const email = (state.currentUser.email || '').toLowerCase();
  return role === 'admin' || email === 'kaviyaarumugam541@gmail.com' || email.includes('admin');
}

// 9. RENDER STUDENTS DIRECTORY
function renderStudents() {
  if (!DOM.studentsGridRoot) return;
  if (state.students.length === 0) {
    DOM.studentsGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No registered student profiles found.</div>';
    return;
  }

  const isAdmin = isUserAdmin();

  // Search & Filters
  const searchInput = document.getElementById('student-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const deptSelect = document.getElementById('student-dept-filter');
  const selectedDept = deptSelect ? deptSelect.value : 'All';

  const yearSelect = document.getElementById('student-year-filter');
  const selectedYear = yearSelect ? yearSelect.value : 'All';

  const statusSelect = document.getElementById('student-status-filter');
  const selectedStatus = statusSelect ? statusSelect.value : 'All';

  const sortSelect = document.getElementById('student-sort-by');
  const selectedSort = sortSelect ? sortSelect.value : 'name_asc';

  let filtered = state.students.filter(s => {
    if (query) {
      const matchName = (s.name || '').toLowerCase().includes(query);
      const matchRoll = (s.roll_no || '').toLowerCase().includes(query);
      const matchProject = (s.assigned_project || s.project_title || '').toLowerCase().includes(query);
      if (!matchName && !matchRoll && !matchProject) return false;
    }
    if (selectedDept !== 'All' && (s.department || '').toLowerCase() !== selectedDept.toLowerCase()) {
      return false;
    }
    if (selectedYear !== 'All' && (s.year || '').toLowerCase() !== selectedYear.toLowerCase()) {
      return false;
    }
    if (selectedStatus !== 'All' && (s.status || 'Active').toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (selectedSort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (selectedSort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (selectedSort === 'roll_asc') return (a.roll_no || '').localeCompare(b.roll_no || '');
    if (selectedSort === 'progress_desc') return (b.progress || 0) - (a.progress || 0);
    return 0;
  });

  if (filtered.length === 0) {
    DOM.studentsGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No student profiles match the filter criteria.</div>';
    return;
  }

  let html = `
    <div class="students-table-outer" style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-card); margin-top: 16px;">
      <table class="students-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
        <thead>
          <tr style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 12px 16px;">Student</th>
            <th style="padding: 12px 16px;">Register No</th>
            <th style="padding: 12px 16px;">Dept & Year</th>
            <th style="padding: 12px 16px;">Project & Guide</th>
            <th style="padding: 12px 16px;">Progress</th>
            <th style="padding: 12px 16px;">Status</th>
            <th style="padding: 12px 16px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  filtered.forEach(s => {
    const photo = s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${(s.avatar_color || '6366f1').replace('#','')}&color=fff`;
    const statusText = s.status || 'Active';
    const statusBadge = statusText === 'Active' ? 'badge-success' : 'badge-normal';
    const projName = s.assigned_project || s.project_title || 'Unassigned';
    const guideName = s.guide || 'Not assigned';
    const prog = s.progress || 0;

    html += `
      <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;" class="student-table-row">
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${photo}" alt="${escapeHTML(s.name)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid ${s.avatar_color || '#6366f1'};">
            <div>
              <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(s.name)}</div>
              <div style="font-size: 11px; color: var(--text-dim);">${escapeHTML(s.email || '')}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 16px; font-weight: 600; color: var(--text-muted);">${escapeHTML(s.roll_no)}</td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--text-main);">${escapeHTML(s.department || 'Lab')}</div>
          <div style="font-size: 11px; color: var(--text-dim);">${escapeHTML(s.year || 'Student')} ${s.section ? '• ' + escapeHTML(s.section) : ''}</div>
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: #60a5fa;">${escapeHTML(projName)}</div>
          <div style="font-size: 11px; color: var(--text-dim);">Guide: ${escapeHTML(guideName)}</div>
        </td>
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; min-width:60px;">
              <div style="width:${prog}%; height:100%; background:linear-gradient(90deg, #2563eb, #10b981); border-radius:4px;"></div>
            </div>
            <span style="font-size:11px; font-weight:700; color:var(--text-main);">${prog}%</span>
          </div>
        </td>
        <td style="padding: 12px 16px;">
          <span class="badge ${statusBadge}">${escapeHTML(statusText)}</span>
        </td>
        <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
          <button class="btn btn-sm btn-secondary" onclick="openStudentViewModal(${s.id})" style="margin-right: 6px;">👁️ View Profile</button>
          ${isAdmin ? `<button class="btn btn-sm btn-primary" onclick="openStudentEditModal(${s.id})">✏️ Edit</button>` : ''}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  DOM.studentsGridRoot.innerHTML = html;
}

function openStudentViewModal(studentId) {
  const s = state.students.find(st => Number(st.id) === Number(studentId));
  if (!s) return;

  const photo = s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${(s.avatar_color || '6366f1').replace('#','')}&color=fff`;

  const avatarEl = document.getElementById('view-student-avatar');
  if (avatarEl) avatarEl.src = photo;

  const nameEl = document.getElementById('view-student-name');
  if (nameEl) nameEl.textContent = s.name;

  const rollEl = document.getElementById('view-student-roll');
  if (rollEl) rollEl.textContent = s.roll_no;

  const statusEl = document.getElementById('view-student-status');
  if (statusEl) {
    statusEl.textContent = s.status || 'Active';
    statusEl.className = `badge ${s.status === 'Inactive' ? 'badge-normal' : 'badge-success'}`;
  }

  const deptEl = document.getElementById('view-student-dept');
  if (deptEl) deptEl.textContent = s.department || 'N/A';

  const yearSecEl = document.getElementById('view-student-year-sec');
  if (yearSecEl) yearSecEl.textContent = `${s.year || 'N/A'} ${s.section ? ' (' + s.section + ')' : ''}`;

  const collegeEl = document.getElementById('view-student-college');
  if (collegeEl) collegeEl.textContent = s.college || 'Indra Ganesan College of Engineering';

  const roleEl = document.getElementById('view-student-role');
  if (roleEl) roleEl.textContent = s.role || 'Member / Researcher';

  const emailEl = document.getElementById('view-student-email');
  if (emailEl) emailEl.textContent = s.email || 'N/A';

  const phoneEl = document.getElementById('view-student-phone');
  if (phoneEl) phoneEl.textContent = s.phone || 'N/A';

  const skillsEl = document.getElementById('view-student-skills');
  if (skillsEl) {
    const skillsList = (s.skills || '').split(',').map(sk => sk.trim()).filter(Boolean);
    if (skillsList.length > 0) {
      skillsEl.innerHTML = skillsList.map(sk => `<span class="card-tag-pill" style="color:#c7d2fe; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); padding:3px 8px; border-radius:6px; font-size:11px;">${escapeHTML(sk)}</span>`).join('');
    } else {
      skillsEl.textContent = 'No technical skills specified.';
    }
  }

  const teamEl = document.getElementById('view-student-team');
  if (teamEl) teamEl.textContent = s.assigned_project || s.project_title || 'No team/project assigned yet.';

  const guideEl = document.getElementById('view-student-guide');
  if (guideEl) guideEl.textContent = s.guide || 'Not assigned';

  const membersEl = document.getElementById('view-student-members');
  if (membersEl) membersEl.textContent = s.team_members || s.name;

  const bioEl = document.getElementById('view-student-bio');
  if (bioEl) bioEl.textContent = s.bio || 'No biography details provided.';

  const githubWrap = document.getElementById('view-student-github-wrap');
  const githubLink = document.getElementById('view-student-github');
  if (githubWrap && githubLink) {
    if (s.github_url) {
      githubLink.href = s.github_url;
      githubWrap.style.display = 'block';
    } else {
      githubWrap.style.display = 'none';
    }
  }

  const linkedinWrap = document.getElementById('view-student-linkedin-wrap');
  const linkedinLink = document.getElementById('view-student-linkedin');
  if (linkedinWrap && linkedinLink) {
    if (s.linkedin_url) {
      linkedinLink.href = s.linkedin_url;
      linkedinWrap.style.display = 'block';
    } else {
      linkedinWrap.style.display = 'none';
    }
  }

  const btnEditFromView = document.getElementById('btn-admin-edit-from-view');
  if (btnEditFromView) {
    if (isUserAdmin()) {
      btnEditFromView.style.display = 'inline-block';
      btnEditFromView.onclick = () => {
        closeModal(document.getElementById('student-view-modal'));
        openStudentEditModal(s.id);
      };
    } else {
      btnEditFromView.style.display = 'none';
    }
  }

  loadStudentCalendar(s.id);

  openModal(document.getElementById('student-view-modal'));
}

async function loadStudentCalendar(studentId) {
  const tbody = document.getElementById('student-calendar-tbody');
  if (!tbody) return;

  const btnAddCal = document.getElementById('btn-admin-add-calendar-activity');
  const isAdmin = isUserAdmin();

  if (btnAddCal) {
    if (isAdmin) {
      btnAddCal.style.display = 'inline-block';
      btnAddCal.onclick = () => openCalendarActivityModal(studentId);
    } else {
      btnAddCal.style.display = 'none';
    }
  }

  try {
    const res = await authFetch(`/api/students/${studentId}/calendar`);
    if (!res.ok) throw new Error('Failed to load calendar');
    const activities = await res.json();

    if (activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:16px; color:var(--text-dim); text-align:center;">No month-wise calendar activities recorded for this student.</td></tr>';
      return;
    }

    let html = '';
    activities.forEach(act => {
      let badgeClass = 'badge-normal';
      if (act.status === 'Completed') badgeClass = 'badge-success';
      if (act.status === 'In Progress') badgeClass = 'badge-primary';

      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px; font-weight:700; color:var(--text-main);">${escapeHTML(act.month)}</td>
          <td style="padding:10px; color:var(--text-muted);">${escapeHTML(act.date || '-')}</td>
          <td style="padding:10px; font-weight:600; color:#e2e8f0;">${escapeHTML(act.activity)}</td>
          <td style="padding:10px;"><span class="badge ${badgeClass}">${escapeHTML(act.status || 'Pending')}</span></td>
          <td style="padding:10px; font-weight:700; color:#34d399;">${act.progress || 0}%</td>
          <td style="padding:10px; color:var(--text-dim); font-size:11px;">${escapeHTML(act.remarks || '-')}</td>
          <td style="padding:10px; text-align:right;" class="admin-cal-col">
            ${isAdmin ? `
              <button class="btn btn-sm btn-secondary" onclick="openCalendarActivityModal(${studentId}, ${act.id})" style="padding:2px 6px; font-size:11px; margin-right:4px;">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCalendarActivity(${studentId}, ${act.id})" style="padding:2px 6px; font-size:11px;">🗑️</button>
            ` : '-'}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  } catch (err) {
    console.error('Error loading student calendar:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="padding:12px; color:#ef4444;">Failed to load calendar activities.</td></tr>';
  }
}

function openCalendarActivityModal(studentId, activityId = null) {
  document.getElementById('cal-student-id').value = studentId;
  document.getElementById('cal-activity-id').value = activityId || '';

  if (activityId) {
    document.getElementById('calendar-activity-title').textContent = '✏️ Edit Calendar Activity';
    authFetch(`/api/students/${studentId}/calendar`).then(r => r.json()).then(activities => {
      const act = activities.find(a => Number(a.id) === Number(activityId));
      if (act) {
        document.getElementById('cal-month').value = act.month || 'January';
        document.getElementById('cal-date').value = act.date || '';
        document.getElementById('cal-activity-text').value = act.activity || '';
        document.getElementById('cal-status').value = act.status || 'Pending';
        document.getElementById('cal-progress').value = act.progress || 0;
        document.getElementById('cal-remarks').value = act.remarks || '';
      }
    });
  } else {
    document.getElementById('calendar-activity-title').textContent = '📅 Add Calendar Activity';
    document.getElementById('cal-month').value = 'January';
    document.getElementById('cal-date').value = '01';
    document.getElementById('cal-activity-text').value = '';
    document.getElementById('cal-status').value = 'In Progress';
    document.getElementById('cal-progress').value = '25';
    document.getElementById('cal-remarks').value = '';
  }

  openModal(document.getElementById('calendar-activity-modal'));
}

async function handleCalendarActivityFormSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('cal-student-id').value;
  const activityId = document.getElementById('cal-activity-id').value;
  const month = document.getElementById('cal-month').value;
  const date = document.getElementById('cal-date').value.trim();
  const activity = document.getElementById('cal-activity-text').value.trim();
  const status = document.getElementById('cal-status').value;
  const progress = Number(document.getElementById('cal-progress').value || 0);
  const remarks = document.getElementById('cal-remarks').value.trim();

  if (!month || !activity) {
    showToast('Month and Activity description are required', 'error');
    return;
  }

  const payload = { month, date, activity, status, progress, remarks };
  const url = activityId ? `/api/students/calendar/${activityId}` : `/api/students/${studentId}/calendar`;
  const method = activityId ? 'PUT' : 'POST';

  try {
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save activity');
    showToast('Calendar activity saved successfully', 'success');
    closeModal(document.getElementById('calendar-activity-modal'));
    loadStudentCalendar(studentId);
  } catch (err) {
    showToast(`Error saving calendar activity: ${err.message}`, 'error');
  }
}

async function deleteCalendarActivity(studentId, activityId) {
  if (!confirm('Are you sure you want to delete this calendar activity?')) return;
  try {
    const res = await authFetch(`/api/students/calendar/${activityId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete activity');
    showToast('Calendar activity deleted successfully', 'success');
    loadStudentCalendar(studentId);
  } catch (err) {
    showToast(`Error deleting activity: ${err.message}`, 'error');
  }
}

function openStudentEditModal(studentId) {
  if (!isUserAdmin()) {
    showToast('Only Admins can edit student profiles', 'error');
    return;
  }
  const s = state.students.find(st => Number(st.id) === Number(studentId));
  if (!s) return;

  document.getElementById('edit-student-id').value = s.id;
  document.getElementById('edit-student-name').value = s.name || '';
  document.getElementById('edit-student-roll').value = s.roll_no || '';
  document.getElementById('edit-student-email').value = s.email || '';
  document.getElementById('edit-student-phone').value = s.phone || '';
  document.getElementById('edit-student-dept').value = s.department || '';
  document.getElementById('edit-student-year').value = s.year || '';
  document.getElementById('edit-student-section').value = s.section || '';
  document.getElementById('edit-student-college').value = s.college || 'Indra Ganesan College of Engineering';
  document.getElementById('edit-student-role').value = s.role || '';
  document.getElementById('edit-student-photo').value = s.photo_url || '';
  document.getElementById('edit-student-status').value = s.status || 'Active';
  document.getElementById('edit-student-skills').value = s.skills || '';
  document.getElementById('edit-student-github').value = s.github_url || '';
  document.getElementById('edit-student-linkedin').value = s.linkedin_url || '';
  document.getElementById('edit-student-team').value = s.assigned_project || '';
  document.getElementById('edit-student-bio').value = s.bio || '';

  openModal(document.getElementById('student-edit-modal'));
}

async function handleStudentEditFormSubmit(e) {
  e.preventDefault();
  if (!isUserAdmin()) {
    showToast('Only Admins can edit student profiles', 'error');
    return;
  }

  const studentId = document.getElementById('edit-student-id').value;
  const name = document.getElementById('edit-student-name').value.trim();
  const roll_no = document.getElementById('edit-student-roll').value.trim();

  if (!name || !roll_no) {
    showToast('Student Name and Register Number are required', 'error');
    return;
  }

  const photo_url = document.getElementById('edit-student-photo').value.trim();
  const github_url = document.getElementById('edit-student-github').value.trim();
  const linkedin_url = document.getElementById('edit-student-linkedin').value.trim();

  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
  if (photo_url && !urlRegex.test(photo_url)) {
    showToast('Please enter a valid Photo URL', 'error');
    return;
  }
  if (github_url && !urlRegex.test(github_url)) {
    showToast('Please enter a valid GitHub Profile URL', 'error');
    return;
  }
  if (linkedin_url && !urlRegex.test(linkedin_url)) {
    showToast('Please enter a valid LinkedIn Profile URL', 'error');
    return;
  }

  const payload = {
    name,
    roll_no,
    email: document.getElementById('edit-student-email').value.trim(),
    phone: document.getElementById('edit-student-phone').value.trim(),
    department: document.getElementById('edit-student-dept').value.trim(),
    year: document.getElementById('edit-student-year').value.trim(),
    section: document.getElementById('edit-student-section').value.trim(),
    college: document.getElementById('edit-student-college').value.trim(),
    role: document.getElementById('edit-student-role').value.trim(),
    photo_url,
    status: document.getElementById('edit-student-status').value,
    skills: document.getElementById('edit-student-skills').value.trim(),
    github_url,
    linkedin_url,
    assigned_project: document.getElementById('edit-student-team').value.trim(),
    bio: document.getElementById('edit-student-bio').value.trim()
  };

  try {
    const res = await authFetch(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server returned ${res.status}`);
    }

    const data = await res.json();
    showToast('Student profile updated successfully', 'success');

    closeModal(document.getElementById('student-edit-modal'));

    // Refresh student data & re-render view
    const studentsRes = await authFetch('/api/students');
    if (studentsRes.ok) {
      state.students = await studentsRes.json();
      renderStudents();
    }
  } catch (err) {
    console.error('Error updating student:', err);
    showToast(`Failed to update student: ${err.message}`, 'error');
  }
}

function populateBomProjectSelect() {
  if (!DOM.bomProjectCodeSelect) return;
  DOM.bomProjectCodeSelect.innerHTML = state.projects.map(p => `
    <option value="${p.project_code}">${p.project_code} - ${escapeHTML(p.title)}</option>
  `).join('');
}

function updateStatsSummary() {
  const activeCount = state.projects.filter(p => p.status !== 'completed').length;
  const domains = new Set(state.projects.map(p => p.domain)).size;
  DOM.statsSummaryPill.textContent = `${activeCount} Active Projects • ${domains} Domains • ${state.students.length} Students`;
}

// ----------------------------------------------------
// DRAG & DROP HANDLERS (KANBAN)
// ----------------------------------------------------
function handleDragStart(e) {
  state.draggedCardId = Number(e.target.getAttribute('data-id'));
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', state.draggedCardId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.col-cards-wrapper').forEach(w => w.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e, targetStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const projectId = state.draggedCardId;
  if (!projectId) return;

  const project = state.projects.find(p => p.id === projectId);
  if (project && project.status !== targetStatus) {
    project.status = targetStatus;
    if (targetStatus === 'completed') project.progress = 100;
    else if (targetStatus === 'in_queue') project.progress = 15;
    else if (targetStatus === 'in_progress' && project.progress < 30) project.progress = 50;
    else if (targetStatus === 'testing' && project.progress < 70) project.progress = 85;

    // Immediate optimistic update across all views
    renderAllViews();
    updateStatsSummary();

    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, progress: project.progress })
      });
      if (res.ok) {
        showToast(`Moved ${project.project_code} to ${formatStatus(targetStatus)}`);
        // Re-fetch to ensure server state consistency across views
        await Promise.all([fetchProjects(), fetchNotifications()]);
        renderAllViews();
        updateStatsSummary();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status on server', 'error');
    }
  }
}

// ----------------------------------------------------
// PROJECT DETAILS & DISCUSSION MODAL
// ----------------------------------------------------
async function openProjectDetail(projectId) {
  state.activeProjectId = projectId;
  try {
    const res = await fetch(`/api/projects/${projectId}`);
    const project = await res.json();

    document.getElementById('detail-code').textContent = project.project_code || 'IGRID-PROJ';
    document.getElementById('detail-domain').textContent = project.domain || 'General';
    
    // Priority Badge (Fix "undefined Priority" bug)
    const priorityVal = project.priority || 'Normal';
    const priorityBadge = document.getElementById('detail-priority');
    priorityBadge.textContent = `${priorityVal} Priority`;
    priorityBadge.className = `badge ${priorityVal === 'High' ? 'badge-high' : (priorityVal === 'Normal' ? 'badge-normal' : 'badge-low')}`;
    
    // Hero image
    const heroWrap = document.getElementById('detail-hero-img-wrap');
    const heroImg = document.getElementById('detail-hero-img');
    if (project.image_url && project.image_url.trim()) {
      heroImg.src = project.image_url.trim();
      heroWrap.style.display = 'block';
    } else {
      heroWrap.style.display = 'none';
    }

    // Title & Description
    document.getElementById('detail-title').textContent = project.title || 'Untitled Project';
    const descText = (project.description && project.description.trim()) ? project.description.trim() : 'No description provided.';
    document.getElementById('detail-desc').textContent = descText;

    // Immediate Action / Blocker
    const actionText = (project.immediate_action && project.immediate_action.trim()) ? project.immediate_action.trim() : 'No blocker specified.';
    document.getElementById('detail-action-item').textContent = actionText;
    
    // Progress %
    const progVal = typeof project.progress === 'number' ? project.progress : (parseInt(project.progress, 10) || 0);
    document.getElementById('detail-progress-val').textContent = `${progVal}%`;
    document.getElementById('detail-progress-fill').style.width = `${Math.min(100, Math.max(0, progVal))}%`;

    // Status & Timeline
    document.getElementById('detail-status').textContent = formatStatus(project.status || 'in_progress');
    
    let timelineText = formatDate(project.due_date);
    if (project.start_date) {
      timelineText = `${formatDate(project.start_date)} → ${timelineText}`;
    }
    document.getElementById('detail-due-date').textContent = timelineText || 'No due date set';

    // Team & Lead, and Team Members List
    document.getElementById('detail-team').textContent = `${project.team_name || 'Team'} (${project.team_lead || 'Lead'})`;
    
    let membersText = 'No team members listed';
    if (Array.isArray(project.team_members) && project.team_members.length > 0) {
      membersText = project.team_members.map(m => typeof m === 'object' ? (m.name || m.email || JSON.stringify(m)) : String(m)).join(', ');
    } else if (typeof project.team_members === 'string' && project.team_members.trim()) {
      membersText = project.team_members.trim();
    }
    const teamMembersEl = document.getElementById('detail-team-members');
    if (teamMembersEl) teamMembersEl.textContent = membersText;

    // BOM Status
    document.getElementById('detail-bom-status').textContent = project.bom_status || 'Not Required';

    // Media Buttons (GitHub, Technical Report, Video Demo, LinkedIn)
    const mediaBar = document.getElementById('detail-media-bar');
    const mediaList = [];
    if (project.github_repo && project.github_repo.trim()) {
      mediaList.push(`<a href="${project.github_repo.trim()}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-github">🐙 GitHub Repo</a>`);
    } else {
      mediaList.push(`<span class="btn-media btn-media-disabled" style="opacity: 0.5; cursor: default;" title="No GitHub repository link added">🐙 No GitHub Link</span>`);
    }

    if (project.doc_url && project.doc_url.trim()) {
      mediaList.push(`<a href="${project.doc_url.trim()}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-doc">📄 View Technical Report</a>`);
    } else {
      mediaList.push(`<span class="btn-media btn-media-disabled" style="opacity: 0.5; cursor: default;" title="No technical report link added yet">📄 No report uploaded yet</span>`);
    }

    if (project.youtube_url && project.youtube_url.trim()) {
      mediaList.push(`<a href="${project.youtube_url.trim()}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-youtube">🎥 Video Demo</a>`);
    }

    if (project.linkedin_url && project.linkedin_url.trim()) {
      mediaList.push(`<a href="${project.linkedin_url.trim()}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-linkedin">💼 LinkedIn Post</a>`);
    }
    mediaBar.innerHTML = mediaList.join('');

    // Deliverables
    const deliverablesWrap = document.getElementById('detail-deliverables-wrapper');
    if (project.deliverables && project.deliverables.trim()) {
      deliverablesWrap.style.display = 'flex';
      document.getElementById('detail-deliverables').textContent = project.deliverables.trim();
    } else {
      deliverablesWrap.style.display = 'none';
    }

    // Hashtags
    const tagsList = (project.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    document.getElementById('detail-tags').innerHTML = tagsList.map(t => `<span class="card-tag-pill" style="font-size:12px; padding:3px 8px;">${t}</span>`).join('');

    // BOM Subtable
    const bomWrapper = document.getElementById('detail-bom-table-wrapper');
    if (project.boms && project.boms.length > 0) {
      bomWrapper.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>Component</th><th>Part #</th><th>Qty</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${project.boms.map(b => `
              <tr>
                <td><strong>${escapeHTML(b.item_name)}</strong></td>
                <td><code>${b.part_number || '-'}</code></td>
                <td>${b.quantity}</td>
                <td style="color:#34d399;">₹${Number(b.total_price).toLocaleString('en-IN')}</td>
                <td><span class="badge ${b.status === 'Approved' ? 'badge-normal' : 'badge-date'}">${b.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      bomWrapper.innerHTML = '<div style="font-size:12px; color:var(--text-dim);">No BOM requisitions submitted for this project.</div>';
    }

    // Fetch & render Project-Specific Timeline Gantt Chart
    try {
      const tasksRes = await authFetch(`/api/projects/${projectId}/tasks`);
      if (tasksRes.ok) {
        state.activeProjectTasks = await tasksRes.json();
      } else {
        state.activeProjectTasks = [];
      }
    } catch(e) {
      state.activeProjectTasks = [];
    }
    renderProjectGanttTimeline(project, state.activeProjectTasks);

    renderProjectComments(project.activities || []);
    openModal(DOM.detailModal);
  } catch (err) {
    console.error('Error in openProjectDetail:', err);
    showToast('Failed to open project details', 'error');
  }
}

// ----------------------------------------------------
// PROJECT-SPECIFIC GANTT TIMELINE LOGIC
// ----------------------------------------------------

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function syncMonthDropdownsFromDates() {
  const startVal = document.getElementById('task-start-input').value;
  const endVal = document.getElementById('task-end-input').value;

  if (startVal) {
    const s = new Date(startVal);
    if (!isNaN(s.getTime())) {
      const m = monthNamesFull[s.getMonth()];
      const startMonthSel = document.getElementById('task-start-month-input');
      if (startMonthSel) startMonthSel.value = m;
    }
  }
  if (endVal) {
    const e = new Date(endVal);
    if (!isNaN(e.getTime())) {
      const m = monthNamesFull[e.getMonth()];
      const endMonthSel = document.getElementById('task-end-month-input');
      if (endMonthSel) endMonthSel.value = m;
    }
  }
}

function syncDatesFromMonthDropdowns() {
  const startM = document.getElementById('task-start-month-input').value;
  const endM = document.getElementById('task-end-month-input').value;
  const currentYear = new Date().getFullYear();

  if (startM) {
    const startIdx = monthNamesFull.indexOf(startM);
    if (startIdx !== -1) {
      const curStart = document.getElementById('task-start-input').value;
      if (!curStart || new Date(curStart).getMonth() !== startIdx) {
        const monthStr = String(startIdx + 1).padStart(2, '0');
        document.getElementById('task-start-input').value = `${currentYear}-${monthStr}-01`;
      }
    }
  }
  if (endM) {
    const endIdx = monthNamesFull.indexOf(endM);
    if (endIdx !== -1) {
      const curEnd = document.getElementById('task-end-input').value;
      if (!curEnd || new Date(curEnd).getMonth() !== endIdx) {
        const lastDay = new Date(currentYear, endIdx + 1, 0).getDate();
        const monthStr = String(endIdx + 1).padStart(2, '0');
        const dayStr = String(lastDay).padStart(2, '0');
        document.getElementById('task-end-input').value = `${currentYear}-${monthStr}-${dayStr}`;
      }
    }
  }
  updateTaskDurationPreview();
}

function renderProjectGanttTimeline(project, tasks = []) {
  const container = document.getElementById('detail-gantt-container');
  const summaryEl = document.getElementById('detail-timeline-summary');
  if (!container) return;

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);
  const totalYearDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) + 1;

  const todayObj = new Date();
  let todayLeftPct = null;
  if (todayObj.getFullYear() === currentYear) {
    const todayDay = Math.round((todayObj - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    todayLeftPct = ((todayDay - 1) / totalYearDays) * 100;
  }

  if (summaryEl) {
    summaryEl.innerHTML = `
      <span style="color:#0f172a; font-weight:700;">${escapeHTML(project.title)}</span> &bull; 
      Schedule Year: <span style="color:#2563eb; font-weight:700;">${currentYear}</span> &bull; 
      Total Tasks: <span style="color:#10b981; font-weight:700;">${tasks.length} items</span>
    `;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let headerMonthsHTML = '';
  monthNames.forEach((m, idx) => {
    const colorClass = (idx % 2 === 0) ? 'th-blue' : 'th-orange';
    headerMonthsHTML += `<th class="ref-gantt-th-month ${colorClass}">${m}</th>`;
  });

  let monthGridBgHTML = '';
  monthNames.forEach(() => {
    monthGridBgHTML += `<div class="ref-grid-month-col"></div>`;
  });

  let taskRowsHTML = '';

  if (tasks.length === 0) {
    taskRowsHTML = `
      <tr>
        <td class="ref-gantt-td-taskname">No Tasks</td>
        <td colspan="12" class="ref-gantt-td-grid">
          <div class="ref-grid-bg">${monthGridBgHTML}</div>
          <div style="padding:20px; text-align:center; color:#64748b; font-size:13px; font-weight:500;">
            No Tasks &bull; No timeline tasks added yet. Click <strong>"+ Add Task"</strong> to create your first task.
          </div>
        </td>
      </tr>
    `;
  } else {
    tasks.forEach(task => {
      let tStart = new Date(task.start_date);
      let tEnd = new Date(task.end_date);

      if (isNaN(tStart.getTime())) tStart = new Date(currentYear, 0, 1);
      if (isNaN(tEnd.getTime())) tEnd = new Date(currentYear, 11, 31);

      const clampedStart = new Date(Math.max(startOfYear, Math.min(endOfYear, tStart)));
      const clampedEnd = new Date(Math.max(startOfYear, Math.min(endOfYear, tEnd)));

      const startDayOfYear = Math.round((clampedStart - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
      const endDayOfYear = Math.round((clampedEnd - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

      const leftPct = Math.max(0, Math.min(99, ((startDayOfYear - 1) / totalYearDays) * 100));
      const widthPct = Math.max(1.5, Math.min(100 - leftPct, ((endDayOfYear - startDayOfYear + 1) / totalYearDays) * 100));

      const durationDays = Math.round((tEnd - tStart) / (1000 * 60 * 60 * 24)) + 1;
      const statusClass = `bar-${task.status || 'in_progress'}`;

      const dateLabel = `${formatDateShort(task.start_date)} → ${formatDateShort(task.end_date)}`;

      taskRowsHTML += `
        <tr>
          <td class="ref-gantt-td-taskname">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <span onclick="openTaskInfoModal(${task.id})" style="cursor:pointer; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(task.task_name)}">
                ${escapeHTML(task.task_name)}
              </span>
              <div style="display:inline-flex; gap:4px; margin-left:6px;">
                <button type="button" class="btn-edit-task" data-task-id="${task.id}" title="Edit Task" style="background:none; border:none; cursor:pointer; font-size:12px; padding:2px 4px; border-radius:4px; opacity:0.8;">✏️</button>
                <button type="button" class="btn-delete-task" data-task-id="${task.id}" title="Delete Task" style="background:none; border:none; cursor:pointer; font-size:12px; padding:2px 4px; border-radius:4px; opacity:0.8;">🗑️</button>
              </div>
            </div>
          </td>
          <td colspan="12" class="ref-gantt-td-grid">
            <div class="ref-grid-bg">${monthGridBgHTML}</div>
            ${todayLeftPct !== null ? `<div class="ref-today-line" style="left:${todayLeftPct}%;" title="Today"></div>` : ''}
            <div class="ref-task-bar ${statusClass}" 
                 style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%;"
                 onclick="openTaskInfoModal(${task.id})"
                 title="${escapeHTML(task.task_name)} | ${dateLabel} (${durationDays} days)">
              <span class="ref-bar-marker">✓</span>
              <span class="ref-bar-label">${escapeHTML(task.task_name)} (${dateLabel})</span>
              <span class="ref-bar-marker">✓</span>
            </div>
          </td>
        </tr>
      `;
    });
  }

  container.innerHTML = `
    <div class="ref-gantt-panel">
      <div class="ref-gantt-header">
        <div>
          <h3 class="ref-gantt-title">Project Management Timeline</h3>
          <p class="ref-gantt-subtitle">${escapeHTML(project.title)} • ${currentYear} Milestone Schedule</p>
        </div>
        <button class="ref-gantt-add-btn add-task-btn" id="btn-gantt-add-task" type="button">➕ + Add Task</button>
      </div>

      <div class="ref-gantt-scroll-wrapper">
        <table class="ref-gantt-table">
          <thead>
            <tr>
              <th class="ref-gantt-th-taskname">Task Name</th>
              ${headerMonthsHTML}
            </tr>
          </thead>
          <tbody>
            ${taskRowsHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openTaskModalForCreate() {
  if (!state.activeProjectId) {
    showToast('Please open a project first', 'error');
    return;
  }
  const modalTitle = document.getElementById('modal-task-title');
  if (modalTitle) modalTitle.textContent = '➕ Add Project Task';

  const form = document.getElementById('task-form');
  if (form) form.reset();

  document.getElementById('task-id-input').value = '';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const endStr = end.toISOString().split('T')[0];

  document.getElementById('task-start-input').value = todayStr;
  document.getElementById('task-end-input').value = endStr;
  document.getElementById('task-status-input').value = 'in_progress';
  document.getElementById('task-priority-input').value = 'normal';

  const activeProj = state.projects.find(p => p.id === state.activeProjectId);
  if (activeProj && activeProj.team_lead) {
    document.getElementById('task-assigned-input').value = activeProj.team_lead;
  } else {
    document.getElementById('task-assigned-input').value = '';
  }

  syncMonthDropdownsFromDates();
  updateTaskDurationPreview();
  openModal(DOM.taskModal);
}

function openTaskModalForEdit(taskId) {
  const task = state.activeProjectTasks.find(t => t.id === taskId);
  if (!task) return;

  if (DOM.taskInfoModal) closeModal(DOM.taskInfoModal);

  const modalTitle = document.getElementById('modal-task-title');
  if (modalTitle) modalTitle.textContent = '✏️ Edit Project Task';

  document.getElementById('task-id-input').value = task.id;
  document.getElementById('task-name-input').value = task.task_name || '';
  document.getElementById('task-desc-input').value = task.description || '';
  document.getElementById('task-start-input').value = task.start_date || '';
  document.getElementById('task-end-input').value = task.end_date || '';
  document.getElementById('task-status-input').value = task.status || 'in_progress';
  document.getElementById('task-priority-input').value = task.priority || 'normal';
  document.getElementById('task-assigned-input').value = task.assigned_member || '';

  syncMonthDropdownsFromDates();
  updateTaskDurationPreview();
  openModal(DOM.taskModal);
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Task deleted successfully', 'success');
      if (DOM.taskInfoModal) closeModal(DOM.taskInfoModal);
      if (DOM.taskModal) closeModal(DOM.taskModal);

      const tasksRes = await authFetch(`/api/projects/${state.activeProjectId}/tasks`);
      if (tasksRes.ok) {
        state.activeProjectTasks = await tasksRes.json();
      }
      const activeProj = state.projects.find(p => p.id === state.activeProjectId);
      if (activeProj) {
        renderProjectGanttTimeline(activeProj, state.activeProjectTasks);
      }
    } else {
      showToast('Failed to delete task', 'error');
    }
  } catch (err) {
    console.error('Error deleting task:', err);
    showToast('Error deleting task', 'error');
  }
}

function updateTaskDurationPreview() {
  const startVal = document.getElementById('task-start-input').value;
  const endVal = document.getElementById('task-end-input').value;
  const preview = document.getElementById('task-duration-preview');
  if (!preview) return;

  if (startVal && endVal) {
    const s = new Date(startVal);
    const e = new Date(endVal);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const dur = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      if (dur < 1) {
        preview.style.color = '#ef4444';
        preview.textContent = '⚠️ End Date must be on or after Start Date';
      } else {
        preview.style.color = 'var(--primary)';
        preview.textContent = `Calculated Duration: ${dur} day${dur === 1 ? '' : 's'}`;
      }
      return;
    }
  }
  preview.textContent = 'Calculated Duration: -';
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();
  const taskId = document.getElementById('task-id-input').value;
  const task_name = document.getElementById('task-name-input').value.trim();
  const description = document.getElementById('task-desc-input').value.trim();
  const start_date = document.getElementById('task-start-input').value;
  const end_date = document.getElementById('task-end-input').value;
  const start_month = document.getElementById('task-start-month-input').value;
  const end_month = document.getElementById('task-end-month-input').value;
  const status = document.getElementById('task-status-input').value;
  const priority = document.getElementById('task-priority-input').value;
  const assigned_member = document.getElementById('task-assigned-input').value.trim();

  if (!task_name) {
    showToast('Task Name cannot be empty.', 'error');
    return;
  }

  if (!start_date || !end_date) {
    showToast('Start Date and End Date are required.', 'error');
    return;
  }

  if (new Date(end_date) < new Date(start_date)) {
    showToast('End Date must be on or after Start Date.', 'error');
    return;
  }

  const payload = {
    task_name, description, start_date, end_date, start_month, end_month, status, priority, assigned_member
  };

  try {
    let res;
    if (taskId) {
      res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await authFetch(`/api/projects/${state.activeProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal(DOM.taskModal);
      showToast(taskId ? 'Task updated successfully' : 'Task saved successfully');
      
      const tasksRes = await authFetch(`/api/projects/${state.activeProjectId}/tasks`);
      if (tasksRes.ok) {
        state.activeProjectTasks = await tasksRes.json();
      }
      const activeProj = state.projects.find(p => p.id === state.activeProjectId);
      if (activeProj) {
        renderProjectGanttTimeline(activeProj, state.activeProjectTasks);
      }
    } else {
      const json = await res.json();
      showToast(json.error || 'Failed to save task', 'error');
    }
  } catch (err) {
    console.error('Error saving task:', err);
    showToast('Failed to save task to server', 'error');
  }
}

function openTaskInfoModal(taskId) {
  const task = state.activeProjectTasks.find(t => t.id === taskId);
  if (!task) return;

  const titleEl = document.getElementById('task-info-title');
  const badgeEl = document.getElementById('task-info-status-badge');
  const pillEl = document.getElementById('task-info-duration-pill');
  const datesEl = document.getElementById('task-info-dates');
  const descEl = document.getElementById('task-info-desc');
  const assignedEl = document.getElementById('task-info-assigned');

  const dur = Math.round((new Date(task.end_date) - new Date(task.start_date)) / (1000 * 60 * 60 * 24)) + 1;

  if (titleEl) titleEl.textContent = task.task_name;
  if (badgeEl) {
    const statusLabel = task.status === 'completed' ? 'Completed' : (task.status === 'on_hold' ? 'On Hold' : (task.status === 'not_started' ? 'Not Started' : 'In Progress'));
    badgeEl.textContent = statusLabel;
    badgeEl.className = `badge ${task.status === 'completed' ? 'badge-normal' : (task.status === 'on_hold' ? 'badge-danger' : 'badge-blue')}`;
  }
  if (pillEl) pillEl.textContent = `${dur} day${dur === 1 ? '' : 's'}`;
  if (datesEl) datesEl.textContent = `${formatDateShort(task.start_date)} → ${formatDateShort(task.end_date)}`;
  if (descEl) descEl.textContent = task.description || 'No description provided for this task.';
  if (assignedEl) assignedEl.textContent = `Assigned to: ${task.assigned_member || 'Unassigned'} • Priority: ${(task.priority || 'normal').toUpperCase()}`;

  const editBtn = document.getElementById('btn-edit-task-info');
  if (editBtn) editBtn.onclick = () => openTaskModalForEdit(task.id);

  const deleteBtn = document.getElementById('btn-delete-task-info');
  if (deleteBtn) deleteBtn.onclick = () => deleteTask(task.id);

  openModal(DOM.taskInfoModal);
}

function renderProjectComments(activities) {
  const thread = document.getElementById('detail-comments-thread');
  if (activities.length === 0) {
    thread.innerHTML = '<div style="font-size:12px; color:var(--text-dim);">No updates posted yet. Write a milestone note below!</div>';
    return;
  }

  thread.innerHTML = activities.map(a => `
    <div class="comment-bubble">
      <div class="comment-meta">
        <strong>${escapeHTML(a.author)} (${a.author_role || 'Member'})</strong>
        <span>${formatDateTime(a.created_at)}</span>
      </div>
      <div class="comment-text">${escapeHTML(a.message)}</div>
    </div>
  `).join('');
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const author = document.getElementById('comment-author').value.trim();
  const message = document.getElementById('comment-text').value.trim();

  if (!message || !state.activeProjectId) return;

  try {
    const res = await fetch(`/api/projects/${state.activeProjectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, author_role: 'Coordinator', message })
    });
    if (res.ok) {
      document.getElementById('comment-text').value = '';
      openProjectDetail(state.activeProjectId);
      showToast('Comment posted');
    }
  } catch (err) {
    showToast('Failed to post comment', 'error');
  }
}

// ----------------------------------------------------
// PROJECT FORM CREATE / EDIT
// ----------------------------------------------------
function updateLinkPreviewIcon(elementId, url) {
  const icon = document.getElementById(elementId);
  if (!icon) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
    icon.href = url;
    icon.style.display = 'inline';
  } else {
    icon.style.display = 'none';
  }
}

function initEditFormLinkProtection() {
  const linkIds = ['form-image-url', 'form-github', 'form-youtube', 'form-doc-url', 'form-linkedin'];
  linkIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('click', (e) => {
        e.stopPropagation();
        input.focus();
      });
      input.addEventListener('input', () => {
        const previewId = id.replace('form-', 'preview-');
        updateLinkPreviewIcon(previewId, input.value.trim());
      });
    }
  });
}

function openProjectModalForCreate(defaultStatus = 'in_progress') {
  DOM.modalProjectTitle.textContent = '🚀 Create Innovation Project / Task';
  DOM.projectForm.reset();
  document.getElementById('form-project-id').value = '';
  document.getElementById('form-status').value = defaultStatus;
  
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  document.getElementById('form-due-date').value = nextMonth.toISOString().split('T')[0];

  ['preview-image-url', 'preview-github', 'preview-youtube', 'preview-doc-url', 'preview-linkedin'].forEach(id => {
    updateLinkPreviewIcon(id, '');
  });

  openModal(DOM.projectModal);
}

function openProjectModalForEdit(project) {
  DOM.modalProjectTitle.textContent = `✏️ Edit Project: ${project.project_code}`;
  document.getElementById('form-project-id').value = project.id;
  document.getElementById('form-code').value = project.project_code;
  document.getElementById('form-title').value = project.title;
  document.getElementById('form-description').value = project.description || '';
  document.getElementById('form-domain').value = project.domain;
  document.getElementById('form-priority').value = project.priority;
  document.getElementById('form-status').value = project.status;
  document.getElementById('form-tags').value = project.tags || '';
  document.getElementById('form-progress').value = project.progress || 0;
  document.getElementById('form-due-date').value = project.due_date || '';
  document.getElementById('form-action-item').value = project.immediate_action || '';
  document.getElementById('form-github').value = project.github_repo || '';
  document.getElementById('form-youtube').value = project.youtube_url || '';
  document.getElementById('form-doc-url').value = project.doc_url || '';
  document.getElementById('form-linkedin').value = project.linkedin_url || '';
  document.getElementById('form-image-url').value = project.image_url || '';
  document.getElementById('form-team-name').value = project.team_name || '';
  document.getElementById('form-team-lead').value = project.team_lead || '';
  document.getElementById('form-team-lead-photo').value = project.team_lead_photo || '';
  document.getElementById('form-deliverables').value = project.deliverables || '';

  updateLinkPreviewIcon('preview-image-url', project.image_url);
  updateLinkPreviewIcon('preview-github', project.github_repo);
  updateLinkPreviewIcon('preview-youtube', project.youtube_url);
  updateLinkPreviewIcon('preview-doc-url', project.doc_url);
  updateLinkPreviewIcon('preview-linkedin', project.linkedin_url);

  openModal(DOM.projectModal);
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-project-id').value;

  let docUrl = document.getElementById('form-doc-url').value.trim();

  // Validate & normalize Google Drive URL if provided
  if (docUrl) {
    if (!docUrl.startsWith('http://') && !docUrl.startsWith('https://')) {
      docUrl = 'https://' + docUrl;
    }
    const isDriveLink = docUrl.includes('drive.google.com') ||
                        docUrl.includes('docs.google.com') ||
                        docUrl.includes('google.com/drive');
    if (!isDriveLink) {
      console.warn('⚠️ Google Drive Link Validation Failed:', docUrl);
      showToast('Please paste a valid Google Drive or Docs link (e.g. drive.google.com or docs.google.com)', 'error');
      return;
    }
  }

  const payload = {
    project_code: document.getElementById('form-code').value.trim(),
    title: document.getElementById('form-title').value.trim(),
    description: document.getElementById('form-description').value.trim(),
    domain: document.getElementById('form-domain').value,
    priority: document.getElementById('form-priority').value,
    status: document.getElementById('form-status').value,
    tags: document.getElementById('form-tags').value.trim(),
    progress: Number(document.getElementById('form-progress').value) || 0,
    due_date: document.getElementById('form-due-date').value,
    immediate_action: document.getElementById('form-action-item').value.trim(),
    github_repo: document.getElementById('form-github').value.trim(),
    youtube_url: document.getElementById('form-youtube').value.trim(),
    doc_url: docUrl,
    linkedin_url: document.getElementById('form-linkedin').value.trim(),
    image_url: document.getElementById('form-image-url').value.trim(),
    team_name: document.getElementById('form-team-name').value.trim(),
    team_lead: document.getElementById('form-team-lead').value.trim(),
    team_lead_photo: document.getElementById('form-team-lead-photo').value.trim(),
    deliverables: document.getElementById('form-deliverables').value.trim()
  };

  console.log('💾 Submitting Project Form Payload:', payload);

  try {
    let res;
    if (id) {
      res = await authFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      console.log('✅ Project saved successfully!');
      closeModal(DOM.projectModal);
      showToast(id ? 'Project updated successfully' : 'New project created successfully');
      await Promise.all([fetchProjects(), fetchNotifications()]);
      renderAllViews();
      updateStatsSummary();
      if (id && String(state.activeProjectId) === String(id)) {
        await openProjectDetail(id);
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error('❌ Server rejection when saving project:', res.status, errData);
      showToast(errData.error || `Failed to save project (HTTP ${res.status})`, 'error');
    }
  } catch (err) {
    console.error('❌ Error saving project:', err);
    showToast(`Failed to save project: ${err.message || 'Network error'}`, 'error');
  }
}

async function deleteProject(id) {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Project deleted');
      await Promise.all([fetchProjects(), fetchNotifications()]);
      renderAllViews();
      updateStatsSummary();
    }
  } catch (err) {
    showToast('Failed to delete project', 'error');
  }
}

async function updateProjectField(id, field, value) {
  try {
    const payload = {};
    payload[field] = value;
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast(`Updated ${field}`);
      await fetchProjects();
      renderAllViews();
    }
  } catch (err) {
    showToast('Update failed', 'error');
  }
}

// ----------------------------------------------------
// BOM SUBMISSION & APPROVALS
// ----------------------------------------------------
function openBomModal(preselectedCode = null) {
  DOM.bomForm.reset();
  if (preselectedCode && DOM.bomProjectCodeSelect) {
    DOM.bomProjectCodeSelect.value = preselectedCode;
  }
  openModal(DOM.bomModal);
}

async function handleBomFormSubmit(e) {
  e.preventDefault();
  const payload = {
    project_code: DOM.bomProjectCodeSelect.value,
    item_name: document.getElementById('bom-item-name').value.trim(),
    part_number: document.getElementById('bom-part-no').value.trim(),
    category: document.getElementById('bom-category').value,
    quantity: Number(document.getElementById('bom-quantity').value) || 1,
    unit_price: Number(document.getElementById('bom-unit-price').value) || 0,
    supplier_url: document.getElementById('bom-supplier').value.trim(),
    datasheet_url: document.getElementById('bom-datasheet').value.trim(),
    justification: document.getElementById('bom-justification').value.trim(),
    submitted_by: document.getElementById('bom-submitted-by').value.trim()
  };

  try {
    const res = await fetch('/api/bom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal(DOM.bomModal);
      showToast('BOM Requisition submitted for lab approval');
      await Promise.all([fetchBoms(), fetchProjects(), fetchNotifications()]);
      renderAllViews();
    }
  } catch (err) {
    showToast('Failed to submit BOM', 'error');
  }
}

async function updateBomStatus(bomId, status) {
  try {
    const res = await fetch(`/api/bom/${bomId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_remarks: `Set to ${status} by Lab In-Charge` })
    });
    if (res.ok) {
      showToast(`BOM item marked as ${status}`);
      await Promise.all([fetchBoms(), fetchNotifications()]);
      renderAllViews();
    }
  } catch (err) {
    showToast('Failed to update BOM status', 'error');
  }
}

// ----------------------------------------------------
// STUDENT REGISTRATION
// ----------------------------------------------------
async function handleStudentFormSubmit(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('student-name').value.trim(),
    roll_no: document.getElementById('student-roll').value.trim(),
    email: document.getElementById('student-email').value.trim(),
    department: document.getElementById('student-dept').value.trim(),
    role: document.getElementById('student-role').value.trim(),
    year: document.getElementById('student-year').value.trim(),
    skills: document.getElementById('student-skills').value.trim(),
    photo_url: document.getElementById('student-photo').value.trim()
  };

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal(DOM.studentModal);
      showToast('Student registered successfully');
      await fetchStudents();
      renderStudents();
      updateStatsSummary();
    }
  } catch (err) {
    showToast('Failed to register student', 'error');
  }
}

// ----------------------------------------------------
// ANALYTICS & STATS DASHBOARD
// ----------------------------------------------------

function renderAnalytics() {
  if (state.currentView === 'analytics') {
    loadAnalyticsData();
  }
}

async function loadAnalyticsData() {
  const loadingEl = document.getElementById('analytics-view-loading');
  const errorEl = document.getElementById('analytics-view-error');
  const errorTextEl = document.getElementById('analytics-error-text');

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';

  try {
    const res = await authFetch('/api/analytics');
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server returned HTTP ${res.status}`);
    }

    const stats = await res.json();
    if (loadingEl) loadingEl.style.display = 'none';

    renderAnalyticsContent(stats);
    return stats;
  } catch (err) {
    console.error('Error loading analytics:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      if (errorTextEl) errorTextEl.textContent = `Error loading analytics: ${err.message}`;
    }
    showToast('Failed to load analytics data', 'error');
    return null;
  }
}

function renderAnalyticsContent(stats = {}) {
  const totalProjects = stats.totalProjects || 0;
  const byStatus = stats.byStatus || { in_queue: 0, in_progress: 0, testing: 0, completed: 0 };
  const byDomain = Array.isArray(stats.byDomain) ? stats.byDomain : [];
  const pendingBOMCount = stats.pendingBOMCount || 0;

  const kpiHTML = `
    <div class="kpi-card">
      <span class="stat-label">Total Lab Projects</span>
      <span class="kpi-val text-primary">${totalProjects}</span>
    </div>
    <div class="kpi-card">
      <span class="stat-label">Active Prototyping</span>
      <span class="kpi-val text-warning">${byStatus.in_progress || 0}</span>
    </div>
    <div class="kpi-card">
      <span class="stat-label">BOM Pending Signoff</span>
      <span class="kpi-val text-warning">${pendingBOMCount}</span>
    </div>
    <div class="kpi-card">
      <span class="stat-label">Completed & Showcased</span>
      <span class="kpi-val text-success">${byStatus.completed || 0}</span>
    </div>
  `;

  if (DOM.analyticsKpiRoot) DOM.analyticsKpiRoot.innerHTML = kpiHTML;
  const pageKpiRoot = document.getElementById('analytics-page-kpi-root');
  if (pageKpiRoot) pageKpiRoot.innerHTML = kpiHTML;

  const totalP = totalProjects > 0 ? totalProjects : 1;
  let domainBarsHTML = '';
  if (byDomain.length === 0) {
    domainBarsHTML = '<div style="font-size:12px; color:var(--text-dim); padding:10px;">No domain distribution data available.</div>';
  } else {
    domainBarsHTML = byDomain.map(d => {
      const pct = Math.round(((d.count || 0) / totalP) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${escapeHTML(d.domain || 'Other')}</span>
          <div class="bar-fill-wrap">
            <div class="bar-fill-color" style="width:${pct}%;"></div>
          </div>
          <span class="bar-num">${d.count || 0}</span>
        </div>
      `;
    }).join('');
  }

  if (DOM.analyticsDomainBars) DOM.analyticsDomainBars.innerHTML = domainBarsHTML;
  const pageDomainBars = document.getElementById('analytics-page-domain-bars');
  if (pageDomainBars) pageDomainBars.innerHTML = domainBarsHTML;

  const statusLabels = {
    in_queue: 'In Queue / Ideation',
    in_progress: 'On Progress / Prototyping',
    testing: 'Testing & BOM Review',
    completed: 'Completed & Deployed'
  };

  let statusBarsHTML = '';
  const statusEntries = Object.entries(byStatus);
  if (statusEntries.length === 0) {
    statusBarsHTML = '<div style="font-size:12px; color:var(--text-dim); padding:10px;">No status distribution data available.</div>';
  } else {
    statusBarsHTML = statusEntries.map(([st, count]) => {
      const pct = Math.round(((count || 0) / totalP) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${statusLabels[st] || st}</span>
          <div class="bar-fill-wrap">
            <div class="bar-fill-color" style="width:${pct}%; background:#8b5cf6;"></div>
          </div>
          <span class="bar-num">${count || 0}</span>
        </div>
      `;
    }).join('');
  }

  if (DOM.analyticsStatusBars) DOM.analyticsStatusBars.innerHTML = statusBarsHTML;
  const pageStatusBars = document.getElementById('analytics-page-status-bars');
  if (pageStatusBars) pageStatusBars.innerHTML = statusBarsHTML;
}

async function openAnalyticsModal() {
  const stats = await loadAnalyticsData();
  if (stats) {
    openModal(DOM.analyticsModal);
  }
}

// ----------------------------------------------------
// ACTIVITY FEED
// ----------------------------------------------------
function renderRecentActivityFeed() {
  if (!DOM.activityFeedList) return;
  DOM.activityFeedList.innerHTML = `
    <div class="notif-item">
      <div style="font-weight:600; color:#fff;">Status Moved</div>
      <div style="color:var(--text-muted);">IGRID-DRN-03 moved to <strong>Testing & Review</strong></div>
      <div style="font-size:10px; color:var(--text-dim);">15 mins ago</div>
    </div>
    <div class="notif-item">
      <div style="font-weight:600; color:#fff;">BOM Approved</div>
      <div style="color:var(--text-muted);">Jetson Orin Nano Kit approved for IGRID-AI-01</div>
      <div style="font-size:10px; color:var(--text-dim);">1 hour ago</div>
    </div>
    <div class="notif-item">
      <div style="font-weight:600; color:#fff;">GitHub Sync</div>
      <div style="color:var(--text-muted);">New commit to <code>6dof-modular-robot-arm</code></div>
      <div style="font-size:10px; color:var(--text-dim);">3 hours ago</div>
    </div>
  `;
}

// ----------------------------------------------------
// UTILITIES & HELPERS
// ----------------------------------------------------
function openModal(modal) {
  if (modal) {
    if (modal.id === 'task-modal' || modal.id === 'task-info-modal' || modal.id === 'calendar-activity-modal' || modal.id === 'add-domain-modal') {
      modal.style.zIndex = '2050';
    } else {
      modal.style.zIndex = '1000';
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('active');
    modal.style.zIndex = '';
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✨'}</span> <span>${escapeHTML(msg)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatStatus(status) {
  const map = {
    in_queue: 'In Queue',
    in_progress: 'On Progress',
    testing: 'Testing',
    completed: 'Completed'
  };
  return map[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-GB', options);
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
