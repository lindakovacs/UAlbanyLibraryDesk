/**
 * UAlbany LibraryDesk - Client-Side API Client
 * Provides communication between the front-end interface and the Node.js/Express & MySQL API
 */
(function () {
  'use strict';

  const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api';

  const apiClient = {
    getToken() {
      return localStorage.getItem('librarydesk_token') || null;
    },

    setSession(token, user) {
      if (token) localStorage.setItem('librarydesk_token', token);
      if (user) localStorage.setItem('librarydesk_user', JSON.stringify(user));
    },

    clearSession() {
      localStorage.removeItem('librarydesk_token');
      localStorage.removeItem('librarydesk_user');
    },

    getUser() {
      const u = localStorage.getItem('librarydesk_user');
      return u ? JSON.parse(u) : null;
    },

    async request(endpoint, options = {}) {
      const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const token = this.getToken();
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    },

    // Authentication methods
    async login(netid, password) {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ netid, password })
      });
      if (data.token) {
        this.setSession(data.token, data.user);
      }
      return data;
    },

    async getCurrentUser() {
      return this.request('/auth/getCurrentUser');
    },

    async logout() {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } finally {
        this.clearSession();
      }
    },

    // Equipment catalog
    async getEquipment(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/equipment${qs ? '?' + qs : ''}`);
    },

    async getEquipmentById(id) {
      return this.request(`/equipment/${id}`);
    },

    // Circulation & Loans
    async getLoans(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/loans${qs ? '?' + qs : ''}`);
    },

    async checkout(loanData) {
      return this.request('/loans', {
        method: 'POST',
        body: JSON.stringify(loanData)
      });
    },

    async returnItem(loanId, returnData) {
      return this.request(`/loans/${loanId}/return`, {
        method: 'POST',
        body: JSON.stringify(returnData)
      });
    },

    // Borrowers directory
    async getBorrowers(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/borrowers${qs ? '?' + qs : ''}`);
    },

    // Preparation pipeline
    async getPreparation(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/preparation${qs ? '?' + qs : ''}`);
    },

    async updatePreparation(prepId, updates) {
      return this.request(`/preparation/${prepId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    // Reporting & KPI Metrics
    async getSummaryKPIs() {
      return this.request('/reports/summary');
    },

    async getReports(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/reports${qs ? '?' + qs : ''}`);
    }
  };

  window.LibraryDeskAPI = apiClient;

  // Initialize form event hooks once DOM is ready
  function initApiFormHooks() {
    // 1. Handle login form submission
    const loginForm = document.querySelector('.login-card');
    if (loginForm && !loginForm.dataset.apiBound) {
      loginForm.dataset.apiBound = 'true';
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const netidInput = document.getElementById('netid');
        const passwordInput = document.getElementById('password');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        let errorBanner = loginForm.querySelector('.login-error-banner');
        if (errorBanner) errorBanner.remove();

        const netid = netidInput ? netidInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!netid || !password) {
          errorBanner = document.createElement('div');
          errorBanner.className = 'login-error-banner';
          errorBanner.setAttribute('role', 'alert');
          errorBanner.style.cssText = `
            background: #fdf2f2;
            border: 1px solid #f8d7da;
            color: #8c1d1e;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            margin-bottom: 1rem;
          `;
          errorBanner.textContent = 'Please enter both your NetID and password.';
          loginForm.insertBefore(errorBanner, loginForm.querySelector('.form-field'));
          return;
        }

        const originalBtnText = submitBtn ? submitBtn.textContent : 'Sign in';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying credentials...';
        }

        try {
          await apiClient.login(netid, password);
          window.location.href = 'index.html';
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }

          // Format error according to OWASP authentication security standards
          let displayMessage = 'Invalid NetID or password. Please verify your credentials and try again.';
          if (err.status === 401) {
            displayMessage = 'Invalid NetID or password. Please verify your credentials and try again.';
          } else if (err.status === 400) {
            displayMessage = err.data?.message || 'Please provide both your NetID and password.';
          } else if (err.status === 404) {
            displayMessage = 'Authentication service is currently unavailable. Please verify the Express backend server is running.';
          } else if (err.status >= 500) {
            displayMessage = 'The server encountered an error during authentication. Please try again later.';
          } else if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
            displayMessage = 'Cannot connect to authentication server. Please check your connection or restart the backend.';
          }

          errorBanner = document.createElement('div');
          errorBanner.className = 'login-error-banner';
          errorBanner.setAttribute('role', 'alert');
          errorBanner.style.cssText = `
            background: #fdf2f2;
            border: 1px solid #f8d7da;
            color: #8c1d1e;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            margin-bottom: 1rem;
          `;
          errorBanner.textContent = displayMessage;
          loginForm.insertBefore(errorBanner, loginForm.querySelector('.form-field'));
        }
      });
    }

    // 2. Handle checkout form submission (new-loan.html)
    const checkoutForm = document.querySelector('form.assignment-form[action*="loans.html"]');
    const isCheckoutPage = window.location.pathname.includes('new-loan') || document.getElementById('equipment-select');
    if (checkoutForm && isCheckoutPage && !checkoutForm.dataset.apiBound) {
      checkoutForm.dataset.apiBound = 'true';
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const borrowerInput = document.getElementById('borrower-name');
        const netidInput = document.getElementById('borrower-netid');
        const eqSelect = document.getElementById('equipment-select');
        const assetTagInput = document.getElementById('asset-tag');
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');

        const loanPayload = {
          borrower: borrowerInput ? borrowerInput.value.trim() : '',
          netid: netidInput ? netidInput.value.trim() : '',
          equipmentId: eqSelect ? eqSelect.value : '',
          assetTag: assetTagInput ? assetTagInput.value.trim() : ''
        };

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Complete checkout';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing checkout...';
        }

        try {
          await apiClient.checkout(loanPayload);
          window.location.href = 'loans.html?checkoutSuccess=' + encodeURIComponent(loanPayload.equipmentId);
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          alert(err.data?.message || err.message || 'Failed to complete checkout');
        }
      });
    }

    // 3. Handle return form submission (return-item.html)
    const isReturnPage = window.location.pathname.includes('return-item') || document.getElementById('loan-select');
    if (checkoutForm && isReturnPage && !checkoutForm.dataset.apiBound) {
      checkoutForm.dataset.apiBound = 'true';
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loanSelect = document.getElementById('loan-select');
        const conditionSelect = document.getElementById('equipment-condition');
        const destinationSelect = document.getElementById('next-destination');
        const notesInput = document.getElementById('return-notes');
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');

        const loanId = loanSelect ? loanSelect.value : '';
        if (!loanId) {
          alert('Please select an open loan to return');
          return;
        }

        const returnPayload = {
          condition: conditionSelect ? conditionSelect.value : 'good',
          destination: destinationSelect ? destinationSelect.value : 'ready-shelf',
          notes: notesInput ? notesInput.value.trim() : ''
        };

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Confirm return';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Processing check-in...';
        }

        try {
          await apiClient.returnItem(loanId, returnPayload);
          if (returnPayload.destination === 'prep-queue') {
            window.location.href = 'preparation-all.html?returnSuccess=' + encodeURIComponent(loanId);
          } else {
            window.location.href = 'loans.html?returnSuccess=' + encodeURIComponent(loanId);
          }
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          alert(err.data?.message || err.message || 'Failed to process return');
        }
      });
    }

    // 4. Handle sign out clicks
    document.querySelectorAll('a[href*="login.html"]').forEach(link => {
      if (link.textContent.toLowerCase().includes('sign out') || link.textContent.toLowerCase().includes('logout')) {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          await apiClient.logout();
          window.location.href = 'login.html';
        });
      }
    });

    // 5. Dynamic Session & Header Synchronization
    syncUserSessionUI();

    // 6. Dynamic Dashboard KPI Synchronization (Overview Page)
    syncDashboardKPIs();

    // 7. Dynamic Equipment Page Synchronization (Equipment Collection)
    syncEquipmentPage();

    // 8. Dynamic Return Form Dropdown (Return Item Page)
    syncReturnSelect();

    // 9. Dynamic Loans Table Metrics (Loans & Returns Page)
    syncLoansTable();

    // 10. Dynamic Borrowers Page Metrics (Borrowers Page)
    syncBorrowersTable();
  }

  async function syncEquipmentPage() {
    const grid = document.querySelector('.equipment-grid');
    if (!grid) return;
    try {
      const res = await apiClient.getEquipment();
      if (!res || !res.equipment) return;
      const eqMap = new Map(res.equipment.map(e => [e.id, e]));
      grid.querySelectorAll('.equipment-card').forEach(card => {
        const p = card.querySelector('p');
        if (!p) return;
        const match = p.textContent.match(/EQ-\d+/);
        if (!match) return;
        const eq = eqMap.get(match[0]);
        if (!eq) return;
        const availEl = card.querySelector('.equipment-availability strong');
        if (availEl) {
          availEl.textContent = `${eq.available} of ${eq.total} available`;
        }
        const badgeEl = card.querySelector('.equipment-availability span');
        if (badgeEl) {
          if (eq.available <= 0) {
            badgeEl.textContent = 'Currently on loan';
            badgeEl.className = 'status-badge in-progress';
          } else {
            badgeEl.textContent = 'Ready to borrow';
            badgeEl.className = 'status-badge ready';
          }
        }
      });
    } catch (e) {
      // Fallback gracefully
    }
  }

  async function syncReturnSelect() {
    const select = document.getElementById('loan-select');
    if (!select) return;
    try {
      const res = await apiClient.getLoans({ status: 'active' });
      if (!res || !res.loans || res.loans.length === 0) return;
      select.innerHTML = '<option value="">Choose an open loan...</option>';
      res.loans.forEach(loan => {
        const opt = document.createElement('option');
        opt.value = loan.id;
        opt.textContent = `${loan.id} · ${loan.borrower} · ${loan.equipmentName || loan.equipmentId} (Due ${loan.dueDate || 'Soon'})`;
        select.appendChild(opt);
      });
    } catch (e) {
      // Fallback gracefully
    }
  }

  async function syncLoansTable() {
    const tableContainer = document.querySelector('.loan-table-container');
    if (!tableContainer) return;
    try {
      const res = await apiClient.getLoans();
      if (!res || !res.loans) return;
      const headingCount = document.querySelector('.section-heading h2');
      const subCount = document.querySelector('.section-heading p');
      if (headingCount) headingCount.textContent = `${res.total} loans`;
      if (subCount) {
        const activeCount = res.loans.filter(l => l.status === 'active' || l.status === 'due-today' || l.status === 'overdue').length;
        const returnedCount = res.loans.filter(l => l.status === 'returned').length;
        subCount.textContent = `${activeCount} open loans · ${returnedCount} returned`;
      }
    } catch (e) {
      // Fallback gracefully
    }
  }

  async function syncBorrowersTable() {
    const borrowerPanel = document.querySelector('.borrower-panel');
    if (!borrowerPanel) return;
    try {
      const res = await apiClient.getBorrowers();
      if (!res || !res.borrowers) return;
      const headingCount = document.getElementById('borrower-list-heading');
      if (headingCount) headingCount.textContent = `${res.total} borrowers`;
    } catch (e) {
      // Fallback gracefully
    }
  }

  function getInitials(name) {
    if (!name) return 'LK';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatCount(num) {
    const n = Number(num) || 0;
    return n < 10 ? `0${n}` : `${n}`;
  }

  function syncUserSessionUI() {
    const user = apiClient.getUser();
    if (!user) return;

    // Update global app-header elements if present
    const appHeader = document.querySelector('app-header');
    if (appHeader) {
      if (user.name) appHeader.setAttribute('user-name', user.name);
      if (user.role) appHeader.setAttribute('user-role', user.role);
      appHeader.setAttribute('user-initials', getInitials(user.name));

      // Also directly update rendered header DOM nodes if custom element rendered
      const headerInitials = appHeader.querySelector('.profile-initials');
      if (headerInitials) headerInitials.textContent = getInitials(user.name);
      const headerName = appHeader.querySelector('.profile-summary strong');
      if (headerName) headerName.textContent = user.name;
      const headerRole = appHeader.querySelector('.profile-summary small');
      if (headerRole) headerRole.textContent = user.role || 'Library staff';
    }

    // Update Overview greeting on index.html
    const overviewHeading = document.getElementById('overview-title');
    if (overviewHeading && user.name) {
      const firstName = user.name.split(' ')[0];
      overviewHeading.innerHTML = `Good afternoon, ${firstName}<span class="text-primary">.</span>`;
    }

    // Update Profile page details on profile.html
    const profileHeading = document.getElementById('user-name-heading');
    if (profileHeading) {
      if (user.name) profileHeading.textContent = user.name;
      const netidDisplay = document.querySelector('.equipment-id');
      if (netidDisplay && user.netid) netidDisplay.textContent = `UAlbany NetID: ${user.netid}`;
      const initialsIcon = document.querySelector('.equipment-detail-icon');
      if (initialsIcon) initialsIcon.textContent = getInitials(user.name);

      // Update definition lists on profile.html
      document.querySelectorAll('.detail-list div').forEach(row => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (!dt || !dd) return;
        const label = dt.textContent.trim().toLowerCase();
        if (label === 'full name' && user.name) dd.textContent = user.name;
        if (label === 'netid' && user.netid) dd.textContent = user.netid;
        if (label === 'official email' && user.email) dd.textContent = user.email;
        if (label === 'university id' && user.universityId) dd.textContent = user.universityId;
        if (label === 'department' && user.department) dd.textContent = user.department;
        if (label === 'division' && user.division) dd.textContent = user.division;
        if (label === 'role' && user.role) dd.textContent = user.role;
        if (label === 'desk station' && user.deskStation) dd.textContent = user.deskStation;
        if (label === 'workstation id' && user.workstationId) dd.textContent = user.workstationId;
      });
    }
  }

  async function syncDashboardKPIs() {
    const statsContainer = document.querySelector('.overview-stats');
    if (!statsContainer) return;

    try {
      const res = await apiClient.getSummaryKPIs();
      if (!res || !res.kpis) return;
      const kpis = res.kpis;

      // Update 4 overview stat cards
      const articles = statsContainer.querySelectorAll('article');
      if (articles.length >= 4) {
        const eqCount = articles[0].querySelector('strong');
        if (eqCount && kpis.totalEquipment != null) eqCount.textContent = formatCount(kpis.totalEquipment);

        const loansCount = articles[1].querySelector('strong');
        if (loansCount && kpis.activeLoans != null) loansCount.textContent = formatCount(kpis.activeLoans);

        const dueCount = articles[2].querySelector('strong');
        if (dueCount && kpis.dueToday != null) dueCount.textContent = formatCount(kpis.dueToday);

        const overdueCount = articles[3].querySelector('strong');
        if (overdueCount && kpis.overdue != null) overdueCount.textContent = formatCount(kpis.overdue);
      }

      // Update preparation report KPI stats on index.html if present
      const prepStats = document.querySelector('.preparation-report-stats');
      if (prepStats && kpis.preparation) {
        const prepBoxes = prepStats.querySelectorAll('div');
        if (prepBoxes.length >= 4) {
          const needsBox = prepBoxes[0].querySelector('strong');
          if (needsBox && kpis.preparation.needsPreparation != null) needsBox.textContent = formatCount(kpis.preparation.needsPreparation);

          const inPrepBox = prepBoxes[1].querySelector('strong');
          if (inPrepBox && kpis.preparation.inPreparation != null) inPrepBox.textContent = formatCount(kpis.preparation.inPreparation);

          const reviewBox = prepBoxes[2].querySelector('strong');
          if (reviewBox && kpis.preparation.awaitingReview != null) reviewBox.textContent = formatCount(kpis.preparation.awaitingReview);

          const readyBox = prepBoxes[3].querySelector('strong');
          if (readyBox && kpis.preparation.readyForLending != null) readyBox.textContent = formatCount(kpis.preparation.readyForLending);
        }
      }
    } catch (e) {
      // Graceful fallback to static HTML content if API is unreachable
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApiFormHooks);
  } else {
    initApiFormHooks();
  }
})();
