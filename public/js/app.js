/**
 * IGRID INNOVATION LAB - CLIENT APPLICATION LOGIC
 * Dynamic Project Management Dashboard with Executive Showcase, Kanban, Timeline, List, Table, BOM & Student Hub
 */

// Application State
const state = {
  projects: [],
  students: [],
  boms: [],
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
  if (state.currentUser) {
    if (userNameText) userNameText.textContent = state.currentUser.email.split('@')[0];
    if (userRoleBadge) userRoleBadge.textContent = 'Authenticated User';
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
// API FETCHERS
// ----------------------------------------------------
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

  // Project Modal Actions
  DOM.openAddTaskModal.addEventListener('click', () => openProjectModalForCreate());
  DOM.closeProjectModal.addEventListener('click', () => closeModal(DOM.projectModal));
  DOM.cancelProjectBtn.addEventListener('click', () => closeModal(DOM.projectModal));
  DOM.projectForm.addEventListener('submit', handleProjectFormSubmit);

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

  // Analytics Modal Actions
  DOM.labAnalyticsBtn.addEventListener('click', () => openAnalyticsModal());
  DOM.closeAnalyticsModal.addEventListener('click', () => closeModal(DOM.analyticsModal));
  DOM.btnCloseAnalytics.addEventListener('click', () => closeModal(DOM.analyticsModal));
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

  let html = '';
  state.projects.forEach(p => {
    const progress = p.progress || 0;
    const priorityColor = p.status === 'completed' ? '#8b5cf6' : (p.priority === 'High' ? '#ef4444' : (p.priority === 'Normal' ? '#10b981' : '#38bdf8'));
    
    const startPercent = Math.max(5, Math.min(60, Math.floor((100 - progress) * 0.4)));
    const widthPercent = Math.max(30, Math.min(90, progress + 20));

    html += `
      <div class="timeline-row">
        <div class="timeline-project-info" onclick="openProjectDetail(${p.id})" style="cursor:pointer;">
          <span class="timeline-code">${p.project_code} • ${p.domain}</span>
          <span class="timeline-title">${escapeHTML(p.title)}</span>
        </div>
        <div class="timeline-bar-track">
          <div class="timeline-bar-fill" style="left:${startPercent}%; width:${widthPercent}%; background:${priorityColor};" onclick="openProjectDetail(${p.id})">
            <span>${p.team_lead || p.domain}</span>
            <span>${p.progress || 0}%</span>
          </div>
        </div>
      </div>
    `;
  });

  DOM.timelineChartRoot.innerHTML = html;
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

// 9. RENDER STUDENTS DIRECTORY
function renderStudents() {
  if (!DOM.studentsGridRoot) return;
  if (state.students.length === 0) {
    DOM.studentsGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim);">No student profiles found.</div>';
    return;
  }

  let html = '';
  state.students.forEach(s => {
    const skillsList = (s.skills || '').split(',').map(sk => sk.trim()).filter(Boolean);
    const skillsHTML = skillsList.map(sk => `<span class="card-tag-pill" style="color:#c7d2fe;">${sk}</span>`).join('');
    const photo = s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${(s.avatar_color || '6366f1').replace('#','')}&color=fff`;

    html += `
      <div class="student-card">
        <div class="student-card-top">
          <img src="${photo}" alt="${escapeHTML(s.name)}" class="student-avatar-big" style="border:2px solid ${s.avatar_color || '#6366f1'};">
          <div class="student-info-main">
            <h4>${escapeHTML(s.name)}</h4>
            <span class="student-roll">${s.roll_no} • ${s.year || 'Student'}</span>
          </div>
        </div>

        <div style="font-size:12px; color:var(--text-muted);">
          <div><strong>Role:</strong> ${escapeHTML(s.role || 'Innovator')}</div>
          <div><strong>Dept:</strong> ${escapeHTML(s.department || 'IGRID Lab')}</div>
          <div><strong>Email:</strong> <a href="mailto:${s.email}" style="color:#60a5fa;">${s.email}</a></div>
        </div>

        ${skillsHTML ? `
          <div style="margin-top:auto;">
            <div style="font-size:10px; font-weight:700; color:var(--text-dim); margin-bottom:4px;">SKILLS:</div>
            <div class="card-tags">${skillsHTML}</div>
          </div>
        ` : ''}
      </div>
    `;
  });

  DOM.studentsGridRoot.innerHTML = html;
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

    document.getElementById('detail-code').textContent = project.project_code;
    document.getElementById('detail-domain').textContent = project.domain;
    document.getElementById('detail-priority').textContent = `${project.priority} Priority`;
    document.getElementById('detail-priority').className = `badge ${project.priority === 'High' ? 'badge-high' : (project.priority === 'Normal' ? 'badge-normal' : 'badge-low')}`;
    
    // Hero image
    const heroWrap = document.getElementById('detail-hero-img-wrap');
    const heroImg = document.getElementById('detail-hero-img');
    if (project.image_url) {
      heroImg.src = project.image_url;
      heroWrap.style.display = 'block';
    } else {
      heroWrap.style.display = 'none';
    }

    document.getElementById('detail-title').textContent = project.title;
    document.getElementById('detail-desc').textContent = project.description || 'No description provided.';
    document.getElementById('detail-action-item').textContent = project.immediate_action || 'No blocker specified.';
    
    document.getElementById('detail-progress-val').textContent = `${project.progress || 0}%`;
    document.getElementById('detail-progress-fill').style.width = `${project.progress || 0}%`;

    document.getElementById('detail-status').textContent = formatStatus(project.status);
    document.getElementById('detail-due-date').textContent = formatDate(project.due_date);
    document.getElementById('detail-team').textContent = `${project.team_name || 'Team'} (${project.team_lead || 'Lead'})`;
    document.getElementById('detail-bom-status').textContent = project.bom_status || 'Not Required';

    // Media Buttons
    const mediaBar = document.getElementById('detail-media-bar');
    const mediaList = [];
    if (project.github_repo) mediaList.push(`<a href="${project.github_repo}" target="_blank" class="btn-media btn-media-github">🐙 GitHub Repo</a>`);
    if (project.youtube_url) mediaList.push(`<a href="${project.youtube_url}" target="_blank" class="btn-media btn-media-youtube">🎥 Video Demo</a>`);
    if (project.linkedin_url) mediaList.push(`<a href="${project.linkedin_url}" target="_blank" class="btn-media btn-media-linkedin">💼 LinkedIn Post</a>`);
    if (project.doc_url) mediaList.push(`<a href="${project.doc_url}" target="_blank" class="btn-media btn-media-doc">📄 Technical Doc</a>`);
    mediaBar.innerHTML = mediaList.join('');

    const deliverablesWrap = document.getElementById('detail-deliverables-wrapper');
    if (project.deliverables) {
      deliverablesWrap.style.display = 'flex';
      document.getElementById('detail-deliverables').textContent = project.deliverables;
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

    renderProjectComments(project.activities || []);
    openModal(DOM.detailModal);
  } catch (err) {
    console.error(err);
    showToast('Failed to open project details', 'error');
  }
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
function openProjectModalForCreate(defaultStatus = 'in_progress') {
  DOM.modalProjectTitle.textContent = '🚀 Create Innovation Project / Task';
  DOM.projectForm.reset();
  document.getElementById('form-project-id').value = '';
  document.getElementById('form-status').value = defaultStatus;
  
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  document.getElementById('form-due-date').value = nextMonth.toISOString().split('T')[0];

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
  document.getElementById('form-linkedin').value = project.linkedin_url || '';
  document.getElementById('form-image-url').value = project.image_url || '';
  document.getElementById('form-team-name').value = project.team_name || '';
  document.getElementById('form-team-lead').value = project.team_lead || '';
  document.getElementById('form-team-lead-photo').value = project.team_lead_photo || '';
  document.getElementById('form-deliverables').value = project.deliverables || '';

  openModal(DOM.projectModal);
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-project-id').value;

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
    linkedin_url: document.getElementById('form-linkedin').value.trim(),
    image_url: document.getElementById('form-image-url').value.trim(),
    team_name: document.getElementById('form-team-name').value.trim(),
    team_lead: document.getElementById('form-team-lead').value.trim(),
    team_lead_photo: document.getElementById('form-team-lead-photo').value.trim(),
    deliverables: document.getElementById('form-deliverables').value.trim()
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal(DOM.projectModal);
      showToast(id ? 'Project updated successfully' : 'New project created successfully');
      await Promise.all([fetchProjects(), fetchNotifications()]);
      renderAllViews();
      updateStatsSummary();
    } else {
      const err = await res.json();
      showToast(err.error || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to save project', 'error');
  }
}

// Universal Confirmation Dialog for Delete Actions
function confirmDeleteDialog({ title = '⚠️ Confirmation Required', message = "Are you sure? This can't be undone", onConfirm }) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const proceedBtn = document.getElementById('btn-confirm-proceed');
  const cancelBtn = document.getElementById('btn-confirm-cancel');
  const closeBtn = document.getElementById('close-confirm-modal');

  if (!modal) return;

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  openModal(modal);

  // Focus Cancel button by default to prevent accidental deletion on Enter
  if (cancelBtn) {
    setTimeout(() => cancelBtn.focus(), 50);
  }

  const cleanup = () => {
    closeModal(modal);
    proceedBtn.removeEventListener('click', handleProceed);
  };

  const handleProceed = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  proceedBtn.addEventListener('click', handleProceed);
  cancelBtn.onclick = cleanup;
  closeBtn.onclick = cleanup;
}

// Global helpers for removing photos, videos, team members, comments, and BOM items
window.confirmDeleteDialog = confirmDeleteDialog;

window.confirmClearPhoto = (onClear) => {
  confirmDeleteDialog({
    title: '🖼️ Remove Photo',
    message: "Are you sure? This can't be undone",
    onConfirm: onClear
  });
};

window.confirmClearVideo = (onClear) => {
  confirmDeleteDialog({
    title: '🎥 Remove Video',
    message: "Are you sure? This can't be undone",
    onConfirm: onClear
  });
};

window.confirmRemoveTeamMember = (memberName, onRemove) => {
  confirmDeleteDialog({
    title: '👥 Remove Team Member',
    message: `Are you sure you want to remove ${memberName}? This can't be undone`,
    onConfirm: onRemove
  });
};

window.confirmDeleteComment = (commentId, onDelete) => {
  confirmDeleteDialog({
    title: '💬 Delete Comment',
    message: "Are you sure? This can't be undone",
    onConfirm: onDelete
  });
};

window.confirmDeleteBomItem = (bomId, onDelete) => {
  confirmDeleteDialog({
    title: '🛒 Delete BOM Item',
    message: "Are you sure? This can't be undone",
    onConfirm: onDelete
  });
};

async function deleteProject(id) {
  confirmDeleteDialog({
    title: '⚠️ Delete Project Entry',
    message: "Are you sure? This can't be undone",
    onConfirm: async () => {
      try {
        const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Project deleted', 'info');
          if (DOM.detailModal) closeModal(DOM.detailModal);
          await Promise.all([fetchProjects(), fetchNotifications()]);
          renderAllViews();
          updateStatsSummary();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to delete project', 'error');
        }
      } catch (err) {
        showToast('Failed to delete project', 'error');
      }
    }
  });
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
// ANALYTICS MODAL
// ----------------------------------------------------
async function openAnalyticsModal() {
  try {
    const res = await fetch('/api/analytics');
    const stats = await res.json();

    DOM.analyticsKpiRoot.innerHTML = `
      <div class="kpi-card">
        <span class="stat-label">Total Lab Projects</span>
        <span class="kpi-val text-primary">${stats.totalProjects || 0}</span>
      </div>
      <div class="kpi-card">
        <span class="stat-label">Active Prototyping</span>
        <span class="kpi-val text-warning">${stats.byStatus.in_progress || 0}</span>
      </div>
      <div class="kpi-card">
        <span class="stat-label">BOM Pending Signoff</span>
        <span class="kpi-val text-warning">${stats.pendingBOMCount || 0}</span>
      </div>
      <div class="kpi-card">
        <span class="stat-label">Completed & Showcased</span>
        <span class="kpi-val text-success">${stats.byStatus.completed || 0}</span>
      </div>
    `;

    const totalP = stats.totalProjects || 1;
    DOM.analyticsDomainBars.innerHTML = (stats.byDomain || []).map(d => {
      const pct = Math.round((d.count / totalP) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${d.domain}</span>
          <div class="bar-fill-wrap">
            <div class="bar-fill-color" style="width:${pct}%;"></div>
          </div>
          <span class="bar-num">${d.count}</span>
        </div>
      `;
    }).join('');

    const statusLabels = {
      in_queue: 'In Queue',
      in_progress: 'On Progress',
      testing: 'Testing',
      completed: 'Completed'
    };
    DOM.analyticsStatusBars.innerHTML = Object.entries(stats.byStatus || {}).map(([st, count]) => {
      const pct = Math.round((count / totalP) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${statusLabels[st] || st}</span>
          <div class="bar-fill-wrap">
            <div class="bar-fill-color" style="width:${pct}%; background:#8b5cf6;"></div>
          </div>
          <span class="bar-num">${count}</span>
        </div>
      `;
    }).join('');

    openModal(DOM.analyticsModal);
  } catch (err) {
    showToast('Failed to load analytics', 'error');
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
  if (modal) modal.classList.add('active');
}

function closeModal(modal) {
  if (modal) modal.classList.remove('active');
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
