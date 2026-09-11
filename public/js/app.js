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
  allProjectsCache: [],
  currentView: 'board',
  filterDomain: 'All',
  filterTag: '',
  filterStatus: 'All',
  filterPriority: 'All',
  searchQuery: '',
  sortBy: 'due_date',
  activeProjectId: null,
  draggedCardId: null,
  auditLogs: [],
  auditTotal: 0,
  auditPage: 1,
  auditLimit: 50,
  auditTotalPages: 1,
  auditSummary: {},
  auditFilters: {
    search: '',
    role: 'all',
    batch: 'all',
    sort: 'timestamp_desc',
    event_type: 'all',
    start_date: '',
    end_date: ''
  },
  studentViewMode: 'cards',
  expandedStudentCards: new Set(),
  togglingProjects: new Set(),
  currentEditingTeamMembers: [],
  batchFilter: 'all',
  collapsedBatches: new Set()
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
  saveProjectBtn: document.getElementById('save-project-btn'),
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

function isUserAdmin() {
  if (!state.currentUser) return false;
  const role = (state.currentUser.role || '').toLowerCase();
  const email = (state.currentUser.email || '').toLowerCase();
  return role === 'admin' || email === 'admin@igridlab.edu.in';
}

function isUserStudent() {
  if (!state.currentUser) return false;
  const role = (state.currentUser.role || '').toLowerCase();
  return role === 'student' && !isUserAdmin();
}

function isUserViewer() {
  if (!state.currentUser) return false;
  const role = (state.currentUser.role || '').toLowerCase();
  return role === 'viewer';
}

function isUserPublic() {
  return !state.currentUser || isUserViewer();
}

function isUserMemberOfProject(project) {
  if (!project) return false;
  if (isUserAdmin()) return true;
  if (!isUserStudent()) return false;
  
  const user = state.currentUser;
  if (!user) return false;

  const targetId = Number(project.id);
  const userProjectId = user.project_id ? Number(user.project_id) : (user.team_id ? Number(user.team_id) : (user.teamId ? Number(user.teamId) : null));

  // 1. Direct teamId / projectId comparison (SOURCE OF TRUTH)
  if (userProjectId && userProjectId === targetId) {
    return true;
  }

  if (user.team_code && user.team_code === project.project_code) {
    return true;
  }

  if (user.assigned_project && (user.assigned_project === project.project_code || user.assigned_project === project.title)) {
    return true;
  }
  if (user.project_title && (user.project_title === project.title || user.project_title === project.project_code)) {
    return true;
  }

  // 2. Check student directory record in state.students
  const rawUserName = (user.name || '').toLowerCase().trim();
  const userName = rawUserName.replace(/\s*\(student\)\s*/gi, '').trim();
  const userEmail = (user.email || '').toLowerCase().trim();

  if (state.students && Array.isArray(state.students)) {
    const stRecord = state.students.find(s => 
      (s.user_id && Number(s.user_id) === Number(user.id)) || 
      (s.email && s.email.toLowerCase().trim() === userEmail) ||
      (user.roll_no && s.roll_no && s.roll_no === user.roll_no) ||
      (userName && s.name && s.name.toLowerCase().trim() === userName)
    );
    if (stRecord) {
      if (stRecord.project_id && Number(stRecord.project_id) === targetId) return true;
      if (stRecord.team_id && Number(stRecord.team_id) === targetId) return true;
      if (stRecord.assigned_project && (stRecord.assigned_project === project.project_code || stRecord.assigned_project.toLowerCase() === (project.title || '').toLowerCase())) {
        return true;
      }
      if (stRecord.project_title && (stRecord.project_title === project.title || stRecord.project_title.toLowerCase() === (project.project_code || '').toLowerCase())) {
        return true;
      }
      if (stRecord.team_name && project.team_name && stRecord.team_name.toLowerCase().trim() === project.team_name.toLowerCase().trim()) {
        return true;
      }
    }
  }

  // 3. Team lead or team members list match
  if (project.team_lead) {
    const leadStr = project.team_lead.toLowerCase();
    if ((userName && (leadStr.includes(userName) || userName.includes(leadStr))) ||
        (userEmail && leadStr.includes(userEmail))) {
      return true;
    }
  }

  if (project.team_members) {
    let membersList = [];
    if (Array.isArray(project.team_members)) {
      membersList = project.team_members;
    } else if (typeof project.team_members === 'string') {
      try {
        const parsed = JSON.parse(project.team_members);
        if (Array.isArray(parsed)) membersList = parsed;
        else membersList = [project.team_members];
      } catch (e) {
        membersList = project.team_members.split(',').map(m => m.trim());
      }
    }
    
    for (const m of membersList) {
      if (typeof m === 'object' && m !== null) {
        const mName = (m.name || '').toLowerCase().replace(/\s*\(student\)\s*/gi, '').trim();
        const mEmail = (m.email || '').toLowerCase().trim();
        if ((userName && mName && (mName.includes(userName) || userName.includes(mName))) ||
            (userEmail && mEmail && mEmail === userEmail)) {
          return true;
        }
      } else if (typeof m === 'string') {
        const mLower = m.toLowerCase().trim();
        if ((userName && (mLower.includes(userName) || userName.includes(mLower))) ||
            (userEmail && mLower.includes(userEmail))) {
          return true;
        }
      }
    }
  }

  return false;
}

async function checkSessionOrRedirect() {
  const token = getSessionToken();
  if (!token) {
    state.currentUser = null;
    updateUserNavbarUI();
    return true; // Allows public showcase view without forced login redirect!
  }
  try {
    const res = await fetch('/api/auth/session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      localStorage.removeItem('igrid_session');
      state.currentUser = null;
      updateUserNavbarUI();
      return true; // Fall back to public showcase mode
    }
    const data = await res.json();
    state.currentUser = data.user;
    updateUserNavbarUI();
    return true;
  } catch (err) {
    localStorage.removeItem('igrid_session');
    state.currentUser = null;
    updateUserNavbarUI();
    return true;
  }
}

async function authFetch(url, options = {}) {
  const token = getSessionToken();
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  options.headers = headers;

  const baseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
  const fullUrl = (url.startsWith('http://') || url.startsWith('https://')) 
    ? url 
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  try {
    const res = await fetch(fullUrl, options);
    if (res.status === 401 && options.method && options.method !== 'GET') {
      showToast('Please sign in as a student or administrator to make changes.', 'error');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
      throw new Error('Unauthorized');
    }
    return res;
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      console.warn(`[API Connection Warning] ${url}:`, err.message || err);
    }
    throw err;
  }
}

function updateUserNavbarUI() {
  const userRoleBadge = document.getElementById('user-display-role');
  const userNameText = document.getElementById('user-display-name');
  const avatarImg = document.getElementById('profile-avatar-img');
  const loginBtn = document.getElementById('btn-login-nav');
  const logoutBtn = document.getElementById('btn-logout-nav');
  const openAddStudentBtn = document.getElementById('open-add-student-modal');
  const openAddProjectBtn = document.getElementById('open-project-modal');
  const openAddTaskModal = document.getElementById('open-add-task-modal');

  if (state.currentUser) {
    const isAdmin = isUserAdmin();
    const isViewer = isUserViewer();
    const displayName = state.currentUser.name || state.currentUser.email.split('@')[0];

    if (userNameText) userNameText.textContent = displayName;
    
    let avatarBg = '10b981';
    let roleText = '🎓 Student Innovator';
    let roleBadgeClass = 'badge-success';

    if (isAdmin) {
      avatarBg = '6366f1';
      roleText = '👑 Admin Coordinator';
      roleBadgeClass = 'badge-primary';
    } else if (isViewer) {
      avatarBg = '0284c7';
      roleText = '👁️ Public Showcase Viewer';
      roleBadgeClass = 'badge-blue';
    }

    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${avatarBg}&color=fff`;
    if (userRoleBadge) {
      userRoleBadge.textContent = roleText;
      userRoleBadge.className = `badge ${roleBadgeClass}`;
    }

    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    // 1. Navigation Menu Filtering:
    // When isViewer: ONLY "Management Showcase" and "Board" are visible!
    // All other tabs (timeline, list, table, bom, completed, students, analytics, audit) are hidden!
    if (DOM.viewTabs) {
      DOM.viewTabs.forEach(tab => {
        const view = tab.getAttribute('data-view');
        if (isViewer) {
          if (view === 'executive' || view === 'board') {
            tab.style.display = 'inline-flex';
          } else {
            tab.style.display = 'none';
          }
        } else if (view === 'audit') {
          tab.style.display = isAdmin ? 'inline-flex' : 'none';
        } else {
          tab.style.display = 'inline-flex';
        }
      });
    }

    const labAnalyticsBtn = document.getElementById('lab-analytics-btn');
    if (labAnalyticsBtn) labAnalyticsBtn.style.display = isViewer ? 'none' : 'inline-flex';

    if (!isAdmin) {
      if (openAddStudentBtn) openAddStudentBtn.style.display = 'none';
      if (openAddProjectBtn) openAddProjectBtn.style.display = 'none';
      if (openAddTaskModal) openAddTaskModal.style.display = 'none';
    } else {
      if (openAddStudentBtn) openAddStudentBtn.style.display = 'inline-block';
      if (openAddProjectBtn) openAddProjectBtn.style.display = 'inline-block';
      if (openAddTaskModal) openAddTaskModal.style.display = 'inline-block';
    }

    // Student Quick Access Banner & Navbar Button
    const isStudent = isUserStudent();
    const myTeamBtn = document.getElementById('btn-my-team-project');
    const studentBanner = document.getElementById('student-team-quick-banner');
    const bannerName = document.getElementById('student-banner-name');
    const bannerProjCode = document.getElementById('student-banner-project-code');
    const bannerProjTitle = document.getElementById('student-banner-project-title');
    const bannerBtnEdit = document.getElementById('student-banner-btn-edit');
    const bannerBtnView = document.getElementById('student-banner-btn-view');
    const bannerBtnProfile = document.getElementById('student-banner-btn-profile');

    if (isStudent && state.currentUser) {
      let matchedProj = null;
      if (state.projects && state.projects.length > 0) {
        matchedProj = state.projects.find(p => isUserMemberOfProject(p));
      }
      
      let stRecord = null;
      if (state.students && state.students.length > 0) {
        const uEmail = (state.currentUser.email || '').toLowerCase().trim();
        const uName = (state.currentUser.name || '').toLowerCase().trim();
        stRecord = state.students.find(s => 
          (s.email && s.email.toLowerCase().trim() === uEmail) ||
          (uName && s.name && s.name.toLowerCase().trim() === uName)
        );
      }

      if (myTeamBtn) {
        myTeamBtn.style.display = 'inline-flex';
        myTeamBtn.onclick = () => {
          const p = matchedProj || state.projects.find(proj => isUserMemberOfProject(proj));
          if (p) {
            openProjectModalForEdit(p);
          } else {
            showToast('Loading your team project...', 'info');
            fetchProjects().then(() => {
              const freshP = state.projects.find(proj => isUserMemberOfProject(proj));
              if (freshP) openProjectModalForEdit(freshP);
              else showToast('No assigned project found for your account.', 'warning');
            });
          }
        };
      }

      if (studentBanner) {
        studentBanner.style.display = 'flex';
        if (bannerName) bannerName.textContent = displayName;
        if (matchedProj) {
          if (bannerProjCode) bannerProjCode.textContent = matchedProj.project_code || 'Assigned Project';
          if (bannerProjTitle) bannerProjTitle.textContent = matchedProj.title || '';
        } else if (state.currentUser.team_code) {
          if (bannerProjCode) bannerProjCode.textContent = state.currentUser.team_code;
          if (bannerProjTitle) bannerProjTitle.textContent = state.currentUser.team_name || 'Team Project';
        } else {
          if (bannerProjCode) bannerProjCode.textContent = 'Team Project';
          if (bannerProjTitle) bannerProjTitle.textContent = 'Assigned to your Student Account';
        }

        if (bannerBtnEdit) {
          bannerBtnEdit.onclick = () => {
            const p = matchedProj || state.projects.find(proj => isUserMemberOfProject(proj));
            if (p) openProjectModalForEdit(p);
            else showToast('Loading project...', 'info');
          };
        }
        if (bannerBtnView) {
          bannerBtnView.onclick = () => {
            const p = matchedProj || state.projects.find(proj => isUserMemberOfProject(proj));
            if (p) openProjectDetail(p.id);
            else showToast('Loading project...', 'info');
          };
        }
        if (bannerBtnProfile) {
          bannerBtnProfile.onclick = () => {
            if (stRecord) openStudentViewModal(stRecord.id);
            else showToast('Opening profile...', 'info');
          };
        }
      }
    } else {
      if (myTeamBtn) myTeamBtn.style.display = 'none';
      if (studentBanner) studentBanner.style.display = 'none';
    }
  } else {
    // GUEST PUBLIC SHOWCASE (READ-ONLY) - default to Showcase and Board only
    const myTeamBtn = document.getElementById('btn-my-team-project');
    const studentBanner = document.getElementById('student-team-quick-banner');
    if (myTeamBtn) myTeamBtn.style.display = 'none';
    if (studentBanner) studentBanner.style.display = 'none';
    if (DOM.viewTabs) {
      DOM.viewTabs.forEach(tab => {
        const view = tab.getAttribute('data-view');
        if (view === 'executive' || view === 'board') {
          tab.style.display = 'inline-flex';
        } else {
          tab.style.display = 'none';
        }
      });
    }
    const labAnalyticsBtn = document.getElementById('lab-analytics-btn');
    if (labAnalyticsBtn) labAnalyticsBtn.style.display = 'none';

    if (userNameText) userNameText.textContent = 'Public Visitor';
    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=Public+Visitor&background=3b82f6&color=fff`;
    if (userRoleBadge) {
      userRoleBadge.textContent = '🌐 Public Showcase (Guest)';
      userRoleBadge.className = 'badge badge-primary';
    }
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (openAddStudentBtn) openAddStudentBtn.style.display = 'none';
    if (openAddProjectBtn) openAddProjectBtn.style.display = 'none';
    if (openAddTaskModal) openAddTaskModal.style.display = 'none';
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
  resolveCurrentRoute();
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
    const isAdmin = isUserAdmin();
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

  // If no filters active, update allProjectsCache
  if (state.filterDomain === 'All' && state.filterStatus === 'All' && state.filterPriority === 'All' && !state.filterTag && !state.searchQuery) {
    state.allProjectsCache = [...state.projects];
  } else if (!state.allProjectsCache || state.allProjectsCache.length === 0) {
    try {
      const allRes = await authFetch('/api/projects');
      state.allProjectsCache = await allRes.json();
    } catch(e) {}
  }
}

async function fetchStudents() {
  if (isUserViewer()) {
    state.students = [];
    return;
  }
  try {
    const res = await authFetch('/api/students');
    if (res.ok) state.students = await res.json();
    else state.students = [];
  } catch(e) {
    state.students = [];
  }
}

async function fetchBoms() {
  if (isUserViewer()) {
    state.boms = [];
    return;
  }
  try {
    const res = await authFetch('/api/bom');
    if (res.ok) state.boms = await res.json();
    else state.boms = [];
  } catch(e) {
    state.boms = [];
  }
}

async function fetchServerStats() {
  try {
    const res = await authFetch('/api/projects/stats');
    if (res.ok) {
      state.serverStats = await res.json();
      return state.serverStats;
    }
  } catch (err) {
    console.warn('Failed to fetch server stats:', err);
  }
  return null;
}

async function fetchNotifications() {
  if (isUserViewer()) {
    if (DOM.notifBadge) DOM.notifBadge.textContent = '0';
    if (DOM.tabBomCount) DOM.tabBomCount.textContent = '0';
    return;
  }
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

  // Hashtag Cloud Filter (Single-select / Toggle)
  if (DOM.hashtagCloud) {
    DOM.hashtagCloud.addEventListener('click', async (e) => {
      const chip = e.target.closest('.hashtag-chip');
      if (!chip) return;

      const tagVal = chip.getAttribute('data-tag') || '';

      // Toggle behavior: clicking active tag resets to all projects
      if (state.filterTag.toLowerCase() === tagVal.toLowerCase() && tagVal !== '') {
        state.filterTag = '';
      } else {
        state.filterTag = tagVal;
      }

      await fetchProjects();
      renderAllViews();
      if (DOM.filterActiveDot) {
        DOM.filterActiveDot.style.display = (state.filterDomain !== 'All' || state.filterPriority !== 'All' || state.filterStatus !== 'All' || state.filterTag) ? 'block' : 'none';
      }

      if (state.filterTag) {
        showToast(`Filtered by ${state.filterTag} (${state.projects.length} matching)`);
      } else {
        showToast('Showing all project tags');
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
  if (DOM.openAddTaskModal) DOM.openAddTaskModal.addEventListener('click', () => {
    state.openedFromDetailModal = false;
    state.detailModalProjectId = null;
    openProjectModalForCreate();
  });
  if (DOM.closeProjectModal) DOM.closeProjectModal.addEventListener('click', () => {
    closeModal(DOM.projectModal);
    if (state.openedFromDetailModal && state.detailModalProjectId) {
      const pid = state.detailModalProjectId;
      state.openedFromDetailModal = false;
      state.detailModalProjectId = null;
      openProjectDetail(pid);
    }
  });
  if (DOM.cancelProjectBtn) DOM.cancelProjectBtn.addEventListener('click', () => {
    closeModal(DOM.projectModal);
    if (state.openedFromDetailModal && state.detailModalProjectId) {
      const pid = state.detailModalProjectId;
      state.openedFromDetailModal = false;
      state.detailModalProjectId = null;
      openProjectDetail(pid);
    }
  });
  if (DOM.projectForm) DOM.projectForm.addEventListener('submit', handleProjectFormSubmit);
  
  const saveProjBtn = document.getElementById('save-project-btn');
  if (saveProjBtn) {
    saveProjBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleProjectFormSubmit(e);
    });
  }
  initEditFormLinkProtection();

  // Column quick add buttons
  document.querySelectorAll('.col-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.openedFromDetailModal = false;
      state.detailModalProjectId = null;
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
      state.openedFromDetailModal = true;
      state.detailModalProjectId = project.id;
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

  // Initialize Team Members chip listeners & Form link preview listeners
  initTeamMembersInputListeners();
  initEditFormLinkProtection();

  // Topbar New Project button
  const topbarNewProjectBtn = document.getElementById('open-add-task-modal');
  if (topbarNewProjectBtn) {
    topbarNewProjectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openProjectModalForCreate();
    });
  }

  // Date input picker click trigger enhancer
  document.querySelectorAll('input[type="date"]').forEach(dInput => {
    dInput.addEventListener('click', () => {
      if (typeof dInput.showPicker === 'function') {
        try { dInput.showPicker(); } catch(e) {}
      }
    });
  });

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

  // Student Delete Modal Actions
  const closeStudentDeleteModal = document.getElementById('close-student-delete-modal');
  if (closeStudentDeleteModal) closeStudentDeleteModal.addEventListener('click', () => closeModal(document.getElementById('student-delete-modal')));

  const cancelStudentDeleteBtn = document.getElementById('btn-cancel-delete-student');
  if (cancelStudentDeleteBtn) cancelStudentDeleteBtn.addEventListener('click', () => closeModal(document.getElementById('student-delete-modal')));

  const confirmStudentDeleteBtn = document.getElementById('btn-confirm-delete-student');
  if (confirmStudentDeleteBtn) confirmStudentDeleteBtn.addEventListener('click', executeStudentDelete);

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

  const btnStudentViewCards = document.getElementById('btn-student-view-cards');
  const btnStudentViewTable = document.getElementById('btn-student-view-table');
  if (btnStudentViewCards) {
    btnStudentViewCards.addEventListener('click', () => {
      state.studentViewMode = 'cards';
      btnStudentViewCards.classList.add('active');
      if (btnStudentViewTable) btnStudentViewTable.classList.remove('active');
      renderStudents();
    });
  }
  if (btnStudentViewTable) {
    btnStudentViewTable.addEventListener('click', () => {
      state.studentViewMode = 'table';
      btnStudentViewTable.classList.add('active');
      if (btnStudentViewCards) btnStudentViewCards.classList.remove('active');
      renderStudents();
    });
  }

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

  const navLogoutBtn = document.getElementById('btn-logout-nav');
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      try {
        await authFetch('/api/auth/logout', { method: 'POST' });
      } catch(e) {}
      localStorage.removeItem('igrid_session');
      showToast('Signed out successfully');
      window.location.href = '/login';
    });
  }

  // Audit Logs listeners
  initAuditLogListeners();

  // Batch View listeners
  initBatchViewListeners();
}

function resolveCurrentRoute() {
  const isViewer = isUserViewer();
  const isAdmin = isUserAdmin();

  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase().replace(/^#/, '');

  let targetView = isViewer ? 'executive' : 'board';

  // Match route by hash or path
  if (hash === 'executive' || hash === 'showcase' || path === '/executive' || path === '/showcase' || path === '/public-view') {
    targetView = 'executive';
  } else if (hash === 'board' || path === '/board') {
    targetView = 'board';
  } else if (hash === 'timeline' || path === '/timeline') {
    targetView = 'timeline';
  } else if (hash === 'list' || path === '/list') {
    targetView = 'list';
  } else if (hash === 'table' || path === '/table') {
    targetView = 'table';
  } else if (hash === 'bom' || path === '/bom') {
    targetView = 'bom';
  } else if (hash === 'completed' || hash === 'archive' || path === '/completed') {
    targetView = 'completed';
  } else if (hash === 'students' || hash === 'teams' || path === '/students' || path === '/team-management') {
    targetView = 'students';
  } else if (hash === 'analytics' || path === '/analytics') {
    targetView = 'analytics';
  } else if (hash === 'audit' || hash === 'audit-log' || path === '/audit' || path === '/audit-log' || path === '/admin') {
    targetView = 'audit';
  } else if (hash === 'batch' || hash === 'batches' || path === '/batch' || path === '/batches') {
    targetView = 'batch';
  }

  // Enforce viewer role restriction: ONLY Management Showcase and Board allowed!
  if (isViewer) {
    if (targetView !== 'executive' && targetView !== 'board') {
      showToast('Access restricted: Public Showcase Viewers can only access Management Showcase and Board.', 'warning');
      targetView = 'executive';
      if (window.location.pathname !== '/' && window.location.pathname !== '/showcase') {
        window.history.replaceState(null, '', '/showcase#executive');
      } else {
        window.location.hash = '#executive';
      }
    }
  } else if (targetView === 'audit' && !isAdmin) {
    showToast('Access denied: Administrator privilege required for audit logs.', 'error');
    targetView = 'board';
    window.history.replaceState(null, '', '/#board');
  }

  switchView(targetView);
}

window.addEventListener('hashchange', resolveCurrentRoute);
window.addEventListener('popstate', resolveCurrentRoute);

function switchView(viewName) {
  const isViewer = isUserViewer();
  const isAdmin = isUserAdmin();

  if (isViewer) {
    if (viewName !== 'executive' && viewName !== 'board') {
      showToast('Access restricted: Public Showcase Viewers can only access Management Showcase and Board.', 'warning');
      viewName = 'executive';
    }
  } else if (viewName === 'audit' && !isAdmin) {
    showToast('Access denied: Administrator privilege required.', 'error');
    viewName = 'board';
  }

  if (window.location.hash !== `#${viewName}`) {
    window.history.replaceState(null, '', `/#${viewName}`);
  }

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
// RENDERING FUNCTIONS & HASHTAG CLOUD
// ----------------------------------------------------
const PRESET_TAGS = ['#all', '#ROS2', '#EdgeAI', '#YOLOv8', '#JetsonOrin', '#PX4', '#LoRaWAN', '#SLAM', '#CANBus', '#FPGA'];

function renderHashtagCloud() {
  if (!DOM.hashtagCloud) return;

  const dataset = (state.allProjectsCache && state.allProjectsCache.length > 0) ? state.allProjectsCache : state.projects;

  const tagCounts = {};
  PRESET_TAGS.forEach(tag => {
    if (tag === '#all') {
      tagCounts[tag] = dataset.length;
    } else {
      const clean = tag.replace('#', '').toLowerCase();
      tagCounts[tag] = dataset.filter(p => {
        const pTags = (p.tags || '').toLowerCase();
        return pTags.includes(clean);
      }).length;
    }
  });

  const activeTag = state.filterTag ? (state.filterTag.startsWith('#') ? state.filterTag : `#${state.filterTag}`) : '#all';

  let html = `<span class="hashtag-label">Tags:</span>`;
  PRESET_TAGS.forEach(tag => {
    const isAll = tag === '#all';
    const isActive = (isAll && (!state.filterTag || state.filterTag === '#all' || state.filterTag === '')) || (!isAll && activeTag.toLowerCase() === tag.toLowerCase());
    const count = tagCounts[tag] || 0;
    const tagValue = isAll ? '' : tag;
    html += `
      <button type="button" class="hashtag-chip ${isActive ? 'active' : ''}" data-tag="${tagValue}" title="${isAll ? 'Show all projects' : `Filter by ${tag} (${count} projects)`}">
        <span>${tag}</span>
        <span class="hashtag-count">${count}</span>
      </button>
    `;
  });

  DOM.hashtagCloud.innerHTML = html;
}

window.resetTagFilter = async function() {
  state.filterTag = '';
  await fetchProjects();
  renderAllViews();
  if (DOM.filterActiveDot) {
    DOM.filterActiveDot.style.display = (state.filterDomain !== 'All' || state.filterPriority !== 'All' || state.filterStatus !== 'All' || state.filterTag) ? 'block' : 'none';
  }
  showToast('Showing all projects');
};

function renderAllViews() {
  renderHashtagCloud();
  renderKanban();
  renderExecutiveShowcase();
  if (!isUserViewer()) {
    renderTimeline();
    renderList();
    renderTable();
    renderBOM();
    renderCompleted();
    renderStudents();
    renderAnalytics();
    if (state.currentView === 'audit' && isUserAdmin()) {
      fetchAndRenderAuditLogs();
    }
    renderBatchView();
    populateBomProjectSelect();
  }
  updateStatsSummary();
  updateUserNavbarUI();
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

    // Team Logo & Photo
    const leadPhoto = p.team_logo_url || p.team_lead_photo || (p.team_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_name)}&background=6366f1&color=fff` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_lead || 'Team')}&background=6366f1&color=fff`);

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

    const isAdmin = isUserAdmin();
    const canEdit = isAdmin || isUserMemberOfProject(p);
    const isMyTeam = !isAdmin && isUserMemberOfProject(p);
    const myTeamBadge = isMyTeam
      ? '<span class="badge" style="background:rgba(245,158,11,0.25); color:#fbbf24; border:1px solid #f59e0b; font-weight:700; font-size:11px;">⭐ Your Team</span>'
      : '';

    const isHidden = (p.is_visible === 0 || p.is_visible === false || p.is_active === 0 || p.is_active === false);
    const hiddenBadge = (isAdmin && isHidden)
      ? '<span class="badge badge-hidden" title="Hidden from students and public viewers">👁️‍🗨️ Hidden</span>'
      : '';

    html += `
      <div class="exec-card ${isHidden ? 'project-card-hidden' : ''} ${isMyTeam ? 'exec-card-my-team' : ''}" style="${isMyTeam ? 'border: 2px solid rgba(245, 158, 11, 0.6); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15);' : ''}">
        <!-- Hero Photo with Badges -->
        <div class="exec-card-hero">
          <img src="${heroImg}" alt="${escapeHTML(p.title)}" loading="lazy">
          <div class="exec-card-overlay">
            <div class="exec-card-top-badges">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span class="card-id-code">${p.project_code}</span>
                ${myTeamBadge}
                ${hiddenBadge}
                ${isAdmin ? renderProjectActiveToggleHTML(p.id, p.is_visible !== undefined ? p.is_visible : p.is_active) : ''}
              </div>
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

          <!-- Team Lead & Logo Row -->
          <div class="exec-card-lead-row">
            <div class="exec-lead-info">
              <img src="${leadPhoto}" alt="Team Logo" title="Team Logo: ${escapeHTML(p.team_name || p.team_lead || 'Team')}" class="exec-lead-avatar">
              <div>
                <div class="exec-lead-name">${escapeHTML(p.team_lead || 'Student Lead')}</div>
                <div class="exec-lead-role">${escapeHTML(p.team_name || 'Innovation Group')}</div>
              </div>
            </div>
            <div class="avatar-group">
              ${memberAvatarsHTML}
            </div>
          </div>

          <!-- Immediate Action / Procurement Alert (Internal Notes - Hidden from Viewers) -->
          ${(!isUserViewer() && p.immediate_action) ? `
          <div class="exec-action-alert">
            <div class="exec-action-alert-text">
              <strong>${hasPendingBOM ? '⚠️ BOM Requisition Pending:' : '⚡ Next Action Item:'}</strong>
              <div>${escapeHTML(p.immediate_action || 'Ongoing prototype development')}</div>
            </div>
            ${(hasPendingBOM && isUserAdmin()) ? `<button class="btn btn-sm btn-primary" onclick="switchView('bom')">Review BOM</button>` : ''}
          </div>
          ` : ''}

          <!-- Media & Social Links -->
          ${mediaLinks.length > 0 ? `
            <div class="exec-media-links">
              ${mediaLinks.join('')}
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="exec-card-footer" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="font-size:12px; color:var(--text-dim);">Due: <strong>${formatDate(p.due_date)}</strong></span>
          <div style="display:flex; align-items:center; gap:6px;">
            ${canEdit ? `
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(proj => proj.id === ${p.id}) || ${JSON.stringify(p).replace(/"/g, '&quot;')})" style="background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(245,158,11,0.3); padding:6px 12px; font-size:12px; border-radius:6px; cursor:pointer;" title="Edit Your Team Project Details (Links, Team Name, Logo, Members & Deliverables)">
                ✏️ Edit Details
              </button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="openSpotlightPresentation(${p.id})">
              <span>🔍 Spotlight View</span>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  DOM.execShowcaseGridRoot.innerHTML = html;
}

// 2. SPOTLIGHT PRESENTATION VIEW
async function openSpotlightPresentation(projectId) {
  try {
    const res = await authFetch(`/api/projects/${projectId}`);
    const project = await res.json();

    document.getElementById('spotlight-code').textContent = `${project.project_code} - ${project.title}`;
    document.getElementById('spotlight-domain').textContent = project.domain;

    const defaultHero = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    const heroImg = project.image_url || defaultHero;
    const leadPhoto = project.team_logo_url || project.team_lead_photo || (project.team_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(project.team_name)}&background=6366f1&color=fff` : `https://ui-avatars.com/api/?name=${encodeURIComponent(project.team_lead || 'Team')}&background=6366f1&color=fff`);

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

    const canEdit = isUserAdmin() || isUserMemberOfProject(project);

    DOM.spotlightBodyRoot.innerHTML = `
      <div class="spotlight-hero-media">
        <img src="${heroImg}" alt="${escapeHTML(project.title)}">
      </div>

      <div class="spotlight-grid">
        <div class="spotlight-details">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
            <h2 style="margin:0;">${escapeHTML(project.title)}</h2>
            ${canEdit ? `
              <button class="btn btn-sm btn-primary" onclick="closeModal(DOM.spotlightModal); openProjectModalForEdit(state.projects.find(proj => proj.id === ${project.id}) || ${JSON.stringify(project).replace(/"/g, '&quot;')});" style="background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; padding:6px 14px; font-size:12px; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; box-shadow:0 2px 8px rgba(245,158,11,0.3); border-radius:6px; cursor:pointer;" title="Edit Your Team Project Details (Links, Team Name, Logo, Members & Deliverables)">
                ✏️ Edit Project Details
              </button>
            ` : ''}
          </div>
          <p style="font-size:13px; color:var(--text-muted); line-height:1.6;">${escapeHTML(project.description || '')}</p>

          ${(!isUserViewer() && project.immediate_action) ? `
          <div class="detail-action-box">
            <strong>⚡ Critical Immediate Action Item / Blocker:</strong>
            <p style="margin-top:2px;">${escapeHTML(project.immediate_action || 'No critical blockers reported.')}</p>
          </div>
          ` : ''}

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
            <span style="font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase;">TEAM & LEAD</span>
            <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
              <img src="${leadPhoto}" alt="Team Logo" title="Team Logo: ${escapeHTML(project.team_name || project.team_lead || 'Team')}" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:2px solid var(--primary);">
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

  if (state.projects.length === 0) {
    const activeTagName = state.filterTag || 'the selected criteria';
    const resetBtn = state.filterTag ? `<div style="margin-top:10px;"><button class="btn btn-secondary" onclick="resetTagFilter()" style="font-size:11px; padding:4px 10px; cursor:pointer;">Reset Filter (#all)</button></div>` : '';
    DOM.cardsInQueue.innerHTML = `<div class="empty-column-state" style="padding:28px 12px; text-align:center; color:var(--text-dim); font-size:12px;">No projects tagged <strong>${escapeHTML(activeTagName)}</strong> in Queue.${resetBtn}</div>`;
    DOM.cardsInProgress.innerHTML = `<div class="empty-column-state" style="padding:28px 12px; text-align:center; color:var(--text-dim); font-size:12px;">No projects tagged <strong>${escapeHTML(activeTagName)}</strong> in Progress.</div>`;
    DOM.cardsTesting.innerHTML = `<div class="empty-column-state" style="padding:28px 12px; text-align:center; color:var(--text-dim); font-size:12px;">No projects tagged <strong>${escapeHTML(activeTagName)}</strong> in Testing.</div>`;
    DOM.cardsCompleted.innerHTML = `<div class="empty-column-state" style="padding:28px 12px; text-align:center; color:var(--text-dim); font-size:12px;">No projects tagged <strong>${escapeHTML(activeTagName)}</strong> Completed.</div>`;
  } else {
    DOM.cardsInQueue.innerHTML = cols.in_queue.length ? cols.in_queue.map(createCardHTML).join('') : '<div class="empty-column-state" style="padding:24px 12px; text-align:center; color:var(--text-dim); font-size:11px; opacity:0.5;">No items</div>';
    DOM.cardsInProgress.innerHTML = cols.in_progress.length ? cols.in_progress.map(createCardHTML).join('') : '<div class="empty-column-state" style="padding:24px 12px; text-align:center; color:var(--text-dim); font-size:11px; opacity:0.5;">No items</div>';
    DOM.cardsTesting.innerHTML = cols.testing.length ? cols.testing.map(createCardHTML).join('') : '<div class="empty-column-state" style="padding:24px 12px; text-align:center; color:var(--text-dim); font-size:11px; opacity:0.5;">No items</div>';
    DOM.cardsCompleted.innerHTML = cols.completed.length ? cols.completed.map(createCardHTML).join('') : '<div class="empty-column-state" style="padding:24px 12px; text-align:center; color:var(--text-dim); font-size:11px; opacity:0.5;">No items</div>';
  }

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
      const tag = pill.getAttribute('data-tag') || '';
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      if (state.filterTag.toLowerCase() === cleanTag.toLowerCase()) {
        state.filterTag = '';
      } else {
        state.filterTag = cleanTag;
      }
      await fetchProjects();
      renderAllViews();
      if (DOM.filterActiveDot) {
        DOM.filterActiveDot.style.display = (state.filterDomain !== 'All' || state.filterPriority !== 'All' || state.filterStatus !== 'All' || state.filterTag) ? 'block' : 'none';
      }
      showToast(state.filterTag ? `Filtered by tag ${state.filterTag} (${state.projects.length} matching)` : 'Showing all project tags');
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
    avatarsHTML = `<img src="${p.team_logo_url || p.team_lead_photo || (p.team_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_name)}&background=6366f1&color=fff` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.team_lead || 'IG')}&background=6366f1&color=fff`)}" class="avatar-badge" title="Team Logo: ${escapeHTML(p.team_name || p.team_lead || 'Team')}" alt="Team Logo">`;
  }

  let bomIcon = '';
  if (p.bom_status === 'Approved') bomIcon = '<span style="color:#10b981;" title="BOM Approved">✓ BOM</span>';
  else if (p.bom_status === 'Submitted') bomIcon = '<span style="color:#f59e0b;" title="BOM Pending Review">⏳ BOM</span>';

  const isAdmin = isUserAdmin();
  const isViewer = isUserViewer();
  const canEdit = isAdmin || isUserMemberOfProject(p);
  const isMyTeam = !isAdmin && isUserMemberOfProject(p);
  const myTeamBadge = isMyTeam
    ? '<span class="badge" style="background:rgba(245,158,11,0.25); color:#fbbf24; border:1px solid #f59e0b; font-weight:700; font-size:10px;">⭐ Your Team</span>'
    : '';

  const isHidden = (p.is_visible === 0 || p.is_visible === false || p.is_active === 0 || p.is_active === false);
  const hiddenClass = isHidden ? 'project-card-hidden' : '';
  const hiddenBadge = (isAdmin && isHidden)
    ? '<span class="badge badge-hidden" title="Hidden from students and public viewers">👁️‍🗨️ Hidden</span>'
    : '';
  const draggableAttrs = isAdmin ? 'draggable="true" ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"' : 'draggable="false"';
  const stageLockIcon = !isAdmin ? '<span title="🔒 Stage changes are restricted to Administrator" style="font-size: 11px; opacity: 0.65; cursor: default;">🔒</span>' : '';

  return `
    <div class="kanban-card ${hiddenClass} ${isMyTeam ? 'kanban-card-my-team' : ''}" style="${isMyTeam ? 'border: 2px solid rgba(245, 158, 11, 0.6);' : ''}" ${draggableAttrs} data-id="${p.id}" ${!isAdmin ? 'title="Click to view details (Stage moves restricted to Admin)"' : 'title="Drag to change stage or click for details"'}>
      <div class="card-top-bar">
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          ${stageLockIcon}
          <span class="card-id-code">${p.project_code}</span>
          ${myTeamBadge}
          ${isAdmin ? renderProjectActiveToggleHTML(p.id, p.is_visible !== undefined ? p.is_visible : p.is_active) : ''}
        </div>
        <div class="card-badges-right" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          ${hiddenBadge}
          <span class="badge ${priorityClass}">${p.priority}</span>
          ${formattedDate ? `<span class="badge badge-due-date ${isOverdue ? 'overdue' : ''}">📅 ${formattedDate}</span>` : ''}
        </div>
      </div>

      <h4 class="card-title">${escapeHTML(p.title)}</h4>
      <p class="card-desc">${escapeHTML(p.description || '')}</p>

      ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}

      ${(!isViewer && p.immediate_action) ? `
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

      <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="avatar-group">
          ${avatarsHTML}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          ${canEdit ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(proj => proj.id === ${p.id}) || ${JSON.stringify(p).replace(/"/g, '&quot;')})" style="background:var(--primary, #f59e0b); color:#000000; padding: 3px 9px; font-size: 11px; height: 26px; border-radius: 5px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; border:none; box-shadow:0 2px 6px rgba(245,158,11,0.25); cursor:pointer;" title="Edit Your Team Project Details (Links, Logo, Members & Deliverables)">
              ✏️ Edit Details
            </button>
          ` : ''}
          <div class="card-counters">
            <span class="counter-item" title="Comments">💬 ${p.comments_count || 0}</span>
            <span class="counter-item" title="BOM/Attachments">📎 ${p.attachments_count || 0}</span>
          </div>
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
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="list-code-badge">${p.project_code}</span>
          ${renderProjectActiveToggleHTML(p.id, p.is_visible !== undefined ? p.is_visible : p.is_active)}
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
  const isAdmin = isUserAdmin();
  state.projects.forEach(p => {
    const canEdit = isAdmin || isUserMemberOfProject(p);
    const isMyTeam = !isAdmin && isUserMemberOfProject(p);

    html += `
      <tr class="${isMyTeam ? 'table-row-my-team' : ''}" style="${isMyTeam ? 'background: rgba(245, 158, 11, 0.06);' : ''}">
        <td class="table-code">
          <div style="display:flex; align-items:center; gap:6px;">
            <span>${p.project_code}</span>
            ${isMyTeam ? '<span class="badge" style="background:rgba(245,158,11,0.25); color:#fbbf24; border:1px solid #f59e0b; font-size:10px;">⭐ Mine</span>' : ''}
            ${isAdmin ? renderProjectActiveToggleHTML(p.id, p.is_visible !== undefined ? p.is_visible : p.is_active, { showLabel: false }) : ''}
          </div>
        </td>
        <td><span class="table-title" onclick="openProjectDetail(${p.id})">${escapeHTML(p.title)}</span></td>
        <td><span class="badge badge-blue">${p.domain}</span></td>
        <td>
          ${isAdmin ? `
            <select onchange="updateProjectField(${p.id}, 'status', this.value)" style="padding:4px 8px; font-size:12px;">
              <option value="in_queue" ${p.status === 'in_queue' ? 'selected' : ''}>In Queue</option>
              <option value="in_progress" ${p.status === 'in_progress' ? 'selected' : ''}>On Progress</option>
              <option value="testing" ${p.status === 'testing' ? 'selected' : ''}>Testing</option>
              <option value="completed" ${p.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          ` : `<span class="badge badge-date">${formatStatus(p.status)}</span>`}
        </td>
        <td>
          ${isAdmin ? `
            <select onchange="updateProjectField(${p.id}, 'priority', this.value)" style="padding:4px 8px; font-size:12px;">
              <option value="High" ${p.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Normal" ${p.priority === 'Normal' ? 'selected' : ''}>Normal</option>
              <option value="Low" ${p.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          ` : `<span class="badge ${p.priority === 'High' ? 'badge-high' : 'badge-blue'}">${p.priority}</span>`}
        </td>
        <td><strong>${p.progress || 0}%</strong></td>
        <td>${formatDate(p.due_date)}</td>
        <td>${escapeHTML(p.team_lead || 'Lead')}</td>
        <td><span class="badge badge-date">${p.bom_status || 'N/A'}</span></td>
        <td>
          ${p.github_repo ? `<a href="${p.github_repo}" target="_blank" class="meta-link">🐙 Repo</a>` : '<span style="color:var(--text-dim)">-</span>'}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:5px;">
            ${canEdit ? `
              <button class="btn btn-sm btn-primary" onclick="openProjectModalForEdit(state.projects.find(proj => proj.id === ${p.id}) || ${JSON.stringify(p).replace(/"/g, '&quot;')})" style="padding:4px 8px; font-size:11px; background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; cursor:pointer;" title="Edit Project Details">✏️ Edit</button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="openProjectDetail(${p.id})" style="padding:4px 8px; font-size:11px;">View</button>
          </div>
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
  return role === 'admin' || email === 'admin@igridlab.edu.in';
}

// 9. RENDER STUDENTS & INNOVATOR TEAMS DIRECTORY
function getStudentMatchedProject(s) {
  if (!s || !Array.isArray(state.projects) || state.projects.length === 0) return null;
  const assigned = (s.assigned_project || '').trim().toLowerCase();
  const title = (s.project_title || '').trim().toLowerCase();
  
  // 1. Direct project_code exact match
  let matched = state.projects.find(p => p.project_code && assigned && p.project_code.toLowerCase() === assigned);
  if (matched) return matched;

  // 2. Direct title exact match
  matched = state.projects.find(p => p.title && title && p.title.toLowerCase() === title);
  if (matched) return matched;

  // 3. Substring match on code or title
  matched = state.projects.find(p => {
    const code = (p.project_code || '').toLowerCase();
    const pTitle = (p.title || '').toLowerCase();
    if (code && assigned && (code.includes(assigned) || assigned.includes(code))) return true;
    if (pTitle && title && (pTitle.includes(title) || title.includes(pTitle))) return true;
    if (pTitle && assigned && (pTitle.includes(assigned) || assigned.includes(pTitle))) return true;
    if (code && title && (code.includes(title) || title.includes(code))) return true;
    return false;
  });
  if (matched) return matched;

  // 4. Team member / team lead name match
  const sName = (s.name || '').trim().toLowerCase();
  matched = state.projects.find(p => {
    if (p.team_lead && p.team_lead.toLowerCase() === sName) return true;
    if (Array.isArray(p.team_members)) {
      return p.team_members.some(m => {
        const mName = typeof m === 'object' && m ? (m.name || '') : String(m);
        return mName.toLowerCase().trim() === sName;
      });
    }
    return false;
  });

  return matched || null;
}

function getStudentProgress(s) {
  const p = getStudentMatchedProject(s);
  if (p && p.progress !== undefined && p.progress !== null) {
    return Number(p.progress) || 0;
  }
  return Number(s.progress) || 0;
}

function toggleStudentCardExpand(studentId) {
  const card = document.getElementById(`student-team-card-${studentId}`);
  const btn = document.getElementById(`btn-expand-${studentId}`);
  if (!card) return;

  const isExpanded = card.classList.contains('is-expanded');
  if (isExpanded) {
    card.classList.remove('is-expanded');
    state.expandedStudentCards.delete(Number(studentId));
    if (btn) btn.innerHTML = '<span>▼ View Full Details</span>';
  } else {
    card.classList.add('is-expanded');
    state.expandedStudentCards.add(Number(studentId));
    if (btn) btn.innerHTML = '<span>▲ Collapse Details</span>';
  }
}

function renderStudents() {
  if (!DOM.studentsGridRoot) return;
  if (state.students.length === 0) {
    DOM.studentsGridRoot.innerHTML = '<div style="padding:20px; color:var(--text-dim); text-align:center;">No registered student profiles found.</div>';
    return;
  }

  const isAdmin = isUserAdmin();
  const currentEmail = (state.currentUser && state.currentUser.email || '').toLowerCase();
  const currentName = (state.currentUser && state.currentUser.name || '').toLowerCase();

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
      const matchDept = (s.department || '').toLowerCase().includes(query);
      const matchGuide = (s.guide || '').toLowerCase().includes(query);
      if (!matchName && !matchRoll && !matchProject && !matchDept && !matchGuide) return false;
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
    if (selectedSort === 'progress_desc') return getStudentProgress(b) - getStudentProgress(a);
    return 0;
  });

  if (filtered.length === 0) {
    DOM.studentsGridRoot.innerHTML = '<div style="padding:40px; color:var(--text-dim); text-align:center;">No student profiles match the filter criteria.</div>';
    return;
  }

  // TABLE VIEW MODE
  if (state.studentViewMode === 'table') {
    let tableHtml = `
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
      const matchedProj = getStudentMatchedProject(s);
      const projName = matchedProj ? matchedProj.title : (s.assigned_project || s.project_title || 'Unassigned');
      const guideName = s.guide || 'Not assigned';
      const prog = getStudentProgress(s);
      const isOwner = (s.email && s.email.toLowerCase() === currentEmail) || (s.name && s.name.toLowerCase() === currentName);

      tableHtml += `
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
            ${matchedProj && (isAdmin || isOwner || isUserMemberOfProject(matchedProj)) ? `
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProj.id}) || ${JSON.stringify(matchedProj).replace(/"/g, '&quot;')})" style="background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; margin-right: 6px;" title="Edit Team Project Details">✏️ Edit Project</button>
            ` : ''}
            ${(isAdmin || isOwner) ? `<button class="btn btn-sm btn-secondary" onclick="openStudentEditModal(${s.id})" style="margin-right: 6px;">👤 Edit Profile</button>` : ''}
            ${isAdmin ? `<button class="btn btn-sm btn-danger btn-student-delete" onclick="event.stopPropagation(); confirmDeleteStudent(${s.id}, '${escapeHTML((s.name || '').replace(/'/g, "\\'"))}')" title="Delete Student Record" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight:600;">🗑️ Delete</button>` : ''}
          </td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    DOM.studentsGridRoot.innerHTML = tableHtml;
    return;
  }

  // EXPANDABLE CARDS GRID VIEW MODE (DEFAULT)
  let cardsHtml = '';
  filtered.forEach(s => {
    const isExpanded = state.expandedStudentCards.has(Number(s.id));
    const photo = s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${(s.avatar_color || '6366f1').replace('#','')}&color=fff`;
    const statusText = s.status || 'Active';
    const statusBadge = statusText === 'Active' ? 'badge-success' : 'badge-normal';
    const isOwner = (s.email && s.email.toLowerCase() === currentEmail) || (s.name && s.name.toLowerCase() === currentName);

    // Cross-reference with Project Database
    const matchedProject = getStudentMatchedProject(s);
    const prog = getStudentProgress(s);

    const projectTitle = matchedProject ? matchedProject.title : (s.project_title || s.assigned_project || 'IGRID Innovation Project');
    const projectCode = matchedProject ? matchedProject.project_code : (s.assigned_project || 'IGRID-PROJ');
    const projectDesc = matchedProject ? (matchedProject.description || 'System architecture & engineering prototype development.') : (s.bio || 'Project under development in IGRID Innovation Lab.');
    const projectPriority = matchedProject ? (matchedProject.priority || 'Normal') : 'Normal';
    const projectStatus = matchedProject ? formatStatus(matchedProject.status) : statusText;
    const projectAction = matchedProject ? (matchedProject.immediate_action || 'Ongoing sprint milestones & testing') : 'System architecture & component benchmarking';
    const projectDeliverables = matchedProject ? (matchedProject.deliverables || 'Working Hardware Prototype, Technical Documentation, GitHub Codebase') : 'Project deliverables and showcase assets.';
    
    // Dates in IST
    const startIST = matchedProject && matchedProject.start_date ? formatISTDateTime(matchedProject.start_date) : '01 Sep 2026 IST';
    const dueIST = matchedProject && matchedProject.due_date ? formatISTDateTime(matchedProject.due_date) : '25 Mar 2026 IST';

    // Tags
    const tagsList = matchedProject && matchedProject.tags ? matchedProject.tags.split(',').map(t => t.trim()).filter(Boolean) : ['#Innovation', '#Engineering'];

    // Media Links
    const githubLink = (matchedProject && matchedProject.github_repo) || s.github_url || '';
    const reportLink = (matchedProject && matchedProject.doc_url) || '';
    const videoLink = (matchedProject && matchedProject.youtube_url) || '';
    const linkedinLink = (matchedProject && matchedProject.linkedin_url) || s.linkedin_url || '';
    const heroImage = (matchedProject && matchedProject.image_url) || '';

    // Team members list
    let teamMembersFormatted = s.team_members || s.name;
    if (matchedProject && matchedProject.team_members) {
      if (Array.isArray(matchedProject.team_members) && matchedProject.team_members.length > 0) {
        teamMembersFormatted = matchedProject.team_members.map(m => typeof m === 'object' ? (m.name || m.email || JSON.stringify(m)) : String(m)).join(', ');
      } else if (typeof matchedProject.team_members === 'string') {
        teamMembersFormatted = matchedProject.team_members;
      }
    }

    // Skills
    const skillsList = (s.skills || '').split(',').map(sk => sk.trim()).filter(Boolean);

    cardsHtml += `
      <div class="student-team-card ${isExpanded ? 'is-expanded' : ''}" id="student-team-card-${s.id}">
        <!-- Top Compact Summary Header -->
        <div class="student-card-header">
          <div class="student-card-lead-wrap">
            <img src="${photo}" alt="${escapeHTML(s.name)}" class="student-card-avatar" style="border-color:${s.avatar_color || '#6366f1'};">
            <div class="student-card-main-info">
              <h4>${escapeHTML(s.name)}</h4>
              <div class="student-card-email">${escapeHTML(s.email || '')}</div>
              <div class="student-card-roll">Reg: ${escapeHTML(s.roll_no)}</div>
            </div>
          </div>
          <span class="badge ${statusBadge}">${escapeHTML(statusText)}</span>
        </div>

        <!-- Badges Bar -->
        <div class="student-card-badges">
          <span class="badge badge-blue">${escapeHTML(s.department || 'Lab')}</span>
          <span class="badge badge-normal">${escapeHTML(s.year || 'Student')}${s.section ? ' • Sec ' + escapeHTML(s.section) : ''}</span>
          ${matchedProject ? `<span class="badge badge-primary">${escapeHTML(projectCode)}</span>` : ''}
        </div>

        <!-- Project Title & Domain -->
        <div class="student-card-project-title" title="${escapeHTML(projectTitle)}">
          <span>🚀</span>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(projectTitle)}</span>
        </div>

        <!-- Progress Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:2px;">
          <span style="color:var(--text-dim);">Milestone Progress</span>
          <strong style="color:var(--text-main);">${prog}%</strong>
        </div>
        <div class="student-card-progress-bar">
          <div class="student-card-progress-fill" style="width:${prog}%;"></div>
        </div>

        <!-- Compact Actions Row -->
        <div class="student-card-actions">
          <button type="button" class="btn btn-sm btn-secondary btn-toggle-expand" id="btn-expand-${s.id}" onclick="toggleStudentCardExpand(${s.id})" style="font-weight:600;">
            <span>${isExpanded ? '▲ Collapse Details' : '▼ View Full Details'}</span>
          </button>
          <div style="display:flex; gap:6px; align-items:center;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openStudentViewModal(${s.id})" title="View Complete Student Profile & Monthly Calendar">
              👤 Profile
            </button>
            ${matchedProject ? `
              <button type="button" class="btn btn-sm btn-secondary" onclick="openProjectDetail(${matchedProject.id})" title="Open Project Details & Gantt Schedule">
                📅 Project
              </button>
            ` : ''}
            ${matchedProject && (isAdmin || isOwner || isUserMemberOfProject(matchedProject)) ? `
              <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}) || ${JSON.stringify(matchedProject).replace(/"/g, '&quot;')})" style="background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; padding:4px 8px; font-size:11px; display:inline-flex; align-items:center; gap:3px;" title="Edit Your Team Project Details (Links, Logo, Members & Deliverables)">
                ✏️ Edit Project
              </button>
            ` : ''}
            ${(isAdmin || isOwner) ? `
              <button type="button" class="btn btn-sm btn-secondary" onclick="openStudentEditModal(${s.id})" title="Edit Profile Details">
                👤 Edit Profile
              </button>
            ` : ''}
            ${isAdmin ? `
              <button type="button" class="btn btn-sm btn-danger btn-student-delete" onclick="event.stopPropagation(); confirmDeleteStudent(${s.id}, '${escapeHTML((s.name || '').replace(/'/g, "\\'"))}')" title="Delete Student Record" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight:600; padding: 4px 8px; border-radius: 6px;">
                🗑️ Delete
              </button>
            ` : ''}
          </div>
        </div>

        <!-- EXPANDABLE FULL INFORMATION SECTION -->
        <div class="student-card-expanded-body">
          <!-- 1. Team & Innovator Section -->
          <div class="expanded-section">
            <h5>👥 Team & Innovator Information</h5>
            <div class="expanded-grid-2col" style="font-size:12px;">
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Team Lead / Student:</span>
                <strong style="color:var(--text-main);">${escapeHTML(s.name)}</strong> (${escapeHTML(s.role || 'Lead')})
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Faculty Guide / Mentor:</span>
                <strong style="color:#60a5fa;">${escapeHTML(s.guide || 'Not assigned')}</strong>
              </div>
              <div style="grid-column:1 / -1;">
                <span style="color:var(--text-dim); display:block; font-size:11px;">Team Members:</span>
                <span style="color:var(--text-main); font-weight:600;">${escapeHTML(teamMembersFormatted)}</span>
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Institution / College:</span>
                <span style="color:var(--text-muted);">${escapeHTML(s.college || 'Indra Ganesan College of Engineering')}</span>
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Phone / Contact:</span>
                <span style="color:var(--text-muted); font-family:var(--font-mono);">${escapeHTML(s.phone || 'Available in Lab Directory')}</span>
              </div>
            </div>
            ${skillsList.length > 0 ? `
              <div style="margin-top:10px;">
                <span style="color:var(--text-dim); display:block; font-size:11px; margin-bottom:4px;">Technical Skills:</span>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                  ${skillsList.map(sk => `<span class="card-tag-pill" style="font-size:10px; padding:2px 6px;">${escapeHTML(sk)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- 2. Project Milestone & Timeline Section -->
          <div class="expanded-section">
            <h5>📊 Project Milestone & Timeline (IST)</h5>
            <p style="font-size:12px; color:var(--text-dim); margin:0 0 10px 0; line-height:1.4;">${escapeHTML(projectDesc)}</p>
            
            <div class="expanded-grid-2col" style="font-size:12px;">
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Current Stage / Status:</span>
                <span class="badge ${statusBadge}" style="margin-top:2px;">${escapeHTML(projectStatus)}</span>
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Priority Level:</span>
                <span class="badge ${projectPriority === 'High' ? 'badge-high' : 'badge-normal'}" style="margin-top:2px;">${escapeHTML(projectPriority)} Priority</span>
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Start Date (IST):</span>
                <strong style="color:var(--text-main); font-family:var(--font-mono); font-size:11px;">${startIST}</strong>
              </div>
              <div>
                <span style="color:var(--text-dim); display:block; font-size:11px;">Deadline / Due Date (IST):</span>
                <strong style="color:#fbbf24; font-family:var(--font-mono); font-size:11px;">${dueIST}</strong>
              </div>
            </div>

            <!-- Tags Cloud -->
            <div style="margin-top:10px;">
              <span style="color:var(--text-dim); display:block; font-size:11px; margin-bottom:4px;">Technology Categorization:</span>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${tagsList.map(tag => `<span class="card-tag-pill" style="font-size:11px; padding:2px 7px; color:#93c5fd; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3);">${escapeHTML(tag.startsWith('#') ? tag : '#' + tag)}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- 3. Immediate Action / Blocker -->
          <div class="expanded-section" style="border-left:3px solid #f59e0b; background:rgba(245,158,11,0.05);">
            <h5 style="color:#fbbf24;">⚡ Sprint Action Item & Blocker</h5>
            <div style="font-size:12px; color:var(--text-main);">${escapeHTML(projectAction)}</div>
          </div>

          <!-- 4. Deliverables & Specifications -->
          <div class="expanded-section">
            <h5>📦 Deliverables & Specifications</h5>
            <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${escapeHTML(projectDeliverables)}</div>
          </div>

          <!-- 5. Media & Showcase Resources -->
          <div class="expanded-section">
            <h5>🔗 Showcase Media & Resources</h5>
            ${heroImage ? `
              <div style="margin-bottom:10px; border-radius:8px; overflow:hidden; border:1px solid var(--border-color); max-height:140px;">
                <img src="${heroImage}" alt="Project Photo" style="width:100%; height:140px; object-fit:cover;">
              </div>
            ` : ''}
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${githubLink ? `
                <a href="${githubLink}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-github" style="font-size:11px; padding:4px 10px;">
                  🐙 GitHub Codebase
                </a>
              ` : (matchedProject && (isAdmin || isUserStudent()) ? `
                <button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}), 'form-github')" style="font-size:11px; padding:4px 10px;">
                  ➕ Add GitHub
                </button>
              ` : `
                <span class="btn-media btn-media-disabled" style="opacity:0.5; font-size:11px; padding:4px 10px;">🐙 No GitHub Link</span>
              `)}

              ${reportLink ? `
                <a href="${reportLink}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-doc" style="font-size:11px; padding:4px 10px;">
                  📄 Technical Report
                </a>
              ` : (matchedProject && (isAdmin || isUserStudent()) ? `
                <button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}), 'form-doc-url')" style="font-size:11px; padding:4px 10px;">
                  📄 Add Report
                </button>
              ` : `
                <span class="btn-media btn-media-disabled" style="opacity:0.5; font-size:11px; padding:4px 10px;">📄 No Report Uploaded</span>
              `)}

              ${videoLink ? `
                <a href="${videoLink}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-youtube" style="font-size:11px; padding:4px 10px;">
                  🎥 Video Demo
                </a>
              ` : (matchedProject && (isAdmin || isUserStudent()) ? `
                <button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}), 'form-youtube')" style="font-size:11px; padding:4px 10px;">
                  🎥 Add Video
                </button>
              ` : '')}

              ${linkedinLink ? `
                <a href="${linkedinLink}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-linkedin" style="font-size:11px; padding:4px 10px;">
                  💼 LinkedIn Showcase
                </a>
              ` : (matchedProject && (isAdmin || isUserStudent()) ? `
                <button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}), 'form-linkedin')" style="font-size:11px; padding:4px 10px;">
                  💼 Add LinkedIn
                </button>
              ` : '')}
            </div>
          </div>

          <!-- Bottom Action Footer in Expanded View -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid var(--border-color); flex-wrap:wrap; gap:8px;">
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              ${matchedProject ? `
                <button type="button" class="btn btn-sm btn-primary" onclick="openProjectDetail(${matchedProject.id})">
                  📅 Open Project Details & Discussions
                </button>
              ` : `
                <button type="button" class="btn btn-sm btn-primary" onclick="openStudentViewModal(${s.id})">
                  👁️ View Complete Student Profile
                </button>
              `}
              ${matchedProject && (isAdmin || isOwner || isUserMemberOfProject(matchedProject)) ? `
                <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openProjectModalForEdit(state.projects.find(p=>p.id===${matchedProject.id}) || ${JSON.stringify(matchedProject).replace(/"/g, '&quot;')})" style="background:var(--primary, #f59e0b); color:#000000; font-weight:700; border:none; padding:5px 10px; font-size:12px; display:inline-flex; align-items:center; gap:4px;" title="Edit Your Team Project Details">
                  ✏️ Edit Project
                </button>
              ` : ''}
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="toggleStudentCardExpand(${s.id})">
              ▲ Collapse
            </button>
          </div>
        </div>
      </div>
    `;
  });

  DOM.studentsGridRoot.innerHTML = cardsHtml;
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

  const matchedProject = getStudentMatchedProject(s);
  const prog = getStudentProgress(s);

  const teamEl = document.getElementById('view-student-team');
  if (teamEl) {
    if (matchedProject) {
      teamEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span><strong>${escapeHTML(matchedProject.project_code)}</strong>: ${escapeHTML(matchedProject.title)}</span>
        <span class="badge badge-primary" style="font-size:12px;">${prog}% Progress</span>
      </div>`;
    } else {
      teamEl.textContent = s.assigned_project || s.project_title || 'No team/project assigned yet.';
    }
  }

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

  const isOwner = (s.email && s.email.toLowerCase() === currentEmail) || (s.name && s.name.toLowerCase() === currentName);
  const canEditProject = matchedProject && (isAdmin || isOwner || isUserMemberOfProject(matchedProject));

  const btnViewProj = document.getElementById('btn-student-view-project');
  if (btnViewProj) {
    if (matchedProject) {
      btnViewProj.style.display = 'inline-block';
      btnViewProj.onclick = () => {
        closeModal(document.getElementById('student-view-modal'));
        openProjectDetail(matchedProject.id);
      };
    } else {
      btnViewProj.style.display = 'none';
    }
  }

  const btnEditProjFromView = document.getElementById('btn-student-edit-project-from-view');
  if (btnEditProjFromView) {
    if (canEditProject) {
      btnEditProjFromView.style.display = 'inline-block';
      btnEditProjFromView.onclick = () => {
        closeModal(document.getElementById('student-view-modal'));
        openProjectModalForEdit(state.projects.find(p => p.id === matchedProject.id) || matchedProject);
      };
    } else {
      btnEditProjFromView.style.display = 'none';
    }
  }

  const btnEditFromView = document.getElementById('btn-admin-edit-from-view');
  if (btnEditFromView) {
    if (isAdmin || isOwner) {
      btnEditFromView.style.display = 'inline-block';
      btnEditFromView.innerHTML = '✏️ Edit Profile';
      btnEditFromView.onclick = () => {
        closeModal(document.getElementById('student-view-modal'));
        openStudentEditModal(s.id);
      };
    } else {
      btnEditFromView.style.display = 'none';
    }
  }

  const btnDeleteFromView = document.getElementById('btn-admin-delete-from-view');
  if (btnDeleteFromView) {
    if (isAdmin) {
      btnDeleteFromView.style.display = 'inline-block';
      btnDeleteFromView.onclick = () => {
        confirmDeleteStudent(s.id, s.name);
      };
    } else {
      btnDeleteFromView.style.display = 'none';
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
  const isAdmin = isUserAdmin();
  const isStudent = isUserStudent();
  if (!isAdmin && !isStudent) {
    showToast('Only Admins and Students can edit profiles', 'error');
    return;
  }
  const s = state.students.find(st => Number(st.id) === Number(studentId));
  if (!s) return;

  const userEmail = (state.currentUser && state.currentUser.email || '').toLowerCase();
  const isSelf = (state.currentUser?.student_id && Number(state.currentUser.student_id) === Number(s.id)) ||
                 (s.user_id && Number(s.user_id) === Number(state.currentUser?.id)) ||
                 (s.email && s.email.toLowerCase() === userEmail);

  if (!isAdmin && !isSelf) {
    showToast('You can only edit your own student profile', 'error');
    return;
  }

  document.getElementById('edit-student-id').value = s.id;
  
  const nameEl = document.getElementById('edit-student-name');
  if (nameEl) {
    nameEl.value = s.name || '';
    nameEl.disabled = !isAdmin;
  }

  const rollEl = document.getElementById('edit-student-roll');
  if (rollEl) {
    rollEl.value = s.roll_no || '';
    rollEl.disabled = !isAdmin;
  }

  document.getElementById('edit-student-email').value = s.email || '';
  document.getElementById('edit-student-phone').value = s.phone || '';
  
  const deptEl = document.getElementById('edit-student-dept');
  if (deptEl) {
    deptEl.value = s.department || '';
    deptEl.disabled = !isAdmin;
  }

  const yearEl = document.getElementById('edit-student-year');
  if (yearEl) {
    yearEl.value = s.year || '';
    yearEl.disabled = !isAdmin;
  }

  const secEl = document.getElementById('edit-student-section');
  if (secEl) {
    secEl.value = s.section || '';
    secEl.disabled = !isAdmin;
  }

  const colEl = document.getElementById('edit-student-college');
  if (colEl) {
    colEl.value = s.college || 'Indra Ganesan College of Engineering';
    colEl.disabled = !isAdmin;
  }

  const roleEl = document.getElementById('edit-student-role');
  if (roleEl) {
    roleEl.value = s.role || '';
    roleEl.disabled = !isAdmin;
  }

  document.getElementById('edit-student-photo').value = s.photo_url || '';
  
  const statusEl = document.getElementById('edit-student-status');
  if (statusEl) {
    statusEl.value = s.status || 'Active';
    statusEl.disabled = !isAdmin;
  }

  document.getElementById('edit-student-skills').value = s.skills || '';
  document.getElementById('edit-student-github').value = s.github_url || '';
  document.getElementById('edit-student-linkedin').value = s.linkedin_url || '';
  
  const teamEl = document.getElementById('edit-student-team');
  if (teamEl) {
    teamEl.value = s.assigned_project || '';
    teamEl.disabled = !isAdmin;
  }

  document.getElementById('edit-student-bio').value = s.bio || '';

  openModal(document.getElementById('student-edit-modal'));
}

async function handleStudentEditFormSubmit(e) {
  e.preventDefault();
  const isAdmin = isUserAdmin();
  const isStudent = isUserStudent();
  if (!isAdmin && !isStudent) {
    showToast('Access restricted', 'error');
    return;
  }

  const studentId = document.getElementById('edit-student-id').value;
  const name = document.getElementById('edit-student-name').value.trim();
  const roll_no = document.getElementById('edit-student-roll').value.trim();

  if (isAdmin && (!name || !roll_no)) {
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

// ----------------------------------------------------
// STUDENT DELETION (ADMIN ONLY)
// ----------------------------------------------------
let pendingDeleteStudentId = null;

function confirmDeleteStudent(studentId, studentName) {
  if (!isUserAdmin()) {
    showToast('Only administrators can delete student records.', 'error');
    return;
  }
  const s = state.students.find(st => Number(st.id) === Number(studentId));
  const name = s ? s.name : (studentName || 'Student');
  pendingDeleteStudentId = Number(studentId);

  const nameEl = document.getElementById('delete-student-target-name');
  if (nameEl) nameEl.textContent = name;

  const promptEl = document.getElementById('delete-student-prompt');
  if (promptEl) {
    promptEl.innerHTML = `Delete <strong style="color: #f87171;">${escapeHTML(name)}</strong>? This will permanently remove their record, including their profile, project assignments, and progress data. This can't be undone.`;
  }

  const confirmBtn = document.getElementById('btn-confirm-delete-student');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = '🗑️ Confirm Delete';
  }

  openModal(document.getElementById('student-delete-modal'));
}

async function executeStudentDelete() {
  if (!pendingDeleteStudentId) return;
  if (!isUserAdmin()) {
    showToast('Only administrators can delete student records.', 'error');
    return;
  }

  const confirmBtn = document.getElementById('btn-confirm-delete-student');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
  }

  const s = state.students.find(st => Number(st.id) === pendingDeleteStudentId);
  const studentName = s ? s.name : 'Student';
  const targetId = pendingDeleteStudentId;

  try {
    const res = await authFetch(`/api/students/${targetId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete student record');
    }

    // 1. Remove student from state
    state.students = state.students.filter(st => Number(st.id) !== targetId);
    state.expandedStudentCards.delete(targetId);

    // 2. Unlink from local state.projects if present
    state.projects.forEach(p => {
      if (Array.isArray(p.team_members)) {
        p.team_members = p.team_members.filter(m => {
          if (typeof m === 'object' && m !== null) {
            return (m.name || '').toLowerCase() !== studentName.toLowerCase();
          }
          return String(m).toLowerCase() !== studentName.toLowerCase();
        });
      }
    });

    // 3. Close modals
    closeModal(document.getElementById('student-delete-modal'));
    closeModal(document.getElementById('student-view-modal'));
    closeModal(document.getElementById('student-edit-modal'));

    // 4. Update UI
    renderStudents();
    updateStatsSummary();

    showToast(`Student ${studentName} removed successfully`, 'success');
  } catch (err) {
    console.error('Error deleting student:', err);
    showToast(`Error deleting student: ${err.message}`, 'error');
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '🗑️ Confirm Delete';
    }
    pendingDeleteStudentId = null;
  }
}

function populateBomProjectSelect() {
  if (!DOM.bomProjectCodeSelect) return;
  DOM.bomProjectCodeSelect.innerHTML = state.projects.map(p => `
    <option value="${p.project_code}">${p.project_code} - ${escapeHTML(p.title)}</option>
  `).join('');
}

async function updateStatsSummary() {
  const stats = await fetchServerStats();

  const fallbackTotal = (state.allProjectsCache && state.allProjectsCache.length > 0) ? state.allProjectsCache.length : state.projects.length;
  const targetDataset = (state.allProjectsCache && state.allProjectsCache.length > 0) ? state.allProjectsCache : state.projects;
  const fallbackActive = targetDataset.filter(p => p.status !== 'completed').length;
  const fallbackCompleted = targetDataset.filter(p => p.status === 'completed').length;
  const fallbackInQueue = targetDataset.filter(p => p.status === 'in_queue').length;
  const fallbackInProgress = targetDataset.filter(p => p.status === 'in_progress').length;
  const fallbackTesting = targetDataset.filter(p => p.status === 'testing').length;

  const total = stats ? stats.total : fallbackTotal;
  const active = stats ? stats.active : fallbackActive;
  const completed = stats ? stats.completed : fallbackCompleted;
  const inQueue = stats && stats.breakdown ? stats.breakdown.in_queue : fallbackInQueue;
  const inProgress = stats && stats.breakdown ? stats.breakdown.in_progress : fallbackInProgress;
  const testing = stats && stats.breakdown ? stats.breakdown.testing : fallbackTesting;
  const activeRatio = stats ? stats.active_ratio : `${active} / ${total}`;
  const activePct = stats ? stats.active_percentage : (total > 0 ? Math.round((active / total) * 100) : 0);
  const domainsCount = stats ? stats.domains_count : new Set(targetDataset.map(p => p.domain)).size;
  const studentsCount = stats ? stats.students_count : state.students.length;

  // 1. Top Navigation Summary Pill (#stats-summary-pill)
  if (DOM.statsSummaryPill) {
    DOM.statsSummaryPill.textContent = `Total Projects: ${total} • ${domainsCount} Domains • ${studentsCount} Students`;
    DOM.statsSummaryPill.title = `Total: ${total} Projects across ${domainsCount} Domains | In Queue: ${inQueue} | In Progress: ${inProgress} | Testing: ${testing} | Completed: ${completed}`;
  }

  // 2. Executive Management Showcase KPI Card
  const execActiveNum = document.getElementById('exec-active-projects-num');
  const execActivePct = document.getElementById('exec-active-projects-pct');
  const execActiveBar = document.getElementById('exec-active-projects-bar');
  const execActiveSub = document.getElementById('exec-active-projects-sub');

  if (execActiveNum) execActiveNum.textContent = `${total} Projects`;
  if (execActivePct) execActivePct.textContent = `${total} Total`;
  if (execActiveBar) execActiveBar.style.width = `100%`;
  if (execActiveSub) execActiveSub.textContent = `Queue: ${inQueue} • Progress: ${inProgress} • Testing: ${testing} • Done: ${completed}`;

  // 3. Update Student Count in Showcase
  const execStudentSub = document.getElementById('exec-student-sub');
  if (DOM.execStudentCount) DOM.execStudentCount.textContent = `${studentsCount} Engineers`;
  if (execStudentSub) execStudentSub.textContent = `Across ${domainsCount} Engineering Domains`;
}

// ----------------------------------------------------
// DRAG & DROP HANDLERS (KANBAN - ADMIN ONLY)
// ----------------------------------------------------
function handleDragStart(e) {
  if (!isUserAdmin()) {
    e.preventDefault();
    showToast('Stage changes are restricted to Administrator.', 'warning');
    return false;
  }
  state.draggedCardId = Number(e.target.getAttribute('data-id'));
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', state.draggedCardId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.col-cards-wrapper').forEach(w => w.classList.remove('drag-over'));
}

function handleDragOver(e) {
  if (!isUserAdmin()) return;
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e, targetStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  if (!isUserAdmin()) {
    showToast('Access denied: Only administrator can change project stage.', 'error');
    return;
  }

  const projectId = state.draggedCardId;
  if (!projectId) return;

  const project = state.projects.find(p => p.id === projectId);
  if (project && project.status !== targetStatus) {
    const oldStatus = project.status;
    const confirmMove = confirm(`Move project "${project.title}" (${project.project_code}) from ${formatStatus(oldStatus)} to ${formatStatus(targetStatus)} stage?`);
    if (!confirmMove) {
      return;
    }

    let newProgress = project.progress;
    if (targetStatus === 'completed') newProgress = 100;
    else if (targetStatus === 'in_queue') newProgress = Math.min(project.progress || 0, 20);
    else if (targetStatus === 'in_progress' && (project.progress || 0) < 30) newProgress = 50;
    else if (targetStatus === 'testing' && (project.progress || 0) < 70) newProgress = 85;

    try {
      const res = await authFetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, progress: newProgress })
      });
      if (res.ok) {
        showToast(`Moved ${project.project_code} to ${formatStatus(targetStatus)}`);
        project.status = targetStatus;
        project.progress = newProgress;
        await Promise.all([fetchProjects(), fetchNotifications()]);
        renderAllViews();
        updateStatsSummary();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.error || 'Failed to update stage on server', 'error');
        renderAllViews();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status on server', 'error');
      renderAllViews();
    }
  }
}

// ----------------------------------------------------
// PROJECT DETAILS & DISCUSSION MODAL
// ----------------------------------------------------
async function openProjectDetail(projectId) {
  state.activeProjectId = projectId;
  try {
    const res = await authFetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.error || (res.status === 404 ? 'This project is not currently available.' : 'Failed to load project details.');
      showToast(msg, 'warning');
      if (DOM.detailModal) closeModal(DOM.detailModal);
      return;
    }
    const project = await res.json();

    document.getElementById('detail-code').textContent = project.project_code || 'IGRID-PROJ';
    document.getElementById('detail-domain').textContent = project.domain || 'General';
    
    // Priority Badge (Fix "undefined Priority" bug)
    const priorityVal = project.priority || 'Normal';
    const priorityBadge = document.getElementById('detail-priority');
    priorityBadge.textContent = `${priorityVal} Priority`;
    priorityBadge.className = `badge ${priorityVal === 'High' ? 'badge-high' : (priorityVal === 'Normal' ? 'badge-normal' : 'badge-low')}`;
    
    // Visibility / Active Status Toggle (Admin Only)
    const activeToggleContainer = document.getElementById('detail-active-toggle-container');
    if (activeToggleContainer) {
      activeToggleContainer.innerHTML = isUserAdmin() ? renderProjectActiveToggleHTML(project.id, project.is_visible !== undefined ? project.is_visible : project.is_active) : '';
    }
    
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

    // Status & Timeline in IST
    document.getElementById('detail-status').textContent = formatStatus(project.status || 'in_progress');
    
    const startDateEl = document.getElementById('detail-start-date');
    const dueDateEl = document.getElementById('detail-due-date');
    const btnQuickEditStart = document.getElementById('btn-quick-edit-start-date');
    const btnQuickEditDue = document.getElementById('btn-quick-edit-due-date');

    const isAdminUser = isUserAdmin();

    if (startDateEl) startDateEl.textContent = project.start_date ? formatISTDateTime(project.start_date) : 'Not specified';
    if (dueDateEl) dueDateEl.textContent = project.due_date ? formatISTDateTime(project.due_date) : 'Not specified';

    if (btnQuickEditStart) {
      btnQuickEditStart.style.display = isAdminUser ? 'inline-block' : 'none';
      btnQuickEditStart.onclick = () => openAdminDateEditModal(project.id);
    }
    if (btnQuickEditDue) {
      btnQuickEditDue.style.display = isAdminUser ? 'inline-block' : 'none';
      btnQuickEditDue.onclick = () => openAdminDateEditModal(project.id);
    }

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
    const gh = (project.github_repo || project.githubLink || project.github_url || '').trim();
    const doc = (project.doc_url || project.techReportUrl || project.technical_report || project.docUrl || '').trim();
    const yt = (project.youtube_url || project.videoDemoUrl || project.youtubeUrl || '').trim();
    const li = (project.linkedin_url || project.linkedinPostUrl || project.linkedin || project.linkedinUrl || '').trim();
    const isViewer = isUserViewer();
    const isAdmin = isUserAdmin();
    const isStudent = isUserStudent();
    const isPublic = isUserPublic();
    const canEditLinks = isAdmin || (isStudent && isUserMemberOfProject(project));

    if (gh) {
      mediaList.push(`<a href="${gh}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-github" title="${escapeHTML(gh)}">🐙 GitHub Repo</a>`);
    } else if (canEditLinks) {
      mediaList.push(`<button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); state.openedFromDetailModal = true; state.detailModalProjectId = ${project.id}; closeModal(DOM.detailModal); openProjectModalForEdit(state.projects.find(p=>p.id===${project.id}), 'form-github')" title="Add your GitHub repository link">➕ Add GitHub Repo</button>`);
    } else {
      mediaList.push(`<span class="btn-media btn-media-disabled" style="opacity: 0.5; cursor: default;" title="No GitHub repository link added">🐙 No GitHub Link</span>`);
    }

    if (doc) {
      mediaList.push(`<a href="${doc}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-doc" title="${escapeHTML(doc)}">📄 View Technical Report</a>`);
    } else if (canEditLinks) {
      mediaList.push(`<button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); state.openedFromDetailModal = true; state.detailModalProjectId = ${project.id}; closeModal(DOM.detailModal); openProjectModalForEdit(state.projects.find(p=>p.id===${project.id}), 'form-doc-url')" title="Add your Technical Report Google Drive / Doc link">📄 Add Technical Report</button>`);
    } else {
      mediaList.push(`<span class="btn-media btn-media-disabled" style="opacity: 0.5; cursor: default;" title="No technical report link added yet">📄 No report uploaded yet</span>`);
    }

    if (yt) {
      mediaList.push(`<a href="${yt}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-youtube" title="${escapeHTML(yt)}">🎥 Video Demo</a>`);
    } else if (canEditLinks) {
      mediaList.push(`<button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); state.openedFromDetailModal = true; state.detailModalProjectId = ${project.id}; closeModal(DOM.detailModal); openProjectModalForEdit(state.projects.find(p=>p.id===${project.id}), 'form-youtube')" title="Add YouTube demo video link">🎥 Add Video Demo</button>`);
    }

    if (li) {
      mediaList.push(`<a href="${li}" target="_blank" rel="noopener noreferrer" class="btn-media btn-media-linkedin" title="${escapeHTML(li)}">💼 LinkedIn Post</a>`);
    } else if (canEditLinks) {
      mediaList.push(`<button type="button" class="btn-media btn-media-add" onclick="event.stopPropagation(); state.openedFromDetailModal = true; state.detailModalProjectId = ${project.id}; closeModal(DOM.detailModal); openProjectModalForEdit(state.projects.find(p=>p.id===${project.id}), 'form-linkedin')" title="Add LinkedIn showcase post link">💼 Add LinkedIn Post</button>`);
    }
    mediaBar.innerHTML = mediaList.join('');

    const manageLinksBtn = document.getElementById('btn-media-manage-links');
    if (manageLinksBtn) {
      if (canEditLinks) {
        manageLinksBtn.style.display = 'inline-flex';
        manageLinksBtn.onclick = (e) => {
          e.stopPropagation();
          state.openedFromDetailModal = true;
          state.detailModalProjectId = project.id;
          closeModal(DOM.detailModal);
          openProjectModalForEdit(project);
        };
      } else {
        manageLinksBtn.style.display = 'none';
      }
    }

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
            <tr>
              <th>Part Name</th>
              <th>Quantity</th>
              <th>Est. Unit Cost (₹)</th>
              <th>Total Cost (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${project.boms.map(b => `
              <tr>
                <td><strong>${escapeHTML(b.item_name)}</strong></td>
                <td>${b.quantity || 1}</td>
                <td>₹${Number(b.estimated_cost || 0).toLocaleString()}</td>
                <td>₹${((b.quantity || 1) * Number(b.estimated_cost || 0)).toLocaleString()}</td>
                <td><span class="badge ${b.status === 'Approved' ? 'badge-approved' : (b.status === 'Pending' ? 'badge-pending' : 'badge-rejected')}">${b.status || 'Pending'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      bomWrapper.innerHTML = `
        <div style="font-size: 13px; color: var(--text-dim); text-align: center; padding: 12px 0;">
          No BOM items logged for this project yet.
        </div>
      `;
    }

    // Render Project Tasks in Timeline Section
    state.activeProjectTasks = [];
    if (!isViewer && !isPublic) {
      try {
        const tasksRes = await authFetch(`/api/projects/${project.id}/tasks`);
        if (tasksRes.ok) {
          state.activeProjectTasks = await tasksRes.json();
        }
      } catch(e) {
        state.activeProjectTasks = [];
      }
    }
    renderProjectGanttTimeline(project, state.activeProjectTasks);

    renderProjectComments(project.activities || []);

    // Role-based visibility for Action Buttons (Edit Project, Delete Project, Quick Add BOM, Add Task)
    const addTaskBtn = document.getElementById('btn-add-project-task');

    // Hide internal blocker / immediate action box for viewers
    const actionBox = document.querySelector('.detail-action-box');
    if (actionBox) actionBox.style.display = (isViewer || isPublic) ? 'none' : 'flex';

    // Hide comment submission form for viewers
    const addCommentSection = document.querySelector('.add-comment-section') || DOM.addCommentForm;
    if (addCommentSection) addCommentSection.style.display = (isViewer || isPublic) ? 'none' : 'block';

    if (isViewer || isPublic) {
      if (DOM.btnEditCurrentProject) DOM.btnEditCurrentProject.style.display = 'none';
      if (DOM.btnDeleteProject) DOM.btnDeleteProject.style.display = 'none';
      if (DOM.btnQuickAddBom) DOM.btnQuickAddBom.style.display = 'none';
      if (DOM.btnQuickEditStart) DOM.btnQuickEditStart.style.display = 'none';
      if (DOM.btnQuickEditDue) DOM.btnQuickEditDue.style.display = 'none';
      if (addTaskBtn) addTaskBtn.style.display = 'none';
    } else if (isAdmin) {
      if (DOM.btnEditCurrentProject) {
        DOM.btnEditCurrentProject.style.display = 'inline-flex';
        DOM.btnEditCurrentProject.innerHTML = '✏️ Edit';
      }
      if (DOM.btnDeleteProject) DOM.btnDeleteProject.style.display = 'inline-flex';
      if (DOM.btnQuickAddBom) DOM.btnQuickAddBom.style.display = 'inline-flex';
      if (addTaskBtn) addTaskBtn.style.display = 'inline-flex';
    } else if (isStudent) {
      const isMember = isUserMemberOfProject(project);
      if (DOM.btnEditCurrentProject) {
        DOM.btnEditCurrentProject.style.display = isMember ? 'inline-flex' : 'none';
        DOM.btnEditCurrentProject.innerHTML = '✏️ Edit';
      }
      if (DOM.btnDeleteProject) DOM.btnDeleteProject.style.display = 'none';
      if (DOM.btnQuickAddBom) DOM.btnQuickAddBom.style.display = isMember ? 'inline-flex' : 'none';
      if (addTaskBtn) addTaskBtn.style.display = isMember ? 'inline-flex' : 'none';
    }

    openModal(DOM.detailModal);
  } catch (err) {
    console.error('Error in openProjectDetail:', err);
    showToast('Failed to open project details', 'error');
  }
}

// ----------------------------------------------------
// PROJECT-SPECIFIC GANTT TIMELINE LOGIC
// ----------------------------------------------------

let selectedTaskIdForInfo = null;

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function renderProjectGanttTimeline(project, tasks = []) {
  const container = document.getElementById('detail-gantt-container');
  const summaryEl = document.getElementById('detail-timeline-summary');
  if (!container) return;

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
  const totalYearDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);

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
      Total Tasks: <span style="color:#10b981; font-weight:700;">${tasks.length} item${tasks.length === 1 ? '' : 's'}</span>
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
        <td class="ref-gantt-td-taskname" style="background:#f8fafc !important; color:#64748b; font-style:italic;">No Tasks</td>
        <td colspan="12" class="ref-gantt-td-grid">
          <div class="ref-grid-bg">${monthGridBgHTML}</div>
          <div style="padding:20px; text-align:center; color:#64748b; font-size:13px; font-weight:500;">
            No timeline tasks added yet.
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

      const isOverflowLeft = tStart < startOfYear;
      const isOverflowRight = tEnd > endOfYear;

      const clampedStart = new Date(Math.max(startOfYear.getTime(), Math.min(endOfYear.getTime(), tStart.getTime())));
      const clampedEnd = new Date(Math.max(startOfYear.getTime(), Math.min(endOfYear.getTime(), tEnd.getTime())));

      const startDayOfYear = Math.max(1, Math.round((clampedStart - startOfYear) / (1000 * 60 * 60 * 24)) + 1);
      const endDayOfYear = Math.max(startDayOfYear, Math.round((clampedEnd - startOfYear) / (1000 * 60 * 60 * 24)) + 1);

      const leftPct = Math.max(0, Math.min(97.5, ((startDayOfYear - 1) / totalYearDays) * 100));
      const rawWidthPct = ((endDayOfYear - startDayOfYear + 1) / totalYearDays) * 100;
      const widthPct = Math.max(2.5, Math.min(100 - leftPct, rawWidthPct));

      const durationDays = Math.max(1, Math.round((tEnd - tStart) / (1000 * 60 * 60 * 24)) + 1);
      const statusClass = `bar-${task.status || 'in_progress'}`;
      const dateLabel = `${formatDateShort(task.start_date)} → ${formatDateShort(task.end_date)}`;

      const leftMarker = isOverflowLeft
        ? `<span class="ref-bar-overflow-left" title="Starts before Jan 1, ${currentYear}">◀</span>`
        : `<span class="ref-bar-marker">✓</span>`;

      const rightMarker = isOverflowRight
        ? `<span class="ref-bar-overflow-right" title="Extends beyond Dec 31, ${currentYear}">▶</span>`
        : `<span class="ref-bar-marker">✓</span>`;

      const richTooltip = `${task.task_name} | ${task.priority || 'Normal'} Priority | ${task.status || 'In Progress'}\nFrom: ${formatDateShort(task.start_date)} → To: ${formatDateShort(task.end_date)} (${durationDays} days)${task.assigned_member ? `\nAssignee: ${task.assigned_member}` : ''}${isOverflowLeft ? ' [Starts before Jan 1]' : ''}${isOverflowRight ? ' [Extends beyond Dec 31]' : ''}`;

      taskRowsHTML += `
        <tr data-task-id="${task.id}">
          <td class="ref-gantt-td-taskname" title="${escapeHTML(richTooltip)}">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; color:#0f172a;" title="${escapeHTML(task.task_name)}">${escapeHTML(task.task_name)}</span>
              <span style="font-size:10px; padding:2px 4px; border-radius:4px; background:rgba(0,0,0,0.06); font-weight:600; flex-shrink:0;">${escapeHTML(task.priority || 'Normal')}</span>
            </div>
          </td>
          <td colspan="12" class="ref-gantt-td-grid">
            <div class="ref-grid-bg">${monthGridBgHTML}</div>
            ${todayLeftPct !== null ? `<div class="ref-today-line" style="left:${todayLeftPct}%;" title="Today"></div>` : ''}
            <div class="ref-task-bar ${statusClass}" 
                 style="left: ${leftPct.toFixed(2)}%; width: ${widthPct.toFixed(2)}%;"
                 title="${escapeHTML(richTooltip)}">
              ${leftMarker}
              <span class="ref-bar-label">${escapeHTML(task.task_name)} (${dateLabel})</span>
              ${rightMarker}
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
    const res = await authFetch(`/api/projects/${state.activeProjectId}/comments`, {
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
function normalizeUrl(url) {
  if (!url) return '';
  url = String(url).trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return 'https://' + url;
  }
  return url;
}

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

function renderTeamMembersChips() {
  const container = document.getElementById('form-team-members-chips');
  if (!container) return;
  const isAdmin = isUserAdmin();
  const isStudent = isUserStudent();
  const canEditMembers = isAdmin || isStudent;

  if (!state.currentEditingTeamMembers || state.currentEditingTeamMembers.length === 0) {
    container.innerHTML = '<span style="font-size:12px; color:var(--text-dim); font-style:italic;">No team members added yet.</span>';
    return;
  }

  container.innerHTML = state.currentEditingTeamMembers.map((name, idx) => `
    <span class="card-tag-pill" style="display:inline-flex; align-items:center; gap:6px; background:rgba(99,102,241,0.18); border:1px solid rgba(99,102,241,0.35); color:#c7d2fe; padding:4px 10px; border-radius:16px; font-size:12px; font-weight:600;">
      <span>👤 ${escapeHTML(name)}</span>
      ${canEditMembers ? `<button type="button" onclick="event.stopPropagation(); removeTeamMemberChip(${idx})" style="background:none; border:none; color:#f87171; cursor:pointer; font-weight:700; font-size:14px; line-height:1; padding:0 2px; margin-left:4px;" title="Remove ${escapeHTML(name)}">&times;</button>` : ''}
    </span>
  `).join('');
}

function checkProjectFormDirty() {
  const isAdmin = isUserAdmin();
  const saveBtn = document.getElementById('save-project-btn');
  if (!saveBtn) return;
  if (isAdmin) {
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    return;
  }
  if (!state.initialEditingProjectValues) {
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    return;
  }

  const currentValues = {
    github: (document.getElementById('form-github')?.value || '').trim(),
    youtube: (document.getElementById('form-youtube')?.value || '').trim(),
    doc: (document.getElementById('form-doc-url')?.value || '').trim(),
    linkedin: (document.getElementById('form-linkedin')?.value || '').trim(),
    image: (document.getElementById('form-image-url')?.value || '').trim(),
    team_name: (document.getElementById('form-team-name')?.value || '').trim(),
    team_lead: (document.getElementById('form-team-lead')?.value || '').trim(),
    team_logo: (document.getElementById('form-team-lead-photo')?.value || '').trim(),
    deliverables: (document.getElementById('form-deliverables')?.value || '').trim(),
    team_members: JSON.stringify(state.currentEditingTeamMembers || [])
  };

  const initial = state.initialEditingProjectValues;
  const isDirty = (
    currentValues.github !== initial.github ||
    currentValues.youtube !== initial.youtube ||
    currentValues.doc !== initial.doc ||
    currentValues.linkedin !== initial.linkedin ||
    currentValues.image !== initial.image ||
    currentValues.team_name !== initial.team_name ||
    currentValues.team_lead !== initial.team_lead ||
    currentValues.team_logo !== initial.team_logo ||
    currentValues.deliverables !== initial.deliverables ||
    currentValues.team_members !== initial.team_members
  );

  saveBtn.disabled = !isDirty;
  saveBtn.style.opacity = isDirty ? '1' : '0.5';
  saveBtn.title = isDirty ? 'Save updated project details' : 'No changes detected to save';
}

function addTeamMemberChip(rawName) {
  if (!rawName) return;
  const names = String(rawName).split(',').map(n => n.trim()).filter(Boolean);
  if (!state.currentEditingTeamMembers) state.currentEditingTeamMembers = [];
  
  names.forEach(name => {
    if (name && !state.currentEditingTeamMembers.includes(name)) {
      state.currentEditingTeamMembers.push(name);
    }
  });

  renderTeamMembersChips();
  const input = document.getElementById('form-team-members-input');
  if (input) input.value = '';
  checkProjectFormDirty();
}

function removeTeamMemberChip(idx) {
  if (state.currentEditingTeamMembers && idx >= 0 && idx < state.currentEditingTeamMembers.length) {
    state.currentEditingTeamMembers.splice(idx, 1);
    renderTeamMembersChips();
    checkProjectFormDirty();
  }
}

function initTeamMembersInputListeners() {
  const input = document.getElementById('form-team-members-input');
  const addBtn = document.getElementById('btn-add-team-member');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        addTeamMemberChip(input.value);
      }
    });

    input.addEventListener('input', () => {
      if (input.value.includes(',')) {
        addTeamMemberChip(input.value);
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (input) addTeamMemberChip(input.value);
    });
  }

  // Bind dirty checking to student editable inputs
  const editableIds = ['form-github', 'form-youtube', 'form-doc-url', 'form-linkedin', 'form-image-url', 'form-team-name', 'form-team-lead', 'form-team-lead-photo', 'form-deliverables'];
  editableIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => checkProjectFormDirty());
      el.addEventListener('change', () => checkProjectFormDirty());
    }
  });
}

function openProjectModalForCreate(defaultStatus = 'in_progress') {
  if (isUserViewer() || isUserPublic()) {
    showToast('Access denied: Public Showcase Viewers have read-only permissions.', 'error');
    return;
  }
  const studentHintEl = document.getElementById('student-edit-hint');
  if (studentHintEl) studentHintEl.style.display = 'none';

  // Show all admin fields and restore required attributes
  document.querySelectorAll('.admin-only-form-field').forEach(el => el.style.display = '');
  ['form-code', 'form-title', 'form-domain', 'form-priority', 'form-status', 'form-start-date', 'form-due-date', 'form-action-item'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.required = true;
      el.disabled = false;
    }
  });

  const descEl = document.getElementById('form-description');
  if (descEl) descEl.disabled = false;
  const tagsEl = document.getElementById('form-tags');
  if (tagsEl) tagsEl.disabled = false;
  const progressEl = document.getElementById('form-progress');
  if (progressEl) progressEl.disabled = false;
  const teamNameEl = document.getElementById('form-team-name');
  if (teamNameEl) teamNameEl.disabled = false;
  const teamLeadEl = document.getElementById('form-team-lead');
  if (teamLeadEl) teamLeadEl.disabled = false;

  DOM.modalProjectTitle.textContent = '🚀 Create Innovation Project / Task';
  DOM.projectForm.reset();
  document.getElementById('form-project-id').value = '';
  document.getElementById('form-status').value = defaultStatus;
  
  state.currentEditingTeamMembers = [];
  renderTeamMembersChips();
  const tmInput = document.getElementById('form-team-members-input');
  if (tmInput) {
    tmInput.value = '';
    tmInput.disabled = false;
  }
  const tmAddBtn = document.getElementById('btn-add-team-member');
  if (tmAddBtn) tmAddBtn.disabled = false;

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const startDateInput = document.getElementById('form-start-date');
  if (startDateInput) startDateInput.value = today.toISOString().split('T')[0];
  
  const dueDateInput = document.getElementById('form-due-date');
  if (dueDateInput) dueDateInput.value = nextMonth.toISOString().split('T')[0];

  const saveBtn = document.getElementById('save-project-btn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.title = 'Create project';
    saveBtn.innerHTML = '💾 Save Project Details';
  }
  state.initialEditingProjectValues = null;

  ['preview-image-url', 'preview-github', 'preview-youtube', 'preview-doc-url', 'preview-linkedin'].forEach(id => {
    updateLinkPreviewIcon(id, '');
  });

  openModal(DOM.projectModal);
}

function openProjectModalForEdit(project, focusField = null) {
  if (!project) return;
  if (isUserViewer() || isUserPublic()) {
    showToast('Access denied: Public Showcase Viewers have read-only permissions.', 'error');
    return;
  }

  const isAdmin = isUserAdmin();
  const isStudent = isUserStudent();

  if (isStudent && !isAdmin) {
    if (!isUserMemberOfProject(project)) {
      showToast('Access denied: You can only edit your own team\'s assigned project.', 'error');
      return;
    }
  }

  if (DOM.detailModal && DOM.detailModal.classList.contains('active')) {
    state.openedFromDetailModal = true;
    state.detailModalProjectId = project.id;
    closeModal(DOM.detailModal);
  }

  // Toggle admin-only form fields
  document.querySelectorAll('.admin-only-form-field').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  // Toggle required flags so student submission won't trigger browser validation errors on hidden fields
  ['form-code', 'form-title', 'form-domain', 'form-priority', 'form-status', 'form-start-date', 'form-due-date', 'form-action-item'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.required = isAdmin;
  });

  const studentHintEl = document.getElementById('student-edit-hint');
  if (studentHintEl) {
    studentHintEl.style.display = (isStudent && !isAdmin) ? 'flex' : 'none';
    if (isStudent && !isAdmin) {
      studentHintEl.innerHTML = `
        <span style="font-size:16px;">🎓</span>
        <div><strong>Team Edit Access:</strong> You are editing your team project (<strong>${escapeHTML(project.project_code || '')}</strong>). You can update your Hero Image, GitHub Repo, Technical Report (Drive), Video Demo, LinkedIn, Team Name, Team Lead, Team Logo, Team Members, and Deliverables.</div>
      `;
    }
  }

  if (DOM.modalProjectTitle) {
    DOM.modalProjectTitle.textContent = isAdmin
      ? `👑 Admin Edit Project Details: ${project.project_code || ''}`
      : `✏️ Edit Project Details: ${project.project_code || ''} - ${project.title || ''}`;
  }

  const saveBtn = document.getElementById('save-project-btn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '💾 Save Project Details';
  }

  document.getElementById('form-project-id').value = project.id || '';
  
  const codeEl = document.getElementById('form-code');
  if (codeEl) {
    codeEl.value = project.project_code || '';
    codeEl.disabled = !isAdmin;
  }

  const titleEl = document.getElementById('form-title');
  if (titleEl) {
    titleEl.value = project.title || '';
    titleEl.disabled = !isAdmin;
  }

  const descEl = document.getElementById('form-description');
  if (descEl) {
    descEl.value = project.description || '';
    descEl.disabled = !isAdmin;
  }
  
  const domainSelect = document.getElementById('form-domain');
  if (domainSelect) {
    let exists = false;
    for (let i = 0; i < domainSelect.options.length; i++) {
      if (domainSelect.options[i].value === project.domain) {
        exists = true;
        break;
      }
    }
    if (!exists && project.domain) {
      const opt = document.createElement('option');
      opt.value = project.domain;
      opt.textContent = project.domain;
      domainSelect.insertBefore(opt, domainSelect.firstChild);
    }
    domainSelect.value = project.domain || (domainSelect.options[0] ? domainSelect.options[0].value : 'AI');
    domainSelect.disabled = !isAdmin;
  }

  const priorityEl = document.getElementById('form-priority');
  if (priorityEl) {
    priorityEl.value = project.priority || 'Normal';
    priorityEl.disabled = !isAdmin;
  }

  const statusEl = document.getElementById('form-status');
  if (statusEl) {
    statusEl.value = project.status || 'in_progress';
    statusEl.disabled = !isAdmin;
  }

  const tagsEl = document.getElementById('form-tags');
  if (tagsEl) {
    tagsEl.value = project.tags || '';
    tagsEl.disabled = !isAdmin;
  }

  const progressEl = document.getElementById('form-progress');
  if (progressEl) {
    progressEl.value = project.progress !== undefined ? project.progress : 0;
    progressEl.disabled = !isAdmin;
  }
  
  let formattedStartDate = project.start_date || '';
  if (formattedStartDate.includes('T')) formattedStartDate = formattedStartDate.split('T')[0];
  const startDateInput = document.getElementById('form-start-date');
  if (startDateInput) {
    startDateInput.value = formattedStartDate;
    startDateInput.disabled = !isAdmin;
  }

  let formattedDueDate = project.due_date || '';
  if (formattedDueDate.includes('T')) formattedDueDate = formattedDueDate.split('T')[0];
  const dueDateInput = document.getElementById('form-due-date');
  if (dueDateInput) {
    dueDateInput.value = formattedDueDate;
    dueDateInput.disabled = !isAdmin;
  }

  const actionEl = document.getElementById('form-action-item');
  if (actionEl) {
    actionEl.value = project.immediate_action || '';
    actionEl.disabled = !isAdmin;
  }

  // Team editable fields (accessible by both Admin and Team Members)
  const ghVal = project.github_repo || project.githubLink || project.github_url || '';
  const ytVal = project.youtube_url || project.videoDemoUrl || project.youtubeUrl || '';
  const docVal = project.doc_url || project.techReportUrl || project.technical_report || project.docUrl || '';
  const liVal = project.linkedin_url || project.linkedinPostUrl || project.linkedin || '';
  const imgVal = project.image_url || project.imageUrl || '';
  
  const ghInput = document.getElementById('form-github');
  if (ghInput) { ghInput.value = ghVal; ghInput.disabled = false; }

  const ytInput = document.getElementById('form-youtube');
  if (ytInput) { ytInput.value = ytVal; ytInput.disabled = false; }

  const docInput = document.getElementById('form-doc-url');
  if (docInput) { docInput.value = docVal; docInput.disabled = false; }

  const liInput = document.getElementById('form-linkedin');
  if (liInput) { liInput.value = liVal; liInput.disabled = false; }

  const imgInput = document.getElementById('form-image-url');
  if (imgInput) { imgInput.value = imgVal; imgInput.disabled = false; }
  
  const teamNameEl = document.getElementById('form-team-name');
  if (teamNameEl) {
    teamNameEl.value = project.team_name || '';
    teamNameEl.disabled = false;
  }

  const teamLeadEl = document.getElementById('form-team-lead');
  if (teamLeadEl) {
    teamLeadEl.value = project.team_lead || '';
    teamLeadEl.disabled = false;
  }

  const teamLogoEl = document.getElementById('form-team-lead-photo');
  if (teamLogoEl) {
    teamLogoEl.value = project.team_logo_url || project.team_lead_photo || project.teamLeadPhoto || project.teamLogoUrl || '';
    teamLogoEl.disabled = false;
  }

  const delivEl = document.getElementById('form-deliverables');
  if (delivEl) {
    delivEl.value = project.deliverables || '';
    delivEl.disabled = false;
  }

  // Pre-fill Team Members (editable by both Admin and Team Members)
  let membersList = [];
  if (Array.isArray(project.team_members)) {
    membersList = project.team_members.map(m => typeof m === 'object' && m ? (m.name || m.email || JSON.stringify(m)) : String(m)).filter(Boolean);
  } else if (Array.isArray(project.teamMembers)) {
    membersList = project.teamMembers.map(m => typeof m === 'object' && m ? (m.name || m.email || JSON.stringify(m)) : String(m)).filter(Boolean);
  } else if (typeof project.team_members === 'string' && project.team_members.trim()) {
    try {
      const parsed = JSON.parse(project.team_members);
      if (Array.isArray(parsed)) {
        membersList = parsed.map(m => typeof m === 'object' && m ? (m.name || m.email || JSON.stringify(m)) : String(m)).filter(Boolean);
      } else {
        membersList = project.team_members.split(',').map(m => m.trim()).filter(Boolean);
      }
    } catch (e) {
      membersList = project.team_members.split(',').map(m => m.trim()).filter(Boolean);
    }
  }
  state.currentEditingTeamMembers = [...membersList];
  renderTeamMembersChips();
  const tmInput = document.getElementById('form-team-members-input');
  if (tmInput) {
    tmInput.value = '';
    tmInput.disabled = false;
  }
  const tmAddBtn = document.getElementById('btn-add-team-member');
  if (tmAddBtn) tmAddBtn.disabled = false;

  updateLinkPreviewIcon('preview-image-url', imgVal);
  updateLinkPreviewIcon('preview-github', ghVal);
  updateLinkPreviewIcon('preview-youtube', ytVal);
  updateLinkPreviewIcon('preview-doc-url', docVal);
  updateLinkPreviewIcon('preview-linkedin', liVal);

  state.initialEditingProjectValues = {
    github: ghVal.trim(),
    youtube: ytVal.trim(),
    doc: docVal.trim(),
    linkedin: liVal.trim(),
    image: imgVal.trim(),
    team_name: (project.team_name || '').trim(),
    team_lead: (project.team_lead || '').trim(),
    team_logo: (project.team_logo_url || project.team_lead_photo || project.teamLeadPhoto || project.teamLogoUrl || '').trim(),
    deliverables: (project.deliverables || '').trim(),
    team_members: JSON.stringify(state.currentEditingTeamMembers || [])
  };

  openModal(DOM.projectModal);
  checkProjectFormDirty();

  if (focusField) {
    setTimeout(() => {
      const fieldEl = document.getElementById(focusField);
      if (fieldEl) {
        fieldEl.focus();
        fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldEl.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.6)';
        setTimeout(() => { fieldEl.style.boxShadow = ''; }, 2000);
      }
    }, 200);
  }
}

async function handleProjectFormSubmit(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  
  console.log('[PROJECT-SAVE] 1. Save button clicked / form submit triggered');
  const saveBtn = document.getElementById('save-project-btn');
  const originalBtnText = saveBtn ? saveBtn.innerHTML : '💾 Save Project Details';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span style="display:inline-block; animation: spin 1s linear infinite; margin-right:6px;">⏳</span> Saving...';
  }

  try {
    const id = document.getElementById('form-project-id') ? document.getElementById('form-project-id').value : '';
    const isAdmin = isUserAdmin();
    const existingProject = id ? state.projects.find(p => String(p.id) === String(id)) : null;

    let title = (document.getElementById('form-title') ? document.getElementById('form-title').value : '').trim();
    if (!title && existingProject) {
      title = existingProject.title;
    }

    if (!title) {
      console.warn('[PROJECT-SAVE] Validation failed: Missing Project Title');
      showToast('Project Title is required.', 'error');
      const titleInput = document.getElementById('form-title');
      if (titleInput && !titleInput.disabled) titleInput.focus();
      return;
    }

    const domainSelect = document.getElementById('form-domain');
    const domain = (domainSelect && domainSelect.value) ? domainSelect.value : (existingProject ? existingProject.domain : 'AI');

    const startDateInput = document.getElementById('form-start-date');
    const dueDateInput = document.getElementById('form-due-date');
    let start_date = startDateInput ? startDateInput.value : '';
    let due_date = dueDateInput ? dueDateInput.value : '';

    if (!start_date && existingProject && existingProject.start_date) {
      start_date = existingProject.start_date.split('T')[0];
    }
    if (!due_date && existingProject && existingProject.due_date) {
      due_date = existingProject.due_date.split('T')[0];
    }

    if (!start_date) {
      start_date = new Date().toISOString().split('T')[0];
    }
    if (!due_date) {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      due_date = nextMonth.toISOString().split('T')[0];
    }

    if (start_date && due_date && new Date(due_date) < new Date(start_date)) {
      console.warn('[PROJECT-SAVE] Validation failed: To Date earlier than From Date');
      showToast('To Date cannot be earlier than From Date.', 'error');
      if (dueDateInput && !dueDateInput.disabled) dueDateInput.focus();
      return;
    }

    const docVal = normalizeUrl(document.getElementById('form-doc-url') ? document.getElementById('form-doc-url').value : '');
    const ghVal = normalizeUrl(document.getElementById('form-github') ? document.getElementById('form-github').value : '');
    const ytVal = normalizeUrl(document.getElementById('form-youtube') ? document.getElementById('form-youtube').value : '');
    const liVal = normalizeUrl(document.getElementById('form-linkedin') ? document.getElementById('form-linkedin').value : '');
    const imgVal = normalizeUrl(document.getElementById('form-image-url') ? document.getElementById('form-image-url').value : '');
    const leadPhotoVal = normalizeUrl(document.getElementById('form-team-lead-photo') ? document.getElementById('form-team-lead-photo').value : '');
    const deliverablesVal = (document.getElementById('form-deliverables') ? document.getElementById('form-deliverables').value : (existingProject ? existingProject.deliverables : '')).trim();

    // Client-side URL format validations
    const isGhValid = !ghVal || ghVal.toLowerCase().startsWith('https://github.com/') || ghVal.toLowerCase().startsWith('http://github.com/') || ghVal.toLowerCase().startsWith('github.com/');
    if (ghVal && !isGhValid) {
      console.warn('[PROJECT-SAVE] Validation failed: Invalid GitHub URL');
      showToast('GitHub Repository URL must be a valid link starting with github.com or https://github.com/.', 'error');
      const ghInput = document.getElementById('form-github');
      if (ghInput) ghInput.focus();
      return;
    }
    const isDocValid = !docVal || docVal.toLowerCase().includes('drive.google.com') || docVal.toLowerCase().includes('docs.google.com');
    if (docVal && !isDocValid) {
      console.warn('[PROJECT-SAVE] Validation failed: Invalid Google Drive/Docs URL');
      showToast('Technical Report must be a valid Google Drive or Google Docs link (containing "drive.google.com" or "docs.google.com").', 'error');
      const docInput = document.getElementById('form-doc-url');
      if (docInput) docInput.focus();
      return;
    }
    const isLiValid = !liVal || liVal.toLowerCase().includes('linkedin.com');
    if (liVal && !isLiValid) {
      console.warn('[PROJECT-SAVE] Validation failed: Invalid LinkedIn URL');
      showToast('LinkedIn Post URL must be a valid link containing "linkedin.com".', 'error');
      const liInput = document.getElementById('form-linkedin');
      if (liInput) liInput.focus();
      return;
    }

    // Flush any pending typed team member
    const pendingMemberInput = document.getElementById('form-team-members-input') ? document.getElementById('form-team-members-input').value.trim() : '';
    if (pendingMemberInput) {
      addTeamMemberChip(pendingMemberInput);
    }

    const payload = {
      project_code: (document.getElementById('form-code') ? document.getElementById('form-code').value : (existingProject ? existingProject.project_code : '')).trim(),
      title: title,
      description: (document.getElementById('form-description') ? document.getElementById('form-description').value : (existingProject ? existingProject.description : '')).trim(),
      domain: domain,
      priority: document.getElementById('form-priority') ? document.getElementById('form-priority').value : (existingProject ? existingProject.priority : 'Normal'),
      status: document.getElementById('form-status') ? document.getElementById('form-status').value : (existingProject ? existingProject.status : 'in_progress'),
      tags: (document.getElementById('form-tags') ? document.getElementById('form-tags').value : (existingProject ? existingProject.tags : '')).trim(),
      progress: Number(document.getElementById('form-progress') ? document.getElementById('form-progress').value : (existingProject ? existingProject.progress : 0)) || 0,
      start_date: start_date,
      due_date: due_date,
      immediate_action: (document.getElementById('form-action-item') ? document.getElementById('form-action-item').value : (existingProject ? existingProject.immediate_action : '')).trim(),
      github_repo: ghVal,
      githubLink: ghVal,
      github_url: ghVal,
      youtube_url: ytVal,
      videoDemoUrl: ytVal,
      youtubeUrl: ytVal,
      doc_url: docVal,
      techReportUrl: docVal,
      technical_report: docVal,
      docUrl: docVal,
      linkedin_url: liVal,
      linkedinPostUrl: liVal,
      linkedinUrl: liVal,
      image_url: imgVal,
      team_name: (document.getElementById('form-team-name') ? document.getElementById('form-team-name').value : (existingProject ? existingProject.team_name : '')).trim(),
      team_lead: (document.getElementById('form-team-lead') ? document.getElementById('form-team-lead').value : (existingProject ? existingProject.team_lead : '')).trim(),
      team_lead_photo: leadPhotoVal,
      team_logo_url: leadPhotoVal,
      teamLogoUrl: leadPhotoVal,
      teamLeadPhoto: leadPhotoVal,
      team_members: state.currentEditingTeamMembers || [],
      teamMembers: state.currentEditingTeamMembers || [],
      deliverables: deliverablesVal
    };

    console.log('[PROJECT-SAVE] 2. Form payload:', payload);
    console.log('[PROJECT-SAVE] 3. Sending API request:', id ? `PUT /api/projects/${id}` : 'POST /api/projects');

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

    console.log('[PROJECT-SAVE] 4. API response status:', res.status);

    if (res.ok) {
      const resData = await res.json().catch(() => ({}));
      console.log('[PROJECT-SAVE] 5. Server response payload:', resData);

      if (resData.project && resData.project.id) {
        const idx = state.projects.findIndex(p => String(p.id) === String(resData.project.id));
        if (idx !== -1) {
          state.projects[idx] = { ...state.projects[idx], ...resData.project };
        } else {
          state.projects.unshift(resData.project);
        }
      }

      closeModal(DOM.projectModal);
      showToast(resData.message || (id ? 'Project details saved successfully.' : 'Project created successfully.'), 'success');

      // Comprehensive state refresh and view re-render
      await Promise.all([fetchProjects(), fetchNotifications()]);
      renderAllViews();
      updateStatsSummary();

      // If this project was opened from Detail Modal or is active
      const wasFromDetail = state.openedFromDetailModal || (DOM.detailModal && DOM.detailModal.classList.contains('active'));
      state.openedFromDetailModal = false;
      state.detailModalProjectId = null;
      if (id && (wasFromDetail || String(state.activeProjectId) === String(id))) {
        await openProjectDetail(id);
      }

      console.log('[PROJECT-SAVE] 6. Save flow completed and UI synchronized with database!');
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error('[PROJECT-SAVE] Server error response:', res.status, errData);
      showToast(errData.error || `Failed to save: Server returned HTTP ${res.status}`, 'error');
    }
  } catch (err) {
    console.error('[PROJECT-SAVE] Exception during save flow:', err);
    showToast(`Failed to save: ${err.message || 'Connection error'}`, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnText;
    }
    syncBodyScrollLock();
  }
}

async function deleteProject(id) {
  try {
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
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
    const res = await authFetch(`/api/projects/${id}`, {
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
  if (isUserViewer() || isUserPublic()) {
    showToast('Access denied: Public Showcase Viewers have read-only permissions.', 'error');
    return;
  }
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
    const res = await authFetch('/api/bom', {
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
    const res = await authFetch(`/api/bom/${bomId}/status`, {
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
    const res = await authFetch('/api/students', {
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
function syncBodyScrollLock() {
  const activeModals = document.querySelectorAll('.modal-overlay.active, .drawer-open');
  if (activeModals.length === 0) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  } else {
    document.body.style.overflow = 'hidden';
  }
}

function openModal(modal) {
  if (modal) {
    modal.classList.add('active');
  }
  syncBodyScrollLock();
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('active');
  }
  syncBodyScrollLock();
}

// Global ESC key handler to close topmost active modal and restore body scroll
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length > 0) {
      const topModal = activeModals[activeModals.length - 1];
      closeModal(topModal);
    }
  }
});

// Global outside-click listener for modal backdrops
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeModal(e.target);
  }
});

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

// ----------------------------------------------------
// PROJECT VISIBILITY (ON/OFF) TOGGLE LOGIC (ADMIN ONLY)
// ----------------------------------------------------
function renderProjectActiveToggleHTML(projectId, isActive, options = {}) {
  const isAdmin = isUserAdmin();
  if (!isAdmin) return ''; // Only admin can see and use this toggle

  const activeBool = isActive !== false && isActive !== 0 && isActive !== '0';
  const toggleClass = activeBool ? 'is-active' : 'is-inactive';
  const labelText = activeBool ? 'ON' : 'OFF';
  const labelClass = activeBool ? 'on' : 'off';
  const titleAttr = activeBool
    ? 'Project Visibility: ON (Visible to Everyone) - Click to hide from students and public viewers'
    : 'Project Visibility: OFF (Hidden from Students & Public) - Click to make visible to everyone';

  return `
    <div class="project-active-toggle-wrap" onclick="event.stopPropagation();" title="${titleAttr}">
      <div class="project-toggle-switch ${toggleClass}" id="project-toggle-switch-${projectId}" data-id="${projectId}" data-active="${activeBool ? 'true' : 'false'}" onclick="handleToggleProjectActive(${projectId}, event)">
        <div class="project-toggle-thumb"></div>
      </div>
      ${options.showLabel !== false ? `<span class="project-toggle-label ${labelClass}" id="project-toggle-label-${projectId}">${labelText}</span>` : ''}
    </div>
  `;
}

async function handleToggleProjectActive(projectId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // Prevent double-click race conditions
  if (state.togglingProjects && state.togglingProjects.has(Number(projectId))) {
    return;
  }

  if (!isUserAdmin()) {
    showToast('Access denied: Only administrator can toggle project visibility.', 'warning');
    return;
  }

  const project = state.projects.find(p => p.id === Number(projectId));
  if (!project) return;

  const currentIsActive = (project.is_visible !== 0 && project.is_visible !== false && project.is_visible !== '0' && project.is_active !== 0 && project.is_active !== false && project.is_active !== '0');
  const newActiveState = !currentIsActive;

  // Requirement 4: Confirmation dialog when turning OFF (hiding from whole team + public)
  if (!newActiveState) {
    const projName = project.title || project.project_code || 'this project';
    const confirmed = window.confirm(`Hide ${projName} from students and public viewers?`);
    if (!confirmed) {
      return;
    }
  }

  if (!state.togglingProjects) state.togglingProjects = new Set();
  state.togglingProjects.add(Number(projectId));

  // Visual loading feedback
  const switches = document.querySelectorAll(`[id^="project-toggle-switch-${projectId}"]`);
  switches.forEach(sw => sw.classList.add('toggle-loading'));

  try {
    const res = await authFetch(`/api/projects/${projectId}/toggle-active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_visible: newActiveState, is_active: newActiveState, isVisible: newActiveState })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Failed to update project visibility`);
    }

    const data = await res.json();
    project.is_visible = newActiveState ? 1 : 0;
    project.isVisible = newActiveState;
    project.is_active = newActiveState ? 1 : 0;
    project.isActive = newActiveState;

    showToast(`Project ${project.project_code} is now ${newActiveState ? 'Visible to Everyone (ON)' : 'Hidden from Students & Public (OFF)'}`, 'success');

    // Update in DOM
    switches.forEach(sw => {
      sw.classList.remove('toggle-loading');
      sw.classList.toggle('is-active', newActiveState);
      sw.classList.toggle('is-inactive', !newActiveState);
      sw.setAttribute('data-active', newActiveState ? 'true' : 'false');
    });

    const labels = document.querySelectorAll(`[id^="project-toggle-label-${projectId}"]`);
    labels.forEach(lbl => {
      lbl.textContent = newActiveState ? 'ON' : 'OFF';
      lbl.className = `project-toggle-label ${newActiveState ? 'on' : 'off'}`;
    });

    // Re-render views
    renderAllViews();

    if (state.activeProjectId === Number(projectId)) {
      openProjectDetail(projectId);
    }
  } catch (err) {
    console.error('[Project Toggle Error]:', err);
    showToast(`Couldn't update project visibility, please try again: ${err.message}`, 'error');
    switches.forEach(sw => sw.classList.remove('toggle-loading'));
  } finally {
    state.togglingProjects.delete(Number(projectId));
  }
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

// ----------------------------------------------------
// INDIA STANDARD TIME (IST = UTC+05:30) TIMEZONE HELPERS
// ----------------------------------------------------
function parseToUTCDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00Z`);
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    return new Date(`${str.replace(' ', 'T')}Z`);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatISTDateTime(dateTimeStr, includeSeconds = false) {
  if (!dateTimeStr) return '';
  const d = parseToUTCDate(dateTimeStr);
  if (!d) return String(dateTimeStr);

  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }

  const formatted = new Intl.DateTimeFormat('en-IN', options).format(d);
  return `${formatted} IST`;
}

function formatISTDate(dateStr) {
  if (!dateStr) return '';
  const d = parseToUTCDate(dateStr);
  if (!d) return String(dateStr);

  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  return `${new Intl.DateTimeFormat('en-IN', options).format(d)} IST`;
}

function convertISTInputToUTC(istDateTimeStr) {
  if (!istDateTimeStr) return '';
  if (istDateTimeStr.includes('T')) {
    const offsetString = `${istDateTimeStr}:00+05:30`;
    const dt = new Date(offsetString);
    return isNaN(dt.getTime()) ? istDateTimeStr : dt.toISOString();
  }
  return istDateTimeStr;
}

function convertUTCToISTInput(utcDateStr) {
  if (!utcDateStr) return '';
  const d = parseToUTCDate(utcDateStr);
  if (!d) return '';

  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = istFormatter.formatToParts(d);
  const getPart = (type) => (parts.find(p => p.type === type) || {}).value;
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}

function formatDate(dateStr) {
  return formatISTDate(dateStr);
}

function formatDateTime(dateTimeStr) {
  return formatISTDateTime(dateTimeStr);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = parseToUTCDate(dateStr);
  if (!d) return String(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short'
  }).format(d);
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

// ----------------------------------------------------
// ADMIN DATE & DEADLINE MODAL EDIT HANDLERS (ADMIN ONLY)
// ----------------------------------------------------
function openAdminDateEditModal(projectId) {
  if (!isUserAdmin()) {
    showToast('Access denied: Date edits are restricted to Administrator.', 'error');
    return;
  }

  const project = state.projects.find(p => p.id === Number(projectId));
  if (!project) return;

  const modal = document.getElementById('admin-date-edit-modal');
  const formId = document.getElementById('admin-date-edit-project-id');
  const titleEl = document.getElementById('admin-date-edit-project-title');
  const startInput = document.getElementById('admin-date-edit-start');
  const dueInput = document.getElementById('admin-date-edit-due');

  if (formId) formId.value = project.id;
  if (titleEl) titleEl.textContent = `${project.project_code} - ${project.title}`;
  if (startInput) startInput.value = convertUTCToISTInput(project.start_date || new Date().toISOString());
  if (dueInput) dueInput.value = convertUTCToISTInput(project.due_date || new Date().toISOString());

  openModal(modal);
}

async function handleAdminDateEditSubmit(e) {
  e.preventDefault();
  if (!isUserAdmin()) {
    showToast('Access denied: Administrator privileges required.', 'error');
    return;
  }

  const projectId = document.getElementById('admin-date-edit-project-id').value;
  const startInput = document.getElementById('admin-date-edit-start');
  const dueInput = document.getElementById('admin-date-edit-due');

  const startUTC = convertISTInputToUTC(startInput.value);
  const dueUTC = convertISTInputToUTC(dueInput.value);

  const project = state.projects.find(p => p.id === Number(projectId));
  const projTitle = project ? `${project.project_code} - ${project.title}` : `Project #${projectId}`;
  const formattedDueIST = formatISTDateTime(dueUTC);

  // Admin Confirmation Dialog
  const confirmed = confirm(`Are you sure you want to change the deadline and timeline for "${projTitle}" to ${formattedDueIST}?`);
  if (!confirmed) return;

  try {
    const res = await authFetch(`/api/projects/${projectId}/dates`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startUTC, due_date: dueUTC })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error ${res.status}`);
    }

    showToast(`Updated deadline for ${projTitle} to ${formattedDueIST}`);

    closeModal(document.getElementById('admin-date-edit-modal'));

    // Update state & re-render
    if (project) {
      project.start_date = startUTC;
      project.due_date = dueUTC;
    }
    await Promise.all([fetchProjects(), fetchNotifications()]);
    renderAllViews();

    if (state.activeProjectId === Number(projectId)) {
      openProjectDetail(projectId);
    }
  } catch (err) {
    console.error('Error updating project dates:', err);
    showToast(`Failed to update dates: ${err.message}`, 'error');
  }
}

function openAdminAuditEditModal(auditId) {
  if (!isUserAdmin()) return;
  const log = state.auditLogs.find(l => l.id === Number(auditId));
  if (!log) return;

  const modal = document.getElementById('admin-audit-edit-modal');
  document.getElementById('admin-audit-edit-id').value = log.id;
  document.getElementById('admin-audit-edit-desc').textContent = `${log.email} (${log.event_type} - ${log.role})`;
  document.getElementById('admin-audit-edit-timestamp').value = convertUTCToISTInput(log.timestamp);
  document.getElementById('admin-audit-edit-details').value = log.details || '';

  openModal(modal);
}

async function handleAdminAuditEditSubmit(e) {
  e.preventDefault();
  if (!isUserAdmin()) return;

  const auditId = document.getElementById('admin-audit-edit-id').value;
  const timeInput = document.getElementById('admin-audit-edit-timestamp');
  const detailsInput = document.getElementById('admin-audit-edit-details');

  const timestampUTC = convertISTInputToUTC(timeInput.value);
  const details = detailsInput.value.trim();

  const confirmed = confirm(`Are you sure you want to update this audit log timestamp to ${formatISTDateTime(timestampUTC)}?`);
  if (!confirmed) return;

  try {
    const res = await authFetch(`/api/admin/audit-logs/${auditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: timestampUTC, details })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error ${res.status}`);
    }

    showToast('Audit log timestamp updated in IST');
    closeModal(document.getElementById('admin-audit-edit-modal'));
    fetchAndRenderAuditLogs();
  } catch (err) {
    console.error('Error updating audit log:', err);
    showToast(`Failed to update audit log: ${err.message}`, 'error');
  }
}

// ----------------------------------------------------
// 10. AUDIT LOG & LOGIN ACTIVITY (ADMIN ONLY)
// ----------------------------------------------------
async function fetchAndRenderAuditLogs() {
  if (!isUserAdmin()) return;

  const tbody = document.getElementById('audit-logs-tbody');
  if (tbody && state.auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:32px; text-align:center; color:var(--text-dim);">Fetching login activity records...</td></tr>';
  }

  const params = new URLSearchParams();
  if (state.auditFilters.search) params.append('search', state.auditFilters.search);
  if (state.auditFilters.role && state.auditFilters.role !== 'all') params.append('role', state.auditFilters.role);
  if (state.auditFilters.batch && state.auditFilters.batch !== 'all') params.append('batch', state.auditFilters.batch);
  if (state.auditFilters.sort) params.append('sort', state.auditFilters.sort);
  if (state.auditFilters.event_type && state.auditFilters.event_type !== 'all') params.append('event_type', state.auditFilters.event_type);
  if (state.auditFilters.start_date) params.append('start_date', state.auditFilters.start_date);
  if (state.auditFilters.end_date) params.append('end_date', state.auditFilters.end_date);
  params.append('page', state.auditPage || 1);
  params.append('limit', state.auditLimit || 50);

  try {
    const res = await authFetch(`/api/admin/audit-logs?${params.toString()}`);
    if (!res.ok) {
      if (res.status === 403) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="padding:32px; text-align:center; color:#ef4444;">🔒 Access Denied. Administrator credentials required.</td></tr>';
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    state.auditLogs = data.logs || [];
    state.auditTotal = data.total || 0;
    state.auditPage = data.page || 1;
    state.auditTotalPages = data.total_pages || 1;
    state.auditSummary = data.summary || {};

    renderAuditLogsUI();
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="padding:32px; text-align:center; color:#ef4444;">Failed to load audit logs: ${escapeHTML(err.message)}</td></tr>`;
    }
  }
}

function renderAuditLogsUI() {
  // Update KPI counters
  const totalEl = document.getElementById('audit-stat-total');
  const uniqueEl = document.getElementById('audit-stat-unique');
  const todayEl = document.getElementById('audit-stat-today');
  const flagsEl = document.getElementById('audit-stat-flags');
  const flagsSub = document.getElementById('audit-stat-flags-sub');

  if (totalEl) totalEl.textContent = Number(state.auditSummary.total_logins || 0).toLocaleString('en-IN');
  if (uniqueEl) uniqueEl.textContent = Number(state.auditSummary.unique_users || 0).toLocaleString('en-IN');
  if (todayEl) todayEl.textContent = Number(state.auditSummary.today_logins || 0).toLocaleString('en-IN');
  if (flagsEl) {
    const flagCount = state.auditSummary.suspicious_accounts_count || 0;
    flagsEl.textContent = flagCount;
    flagsEl.style.color = flagCount > 0 ? '#ef4444' : '#10b981';
    if (flagsSub) flagsSub.textContent = flagCount > 0 ? `${flagCount} account(s) on multiple IPs` : 'All sessions normal';
  }

  // Update Pagination Info
  const startIdx = state.auditTotal > 0 ? ((state.auditPage - 1) * state.auditLimit) + 1 : 0;
  const endIdx = Math.min(state.auditPage * state.auditLimit, state.auditTotal);
  const infoEl = document.getElementById('audit-pagination-info');
  const indicatorEl = document.getElementById('audit-page-indicator');
  const prevBtn = document.getElementById('btn-audit-prev-page');
  const nextBtn = document.getElementById('btn-audit-next-page');

  if (infoEl) infoEl.textContent = `Showing ${startIdx}-${endIdx} of ${state.auditTotal} entries`;
  if (indicatorEl) indicatorEl.textContent = `Page ${state.auditPage} of ${state.auditTotalPages}`;
  if (prevBtn) prevBtn.disabled = state.auditPage <= 1;
  if (nextBtn) nextBtn.disabled = state.auditPage >= state.auditTotalPages;

  // Render Table Rows
  const tbody = document.getElementById('audit-logs-tbody');
  if (!tbody) return;

  if (state.auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:40px; text-align:center; color:var(--text-dim);">No login activity records match the selected filters.</td></tr>';
    return;
  }

  const isAdmin = isUserAdmin();

  let rowsHTML = '';
  state.auditLogs.forEach(log => {
    // Format timestamp in IST (Always displays "IST" suffix)
    const formattedTime = formatISTDateTime(log.timestamp, true);

    // Role badge
    let roleBadge = '<span class="badge badge-success">🎓 Student</span>';
    if (log.role === 'admin') roleBadge = '<span class="badge badge-primary">👑 Admin</span>';
    else if (log.role === 'viewer') roleBadge = '<span class="badge badge-blue">👁️ Viewer</span>';

    // Batch badge
    let batchBadge = '<span style="color:var(--text-dim); font-family:var(--font-mono); font-size:12px;">—</span>';
    if (log.batch === 1) {
      batchBadge = '<span class="badge" style="background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.35); font-weight:700; font-size:11px; padding:2px 8px; border-radius:4px;">Batch 1</span>';
    } else if (log.batch === 2) {
      batchBadge = '<span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.35); font-weight:700; font-size:11px; padding:2px 8px; border-radius:4px;">Batch 2</span>';
    } else if (log.batch === 3) {
      batchBadge = '<span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.35); font-weight:700; font-size:11px; padding:2px 8px; border-radius:4px;">Batch 3</span>';
    } else if (log.batch === 4) {
      batchBadge = '<span class="badge" style="background:rgba(139,92,246,0.15); color:#c084fc; border:1px solid rgba(139,92,246,0.35); font-weight:700; font-size:11px; padding:2px 8px; border-radius:4px;">Batch 4</span>';
    }

    // Status badge
    let statusBadge = '<span style="color:#10b981; font-weight:600;">✓ Success</span>';
    if (log.status === 'FAILED' || log.event_type === 'LOGIN_FAILED') {
      statusBadge = '<span style="color:#ef4444; font-weight:600;">✕ Failed</span>';
    } else if (log.event_type === 'LOGOUT') {
      statusBadge = '<span style="color:var(--text-dim); font-weight:600;">🚪 Logout</span>';
    } else if (log.event_type === 'SIGNUP') {
      statusBadge = '<span style="color:#8b5cf6; font-weight:600;">✨ New User</span>';
    } else if (log.event_type === 'DATE_UPDATE') {
      statusBadge = '<span style="color:#f59e0b; font-weight:600;">📅 Date Change</span>';
    }

    // Security anomaly pill
    let anomalyPill = '<span style="color:#10b981; font-size:11px; background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:4px;">✓ Normal</span>';
    if (log.is_suspicious) {
      anomalyPill = `<span style="color:#ef4444; font-size:11px; font-weight:700; background:rgba(239,68,68,0.15); padding:3px 8px; border-radius:4px; border:1px solid rgba(239,68,68,0.3);" title="${escapeHTML(log.suspicious_reason || 'Multi-IP login')}">⚠️ Multi-IP Alert</span>`;
    }

    const emailPrefix = (log.email || '').split('@')[0];
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(emailPrefix)}&background=${log.role === 'admin' ? '6366f1' : (log.role === 'viewer' ? '0284c7' : '10b981')}&color=fff`;

    const editBtnHTML = isAdmin ? `<button type="button" class="btn btn-secondary" onclick="openAdminAuditEditModal(${log.id})" title="Admin: Edit Timestamp" style="padding:2px 6px; font-size:10px; margin-left:6px;">✏️</button>` : '';

    rowsHTML += `
      <tr style="border-bottom:1px solid var(--border-color); transition:background 0.15s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
        <td style="padding:12px 16px; font-family:var(--font-mono); font-size:12px; color:var(--text-muted); white-space:nowrap;">
          <div style="display:flex; align-items:center;">
            <span>${formattedTime}</span>
            ${editBtnHTML}
          </div>
        </td>
        <td style="padding:12px 16px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${avatarUrl}" style="width:24px; height:24px; border-radius:50%;" alt="Avatar">
            <span style="font-weight:600; color:var(--text-main);">${escapeHTML(log.email)}</span>
          </div>
        </td>
        <td style="padding:12px 16px;">${roleBadge}</td>
        <td style="padding:12px 16px;">${batchBadge}</td>
        <td style="padding:12px 16px; color:var(--text-dim); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${escapeHTML(log.team_name || 'N/A')}
        </td>
        <td style="padding:12px 16px;">
          <span style="font-size:12px; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px; font-family:var(--font-mono);">
            ${escapeHTML(log.method || 'Email / Password')}
          </span>
        </td>
        <td style="padding:12px 16px; font-family:var(--font-mono); font-size:12px; color:#60a5fa;">
          ${escapeHTML(log.ip_address || '127.0.0.1')}
        </td>
        <td style="padding:12px 16px;">${statusBadge}</td>
        <td style="padding:12px 16px;">${anomalyPill}</td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHTML;
}

function initAuditLogListeners() {
  const searchInput = document.getElementById('audit-search-input');
  const roleSelect = document.getElementById('audit-role-filter');
  const batchSelect = document.getElementById('audit-batch-filter');
  const sortSelect = document.getElementById('audit-sort-filter');
  const eventSelect = document.getElementById('audit-event-filter');
  const dateFrom = document.getElementById('audit-date-from');
  const dateTo = document.getElementById('audit-date-to');
  const btnReset = document.getElementById('btn-reset-audit-filters');
  const btnRefresh = document.getElementById('btn-refresh-audit-logs');
  const btnExport = document.getElementById('btn-export-audit-csv');
  const btnPrev = document.getElementById('btn-audit-prev-page');
  const btnNext = document.getElementById('btn-audit-next-page');

  // Date Edit Modal Listeners
  const dateEditForm = document.getElementById('admin-date-edit-form');
  if (dateEditForm) dateEditForm.addEventListener('submit', handleAdminDateEditSubmit);
  const closeDateEditModal = document.getElementById('close-admin-date-edit-modal');
  if (closeDateEditModal) closeDateEditModal.addEventListener('click', () => closeModal(document.getElementById('admin-date-edit-modal')));
  const cancelDateEditBtn = document.getElementById('btn-cancel-admin-date-edit');
  if (cancelDateEditBtn) cancelDateEditBtn.addEventListener('click', () => closeModal(document.getElementById('admin-date-edit-modal')));

  // Audit Edit Modal Listeners
  const auditEditForm = document.getElementById('admin-audit-edit-form');
  if (auditEditForm) auditEditForm.addEventListener('submit', handleAdminAuditEditSubmit);
  const closeAuditEditModal = document.getElementById('close-admin-audit-edit-modal');
  if (closeAuditEditModal) closeAuditEditModal.addEventListener('click', () => closeModal(document.getElementById('admin-audit-edit-modal')));
  const cancelAuditEditBtn = document.getElementById('btn-cancel-admin-audit-edit');
  if (cancelAuditEditBtn) cancelAuditEditBtn.addEventListener('click', () => closeModal(document.getElementById('admin-audit-edit-modal')));

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.auditFilters.search = searchInput.value.trim();
        state.auditPage = 1;
        fetchAndRenderAuditLogs();
      }, 300);
    });
  }

  if (batchSelect) {
    batchSelect.addEventListener('change', () => {
      state.auditFilters.batch = batchSelect.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      state.auditFilters.role = roleSelect.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.auditFilters.sort = sortSelect.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (eventSelect) {
    eventSelect.addEventListener('change', () => {
      state.auditFilters.event_type = eventSelect.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (dateFrom) {
    dateFrom.addEventListener('change', () => {
      state.auditFilters.start_date = dateFrom.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (dateTo) {
    dateTo.addEventListener('change', () => {
      state.auditFilters.end_date = dateTo.value;
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (roleSelect) roleSelect.value = 'all';
      if (batchSelect) batchSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'timestamp_desc';
      if (eventSelect) eventSelect.value = 'all';
      if (dateFrom) dateFrom.value = '';
      if (dateTo) dateTo.value = '';

      state.auditFilters = { search: '', role: 'all', batch: 'all', sort: 'timestamp_desc', event_type: 'all', start_date: '', end_date: '' };
      state.auditPage = 1;
      fetchAndRenderAuditLogs();
      showToast('Audit filters reset');
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchAndRenderAuditLogs();
      showToast('Login activity refreshed');
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (state.auditPage > 1) {
        state.auditPage--;
        fetchAndRenderAuditLogs();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (state.auditPage < state.auditTotalPages) {
        state.auditPage++;
        fetchAndRenderAuditLogs();
      }
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const params = new URLSearchParams();
      if (state.auditFilters.search) params.append('search', state.auditFilters.search);
      if (state.auditFilters.role && state.auditFilters.role !== 'all') params.append('role', state.auditFilters.role);
      if (state.auditFilters.batch && state.auditFilters.batch !== 'all') params.append('batch', state.auditFilters.batch);
      if (state.auditFilters.sort) params.append('sort', state.auditFilters.sort);
      if (state.auditFilters.event_type && state.auditFilters.event_type !== 'all') params.append('event_type', state.auditFilters.event_type);
      if (state.auditFilters.start_date) params.append('start_date', state.auditFilters.start_date);
      if (state.auditFilters.end_date) params.append('end_date', state.auditFilters.end_date);

      const token = getSessionToken();
      if (token) params.append('token', token);

      showToast('Generating official audit CSV report with batches...');
      window.location.href = `/api/admin/audit-logs/export?${params.toString()}`;
    });
  }
}

// Expose globals for inline onclicks
window.openAdminDateEditModal = openAdminDateEditModal;
window.openAdminAuditEditModal = openAdminAuditEditModal;
window.toggleStudentCardExpand = toggleStudentCardExpand;
window.handleToggleProjectActive = handleToggleProjectActive;
window.renderProjectActiveToggleHTML = renderProjectActiveToggleHTML;
window.confirmDeleteStudent = confirmDeleteStudent;
window.executeStudentDelete = executeStudentDelete;
window.renderTeamMembersChips = renderTeamMembersChips;
window.addTeamMemberChip = addTeamMemberChip;
window.removeTeamMemberChip = removeTeamMemberChip;
window.toggleBatchSection = toggleBatchSection;
window.renderBatchView = renderBatchView;

// ==========================================================================
// BATCH PROJECT HUB VIEW LOGIC
// ==========================================================================
const BATCH_INFO = {
  1: {
    number: 1,
    name: 'Batch 1',
    theme: 'Enterprise ERP & Smart Campus Ecology',
    description: 'Academic ERP, Transport ERP, AI Waste Segregation, Campus Carbon Footprint, Tree Health Monitoring',
    codes: ['IG26010001', 'IG26010002', 'IG26010003', 'IG26010004', 'IG26010005']
  },
  2: {
    number: 2,
    name: 'Batch 2',
    theme: 'Smart IoT, Automation & Logistics',
    description: 'Smart Gesture Switch, Inventory Management, Smart Irrigation, Camera Attendance, Placement Readiness',
    codes: ['IG26010006', 'IG26010007', 'IG26010008', 'IG26010009', 'IG26010010']
  },
  3: {
    number: 3,
    name: 'Batch 3',
    theme: 'Robotics, Autonomous Agents & Simulation',
    description: 'Autonomous Cleaning Robot, Robotic Waste Collection, Robotic Gardening, Project Monitoring, Virtual Tour',
    codes: ['IG26010011', 'IG26010012', 'IG26010013', 'IG26010014', 'IG26010015']
  },
  4: {
    number: 4,
    name: 'Batch 4',
    theme: 'UAVs, Digital Twins & Biomedical Sensors',
    description: 'Vehicle Entry & Traffic Analytics, Drone Crowd Monitoring, Drone Digital Twin, Smart Medical Device, Food Monitoring',
    codes: ['IG26010016', 'IG26010017', 'IG26010018', 'IG26010019', 'IG26010020']
  }
};

function getProjectBatch(p) {
  if (p.batch && Number(p.batch) >= 1 && Number(p.batch) <= 4) {
    return Number(p.batch);
  }
  const code = (p.project_code || '').toUpperCase().trim();
  for (let b = 1; b <= 4; b++) {
    if (BATCH_INFO[b].codes.includes(code)) return b;
  }
  const match = code.match(/IG\d{2}\d{2}(\d{4})/i) || code.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 5) return 1;
    if (num >= 6 && num <= 10) return 2;
    if (num >= 11 && num <= 15) return 3;
    if (num >= 16 && num <= 20) return 4;
  }
  if (p.id >= 1 && p.id <= 5) return 1;
  if (p.id >= 6 && p.id <= 10) return 2;
  if (p.id >= 11 && p.id <= 15) return 3;
  if (p.id >= 16 && p.id <= 20) return 4;
  return 1;
}

function renderBatchView() {
  const root = document.getElementById('batch-sections-root');
  if (!root) return;

  // Group state.projects into batches
  const batchGroups = { 1: [], 2: [], 3: [], 4: [] };
  state.projects.forEach(p => {
    const b = getProjectBatch(p);
    if (batchGroups[b]) {
      batchGroups[b].push(p);
    }
  });

  // Filter batch numbers based on state.batchFilter ('all', 1, 2, 3, 4)
  const batchesToRender = (state.batchFilter === 'all')
    ? [1, 2, 3, 4]
    : [Number(state.batchFilter)];

  if (state.projects.length === 0) {
    root.innerHTML = `<div style="padding: 40px 20px; text-align: center; color: var(--text-dim); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;">No projects found matching the current search / filters.</div>`;
    return;
  }

  let html = '';
  batchesToRender.forEach(bNum => {
    const info = BATCH_INFO[bNum];
    const projects = batchGroups[bNum] || [];
    const isCollapsed = state.collapsedBatches.has(bNum);
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0;
    const domains = Array.from(new Set(projects.map(p => p.domain).filter(Boolean)));

    html += `
      <div class="batch-section ${isCollapsed ? 'collapsed' : ''}" id="batch-section-${bNum}">
        <div class="batch-section-header" onclick="toggleBatchSection(${bNum})">
          <div class="batch-header-left">
            <span class="batch-tag-badge">BATCH ${bNum}</span>
            <span class="batch-title-text">${escapeHTML(info.theme)}</span>
            <span class="batch-count-tag">${projects.length} / 5 Projects</span>
            ${domains.length > 0 ? `<span style="font-size: 11px; color: var(--text-dim);">• ${escapeHTML(domains.slice(0, 3).join(', '))}</span>` : ''}
          </div>
          <div class="batch-header-right">
            <div class="batch-stats-summary">
              <span>Avg Progress: <strong style="color: var(--primary);">${avgProgress}%</strong></span>
            </div>
            <button type="button" class="batch-chevron-btn" title="${isCollapsed ? 'Expand Batch' : 'Collapse Batch'}">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div class="batch-section-body">
          ${projects.length > 0 ? `
            <div class="batch-grid">
              ${projects.map(createCardHTML).join('')}
            </div>
          ` : `
            <div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 13px;">No matching projects in Batch ${bNum} for current filters.</div>
          `}
        </div>
      </div>
    `;
  });

  root.innerHTML = html;

  // Attach card click handlers for Batch view
  root.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-tag-pill') || e.target.closest('.card-tag-pill') || e.target.closest('.project-active-toggle-wrapper')) return;
      const id = Number(card.getAttribute('data-id'));
      openProjectDetail(id);
    });
  });

  // Attach tag pill handlers
  root.querySelectorAll('.card-tag-pill').forEach(pill => {
    pill.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tag = pill.getAttribute('data-tag') || '';
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      if (state.filterTag.toLowerCase() === cleanTag.toLowerCase()) {
        state.filterTag = '';
      } else {
        state.filterTag = cleanTag;
      }
      await fetchProjects();
      renderAllViews();
    });
  });
}

function toggleBatchSection(batchNum) {
  const b = Number(batchNum);
  if (state.collapsedBatches.has(b)) {
    state.collapsedBatches.delete(b);
  } else {
    state.collapsedBatches.add(b);
  }
  const section = document.getElementById(`batch-section-${b}`);
  if (section) {
    section.classList.toggle('collapsed', state.collapsedBatches.has(b));
    const btn = section.querySelector('.batch-chevron-btn');
    if (btn) {
      btn.setAttribute('title', state.collapsedBatches.has(b) ? 'Expand Batch' : 'Collapse Batch');
    }
  }
  updateBatchToggleAllButton();
}

function updateBatchToggleAllButton() {
  const textElem = document.getElementById('batch-toggle-all-text');
  if (!textElem) return;
  const allCollapsed = [1, 2, 3, 4].every(b => state.collapsedBatches.has(b));
  textElem.textContent = allCollapsed ? 'Expand All' : 'Collapse All';
}

function initBatchViewListeners() {
  // Batch Filter Pills
  const batchFilterPills = document.querySelectorAll('.batch-pill');
  batchFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      batchFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.batchFilter = pill.getAttribute('data-batch');
      renderBatchView();
    });
  });

  // Batch Toggle All Button
  const btnBatchToggleAll = document.getElementById('btn-batch-toggle-all');
  if (btnBatchToggleAll) {
    btnBatchToggleAll.addEventListener('click', () => {
      const allCollapsed = [1, 2, 3, 4].every(b => state.collapsedBatches.has(b));
      if (allCollapsed) {
        state.collapsedBatches.clear();
      } else {
        state.collapsedBatches = new Set([1, 2, 3, 4]);
      }
      renderBatchView();
      updateBatchToggleAllButton();
    });
  }
}



