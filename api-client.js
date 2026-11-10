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

    // 9. Dynamic New Loan Page (Checkout Form & Live Equipment Options)
    syncNewLoanPage();

    // 10. Dynamic Loans Table Metrics & Rows (Loans & Returns Page)
    syncLoansTable();

    // 11. Dynamic Loan Details View (Loan Details Page)
    syncLoanDetailsPage();

    // 12. Dynamic Borrowers Page Metrics & Rows (Borrowers Page)
    syncBorrowersTable();

    // 13. Dynamic Reports & CSV Statistics (Reports Page)
    syncReportsPage();

    // 14. Dynamic Dashboard Overview Post-Checkout Report (Overview Page)
    syncDashboardOverviewCheckoutReport();

    // 15. Dynamic Notifications Counters (Notifications Page)
    syncNotificationsPage();

    // 16. Dynamic Preparation Workflow Actions (Checklist & Review)
    syncPreparationWorkflow();

    // 17. Dynamic Preparation Queues & Live Search (Preparation Views)
    syncPreparationQueues();

    // 18. Dynamic Dashboard Overview Sections (Overview Page)
    syncDashboardOverviewSections();

    // 19. Dynamic Global Tab Badges (<preparation-tabs> & <loan-tabs>)
    syncGlobalTabBadges();

    // 20. Enforce Purple Styling for Awaiting Review Badges
    enforceReviewBadgeColor();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function enforceReviewBadgeColor() {
    document.querySelectorAll('.status-badge').forEach(badge => {
      const txt = (badge.textContent || '').trim().toLowerCase();
      if (txt === 'awaiting review' || txt === 'review' || txt.includes('review')) {
        badge.classList.add('in-review');
        badge.setAttribute('data-status', 'review');
        badge.style.setProperty('color', '#46166b', 'important');
        badge.style.setProperty('background', '#f1ebf6', 'important');
        badge.style.setProperty('background-color', '#f1ebf6', 'important');
      }
    });
  }

  function debounce(fn, delay = 250) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function getEquipmentIcon(item) {
    const cat = ((item && item.category) || '').toLowerCase();
    const name = ((item && item.name) || '').toLowerCase();
    if (cat.includes('gaming') || name.includes('gamepad') || name.includes('switch') || name.includes('playstation') || name.includes('arcade')) {
      return '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M9 8v4M7 10h4M15 10v.01"></path></svg>';
    }
    if (name.includes('mic') || name.includes('audio') || name.includes('zoom')) {
      return '<svg viewBox="0 0 24 24"><path d="M9 5v8a3 3 0 0 0 6 0V5M7 12a5 5 0 0 0 10 0M12 17v3M9 20h6"></path></svg>';
    }
    if (name.includes('camera') || name.includes('video') || name.includes('owl')) {
      return '<svg viewBox="0 0 24 24"><path d="M4 8h16v11H4zM8 8l1.5-3h5L16 8"></path><circle cx="12" cy="13.5" r="3"></circle></svg>';
    }
    return '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M2 18h20"></path></svg>';
  }

  async function syncEquipmentPage() {
    const grid = document.querySelector('.equipment-grid');
    if (!grid) return;

    const searchInput = document.getElementById('equipment-search');
    const categorySelect = document.querySelector('.equipment-toolbar select') || document.querySelector('select[aria-label="Filter by category"]');
    const countBadge = document.querySelector('.equipment-search-count') || document.querySelector('.equipment-toolbar span');

    async function fetchAndRenderEquipment(searchQuery = '', selectedCategory = '') {
      try {
        const cat = selectedCategory && selectedCategory !== 'All categories' ? selectedCategory : '';
        const res = await apiClient.getEquipment({ search: searchQuery, category: cat });
        if (!res || !res.equipment) return;

        grid.innerHTML = '';
        if (res.equipment.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'equipment-empty-card';
          empty.style.cssText = 'grid-column: 1 / -1; padding: 3rem; text-align: center; color: #6b6474; font-style: italic; background: #fff; border: 1px dashed #cfc5d6; border-radius: 0.6rem;';
          empty.textContent = searchQuery ? `No equipment matches "${searchQuery}"` : 'No equipment available in this category.';
          grid.appendChild(empty);
        } else {
          res.equipment.forEach(item => {
            const article = document.createElement('article');
            article.className = 'equipment-card';
            const isAvail = item.available > 0;
            const badgeClass = isAvail ? 'ready' : 'in-progress';
            const badgeText = isAvail ? 'Ready to borrow' : 'Currently on loan';
            const iconSvg = getEquipmentIcon(item);

            article.innerHTML = `
              <div class="catalog-icon">
                ${iconSvg}
              </div>
              <div>
                <h2>${escapeHtml(item.name)}</h2>
                <p>${escapeHtml(item.id)} · ${escapeHtml(item.category)}</p>
              </div>
              <div class="equipment-availability">
                <strong>${item.available} of ${item.total} available</strong>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
              </div>
              <a class="secondary-action" href="new-loan.html?equipment=${encodeURIComponent(item.id)}">
                Check out
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>
              </a>
            `;
            grid.appendChild(article);
          });
        }

        if (countBadge) {
          countBadge.textContent = `${res.equipment.length} item${res.equipment.length === 1 ? '' : 's'}`;
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    fetchAndRenderEquipment(searchInput ? searchInput.value.trim() : '', categorySelect ? categorySelect.value : '');

    if (searchInput && !searchInput.dataset.apiBound) {
      searchInput.dataset.apiBound = 'true';
      const debouncedSearch = debounce(() => {
        fetchAndRenderEquipment(searchInput.value.trim(), categorySelect ? categorySelect.value : '');
      }, 250);
      searchInput.addEventListener('input', debouncedSearch);
    }

    if (categorySelect && !categorySelect.dataset.apiBound) {
      categorySelect.dataset.apiBound = 'true';
      categorySelect.addEventListener('change', () => {
        fetchAndRenderEquipment(searchInput ? searchInput.value.trim() : '', categorySelect.value);
      });
    }
  }

  async function syncNewLoanPage() {
    const eqSelect = document.getElementById('equipment-select');
    if (!eqSelect) return;
    try {
      const res = await apiClient.getEquipment();
      if (!res || !res.equipment) return;
      const urlParams = new URLSearchParams(window.location.search);
      const preselect = urlParams.get('equipment') || '';

      eqSelect.innerHTML = '<option value="">Choose equipment to check out...</option>';
      res.equipment.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.id} · ${item.name} (${item.available} of ${item.total} available)`;
        if (item.available <= 0) {
          opt.disabled = true;
          opt.textContent += ' [Checked out]';
        }
        if (item.id === preselect) {
          opt.selected = true;
        }
        eqSelect.appendChild(opt);
      });

      // Borrower NetID autofill integration
      const netidInput = document.getElementById('borrower-netid');
      const nameInput = document.getElementById('borrower-name');
      const studentIdInput = document.getElementById('student-id');
      const emailInput = document.getElementById('borrower-email');

      if (netidInput && nameInput && !netidInput.dataset.lookupBound) {
        netidInput.dataset.lookupBound = 'true';
        netidInput.addEventListener('blur', async () => {
          const val = netidInput.value.trim().toLowerCase();
          if (!val) return;
          const bRes = await apiClient.getBorrowers().catch(() => null);
          if (bRes && bRes.borrowers) {
            const b = bRes.borrowers.find(x => x.netid.toLowerCase() === val);
            if (b) {
              if (nameInput && !nameInput.value) nameInput.value = b.name;
              if (studentIdInput && !studentIdInput.value && b.universityId) studentIdInput.value = b.universityId;
              if (emailInput && !emailInput.value && b.email) emailInput.value = b.email;
            }
          }
        });
      }
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
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedLoan = urlParams.get('loan') || '';

      select.innerHTML = '<option value="">Choose an open loan...</option>';
      res.loans.forEach(loan => {
        const opt = document.createElement('option');
        opt.value = loan.id;
        opt.textContent = `${loan.id} · ${loan.borrower} · ${loan.equipmentName || loan.equipmentId} (Due ${loan.dueDate || 'Soon'})`;
        if (loan.id === preselectedLoan) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } catch (e) {
      // Fallback gracefully
    }
  }

  async function syncLoansTable() {
    const tableContainer = document.querySelector('.loan-table-container');
    if (!tableContainer) return;

    const loanSearch = document.getElementById('loan-search');
    const isOverduePage = window.location.pathname.includes('overdue');
    const headingCount = document.querySelector('.section-heading h2');
    const subCount = document.querySelector('.section-heading p');
    const footerCount = document.querySelector('.loan-footer span:first-child');
    const tbody = tableContainer.querySelector('tbody');

    async function fetchAndRenderLoans(query = '') {
      try {
        const params = isOverduePage ? { status: 'overdue' } : {};
        if (query) params.search = query;
        const res = await apiClient.getLoans(params);
        if (!res || !res.loans) return;

        if (headingCount) headingCount.textContent = `${res.total} loans`;
        if (subCount && !query) {
          const activeCount = res.loans.filter(l => l.status === 'active' || l.status === 'due-today' || l.status === 'overdue').length;
          const returnedCount = res.loans.filter(l => l.status === 'returned').length;
          subCount.textContent = `${activeCount} open loans · ${returnedCount} returned`;
        }

        if (footerCount) {
          footerCount.textContent = `Showing ${res.loans.length} of ${res.total} loans`;
        }

        if (tbody) {
          tbody.innerHTML = '';
          if (res.loans.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-message" style="text-align: center; padding: 2rem; color: #6b6474; font-style: italic;">No loans matching "${escapeHtml(query)}"</td></tr>`;
          } else {
            res.loans.forEach(loan => {
              const tr = document.createElement('tr');
              const statusClass = loan.status === 'active' ? 'active' : loan.status === 'due-today' ? 'due' : loan.status === 'overdue' ? 'overdue' : 'returned';
              const statusLabel = loan.status === 'active' ? 'On loan' : loan.status === 'due-today' ? 'Due today' : loan.status === 'overdue' ? 'Overdue' : 'Returned';
              tr.innerHTML = `
                <td>
                  <span class="loan-equipment-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 8h16v11H4zM8 8l1.5-3h5L16 8"></path><circle cx="12" cy="13.5" r="3"></circle></svg>
                  </span>
                  <span class="equipment-details">
                    <strong>${escapeHtml(loan.equipmentName || loan.equipmentId)}</strong>
                    <small>${escapeHtml(loan.equipmentId)} · ${escapeHtml(loan.category || 'Library Equipment')}</small>
                  </span>
                </td>
                <td>NO</td>
                <td>
                  <span class="borrower-cell">
                    <strong>${escapeHtml(loan.borrower)}</strong>
                    <small>${escapeHtml(loan.netid)}</small>
                  </span>
                </td>
                <td>${escapeHtml(loan.checkoutDate || 'Recent')}</td>
                <td>${escapeHtml(loan.dueDate || 'Standard')}</td>
                <td><span class="loan-status ${statusClass}">${statusLabel}</span></td>
                <td>
                  <a class="row-arrow" href="loan-details.html?id=${encodeURIComponent(loan.id)}" aria-label="View loan ${escapeHtml(loan.id)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>
                  </a>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    fetchAndRenderLoans(loanSearch ? loanSearch.value.trim() : '');

    if (loanSearch && !loanSearch.dataset.apiBound) {
      loanSearch.dataset.apiBound = 'true';
      const debounced = debounce(() => {
        fetchAndRenderLoans(loanSearch.value.trim());
      }, 250);
      loanSearch.addEventListener('input', debounced);
    }
  }

  async function syncLoanDetailsPage() {
    const isLoanDetails = window.location.pathname.includes('loan-details');
    if (!isLoanDetails) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const loanId = urlParams.get('id') || 'LN-1042';
      const res = await apiClient.request(`/loans/${loanId}`).catch(() => null);
      if (!res || !res.loan) return;
      const loan = res.loan;

      const heading = document.getElementById('loan-details-heading');
      if (heading) heading.textContent = `Loan record: ${loan.id}`;

      const headingSub = document.querySelector('.page-introduction p');
      if (headingSub && loan.borrower) {
        headingSub.textContent = `Detailed record for active equipment loan to ${loan.borrower}.`;
      }

      const itemName = document.getElementById('item-name');
      if (itemName) itemName.textContent = loan.equipmentName || loan.equipmentId;

      const equipId = document.querySelector('.equipment-id');
      if (equipId) equipId.textContent = `${loan.equipmentId} · ${loan.category || 'Creative Technology'}`;

      const statusBadge = document.querySelector('.loan-status');
      if (statusBadge && loan.status) {
        const sClass = loan.status === 'due-today' ? 'due' : loan.status === 'overdue' ? 'overdue' : 'active';
        const sLabel = loan.status === 'active' ? 'On loan' : loan.status === 'due-today' ? 'Due today' : loan.status === 'overdue' ? 'Overdue' : 'Returned';
        statusBadge.className = `loan-status ${sClass}`;
        statusBadge.textContent = sLabel;
      }

      const targetDueDate = document.querySelector('.equipment-target strong');
      if (targetDueDate && loan.dueDate) targetDueDate.textContent = loan.dueDate;

      // Populate borrower profile information
      let borrowerInfo = null;
      if (loan.borrowerNetId) {
        const bRes = await apiClient.getBorrower(loan.borrowerNetId).catch(() => null);
        if (bRes && bRes.borrower) borrowerInfo = bRes.borrower;
      }

      document.querySelectorAll('.detail-list div').forEach(row => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (!dt || !dd) return;
        const label = dt.textContent.trim().toLowerCase();
        if (label === 'full name' && loan.borrower) dd.textContent = loan.borrower;
        if (label === 'netid' && loan.netid) dd.textContent = loan.netid;
        if (label === 'university id' && (loan.universityId || (borrowerInfo && borrowerInfo.universityId))) {
          dd.textContent = loan.universityId || borrowerInfo.universityId;
        }
        if (label === 'affiliation' && borrowerInfo && borrowerInfo.role) dd.textContent = borrowerInfo.role;
        if (label === 'department' && borrowerInfo && borrowerInfo.department) dd.textContent = borrowerInfo.department;
        if (label === 'email' && (loan.email || (borrowerInfo && borrowerInfo.email))) {
          dd.textContent = loan.email || borrowerInfo.email;
        }
        if (label === 'account standing' && borrowerInfo) {
          const isGood = borrowerInfo.status === 'good';
          dd.innerHTML = `<span class="borrower-status ${isGood ? 'good' : 'warning'}">${isGood ? 'Good standing' : 'Follow-up needed'}</span>`;
        }
        if (label === 'loan id') dd.textContent = loan.id;
        if (label === 'return due date' && loan.dueDate) dd.textContent = `${loan.dueDate} (Standard loan)`;
        if (label === 'checked out' && loan.checkoutDate) dd.textContent = loan.checkoutDate;
        if (label === 'asset barcode' && loan.assetTag) dd.textContent = loan.assetTag;
      });

      const returnActionBtn = document.querySelector('.detail-actions a.primary-action');
      if (returnActionBtn) {
        returnActionBtn.href = `return-item.html?loan=${encodeURIComponent(loan.id)}`;
      }
    } catch (e) {
      // Gracefully preserve static HTML content as fallback
    }
  }

  async function syncBorrowersTable() {
    const borrowerPanel = document.querySelector('.borrower-panel');
    if (!borrowerPanel) return;

    const borrowerSearch = document.getElementById('borrower-search');
    const headingCount = document.getElementById('borrower-list-heading');
    const footerCount = document.querySelector('.borrower-footer span:first-child');
    const tbody = borrowerPanel.querySelector('tbody');

    async function fetchAndRenderBorrowers(query = '') {
      try {
        const params = query ? { search: query } : {};
        const res = await apiClient.getBorrowers(params);
        if (!res || !res.borrowers) return;

        if (headingCount) headingCount.textContent = `${res.total} borrowers`;
        if (footerCount) {
          footerCount.textContent = `Showing ${res.borrowers.length} of ${res.total} borrowers`;
        }

        if (tbody) {
          tbody.innerHTML = '';
          if (res.borrowers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty-message" style="text-align: center; padding: 2rem; color: #6b6474; font-style: italic;">No borrowers matching "${escapeHtml(query)}"</td></tr>`;
          } else {
            res.borrowers.forEach(b => {
              const tr = document.createElement('tr');
              const isOverdue = b.status === 'restricted' || (b.openLoans > 0 && b.hasOverdue);
              const statusClass = isOverdue ? 'overdue' : 'good';
              const statusLabel = isOverdue ? 'Overdue item' : 'Good standing';
              const initials = getInitials(b.name);
              tr.innerHTML = `
                <td>
                  <span class="borrower-profile">
                    <span class="borrower-initials">${initials}</span>
                    <strong>${escapeHtml(b.name)}</strong>
                  </span>
                </td>
                <td>${escapeHtml(b.universityId || b.netid)}</td>
                <td>${b.openLoans != null ? b.openLoans : 0}</td>
                <td><span class="borrower-status ${statusClass}">${statusLabel}</span></td>
                <td>
                  <a class="row-arrow" href="loans.html" aria-label="View ${escapeHtml(b.name)}'s loans">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>
                  </a>
                </td>
              `;
              tbody.appendChild(tr);
            });
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    fetchAndRenderBorrowers(borrowerSearch ? borrowerSearch.value.trim() : '');

    if (borrowerSearch && !borrowerSearch.dataset.apiBound) {
      borrowerSearch.dataset.apiBound = 'true';
      const debounced = debounce(() => {
        fetchAndRenderBorrowers(borrowerSearch.value.trim());
      }, 250);
      borrowerSearch.addEventListener('input', debounced);
    }
  }

  async function syncReportsPage() {
    const reportTable = document.getElementById('report-rows');
    if (!reportTable) return;

    const semesterSelect = document.getElementById('report-semester');
    const fromInput = document.getElementById('report-from');
    const toInput = document.getElementById('report-to');
    const searchInput = document.getElementById('report-search');
    const runBtn = document.getElementById('btn-run-report');
    const summarySemester = document.getElementById('summary-semester');
    const summaryDateRange = document.getElementById('summary-date-range');
    const summaryTotals = document.getElementById('summary-totals');
    const footerCount = document.querySelector('.checkout-report div span') || document.querySelector('.checkout-report span');

    function formatDateRange(fromStr, toStr) {
      if (!fromStr || !toStr) return '';
      try {
        const [y1, m1, d1] = fromStr.split('-').map(Number);
        const [y2, m2, d2] = toStr.split('-').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${mNames[date1.getMonth()]} ${date1.getDate()}, ${date1.getFullYear()} – ${mNames[date2.getMonth()]} ${date2.getDate()}, ${date2.getFullYear()}`;
      } catch (e) {
        return `${fromStr} – ${toStr}`;
      }
    }

    async function loadReports(isManualRun = false) {
      if (runBtn && isManualRun) {
        runBtn.disabled = true;
        runBtn.textContent = 'Generating report...';
      }

      try {
        const semester = semesterSelect ? semesterSelect.value : 'fall-2026';
        const from = fromInput ? fromInput.value : '';
        const to = toInput ? toInput.value : '';
        const search = searchInput ? searchInput.value.trim() : '';

        // Update summary display
        if (summarySemester && semesterSelect) {
          const selectedOption = semesterSelect.options[semesterSelect.selectedIndex];
          summarySemester.textContent = selectedOption ? selectedOption.textContent : 'Fall 2026 (current)';
        }
        if (summaryDateRange && from && to) {
          summaryDateRange.textContent = formatDateRange(from, to);
        }

        const queryParams = { semester };
        if (from) queryParams.from = from;
        if (to) queryParams.to = to;
        if (search) queryParams.search = search;

        const res = await apiClient.getReports(queryParams);
        if (!res || !res.reports) return;

        reportTable.innerHTML = '';
        let totalCheckouts = 0;
        let totalDays = 0;

        if (res.reports.length === 0) {
          reportTable.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #6b6474; font-style: italic;">No equipment checkout records found for the selected timeframe.</td></tr>`;
          if (summaryTotals) {
            summaryTotals.innerHTML = `<strong>0</strong> checkouts · <strong>0.0</strong> days on average`;
          }
          if (footerCount) {
            footerCount.textContent = `Showing 0 active equipment checkout records`;
          }
        } else {
          res.reports.forEach(r => {
            totalCheckouts += (r.checkouts || 0);
            totalDays += (r.totalDays || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>
                <strong>${escapeHtml(r.name)}</strong>
                <small>${escapeHtml(r.id)}</small>
              </td>
              <td>${escapeHtml(r.category)}</td>
              <td><strong>${r.checkouts}</strong></td>
              <td>${r.avgDays} days</td>
              <td>${r.totalDays} days</td>
              <td style="text-align: right">
                <button type="button" class="secondary-action" style="padding: 0.35rem 0.65rem; font-size: 0.75rem"
                  data-name="${escapeHtml(r.name)}" data-id="${escapeHtml(r.id)}" data-checkouts="${r.checkouts}" data-avg="${r.avgDays}" data-total="${r.totalDays}">
                  Download CSV
                </button>
              </td>
            `;
            reportTable.appendChild(tr);
          });

          if (summaryTotals) {
            const avg = totalCheckouts > 0 ? (totalDays / totalCheckouts).toFixed(1) : '0.0';
            summaryTotals.innerHTML = `<strong>${totalCheckouts}</strong> checkouts · <strong>${avg}</strong> days on average`;
          }

          if (footerCount) {
            footerCount.textContent = `Showing ${res.reports.length} active equipment checkout records`;
          }

          // Attach CSV download handlers for each row
          reportTable.querySelectorAll('button[data-name]').forEach(btn => {
            btn.addEventListener('click', () => {
              if (typeof window.downloadCsv === 'function') {
                window.downloadCsv(btn.dataset.name, btn.dataset.id, btn.dataset.checkouts, btn.dataset.avg, btn.dataset.total);
              }
            });
          });
        }

        // Dynamically update full export function
        window.downloadFullReport = function () {
          const rows = document.querySelectorAll('#report-rows tr');
          let csv = 'Equipment,ID,Category,Total Checkouts,Average Length,Total Days Out\n';
          rows.forEach(function (row) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
              const nameEl = cells[0].querySelector('strong');
              const idEl = cells[0].querySelector('small');
              if (!nameEl || !idEl) return;
              const name = nameEl.textContent.trim();
              const id = idEl.textContent.trim();
              const cat = cells[1].textContent.trim();
              const count = cells[2].textContent.trim();
              const avg = cells[3].textContent.trim();
              const total = cells[4].textContent.trim();
              csv += `"${name}","${id}","${cat}",${count},"${avg}","${total}"\n`;
            }
          });
          const sem = (summarySemester?.textContent || 'report').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ualbany_library_checkout_${sem}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        };

        if (runBtn && isManualRun) {
          runBtn.textContent = '✓ Report updated';
          setTimeout(() => {
            runBtn.disabled = false;
            runBtn.textContent = 'Run report';
          }, 1500);
        }
      } catch (e) {
        if (runBtn && isManualRun) {
          runBtn.disabled = false;
          runBtn.textContent = 'Run report';
        }
      }
    }

    loadReports(false);

    if (runBtn && !runBtn.dataset.apiBound) {
      runBtn.dataset.apiBound = 'true';
      runBtn.addEventListener('click', () => loadReports(true));
    }

    if (semesterSelect && !semesterSelect.dataset.apiBound) {
      semesterSelect.dataset.apiBound = 'true';
      semesterSelect.addEventListener('change', () => {
        if (fromInput && toInput) {
          if (semesterSelect.value === 'fall-2026') {
            fromInput.value = '2026-08-24';
            toInput.value = '2026-12-18';
          } else if (semesterSelect.value === 'summer-2026') {
            fromInput.value = '2026-05-18';
            toInput.value = '2026-08-14';
          } else if (semesterSelect.value === 'spring-2026') {
            fromInput.value = '2026-01-20';
            toInput.value = '2026-05-15';
          }
        }
        loadReports(false);
      });
    }

    if (searchInput && !searchInput.dataset.apiBound) {
      searchInput.dataset.apiBound = 'true';
      const debounced = debounce(() => loadReports(false), 250);
      searchInput.addEventListener('input', debounced);
    }
  }

  async function syncDashboardOverviewCheckoutReport() {
    const reportTable = document.getElementById('overview-report-rows');
    if (!reportTable) return;

    const semesterSelect = document.getElementById('overview-report-semester');
    const fromInput = document.getElementById('overview-report-from');
    const toInput = document.getElementById('overview-report-to');
    const runBtn = document.getElementById('overview-btn-run-report');
    const summarySemester = document.getElementById('overview-summary-semester');
    const summaryDates = document.getElementById('overview-summary-dates');
    const summaryTotals = document.getElementById('overview-summary-totals');

    function formatDateRange(fromStr, toStr) {
      if (!fromStr || !toStr) return '';
      try {
        const [y1, m1, d1] = fromStr.split('-').map(Number);
        const [y2, m2, d2] = toStr.split('-').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date1.getDate()} ${mNames[date1.getMonth()]} ${date1.getFullYear()} – ${date2.getDate()} ${mNames[date2.getMonth()]} ${date2.getFullYear()}`;
      } catch (e) {
        return `${fromStr} – ${toStr}`;
      }
    }

    async function loadOverviewReport(isManual = false) {
      if (runBtn && isManual) {
        runBtn.disabled = true;
        runBtn.textContent = 'Generating report...';
      }

      try {
        const semester = semesterSelect ? semesterSelect.value : 'fall-2026';
        const from = fromInput ? fromInput.value : '';
        const to = toInput ? toInput.value : '';

        if (summarySemester && semesterSelect) {
          const opt = semesterSelect.options[semesterSelect.selectedIndex];
          summarySemester.textContent = opt ? opt.textContent : 'Fall 2026 (current)';
        }
        if (summaryDates && from && to) {
          summaryDates.textContent = formatDateRange(from, to);
        }

        const queryParams = { semester };
        if (from) queryParams.from = from;
        if (to) queryParams.to = to;

        const res = await apiClient.getReports(queryParams);
        if (!res || !res.reports) return;

        reportTable.innerHTML = '';
        let totalCheckouts = 0;
        let totalDays = 0;

        if (res.reports.length === 0) {
          reportTable.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b6474; font-style: italic;">No checkout history found for this timeframe.</td></tr>`;
          if (summaryTotals) {
            summaryTotals.textContent = '0 checkouts · 0.0 days avg';
          }
        } else {
          res.reports.slice(0, 8).forEach(r => {
            totalCheckouts += (r.checkouts || 0);
            totalDays += (r.totalDays || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${escapeHtml(r.name)} <small>${escapeHtml(r.id)}</small></td>
              <td>${r.checkouts}</td>
              <td>${r.avgDays} days</td>
              <td>${r.totalDays} days</td>
            `;
            reportTable.appendChild(tr);
          });

          if (summaryTotals) {
            const avg = totalCheckouts > 0 ? (totalDays / totalCheckouts).toFixed(1) : '0.0';
            summaryTotals.textContent = `${totalCheckouts} checkouts · ${avg} days avg`;
          }
        }

        if (runBtn && isManual) {
          runBtn.textContent = '✓ Report updated';
          setTimeout(() => {
            runBtn.disabled = false;
            runBtn.textContent = '▷ Run report';
          }, 1500);
        }
      } catch (e) {
        if (runBtn && isManual) {
          runBtn.disabled = false;
          runBtn.textContent = '▷ Run report';
        }
      }
    }

    loadOverviewReport(false);

    if (runBtn && !runBtn.dataset.apiBound) {
      runBtn.dataset.apiBound = 'true';
      runBtn.addEventListener('click', () => loadOverviewReport(true));
    }

    if (semesterSelect && !semesterSelect.dataset.apiBound) {
      semesterSelect.dataset.apiBound = 'true';
      semesterSelect.addEventListener('change', () => {
        if (fromInput && toInput) {
          if (semesterSelect.value === 'fall-2026') {
            fromInput.value = '2026-08-24';
            toInput.value = '2026-12-18';
          } else if (semesterSelect.value === 'summer-2026') {
            fromInput.value = '2026-05-18';
            toInput.value = '2026-08-14';
          } else if (semesterSelect.value === 'spring-2026') {
            fromInput.value = '2026-01-20';
            toInput.value = '2026-05-15';
          }
        }
        loadOverviewReport(false);
      });
    }
  }

  async function syncPreparationQueues() {
    const prepPanel = document.querySelector('.preparation-panel');
    if (!prepPanel) return;
    const table = prepPanel.querySelector('table');
    if (!table) return;

    const prepSearch = document.getElementById('preparation-search');
    const countBadge = prepPanel.querySelector('.table-tools span:last-child') || prepPanel.querySelector('.table-tools span');
    const tbody = table.querySelector('tbody');

    const tabs = document.querySelector('preparation-tabs');
    const activeTab = tabs ? (tabs.getAttribute('active') || '').toLowerCase() : '';
    const p = window.location.pathname.toLowerCase();
    let statusFilter = '';
    if (activeTab === 'all' || p.includes('all')) {
      statusFilter = '';
    } else if (activeTab === 'awaiting' || (!activeTab && p.endsWith('preparation.html'))) {
      statusFilter = 'awaiting';
    } else if (activeTab === 'in-prep' || activeTab === 'in preparation' || p.includes('progress')) {
      statusFilter = 'in-prep';
    } else if (activeTab === 'review' || p.includes('review')) {
      statusFilter = 'review';
    } else if (activeTab === 'ready' || p.includes('ready')) {
      statusFilter = 'ready';
    }

    async function fetchAndRenderPrep(query = '') {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (query) params.search = query;
        const res = await apiClient.getPreparation(params);
        if (!res || !res.preparation) return;

        if (countBadge) {
          countBadge.textContent = `${res.preparation.length} item${res.preparation.length === 1 ? '' : 's'}`;
        }

        if (tbody) {
          tbody.innerHTML = '';
          if (res.preparation.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty-message" style="text-align: center; padding: 2rem; color: #6b6474; font-style: italic;">No equipment in preparation matching "${escapeHtml(query)}"</td></tr>`;
          } else {
            const footerSpan = prepPanel.querySelector('.table-footer span');
            const footerBtn = prepPanel.querySelector('.table-footer a.primary-action');

            res.preparation.forEach((item, index) => {
              const tr = document.createElement('tr');
              const isSelected = (index === 0);
              const isReview = (item.status === 'review' || item.status === 'in-review');
              const badgeClass = item.status === 'in-prep' ? 'in-progress' : item.status === 'ready' ? 'ready' : isReview ? 'in-review' : '';
              const badgeLabel = item.status === 'awaiting' ? 'Needs preparation' : item.status === 'in-prep' ? 'In preparation' : isReview ? 'Awaiting review' : 'Ready for lending';

              let actionLink = `preparation-details.html?id=${encodeURIComponent(item.equipmentId || item.id)}`;
              if (item.status === 'in-prep') actionLink = `preparation-checklist.html?id=${encodeURIComponent(item.equipmentId || item.id)}`;
              else if (isReview) actionLink = `preparation-review-details.html?id=${encodeURIComponent(item.equipmentId || item.id)}`;
              else if (item.status === 'ready') actionLink = `preparation-details.html?id=${encodeURIComponent(item.equipmentId || item.id)}`;

              let iconSvg = '<svg viewBox="0 0 24 24"><path d="M4 8h16v11H4zM8 8l1.5-3h5L16 8"></path><circle cx="12" cy="13.5" r="3"></circle></svg>';
              const nameLower = (item.equipmentName || '').toLowerCase();
              if (nameLower.includes('console') || nameLower.includes('playstation') || nameLower.includes('switch') || nameLower.includes('gamepad')) {
                iconSvg = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M8 10v4M6 12h4M16 10v.01M18 12v.01"></path></svg>';
              } else if (nameLower.includes('audio') || nameLower.includes('podcasting') || nameLower.includes('microphone') || nameLower.includes('mic') || nameLower.includes('zoom')) {
                iconSvg = '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2"></rect><path d="M10 8h4M10 12h4M10 16h4"></path></svg>';
              } else if (nameLower.includes('owl') || nameLower.includes('conference')) {
                iconSvg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle></svg>';
              }

              tr.dataset.equipmentId = item.equipmentId || item.id;
              tr.dataset.actionLink = actionLink;
              if (isSelected) tr.classList.add('selected-row');

              tr.innerHTML = `
                <td>
                  <span class="selection-circle ${isSelected ? 'selected' : ''}" role="radio" aria-checked="${isSelected}" aria-label="${escapeHtml(item.equipmentName)} selected"></span>
                  <span class="equipment-icon" aria-hidden="true">${iconSvg}</span>
                  <span class="equipment-details">
                    <strong>${escapeHtml(item.equipmentName)}</strong>
                    <small>${escapeHtml(item.equipmentId || item.id)}</small>
                  </span>
                </td>
                <td><span class="status-badge ${badgeClass}" ${isReview ? 'data-status="review"' : ''}>${badgeLabel}</span></td>
                <td>${escapeHtml(item.assignedStaff || 'Unassigned')}</td>
                <td>${escapeHtml(item.targetDate || 'Pending')}</td>
                <td>
                  <a class="row-arrow" href="${actionLink}" aria-label="View ${escapeHtml(item.equipmentName)} details">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>
                  </a>
                </td>
              `;

              tr.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                tbody.querySelectorAll('tr').forEach(r => {
                  r.classList.remove('selected-row');
                  const c = r.querySelector('.selection-circle');
                  if (c) {
                    c.classList.remove('selected');
                    c.setAttribute('aria-checked', 'false');
                  }
                });
                tr.classList.add('selected-row');
                const c = tr.querySelector('.selection-circle');
                if (c) {
                  c.classList.add('selected');
                  c.setAttribute('aria-checked', 'true');
                }
                const eqId = tr.dataset.equipmentId;
                const link = tr.dataset.actionLink;
                if (footerSpan && eqId) footerSpan.textContent = `${eqId} selected`;
                if (footerBtn && link) footerBtn.href = link;
              });

              tbody.appendChild(tr);
            });

            if (footerSpan && res.preparation.length > 0) {
              const first = res.preparation[0];
              footerSpan.textContent = `${first.equipmentId || first.id} selected`;
              if (footerBtn) {
                let firstLink = `preparation-details.html?id=${encodeURIComponent(first.equipmentId || first.id)}`;
                if (first.status === 'in-prep') firstLink = `preparation-checklist.html?id=${encodeURIComponent(first.equipmentId || first.id)}`;
                else if (first.status === 'review') firstLink = `preparation-review-details.html?id=${encodeURIComponent(first.equipmentId || first.id)}`;
                footerBtn.href = firstLink;
              }
            }

            enforceReviewBadgeColor();
            syncGlobalTabBadges();
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    fetchAndRenderPrep(prepSearch ? prepSearch.value.trim() : '');

    if (prepSearch && !prepSearch.dataset.apiBound) {
      prepSearch.dataset.apiBound = 'true';
      const debounced = debounce(() => {
        fetchAndRenderPrep(prepSearch.value.trim());
      }, 250);
      prepSearch.addEventListener('input', debounced);
    }
  }

  async function syncDashboardOverviewSections() {
    // 1. Preparation queue reporting on index.html
    const prepContainer = document.getElementById('overview-prep-rows');
    const prepSearch = document.getElementById('preparation-search');
    const prepCount = document.getElementById('overview-prep-count');
    const prepStats = document.getElementById('overview-prep-stats');

    async function fetchAndRenderOverviewPrep(query = '') {
      const isOverview = document.querySelector('.preparation-report');
      if (!isOverview) return;
      try {
        const params = query ? { search: query } : {};
        const [prepRes, kpiRes] = await Promise.all([
          apiClient.getPreparation(params),
          apiClient.getSummaryKPIs().catch(() => null)
        ]);

        if (kpiRes && kpiRes.kpis && prepStats) {
          const pk = kpiRes.kpis.preparation || {};
          const divs = prepStats.querySelectorAll('div strong');
          if (divs.length >= 4) {
            if (pk.needsPreparation != null) divs[0].textContent = String(pk.needsPreparation).padStart(2, '0');
            if (pk.inPreparation != null) divs[1].textContent = String(pk.inPreparation).padStart(2, '0');
            if (pk.awaitingReview != null) divs[2].textContent = String(pk.awaitingReview).padStart(2, '0');
            if (pk.readyForLending != null) divs[3].textContent = String(pk.readyForLending).padStart(2, '0');
          }
        }

        if (!prepRes || !prepRes.preparation) return;

        if (prepCount) {
          prepCount.textContent = `Showing ${Math.min(prepRes.preparation.length, 8)} of ${prepRes.total || prepRes.preparation.length} items`;
        }

        if (prepContainer) {
          prepContainer.innerHTML = '';
        } else {
          document.querySelectorAll('.preparation-report-row, .prep-search-empty').forEach(el => el.remove());
        }

        if (prepRes.preparation.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'prep-search-empty';
          empty.style.cssText = 'padding: 2rem; text-align: center; color: #6b6474; font-style: italic;';
          empty.textContent = `No preparation items matching "${escapeHtml(query)}"`;
          if (prepContainer) {
            prepContainer.appendChild(empty);
          } else {
            document.querySelector('.preparation-report-tools')?.insertAdjacentElement('afterend', empty);
          }
        } else {
          let prev = document.querySelector('.preparation-report-tools');
          prepRes.preparation.slice(0, 8).forEach(item => {
            const row = document.createElement('div');
            row.className = 'preparation-report-row';
            const isReview = (item.status === 'review' || item.status === 'in-review');
            const badgeClass = item.status === 'in-prep' ? 'in-progress' : item.status === 'ready' ? 'ready' : isReview ? 'in-review' : '';
            const badgeLabel = item.status === 'awaiting' ? 'Needs preparation' : item.status === 'in-prep' ? 'In preparation' : isReview ? 'Awaiting review' : 'Ready for lending';

            row.innerHTML = `
              <div>
                <strong>${escapeHtml(item.equipmentName)}</strong>
                <small>${escapeHtml(item.equipmentId || item.id)} · ${item.currentStep || 0} of 4 steps complete</small>
              </div>
              <span>${escapeHtml(item.assignedStaff || 'Unassigned')}</span>
              <time datetime="${escapeHtml(item.targetDate || '')}">${escapeHtml(item.targetDate || 'Pending')}</time>
              <em class="status-badge ${badgeClass}" ${isReview ? 'data-status="review"' : ''}>${badgeLabel}</em>
            `;

            if (prepContainer) {
              prepContainer.appendChild(row);
            } else if (prev) {
              prev.insertAdjacentElement('afterend', row);
              prev = row;
            }
          });

          enforceReviewBadgeColor();
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    if (document.querySelector('.preparation-report')) {
      fetchAndRenderOverviewPrep(prepSearch ? prepSearch.value.trim() : '');
    }

    if (prepSearch && !prepSearch.dataset.apiBound) {
      prepSearch.dataset.apiBound = 'true';
      const debouncedPrep = debounce(() => {
        fetchAndRenderOverviewPrep(prepSearch.value.trim());
      }, 250);
      prepSearch.addEventListener('input', debouncedPrep);
    }

    // 2. Recent loans on index.html
    const loanSearch = document.getElementById('overview-loans-search') || document.querySelector('.overview-loans input[type="search"]');
    const loansTbody = document.getElementById('overview-loans-rows') || document.querySelector('.overview-loans table tbody');
    const loansStats = document.getElementById('overview-loans-stats') || document.querySelector('.overview-loans .loan-toolbar span');

    async function fetchAndRenderOverviewLoans(query = '') {
      if (!loansTbody) return;
      try {
        const [loanRes, kpiRes] = await Promise.all([
          apiClient.getLoans(query ? { search: query } : {}),
          apiClient.getSummaryKPIs().catch(() => null)
        ]);

        if (kpiRes && kpiRes.kpis && loansStats && !query) {
          const k = kpiRes.kpis;
          loansStats.innerHTML = `All loans <b>${k.activeLoans != null ? k.activeLoans : 5}</b> &nbsp; Due today <b>${k.dueToday != null ? k.dueToday : 2}</b> &nbsp; Overdue <b>${k.overdue != null ? k.overdue : 1}</b>`;
        }

        if (!loanRes || !loanRes.loans) return;

        loansTbody.innerHTML = '';
        if (loanRes.loans.length === 0) {
          loansTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b6474; font-style: italic;">No loans matching "${escapeHtml(query)}"</td></tr>`;
        } else {
          loanRes.loans.slice(0, 5).forEach(loan => {
            const tr = document.createElement('tr');
            const statusClass = loan.status === 'due-today' ? 'due' : loan.status === 'overdue' ? 'overdue' : '';
            const statusLabel = loan.status === 'active' ? 'On loan' : loan.status === 'due-today' ? 'Due today' : loan.status === 'overdue' ? 'Overdue' : 'Returned';
            const isOverdue = (loan.status === 'overdue');

            tr.innerHTML = `
              <td>
                <strong>${escapeHtml(loan.equipmentName || loan.equipmentId)}</strong>
                <small>${escapeHtml(loan.equipmentId)} · ${escapeHtml(loan.category || 'Creative Technology')}</small>
              </td>
              <td>
                <strong>${escapeHtml(loan.borrower)}</strong>
                <small>${escapeHtml(loan.universityId || loan.netid)}</small>
              </td>
              <td>${escapeHtml(loan.checkoutDate || 'Oct 9, 2026')}</td>
              <td class="${isOverdue ? 'overdue-text' : ''}">${escapeHtml(loan.dueDate || 'Oct 13, 2026')}</td>
              <td><em class="loan-pill ${statusClass}">${statusLabel}</em></td>
            `;
            loansTbody.appendChild(tr);
          });
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    if (loansTbody) {
      fetchAndRenderOverviewLoans(loanSearch ? loanSearch.value.trim() : '');
    }

    if (loanSearch && !loanSearch.dataset.apiBound) {
      loanSearch.dataset.apiBound = 'true';
      const debouncedLoan = debounce(() => {
        fetchAndRenderOverviewLoans(loanSearch.value.trim());
      }, 250);
      loanSearch.addEventListener('input', debouncedLoan);
    }
  }

  async function syncNotificationsPage() {
    const isNotifications = window.location.pathname.includes('notifications');
    if (!isNotifications) return;
    try {
      const [kpiRes, overdueRes, dueRes, prepRes] = await Promise.all([
        apiClient.getSummaryKPIs().catch(() => null),
        apiClient.getLoans({ status: 'overdue' }).catch(() => null),
        apiClient.getLoans({ status: 'due-today' }).catch(() => null),
        apiClient.getPreparation({ status: 'awaiting' }).catch(() => null)
      ]);

      const overdueLoans = (overdueRes && overdueRes.loans) || [];
      const dueLoans = (dueRes && dueRes.loans) || [];
      const prepItems = (prepRes && prepRes.preparation) || [];
      const totalAlerts = overdueLoans.length + dueLoans.length + prepItems.length;

      // Update tab counter badges
      const tabs = document.querySelectorAll('.tabs .tab-link');
      if (tabs.length >= 4) {
        const allBadge = tabs[0].querySelector('span');
        if (allBadge) allBadge.textContent = totalAlerts;

        const overdueBadge = tabs[1].querySelector('span');
        if (overdueBadge) overdueBadge.textContent = overdueLoans.length;

        const dueBadge = tabs[2].querySelector('span');
        if (dueBadge) dueBadge.textContent = dueLoans.length;

        const prepBadge = tabs[3].querySelector('span');
        if (prepBadge) prepBadge.textContent = prepItems.length;
      }

      // Populate notifications list dynamically from live database records
      const listContainer = document.querySelector('.notifications-list');
      if (listContainer && (overdueLoans.length > 0 || dueLoans.length > 0 || prepItems.length > 0)) {
        listContainer.innerHTML = '';

        // Overdue alerts
        overdueLoans.forEach(loan => {
          const card = document.createElement('article');
          card.className = 'alert-card';
          card.dataset.category = 'overdue';
          card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #fff; border: 1px solid #fad2cf; border-left: 4px solid #d9383a; border-radius: 0.5rem; gap: 1rem';
          card.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: flex-start">
              <span style="display: grid; width: 2.25rem; height: 2.25rem; place-items: center; background: #fdf2f2; color: #d9383a; border-radius: 50%; font-weight: bold; flex-shrink: 0">!</span>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem">
                  <strong style="color: #252525; font-size: 0.95rem">Overdue loan: ${escapeHtml(loan.borrower)}</strong>
                  <span class="loan-status overdue">Overdue</span>
                </div>
                <p style="margin: 0 0 0.35rem; color: #5f6872; font-size: 0.85rem">
                  ${escapeHtml(loan.equipmentName || loan.equipmentId)} (${escapeHtml(loan.equipmentId)}) was due on ${escapeHtml(loan.dueDate)}. University ID: ${escapeHtml(loan.universityId || loan.netid)}.
                </p>
                <small style="color: #8c8295; font-size: 0.75rem">Checked out: ${escapeHtml(loan.checkoutDate)}</small>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-shrink: 0">
              <a class="primary-action" href="return-item.html?loan=${encodeURIComponent(loan.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">Process return</a>
              <a class="secondary-action" href="loan-details.html?id=${encodeURIComponent(loan.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">View loan</a>
            </div>
          `;
          listContainer.appendChild(card);
        });

        // Due today alerts
        dueLoans.forEach(loan => {
          const card = document.createElement('article');
          card.className = 'alert-card';
          card.dataset.category = 'due';
          card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #fff; border: 1px solid #fdecc8; border-left: 4px solid #d97706; border-radius: 0.5rem; gap: 1rem';
          card.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: flex-start">
              <span style="display: grid; width: 2.25rem; height: 2.25rem; place-items: center; background: #fef9ee; color: #d97706; border-radius: 50%; font-weight: bold; flex-shrink: 0">&#128337;</span>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem">
                  <strong style="color: #252525; font-size: 0.95rem">Due today: ${escapeHtml(loan.borrower)}</strong>
                  <span class="loan-status due">Due today</span>
                </div>
                <p style="margin: 0 0 0.35rem; color: #5f6872; font-size: 0.85rem">
                  ${escapeHtml(loan.equipmentName || loan.equipmentId)} (${escapeHtml(loan.equipmentId)}) is expected back by closing. University ID: ${escapeHtml(loan.universityId || loan.netid)}.
                </p>
                <small style="color: #8c8295; font-size: 0.75rem">Checked out: ${escapeHtml(loan.checkoutDate)}</small>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-shrink: 0">
              <a class="primary-action" href="return-item.html?loan=${encodeURIComponent(loan.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">Process return</a>
              <a class="secondary-action" href="loan-details.html?id=${encodeURIComponent(loan.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">View loan</a>
            </div>
          `;
          listContainer.appendChild(card);
        });

        // Awaiting preparation alerts
        prepItems.forEach(item => {
          const card = document.createElement('article');
          card.className = 'alert-card';
          card.dataset.category = 'prep';
          card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #fff; border: 1px solid #e4dfea; border-left: 4px solid #46166b; border-radius: 0.5rem; gap: 1rem';
          card.innerHTML = `
            <div style="display: flex; gap: 1rem; align-items: flex-start">
              <span style="display: grid; width: 2.25rem; height: 2.25rem; place-items: center; background: #f1ebf6; color: #46166b; border-radius: 50%; font-weight: bold; flex-shrink: 0">&#9881;</span>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem">
                  <strong style="color: #252525; font-size: 0.95rem">Preparation required: ${escapeHtml(item.equipmentName)}</strong>
                  <span class="status-badge" style="color: #a4262c; background: #fde8e8">Needs preparation</span>
                </div>
                <p style="margin: 0 0 0.35rem; color: #5f6872; font-size: 0.85rem">
                  ${escapeHtml(item.equipmentId || item.id)} is awaiting staff assignment. Target completion date: ${escapeHtml(item.targetDate || 'Pending')}.
                </p>
                <small style="color: #8c8295; font-size: 0.75rem">${escapeHtml(item.notes || 'Awaiting assignment')}</small>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-shrink: 0">
              <a class="primary-action" href="preparation-assignment.html?id=${encodeURIComponent(item.equipmentId || item.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">Assign task</a>
              <a class="secondary-action" href="preparation-details.html?id=${encodeURIComponent(item.equipmentId || item.id)}" style="padding: 0.45rem 0.85rem; font-size: 0.8rem">View item</a>
            </div>
          `;
          listContainer.appendChild(card);
        });
      }
    } catch (e) {
      // Gracefully preserve static HTML content as fallback
    }
  }

  async function syncPreparationWorkflow() {
    const isDetails = window.location.pathname.includes('preparation-details') && !window.location.pathname.includes('review');
    const isAssignment = window.location.pathname.includes('preparation-assignment');
    const isChecklist = window.location.pathname.includes('preparation-checklist');
    const isReview = window.location.pathname.includes('preparation-review-details');

    if (!isDetails && !isAssignment && !isChecklist && !isReview) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id') || 'EQ-014';

      const res = await apiClient.getPreparation().catch(() => null);
      if (!res || !res.preparation || res.preparation.length === 0) return;

      const item = res.preparation.find(p => (p.equipmentId && p.equipmentId.toLowerCase() === idParam.toLowerCase()) || (p.id && p.id.toLowerCase() === idParam.toLowerCase())) || res.preparation[0];
      if (!item) return;

      const currentId = item.equipmentId || item.id;
      const targetPrepId = item.id;

      // Common header elements across steps 1-4
      const nameHeading = document.getElementById('equipment-name');
      if (nameHeading) nameHeading.textContent = item.equipmentName;

      const idDisplay = document.querySelector('.equipment-id');
      if (idDisplay) idDisplay.textContent = `${item.equipmentId || item.id} · University Library`;

      const targetDateEl = document.querySelector('.equipment-target strong');
      if (targetDateEl && item.targetDate) targetDateEl.textContent = item.targetDate;

      const iconContainer = document.querySelector('.equipment-detail-icon');
      if (iconContainer) iconContainer.innerHTML = getEquipmentIcon({ category: item.category, name: item.equipmentName });

      const headerBadge = document.querySelector('.equipment-detail-heading .status-badge');
      if (headerBadge) {
        const isRev = (item.status === 'review' || item.status === 'in-review');
        const bClass = item.status === 'in-prep' ? 'in-progress' : item.status === 'ready' ? 'ready' : isRev ? 'in-review' : '';
        const bLabel = item.status === 'awaiting' ? 'Needs preparation' : item.status === 'in-prep' ? 'In preparation' : isRev ? 'Awaiting review' : 'Ready for lending';
        headerBadge.className = `status-badge ${bClass}`.trim();
        headerBadge.textContent = bLabel;
        if (isRev) headerBadge.setAttribute('data-status', 'review');
      }

      // Step 1: Equipment Details View
      if (isDetails) {
        document.querySelectorAll('.detail-list div').forEach(row => {
          const dt = row.querySelector('dt');
          const dd = row.querySelector('dd');
          if (!dt || !dd) return;
          const label = dt.textContent.trim().toLowerCase();
          if (label === 'status') {
            const isRev = (item.status === 'review' || item.status === 'in-review');
            const bClass = item.status === 'in-prep' ? 'in-progress' : item.status === 'ready' ? 'ready' : isRev ? 'in-review' : '';
            const bLabel = item.status === 'awaiting' ? 'Needs preparation' : item.status === 'in-prep' ? 'In preparation' : isRev ? 'Awaiting review' : 'Ready for lending';
            dd.innerHTML = `<span class="status-badge ${bClass}" ${isRev ? 'data-status="review"' : ''}>${bLabel}</span>`;
          }
          if (label === 'assigned to') dd.textContent = item.assignedStaff || 'Unassigned';
          if (label === 'target date') dd.textContent = item.targetDate || 'Pending';
          if (label === 'progress') dd.textContent = `${item.currentStep || 0} of 4 steps complete`;
        });

        const notesTextarea = document.getElementById('preparation-notes');
        if (notesTextarea && item.notes) notesTextarea.value = item.notes;

        const assignLink = document.querySelector('.detail-actions a[href*="preparation-assignment.html"]');
        if (assignLink) assignLink.href = `preparation-assignment.html?id=${encodeURIComponent(currentId)}`;

        const checklistLink = document.querySelector('.detail-actions a[href*="preparation-checklist.html"]');
        if (checklistLink) checklistLink.href = `preparation-checklist.html?id=${encodeURIComponent(currentId)}`;

        const saveNotesBtn = document.querySelector('.detail-actions button.secondary-action');
        if (saveNotesBtn && !saveNotesBtn.dataset.apiBound) {
          saveNotesBtn.dataset.apiBound = 'true';
          saveNotesBtn.addEventListener('click', async () => {
            const originalText = saveNotesBtn.innerHTML;
            saveNotesBtn.disabled = true;
            saveNotesBtn.textContent = 'Saving notes...';
            try {
              await apiClient.updatePreparation(targetPrepId, { notes: notesTextarea ? notesTextarea.value : '' });
              saveNotesBtn.textContent = '✓ Saved to DB';
              setTimeout(() => { saveNotesBtn.innerHTML = originalText; saveNotesBtn.disabled = false; }, 1500);
            } catch (e) {
              saveNotesBtn.innerHTML = originalText;
              saveNotesBtn.disabled = false;
            }
          });
        }
      }

      // Step 2: Assignment View
      if (isAssignment) {
        const staffSelect = document.getElementById('staff-member');
        if (staffSelect && item.assignedStaff && item.assignedStaff !== 'Unassigned') {
          Array.from(staffSelect.options).forEach(opt => {
            if (opt.text.toLowerCase() === item.assignedStaff.toLowerCase()) opt.selected = true;
          });
        }

        const assignForm = document.querySelector('.assignment-form');
        if (assignForm && !assignForm.dataset.apiBound) {
          assignForm.dataset.apiBound = 'true';
          assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const staff = staffSelect ? staffSelect.value : '';
            const targetDateInput = document.getElementById('target-date');
            const tDate = targetDateInput ? targetDateInput.value : '';
            const instInput = document.getElementById('assignment-instructions');
            const instructions = instInput ? instInput.value : '';

            try {
              await apiClient.updatePreparation(targetPrepId, {
                assignedStaff: staff || 'Staff Specialist',
                targetDate: tDate || item.targetDate || '15 Oct 2026',
                status: 'in-prep',
                notes: instructions || item.notes
              });
              window.location.href = `preparation-checklist.html?id=${encodeURIComponent(currentId)}`;
            } catch (err) {
              window.location.href = `preparation-checklist.html?id=${encodeURIComponent(currentId)}`;
            }
          });
        }
      }

      // Step 3: Checklist View
      if (isChecklist) {
        const checklistHeading = document.querySelector('.checklist-heading span');
        const checklistItemsContainer = document.querySelector('.checklist-items');
        const issueNotes = document.getElementById('issue-notes');
        if (issueNotes && item.notes) issueNotes.value = item.notes;

        if (item.checklist && item.checklist.length > 0 && checklistItemsContainer) {
          checklistItemsContainer.innerHTML = '';
          let completedCount = 0;
          item.checklist.forEach(step => {
            if (step.completed) completedCount++;
            const label = document.createElement('label');
            label.className = 'checklist-row';
            label.innerHTML = `
              <input type="checkbox" data-id="${step.id}" ${step.completed ? 'checked' : ''} />
              <span><strong>${escapeHtml(step.title)}</strong><small>${step.completed ? 'Complete' : 'Pending'}</small></span>
            `;
            const checkbox = label.querySelector('input');
            checkbox.addEventListener('change', () => {
              const small = label.querySelector('small');
              if (small) small.textContent = checkbox.checked ? 'Complete' : 'Pending';
              const checked = checklistItemsContainer.querySelectorAll('input:checked').length;
              if (checklistHeading) checklistHeading.textContent = `${checked} / ${item.checklist.length} complete`;
            });
            checklistItemsContainer.appendChild(label);
          });
          if (checklistHeading) checklistHeading.textContent = `${completedCount} / ${item.checklist.length} complete`;
        }

        const saveBtn = document.querySelector('.detail-actions button.secondary-action');
        if (saveBtn && !saveBtn.dataset.bound) {
          saveBtn.dataset.bound = 'true';
          saveBtn.addEventListener('click', async () => {
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            const notes = issueNotes ? issueNotes.value : '';
            try {
              await apiClient.updatePreparation(targetPrepId, { notes });
              saveBtn.textContent = '✓ Saved to DB!';
              setTimeout(() => { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }, 2000);
            } catch (e) {
              saveBtn.innerHTML = originalText;
              saveBtn.disabled = false;
            }
          });
        }

        const submitBtn = document.querySelector('.detail-actions a.primary-action');
        if (submitBtn && !submitBtn.dataset.bound) {
          submitBtn.dataset.bound = 'true';
          submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const notes = issueNotes ? issueNotes.value : '';
            try {
              await apiClient.updatePreparation(targetPrepId, { status: 'review', currentStep: 4, notes });
              window.location.href = `preparation-review-details.html?id=${encodeURIComponent(currentId)}`;
            } catch (err) {
              window.location.href = `preparation-review-details.html?id=${encodeURIComponent(currentId)}`;
            }
          });
        }
      }

      // Step 4: Review Details View
      if (isReview) {
        const reviewStatusBox = document.querySelector('.review-status');
        if (reviewStatusBox) {
          const strong = reviewStatusBox.querySelector('strong');
          const small = reviewStatusBox.querySelector('small');
          if (strong) {
            strong.textContent = item.status === 'review' ? 'Preparation submitted for supervisor sign-off' : item.status === 'ready' ? 'Equipment ready for lending' : 'Preparation in progress';
          }
          if (small) {
            small.textContent = `Assigned to ${item.assignedStaff || 'Staff Specialist'} · Target ${item.targetDate || '15 Oct 2026'}`;
          }
        }

        const reviewItemsContainer = document.querySelector('.review-items');
        if (reviewItemsContainer && item.checklist && item.checklist.length > 0) {
          reviewItemsContainer.innerHTML = '';
          item.checklist.forEach(step => {
            const div = document.createElement('div');
            div.innerHTML = `<span>${escapeHtml(step.title)}</span><strong>${step.completed ? 'Complete' : 'Pending'}</strong>`;
            reviewItemsContainer.appendChild(div);
          });
        }

        const reviewNotes = document.getElementById('review-notes');
        if (reviewNotes && item.notes) reviewNotes.value = item.notes;

        const returnLink = document.querySelector('.detail-actions a.secondary-action');
        if (returnLink) returnLink.href = `preparation-checklist.html?id=${encodeURIComponent(currentId)}`;

        const readyBtn = document.querySelector('.detail-actions button.primary-action');
        if (readyBtn && !readyBtn.dataset.bound) {
          readyBtn.dataset.bound = 'true';
          readyBtn.addEventListener('click', async () => {
            const originalText = readyBtn.innerHTML;
            readyBtn.disabled = true;
            readyBtn.textContent = 'Marking ready...';
            try {
              await apiClient.updatePreparation(targetPrepId, { status: 'ready', currentStep: 4 });
              window.location.href = 'preparation-ready.html';
            } catch (e) {
              readyBtn.innerHTML = originalText;
              readyBtn.disabled = false;
              window.location.href = 'preparation-ready.html';
            }
          });
        }
      }

      enforceReviewBadgeColor();
    } catch (e) {
      // Gracefully preserve static HTML content as fallback
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

      // Update live preparation report list on index.html
      const prepReportRows = document.querySelectorAll('.preparation-report-row');
      if (prepReportRows.length > 0) {
        try {
          const pRes = await apiClient.getPreparation();
          if (pRes && pRes.preparation && pRes.preparation.length > 0) {
            pRes.preparation.slice(0, prepReportRows.length).forEach((item, idx) => {
              const row = prepReportRows[idx];
              if (!row) return;
              const titleEl = row.querySelector('div strong');
              if (titleEl) titleEl.textContent = item.equipmentName;
              const subEl = row.querySelector('div small');
              if (subEl) subEl.textContent = `${item.equipmentId} · ${item.currentStep || 0} of 4 steps complete`;
              const staffEl = row.querySelector('span:not(.status-badge)');
              if (staffEl) staffEl.textContent = item.assignedStaff || 'Unassigned';
              const timeEl = row.querySelector('time');
              if (timeEl && item.targetDate) timeEl.textContent = item.targetDate;
              const badge = row.querySelector('.status-badge');
              if (badge) {
                const label = item.status === 'awaiting' ? 'Needs preparation' : item.status === 'in-prep' ? 'In preparation' : item.status === 'review' ? 'Awaiting review' : 'Ready';
                const badgeClass = item.status === 'in-prep' ? 'in-progress' : item.status === 'ready' ? 'ready' : (item.status === 'review' || item.status === 'in-review') ? 'in-review' : '';
                badge.className = `status-badge ${badgeClass}`.trim();
                badge.textContent = label;
              }
            });
            enforceReviewBadgeColor();
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // Graceful fallback to static HTML content if API is unreachable
    }
  }

  async function syncGlobalTabBadges() {
    const prepTabsEls = document.querySelectorAll('preparation-tabs');
    const loanTabsEls = document.querySelectorAll('loan-tabs');
    if (!prepTabsEls.length && !loanTabsEls.length) return;

    try {
      const res = await apiClient.getSummaryKPIs();
      if (!res || !res.kpis) return;
      const kpis = res.kpis;
      apiClient.lastKPIs = kpis;
      if (window.LibraryDeskAPI) window.LibraryDeskAPI.lastKPIs = kpis;

      // Update <loan-tabs> count badges across loan pages
      if (loanTabsEls.length && kpis.activeLoans != null) {
        loanTabsEls.forEach(loanEl => {
          const links = loanEl.querySelectorAll('a');
          if (links.length >= 2) {
            const allBadge = links[0].querySelector('span');
            if (allBadge) allBadge.textContent = kpis.activeLoans;
            const overdueBadge = links[1].querySelector('span');
            if (overdueBadge) overdueBadge.textContent = kpis.overdue;
          }
        });
      }

      // Update <preparation-tabs> count badges across preparation pages
      if (prepTabsEls.length && kpis.preparation) {
        prepTabsEls.forEach(tabEl => {
          if (typeof tabEl.updateCounts === 'function') {
            tabEl.updateCounts(kpis.preparation);
          } else {
            const s0 = tabEl.querySelector('.badge-awaiting') || tabEl.querySelector('a:nth-child(1) span');
            if (s0 && kpis.preparation.needsPreparation != null) s0.textContent = kpis.preparation.needsPreparation;
            const s1 = tabEl.querySelector('.badge-inprep') || tabEl.querySelector('a:nth-child(2) span');
            if (s1 && kpis.preparation.inPreparation != null) s1.textContent = kpis.preparation.inPreparation;
            const s2 = tabEl.querySelector('.badge-review') || tabEl.querySelector('a:nth-child(3) span');
            if (s2 && kpis.preparation.awaitingReview != null) s2.textContent = kpis.preparation.awaitingReview;
            const s3 = tabEl.querySelector('.badge-ready') || tabEl.querySelector('a:nth-child(4) span');
            if (s3 && kpis.preparation.readyForLending != null) s3.textContent = kpis.preparation.readyForLending;
            const s4 = tabEl.querySelector('.badge-all') || tabEl.querySelector('a:nth-child(5) span');
            if (s4 && kpis.preparation.total != null) s4.textContent = kpis.preparation.total;
          }
        });
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  apiClient.init = initApiFormHooks;
  apiClient.syncGlobalTabBadges = syncGlobalTabBadges;
  apiClient.enforceReviewBadgeColor = enforceReviewBadgeColor;
  window.LibraryDeskAPI = apiClient;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApiFormHooks);
  } else {
    initApiFormHooks();
  }

  // Hook into client-side PJAX page navigation
  document.addEventListener('page:loaded', initApiFormHooks);
})();
