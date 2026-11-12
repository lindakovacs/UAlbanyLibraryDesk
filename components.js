/**
 * UAlbany LibraryDesk - Web Components & Interactive Features
 * Team KofN1: Linda Kovacs, Veronica Dindial, Rym Mahiddine, Wendy Ouedraogo, Amari Scott
 *
 * Provides reusable components:
 * - <app-sidebar [current="overview|equipment|loans|borrowers|preparation"]></app-sidebar>
 * - <app-header [breadcrumbs="..."] [user-name="..."] [user-role="..."] [user-initials="..."]></app-header>
 * - <app-footer></app-footer>
 * - <preparation-tabs [active="awaiting|in-prep|review|ready|all"]></preparation-tabs>
 * - <preparation-steps [active="1|2|3|4|details|assignment|checklist|review"]></preparation-steps>
 * - <loan-tabs [active="all|overdue"]></loan-tabs>
 */

(function () {
  'use strict';

  // Ensure custom elements have display: contents so they don't disrupt flex/grid layouts
  if (!document.getElementById('app-components-style')) {
    const style = document.createElement('style');
    style.id = 'app-components-style';
    style.textContent = `
      app-sidebar,
      app-header,
      app-footer,
      preparation-tabs,
      preparation-steps,
      loan-tabs {
        display: contents;
      }
      .preparation-panel > table tbody tr {
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .preparation-panel > table tbody tr:first-child {
        background: transparent;
      }
      .preparation-panel > table tbody tr.selected-row,
      .preparation-panel > table tbody tr:has(.selection-circle.selected) {
        background: #e5d8ef !important;
      }
      .preparation-panel > table tbody tr:not(.selected-row):not(:has(.selection-circle.selected)) {
        background: transparent !important;
      }
      .status-badge,
      .status-badge.needs-prep,
      .status-badge[data-status="awaiting"],
      .status-badge[data-status="needs-prep"] {
        color: #a4262c !important;
        background: #fde8e8 !important;
        background-color: #fde8e8 !important;
      }
      .status-badge::before,
      .status-badge.needs-prep::before,
      .status-badge[data-status="awaiting"]::before,
      .status-badge[data-status="needs-prep"]::before {
        background: #c43d43 !important;
        background-color: #c43d43 !important;
      }
      .status-badge.in-progress,
      .status-badge[data-status="in-prep"],
      .status-badge[data-status="in-progress"] {
        color: #9a6500 !important;
        background: #fff3d8 !important;
        background-color: #fff3d8 !important;
      }
      .status-badge.in-progress::before,
      .status-badge[data-status="in-prep"]::before,
      .status-badge[data-status="in-progress"]::before {
        background: #b27800 !important;
        background-color: #b27800 !important;
      }
      .status-badge.in-review,
      .status-badge.review,
      .status-badge[data-status="review"],
      .status-badge[data-status*="review"],
      [data-status="review"] .status-badge,
      [data-status*="review"] .status-badge {
        color: #46166b !important;
        background: #f1ebf6 !important;
        background-color: #f1ebf6 !important;
      }
      .status-badge.in-review::before,
      .status-badge.review::before,
      .status-badge[data-status="review"]::before,
      .status-badge[data-status*="review"]::before,
      [data-status="review"] .status-badge::before,
      [data-status*="review"] .status-badge::before {
        background: #46166b !important;
        background-color: #46166b !important;
      }
      .status-badge.ready,
      .status-badge[data-status="ready"] {
        color: #26734d !important;
        background: #e8f5ed !important;
        background-color: #e8f5ed !important;
      }
      .status-badge.ready::before,
      .status-badge[data-status="ready"]::before {
        background: #26734d !important;
        background-color: #26734d !important;
      }
      .library-status {
        cursor: pointer;
        user-select: none;
      }
      .library-status.status-closed .status-dot {
        background: #d9383a;
      }
      .library-status.status-closed {
        color: #8c1d1e;
        background: #fdf2f2;
      }
      .table-empty-message {
        text-align: center;
        padding: 2rem !important;
        color: #6b6474;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }

  /* ==========================================================================
     Canonical Preparation Dataset & Status Hydration
     ========================================================================== */
  const PREPARATION_CATALOG = [
    {
      id: 'PREP-001',
      equipmentId: 'EQ-014',
      equipmentName: 'Game Console',
      category: 'Gaming Consoles and Accessories',
      assignedStaff: 'Unassigned',
      targetDate: '15 Oct 2026',
      status: 'awaiting',
      currentStep: 1,
      checklist: [
        { id: 'wipe', title: 'Factory Reset & Storage Sanitization', completed: false },
        { id: 'inspect', title: 'Hardware Diagnostics & Screen Inspection', completed: false },
        { id: 'accessories', title: 'Charger & USB-C Cable Verification', completed: false },
        { id: 'packaging', title: 'Clean exterior and package in lending sleeve', completed: false }
      ],
      notes: 'Needs physical inspection & sanitization wipe'
    },
    {
      id: 'PREP-002',
      equipmentId: 'EQ-001',
      equipmentName: 'Mirrorless Camera Kit',
      category: 'Creative Technology',
      assignedStaff: 'Unassigned',
      targetDate: '15 Oct 2026',
      status: 'awaiting',
      currentStep: 1,
      checklist: [
        { id: 'wipe', title: 'SD card format and factory reset', completed: false },
        { id: 'inspect', title: 'Sensor cleaning and lens check', completed: false },
        { id: 'battery', title: 'Battery fully charged and tested', completed: false },
        { id: 'manifest', title: 'Accessory pouch verified', completed: false }
      ],
      notes: 'Needs physical inspection & sanitization wipe'
    },
    {
      id: 'PREP-003',
      equipmentId: 'EQ-003',
      equipmentName: 'H4 Zoom Audio Recording Kit',
      category: 'Creative Technology',
      assignedStaff: 'Unassigned',
      targetDate: '16 Oct 2026',
      status: 'awaiting',
      currentStep: 1,
      checklist: [
        { id: 'wipe', title: 'SD card wipe', completed: false },
        { id: 'inspect', title: 'Mic capsule check', completed: false },
        { id: 'battery', title: 'AA batteries replenished', completed: false },
        { id: 'supervisor', title: 'Supervisor sign-off', completed: false }
      ],
      notes: 'Awaiting staff assignment for inspection'
    },
    {
      id: 'PREP-004',
      equipmentId: 'EQ-012',
      equipmentName: 'SmallRig All-in-One Smartphone Video Kit',
      category: 'Creative Technology',
      assignedStaff: 'Unassigned',
      targetDate: '18 Oct 2026',
      status: 'awaiting',
      currentStep: 1,
      checklist: [
        { id: 'inspect', title: 'Rig clamp and handle integrity check', completed: false },
        { id: 'light', title: 'LED fill light battery test', completed: false },
        { id: 'mic', title: 'Shotgun mic and cables check', completed: false },
        { id: 'packaging', title: 'Repack in carry case', completed: false }
      ],
      notes: 'Awaiting staff assignment for inspection'
    },
    {
      id: 'PREP-005',
      equipmentId: 'EQ-006',
      equipmentName: 'PlayStation 5',
      category: 'Gaming Consoles and Accessories',
      assignedStaff: 'John Doe',
      targetDate: '15 Oct 2026',
      status: 'in-prep',
      currentStep: 3,
      checklist: [
        { id: 'wipe', title: 'Factory Reset & Storage Sanitization', completed: true },
        { id: 'inspect', title: 'Hardware Diagnostics & Port Inspection', completed: true },
        { id: 'accessories', title: 'DualSense controller & cables verification', completed: false },
        { id: 'packaging', title: 'Readiness label & pack-in slip', completed: false }
      ],
      notes: 'Cleaning console ports and verifying firmware updates'
    },
    {
      id: 'PREP-006',
      equipmentId: 'EQ-010',
      equipmentName: 'Owl 3 Video Conference Camera',
      category: 'Creative Technology',
      assignedStaff: 'Maria Santos',
      targetDate: '15 Oct 2026',
      status: 'in-prep',
      currentStep: 2,
      checklist: [
        { id: 'inspect', title: 'Physical lens and 360 sensor inspection', completed: true },
        { id: 'firmware', title: 'Firmware & microphone calibration', completed: false },
        { id: 'cables', title: 'USB-C cable & power supply check', completed: false },
        { id: 'packaging', title: 'Pack in safety cylinder case', completed: false }
      ],
      notes: 'Testing 360-degree lens and speaker calibration'
    },
    {
      id: 'PREP-007',
      equipmentId: 'EQ-002',
      equipmentName: 'Nintendo Switch',
      category: 'Gaming Consoles and Accessories',
      assignedStaff: 'Alex Chen',
      targetDate: '17 Oct 2026',
      status: 'in-prep',
      currentStep: 3,
      checklist: [
        { id: 'wipe', title: 'User profiles and network settings wiped', completed: true },
        { id: 'inspect', title: 'Joy-Con stick drift calibration test', completed: true },
        { id: 'dock', title: 'Dock & HDMI cable verification', completed: false },
        { id: 'packaging', title: 'Repackage in protective carry sleeve', completed: false }
      ],
      notes: 'Checking Joy-Con drift and cleaning screen'
    },
    {
      id: 'PREP-008',
      equipmentId: 'EQ-011',
      equipmentName: 'Portable Podcasting Kit (Zoom H6)',
      category: 'Creative Technology',
      assignedStaff: 'Alex Chen',
      targetDate: '15 Oct 2026',
      status: 'review',
      currentStep: 4,
      checklist: [
        { id: 'wipe', title: 'SD card wiped and initialized', completed: true },
        { id: 'capsules', title: 'X/Y and shotgun mic capsules tested', completed: true },
        { id: 'battery', title: 'Fresh batteries verified', completed: true },
        { id: 'supervisor', title: 'Supervisor sign-off', completed: false }
      ],
      notes: 'Sanitization complete; awaiting supervisor sign-off'
    },
    {
      id: 'PREP-009',
      equipmentId: 'EQ-005',
      equipmentName: 'Rode Wireless GO II Microphone System',
      category: 'Creative Technology',
      assignedStaff: 'Maria Santos',
      targetDate: '16 Oct 2026',
      status: 'review',
      currentStep: 4,
      checklist: [
        { id: 'pairing', title: 'Transmitters paired with receiver', completed: true },
        { id: 'levels', title: 'Audio level check & gain calibration', completed: true },
        { id: 'charging', title: 'USB-C charging verified on all units', completed: true },
        { id: 'supervisor', title: 'Supervisor sign-off', completed: false }
      ],
      notes: 'Battery health test passed; awaiting supervisor sign-off'
    },
    {
      id: 'PREP-010',
      equipmentId: 'EQ-004',
      equipmentName: '3D Scanning Kit (Revopoint POP 3 Plus)',
      category: 'Creative Technology',
      assignedStaff: 'John Doe',
      targetDate: '14 Oct 2026',
      status: 'ready',
      currentStep: 4,
      checklist: [
        { id: 'inspect', title: 'Physical scanner head and lenses cleaned', completed: true },
        { id: 'turntable', title: 'Electric turntable and tripod verified', completed: true },
        { id: 'software', title: 'Calibration grid test completed', completed: true },
        { id: 'shelf', title: 'Supervisor signed off; placed on ready shelf', completed: true }
      ],
      notes: 'Calibration verified; staged for circulation'
    },
    {
      id: 'PREP-011',
      equipmentId: 'EQ-009',
      equipmentName: 'M30 Gamepad',
      category: 'Gaming Consoles and Accessories',
      assignedStaff: 'Maria Santos',
      targetDate: '14 Oct 2026',
      status: 'ready',
      currentStep: 4,
      checklist: [
        { id: 'bluetooth', title: 'Bluetooth pairing profile cleared', completed: true },
        { id: 'buttons', title: 'D-Pad and tactile buttons tested', completed: true },
        { id: 'sanitized', title: 'Housing sanitized and cable wrapped', completed: true },
        { id: 'shelf', title: 'Staged on Ready equipment shelf', completed: true }
      ],
      notes: 'Pairing reset, sanitized, ready for loan'
    }
  ];

  window.PREPARATION_CATALOG = PREPARATION_CATALOG;

  function getPrepItem(id) {
    if (!id) {
      try { id = sessionStorage.getItem('current_preparation_id'); } catch (e) {}
    }
    if (!id && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      id = urlParams.get('id');
    }
    if (!id) id = 'EQ-014';
    const idLower = String(id).toLowerCase();
    return PREPARATION_CATALOG.find(p =>
      (p.equipmentId && p.equipmentId.toLowerCase() === idLower) ||
      (p.id && p.id.toLowerCase() === idLower)
    ) || PREPARATION_CATALOG[0];
  }

  function getEquipmentIconSvg(item) {
    const nameLower = ((item && (item.equipmentName || item.name)) || '').toLowerCase();
    if (nameLower.includes('console') || nameLower.includes('playstation') || nameLower.includes('switch') || nameLower.includes('gamepad')) {
      return '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M8 10v4M6 12h4M16 10v.01M18 12v.01"></path></svg>';
    }
    if (nameLower.includes('audio') || nameLower.includes('podcasting') || nameLower.includes('microphone') || nameLower.includes('mic') || nameLower.includes('zoom') || nameLower.includes('rode')) {
      return '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="16" rx="2"></rect><path d="M10 8h4M10 12h4M10 16h4"></path></svg>';
    }
    if (nameLower.includes('owl') || nameLower.includes('conference')) {
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle></svg>';
    }
    return '<svg viewBox="0 0 24 24"><path d="M4 8h16v11H4zM8 8l1.5-3h5L16 8"></path><circle cx="12" cy="13.5" r="3"></circle></svg>';
  }

  function applyStatusBadgeFormat(badge, statusInput) {
    if (!badge) return;
    const raw = (statusInput || badge.getAttribute('data-status') || badge.textContent || '').trim().toLowerCase();
    let bClass = 'needs-prep';
    let bLabel = 'Needs preparation';
    let dataStatus = 'awaiting';
    let textColor = '#a4262c';
    let bgColor = '#fde8e8';

    if (raw === 'in-prep' || raw === 'in preparation' || raw.includes('in prep') || raw === 'in-progress') {
      bClass = 'in-progress';
      bLabel = 'In preparation';
      dataStatus = 'in-prep';
      textColor = '#9a6500';
      bgColor = '#fff3d8';
    } else if (raw === 'review' || raw === 'in-review' || raw === 'awaiting review' || raw.includes('review')) {
      bClass = 'in-review';
      bLabel = 'Awaiting review';
      dataStatus = 'review';
      textColor = '#46166b';
      bgColor = '#f1ebf6';
    } else if (raw === 'ready' || raw === 'ready for lending' || raw.includes('ready')) {
      bClass = 'ready';
      bLabel = 'Ready for lending';
      dataStatus = 'ready';
      textColor = '#26734d';
      bgColor = '#e8f5ed';
    } else {
      bClass = 'needs-prep';
      bLabel = 'Needs preparation';
      dataStatus = 'awaiting';
      textColor = '#a4262c';
      bgColor = '#fde8e8';
    }

    badge.classList.remove('in-progress', 'in-review', 'review', 'ready', 'needs-prep');
    badge.classList.add(bClass);
    badge.textContent = bLabel;
    badge.setAttribute('data-status', dataStatus);
    badge.style.setProperty('color', textColor, 'important');
    badge.style.setProperty('background', bgColor, 'important');
    badge.style.setProperty('background-color', bgColor, 'important');
  }

  /* ==========================================================================
     Component: <app-sidebar>
     ========================================================================== */
  class AppSidebar extends HTMLElement {
    static get observedAttributes() {
      return ['current'];
    }

    connectedCallback() {
      const current = (this.getAttribute('current') || this.detectCurrentPage()).toLowerCase();
      let user = null;
      try {
        const u = localStorage.getItem('librarydesk_user');
        if (u) user = JSON.parse(u);
      } catch (e) {}
      const isSupervisor = user && (user.role || '').toLowerCase().includes('supervisor');

      this.innerHTML = `
        <aside class="sidebar" aria-label="Primary">
          <div class="brand">
            <a href="index.html" aria-label="LibraryDesk home">
              <span class="brand-symbol" aria-hidden="true">
                <img src="assets/favicon.svg" alt="" />
              </span>
              <span class="brand-copy">
                <span class="brand-name">LibraryDesk</span>
                <small>UAlbany University Libraries</small>
              </span>
            </a>
          </div>
          <nav aria-label="Workspace navigation">
            <p class="nav-label">Workspace</p>
            <ul>
              <li>
                <a class="nav-item" href="preparation.html"${current === 'preparation' ? ' aria-current="page"' : ''}>Preparation</a>
              </li>
              <li>
                <a class="nav-item" href="index.html"${current === 'overview' ? ' aria-current="page"' : ''}>Overview</a>
              </li>
              <li>
                <a class="nav-item" href="equipment.html"${current === 'equipment' ? ' aria-current="page"' : ''}>Equipment</a>
              </li>
              <li>
                <a class="nav-item" href="loans.html"${current === 'loans' ? ' aria-current="page"' : ''}>Loans &amp; returns</a>
              </li>
              <li>
                <a class="nav-item" href="borrowers.html"${current === 'borrowers' ? ' aria-current="page"' : ''}>Borrowers</a>
              </li>
              <li>
                <a class="nav-item" href="reports.html"${current === 'reports' ? ' aria-current="page"' : ''}>Reports${isSupervisor ? '' : ' <span style="font-size:0.7em; opacity:0.8; font-weight:normal;">(Supervisor)</span>'}</a>
              </li>
            </ul>
          </nav>
          <div class="sidebar-footer">
            <img class="ualbany-logo" src="assets/UAlbany_logo.svg" alt="University at Albany" />
            <a class="nav-item" href="help.html">Help &amp; support</a>
            <address>
              <strong>University Library</strong><br />Uptown Campus · Albany, NY
            </address>
          </div>
        </aside>
      `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.connectedCallback();
      }
    }

    detectCurrentPage() {
      const path = (window.location.pathname || '').toLowerCase();
      if (path.includes('borrower')) return 'borrowers';
      if (path.includes('equipment')) return 'equipment';
      if (path.includes('loan')) return 'loans';
      if (path.includes('prep')) return 'preparation';
      if (path.includes('report')) return 'reports';
      return 'overview';
    }
  }

  /* ==========================================================================
     Component: <app-header>
     ========================================================================== */
  class AppHeader extends HTMLElement {
    static get observedAttributes() {
      return ['breadcrumbs', 'current'];
    }

    connectedCallback() {
      const rawBreadcrumbs = this.getAttribute('breadcrumbs') || this.getAttribute('current') || '';
      const breadcrumbHtml = this.renderBreadcrumbs(rawBreadcrumbs);
      const userName = this.getAttribute('user-name') || 'Linda Kovacs';
      const userRole = this.getAttribute('user-role') || 'Library staff';
      const userInitials = this.getAttribute('user-initials') || 'LK';

      this.innerHTML = `
        <header class="page-header">
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            ${breadcrumbHtml}
          </nav>
          <div class="header-actions">
            <span class="library-status" role="button" tabindex="0" title="Click to toggle library open/closed status">
              <span class="status-dot" aria-hidden="true"></span><span class="status-label">Library open</span>
            </span>
            <a class="notification-link" href="notifications.html" aria-label="Notifications">&#128276;</a>
            <a href="login.html">Sign out</a>
            <span class="profile-divider" aria-hidden="true"></span>
            <a class="profile-summary" href="profile.html">
              <span class="profile-initials" aria-hidden="true">${userInitials}</span>
              <span><strong>${userName}</strong><small>${userRole}</small></span>
              <span aria-hidden="true">⌄</span>
            </a>
          </div>
        </header>
      `;

      // Status toggle handler
      const statusBtn = this.querySelector('.library-status');
      if (statusBtn) {
        const toggleStatus = () => {
          const isClosed = statusBtn.classList.toggle('status-closed');
          const label = statusBtn.querySelector('.status-label');
          if (label) {
            label.textContent = isClosed ? 'Library closed' : 'Library open';
          }
        };
        statusBtn.addEventListener('click', toggleStatus);
        statusBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleStatus();
          }
        });
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.connectedCallback();
      }
    }

    renderBreadcrumbs(raw) {
      if (!raw) {
        return `<span>Staff workspace</span><span aria-hidden="true">›</span><strong>Overview</strong>`;
      }

      // Check for JSON array format
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((item, index) => {
              const isLast = index === parsed.length - 1;
              const separator = isLast ? '' : '<span aria-hidden="true">›</span>';
              if (isLast) {
                return `<strong>${item.label}</strong>`;
              }
              if (item.href) {
                return `<a href="${item.href}">${item.label}</a>${separator}`;
              }
              return `<span>${item.label}</span>${separator}`;
            })
            .join('');
        }
      } catch (e) {
        // Not JSON, continue to string parsing
      }

      // Check for arrow or chevron separated string: "Section > Subsection > Current"
      if (raw.includes('>') || raw.includes('›')) {
        const parts = raw.split(/[>›]/).map((s) => s.trim());
        return parts
          .map((part, index) => {
            const isLast = index === parts.length - 1;
            const separator = isLast ? '' : '<span aria-hidden="true">›</span>';
            return isLast ? `<strong>${part}</strong>` : `<span>${part}</span>${separator}`;
          })
          .join('');
      }

      // Default string: "Staff workspace › [raw]"
      return `<span>Staff workspace</span><span aria-hidden="true">›</span><strong>${raw}</strong>`;
    }
  }

  /* ==========================================================================
     Component: <app-footer>
     ========================================================================== */
  class AppFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <footer class="page-footer">
          <p class="footer-brand">LibraryDesk · UAlbany University Libraries</p>
          <p class="copyright">
            &copy; 2026 UAlbany Library | Team KofN1: Linda Kovacs, Veronica
            Dindial, Rym Mahiddine, Wendy Ouedraogo, Amari Scott
          </p>
        </footer>
      `;
    }
  }

  /* ==========================================================================
     Component: <preparation-tabs>
     ========================================================================== */
  class PreparationTabs extends HTMLElement {
    static get observedAttributes() {
      return ['active'];
    }

    connectedCallback() {
      this.render();
      if (window.LibraryDeskAPI && typeof window.LibraryDeskAPI.syncGlobalTabBadges === 'function') {
        window.LibraryDeskAPI.syncGlobalTabBadges();
      }
    }

    render() {
      const active = (this.getAttribute('active') || 'awaiting').toLowerCase();
      const kpis = (window.LibraryDeskAPI && window.LibraryDeskAPI.lastKPIs && window.LibraryDeskAPI.lastKPIs.preparation) || null;
      const countAwaiting = kpis && kpis.needsPreparation != null ? kpis.needsPreparation : 4;
      const countInPrep = kpis && kpis.inPreparation != null ? kpis.inPreparation : 3;
      const countReview = kpis && kpis.awaitingReview != null ? kpis.awaitingReview : 2;
      const countReady = kpis && kpis.readyForLending != null ? kpis.readyForLending : 2;
      const countTotal = kpis && kpis.total != null ? kpis.total : 11;

      this.innerHTML = `
        <div class="tabs" role="tablist" aria-label="Preparation status">
          <a class="tab-link${active === 'awaiting' ? ' active-tab' : ''}" href="preparation.html"${active === 'awaiting' ? ' aria-current="page"' : ''}>Awaiting assignment <span class="badge-awaiting">${countAwaiting}</span></a>
          <a class="tab-link${active === 'in-prep' || active === 'in preparation' ? ' active-tab' : ''}" href="preparation-progress.html"${active === 'in-prep' || active === 'in preparation' ? ' aria-current="page"' : ''}>In preparation <span class="badge-inprep">${countInPrep}</span></a>
          <a class="tab-link${active === 'review' ? ' active-tab' : ''}" href="preparation-review.html"${active === 'review' ? ' aria-current="page"' : ''}>Review <span class="badge-review">${countReview}</span></a>
          <a class="tab-link${active === 'ready' ? ' active-tab' : ''}" href="preparation-ready.html"${active === 'ready' ? ' aria-current="page"' : ''}>Ready <span class="badge-ready">${countReady}</span></a>
          <a class="tab-link${active === 'all' ? ' active-tab' : ''}" href="preparation-all.html"${active === 'all' ? ' aria-current="page"' : ''}>All equipment <span class="badge-all">${countTotal}</span></a>
        </div>
      `;
    }

    updateCounts(kpis) {
      if (!kpis) return;
      const s0 = this.querySelector('.badge-awaiting');
      if (s0 && kpis.needsPreparation != null) s0.textContent = kpis.needsPreparation;
      const s1 = this.querySelector('.badge-inprep');
      if (s1 && kpis.inPreparation != null) s1.textContent = kpis.inPreparation;
      const s2 = this.querySelector('.badge-review');
      if (s2 && kpis.awaitingReview != null) s2.textContent = kpis.awaitingReview;
      const s3 = this.querySelector('.badge-ready');
      if (s3 && kpis.readyForLending != null) s3.textContent = kpis.readyForLending;
      const s4 = this.querySelector('.badge-all');
      if (s4 && kpis.total != null) s4.textContent = kpis.total;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.render();
      }
    }
  }

  /* ==========================================================================
     Component: <preparation-steps>
     ========================================================================== */
  class PreparationSteps extends HTMLElement {
    static get observedAttributes() {
      return ['active', 'item-id'];
    }

    connectedCallback() {
      const active = (this.getAttribute('active') || '1').toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      let idParam = this.getAttribute('item-id') || urlParams.get('id');
      if (!idParam) {
        try {
          idParam = sessionStorage.getItem('current_preparation_id');
        } catch (e) {}
      }
      if (!idParam) idParam = 'EQ-014';
      try {
        sessionStorage.setItem('current_preparation_id', idParam);
      } catch (e) {}
      const q = `?id=${encodeURIComponent(idParam)}`;
      this.innerHTML = `
        <nav class="detail-steps" aria-label="Equipment preparation steps">
          <a class="${active === '1' || active === 'details' ? 'current' : ''}" href="preparation-details.html${q}"><span>1</span>Details</a>
          <a class="${active === '2' || active === 'assignment' ? 'current' : ''}" href="preparation-assignment.html${q}"><span>2</span>Assignment</a>
          <a class="${active === '3' || active === 'checklist' ? 'current' : ''}" href="preparation-checklist.html${q}"><span>3</span>Checklist</a>
          <a class="${active === '4' || active === 'review' ? 'current' : ''}" href="preparation-review-details.html${q}"><span>4</span>Review</a>
        </nav>
      `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.connectedCallback();
      }
    }
  }

  /* ==========================================================================
     Component: <loan-tabs>
     ========================================================================== */
  class LoanTabs extends HTMLElement {
    static get observedAttributes() {
      return ['active'];
    }

    connectedCallback() {
      const active = (this.getAttribute('active') || 'all').toLowerCase();
      this.innerHTML = `
        <div class="loan-tabs" role="tablist" aria-label="Loan status">
          <a class="${active === 'all' ? 'active' : ''}" href="loans.html"${active === 'all' ? ' aria-current="page"' : ''}>All loans <span>5</span></a>
          <a class="${active === 'overdue' ? 'active' : ''}" href="loans-overdue.html"${active === 'overdue' ? ' aria-current="page"' : ''}>Overdue <span>1</span></a>
        </div>
      `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.isConnected) {
        this.connectedCallback();
      }
    }
  }

  // Register custom elements immediately
  customElements.define('app-sidebar', AppSidebar);
  customElements.define('app-header', AppHeader);
  customElements.define('app-footer', AppFooter);
  customElements.define('preparation-tabs', PreparationTabs);
  customElements.define('preparation-steps', PreparationSteps);
  customElements.define('loan-tabs', LoanTabs);

  /* ==========================================================================
     Interactive Behaviors: Search Filtering, Checklist Progress
     ========================================================================== */
  function initInteractiveBehaviors() {
    // 1. Preparation queue search filter
    const prepSearch = document.getElementById('preparation-search');
    if (prepSearch && !prepSearch.dataset.bound) {
      prepSearch.dataset.bound = 'true';
      const table = prepSearch.closest('.preparation-panel')?.querySelector('table');
      const countBadge = prepSearch.closest('.table-tools')?.querySelector('span');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr:not(.table-empty-row)'));
        prepSearch.addEventListener('input', () => {
          if (window.LibraryDeskAPI) return; // Handled dynamically with live database API by api-client.js
          const query = prepSearch.value.trim().toLowerCase();
          let visibleCount = 0;

          rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          if (countBadge) {
            countBadge.textContent = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
          }

          let emptyRow = table.querySelector('.table-empty-row');
          if (visibleCount === 0) {
            if (!emptyRow) {
              emptyRow = document.createElement('tr');
              emptyRow.className = 'table-empty-row';
              const colCount = table.querySelectorAll('thead th').length || 4;
              emptyRow.innerHTML = `<td colspan="${colCount}" class="table-empty-message">No matching equipment found for "${query}"</td>`;
              table.querySelector('tbody')?.appendChild(emptyRow);
            } else {
              emptyRow.style.display = '';
              emptyRow.querySelector('td').textContent = `No matching equipment found for "${query}"`;
            }
          } else if (emptyRow) {
            emptyRow.style.display = 'none';
          }
        });
      }
    }

    // 2. Loans table search filter
    const loanSearch = document.getElementById('loan-search');
    if (loanSearch && !loanSearch.dataset.bound) {
      loanSearch.dataset.bound = 'true';
      const loanContainer = loanSearch.closest('.loan-panel');
      const table = loanContainer?.querySelector('table');
      const footerCount = loanContainer?.querySelector('.loan-footer span:first-child');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr:not(.table-empty-row)'));
        const totalCount = rows.length;

        loanSearch.addEventListener('input', () => {
          if (window.LibraryDeskAPI) return; // Handled dynamically with live database API by api-client.js
          const query = loanSearch.value.trim().toLowerCase();
          let visibleCount = 0;

          rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          if (footerCount) {
            footerCount.textContent = `Showing ${visibleCount} of ${totalCount} loans`;
          }

          let emptyRow = table.querySelector('.table-empty-row');
          if (visibleCount === 0) {
            if (!emptyRow) {
              emptyRow = document.createElement('tr');
              emptyRow.className = 'table-empty-row';
              const colCount = table.querySelectorAll('thead th').length || 6;
              emptyRow.innerHTML = `<td colspan="${colCount}" class="table-empty-message">No loans matching "${query}"</td>`;
              table.querySelector('tbody')?.appendChild(emptyRow);
            } else {
              emptyRow.style.display = '';
              emptyRow.querySelector('td').textContent = `No loans matching "${query}"`;
            }
          } else if (emptyRow) {
            emptyRow.style.display = 'none';
          }
        });
      }
    }

    // 3. Equipment cards search & category filter
    const equipmentSearch = document.getElementById('equipment-search');
    const categorySelect = document.querySelector('.equipment-toolbar select') || document.querySelector('select[aria-label="Filter by category"]');
    const grid = document.querySelector('.equipment-grid');
    if (grid && !grid.dataset.bound) {
      grid.dataset.bound = 'true';
      const cards = Array.from(grid.querySelectorAll('article'));
      const countEl = document.querySelector('.equipment-search-count') || document.querySelector('.equipment-toolbar span');

      const filterEquipment = () => {
        if (window.LibraryDeskAPI) return; // Handled dynamically with live database API by api-client.js
        const query = (equipmentSearch ? equipmentSearch.value : '').trim().toLowerCase();
        const selectedCat = categorySelect ? categorySelect.value : 'All categories';
        let visibleCount = 0;

        cards.forEach((card) => {
          const text = card.textContent.toLowerCase();
          const matchesQuery = !query || text.includes(query);
          const matchesCat = selectedCat === 'All categories' || card.textContent.includes(selectedCat);
          const show = matchesQuery && matchesCat;
          card.style.display = show ? '' : 'none';
          if (show) visibleCount++;
        });

        if (countEl) {
          countEl.textContent = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
        }

        let emptyEl = grid.querySelector('.equipment-empty-card');
        if (visibleCount === 0) {
          if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'equipment-empty-card';
            emptyEl.style.cssText = 'grid-column: 1 / -1; padding: 3rem; text-align: center; color: #6b6474; font-style: italic; background: #fff; border: 1px dashed #cfc5d6; border-radius: 0.6rem;';
            emptyEl.textContent = query ? `No equipment matches "${query}"` : 'No equipment available in this category.';
            grid.appendChild(emptyEl);
          } else {
            emptyEl.style.display = '';
            emptyEl.textContent = query ? `No equipment matches "${query}"` : 'No equipment available in this category.';
          }
        } else if (emptyEl) {
          emptyEl.style.display = 'none';
        }
      };

      if (equipmentSearch && !equipmentSearch.dataset.bound) {
        equipmentSearch.dataset.bound = 'true';
        equipmentSearch.addEventListener('input', filterEquipment);
      }
      if (categorySelect && !categorySelect.dataset.bound) {
        categorySelect.dataset.bound = 'true';
        categorySelect.addEventListener('change', filterEquipment);
      }
    }

    // 4. Borrower search filter
    const borrowerSearch = document.getElementById('borrower-search');
    if (borrowerSearch && !borrowerSearch.dataset.bound) {
      borrowerSearch.dataset.bound = 'true';
      const table = document.querySelector('.borrower-table') || document.querySelector('.borrower-panel table');
      const footerCount = document.querySelector('.borrower-footer span:first-child');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr:not(.table-empty-row)'));
        const totalCount = rows.length;

        borrowerSearch.addEventListener('input', () => {
          if (window.LibraryDeskAPI) return; // Handled dynamically with live database API by api-client.js
          const query = borrowerSearch.value.trim().toLowerCase();
          let visibleCount = 0;

          rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
          });

          if (footerCount) {
            footerCount.textContent = `Showing ${visibleCount} of ${totalCount} borrowers`;
          }

          let emptyRow = table.querySelector('.table-empty-row');
          if (visibleCount === 0) {
            if (!emptyRow) {
              emptyRow = document.createElement('tr');
              emptyRow.className = 'table-empty-row';
              const colCount = table.querySelectorAll('thead th').length || 5;
              emptyRow.innerHTML = `<td colspan="${colCount}" class="table-empty-message">No borrowers matching "${query}"</td>`;
              table.querySelector('tbody')?.appendChild(emptyRow);
            } else {
              emptyRow.style.display = '';
              emptyRow.querySelector('td').textContent = `No borrowers matching "${query}"`;
            }
          } else if (emptyRow) {
            emptyRow.style.display = 'none';
          }
        });
      }
    }

    // 5. Preparation checklist progress updater
    const checklistItems = document.querySelectorAll('.checklist-group input[type="checkbox"]');
    if (checklistItems.length > 0) {
      const progressDd = Array.from(document.querySelectorAll('.detail-list div')).find((div) => {
        const dt = div.querySelector('dt');
        return dt && dt.textContent.includes('Progress');
      })?.querySelector('dd');

      const updateProgress = () => {
        const total = checklistItems.length;
        const checked = Array.from(checklistItems).filter((cb) => cb.checked).length;
        if (progressDd) {
          progressDd.textContent = `${checked} of ${total} steps complete`;
        }
      };

      checklistItems.forEach((cb) => {
        if (!cb.dataset.bound) {
          cb.dataset.bound = 'true';
          cb.addEventListener('change', updateProgress);
        }
      });
    }

    // 6. Ensure status badges have uniform colors across all views
    enforceAllStatusBadgeColors();

    // 7. Synchronous hydration of preparation workflow views
    const isPrepWorkflowPage = window.location.pathname.includes('preparation-details') ||
      window.location.pathname.includes('preparation-assignment') ||
      window.location.pathname.includes('preparation-checklist') ||
      window.location.pathname.includes('preparation-review-details');
    if (isPrepWorkflowPage) {
      hydratePreparationUI(document);
    }
  }

  function hydratePreparationUI(root, forcedId) {
    if (!root) root = document;
    let targetId = forcedId;
    if (!targetId && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      targetId = urlParams.get('id');
    }
    if (!targetId) {
      try { targetId = sessionStorage.getItem('current_preparation_id'); } catch (e) {}
    }
    if (!targetId) targetId = 'EQ-014';

    const item = getPrepItem(targetId);
    if (!item) return;
    const eqId = item.equipmentId || item.id;
    try { sessionStorage.setItem('current_preparation_id', eqId); } catch (e) {}

    let savedTargetDate = null;
    try {
      savedTargetDate = sessionStorage.getItem('prep_target_date_' + eqId) || sessionStorage.getItem('prep_target_date_' + item.id);
    } catch (e) {}
    const effectiveTargetDate = savedTargetDate || item.targetDate;

    // Common equipment detail header elements
    const nameEl = root.getElementById ? root.getElementById('equipment-name') : root.querySelector('#equipment-name');
    if (nameEl) nameEl.textContent = item.equipmentName;

    const idEl = root.querySelector('.equipment-id');
    if (idEl) idEl.textContent = `${eqId} · University Library`;

    const targetEl = root.querySelector('.equipment-target strong');
    if (targetEl && effectiveTargetDate) targetEl.textContent = effectiveTargetDate;

    const iconEl = root.querySelector('.equipment-detail-icon');
    if (iconEl) iconEl.innerHTML = getEquipmentIconSvg(item);

    const headerBadge = root.querySelector('.equipment-detail-heading .status-badge');
    if (headerBadge) applyStatusBadgeFormat(headerBadge, item.status);

    // Update <preparation-steps>
    root.querySelectorAll('preparation-steps').forEach((steps) => {
      steps.setAttribute('item-id', eqId);
      if (typeof steps.connectedCallback === 'function') {
        steps.connectedCallback();
      }
    });

    // Update <app-header> breadcrumbs link for equipment details
    const appHeader = root.querySelector('app-header') || (typeof document !== 'undefined' ? document.querySelector('app-header') : null);
    if (appHeader) {
      const rawBreadcrumbs = appHeader.getAttribute('breadcrumbs');
      if (rawBreadcrumbs && rawBreadcrumbs.includes('preparation-details.html')) {
        const updatedBreadcrumbs = rawBreadcrumbs.replace(/preparation-details\.html(\?id=[^"']*)?/g, `preparation-details.html?id=${encodeURIComponent(eqId)}`);
        appHeader.setAttribute('breadcrumbs', updatedBreadcrumbs);
      }
    }

    // Step 1: Equipment Details view
    const detailList = root.querySelector('.detail-list');
    if (detailList) {
      detailList.querySelectorAll('div').forEach((row) => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (!dt || !dd) return;
        const label = dt.textContent.trim().toLowerCase();
        if (label === 'status') {
          let b = dd.querySelector('.status-badge');
          if (!b) {
            dd.innerHTML = `<span class="status-badge"></span>`;
            b = dd.querySelector('.status-badge');
          }
          applyStatusBadgeFormat(b, item.status);
        } else if (label === 'assigned to') {
          dd.textContent = item.assignedStaff || 'Unassigned';
        } else if (label === 'target date') {
          dd.textContent = effectiveTargetDate || 'Pending';
        } else if (label === 'progress') {
          const completedCount = item.checklist ? item.checklist.filter(c => c.completed).length : (item.currentStep || 0);
          const totalCount = item.checklist ? item.checklist.length : 4;
          dd.textContent = `${completedCount} of ${totalCount} steps complete`;
        }
      });

      const notesTextarea = root.getElementById ? root.getElementById('preparation-notes') : root.querySelector('#preparation-notes');
      if (notesTextarea && item.notes) notesTextarea.value = item.notes;

      const assignLink = root.querySelector('.detail-actions a[href*="preparation-assignment.html"]');
      if (assignLink) assignLink.href = `preparation-assignment.html?id=${encodeURIComponent(eqId)}`;

      const checklistLink = root.querySelector('.detail-actions a[href*="preparation-checklist.html"]');
      if (checklistLink) checklistLink.href = `preparation-checklist.html?id=${encodeURIComponent(eqId)}`;

      const reqStepsUl = root.querySelector('.required-steps');
      if (reqStepsUl && item.checklist && item.checklist.length > 0) {
        reqStepsUl.innerHTML = item.checklist.map(step => `<li>${step.title}</li>`).join('');
      }
    }

    // Step 2: Assignment view
    const staffSelect = root.getElementById ? root.getElementById('staff-member') : root.querySelector('#staff-member');
    if (staffSelect && item.assignedStaff && item.assignedStaff !== 'Unassigned') {
      Array.from(staffSelect.options).forEach(opt => {
        if (opt.text.toLowerCase() === item.assignedStaff.toLowerCase()) opt.selected = true;
      });
    }

    const targetDateInput = root.getElementById ? root.getElementById('target-date') : root.querySelector('#target-date');
    if (targetDateInput) {
      if (effectiveTargetDate) {
        try {
          const parsed = new Date(effectiveTargetDate);
          if (!isNaN(parsed.getTime())) {
            const yyyy = parsed.getFullYear();
            const mm = String(parsed.getMonth() + 1).padStart(2, '0');
            const dd = String(parsed.getDate()).padStart(2, '0');
            targetDateInput.value = `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {}
      }

      if (!targetDateInput.dataset.boundTargetSync) {
        targetDateInput.dataset.boundTargetSync = 'true';
        const syncHeaderDate = () => {
          const val = targetDateInput.value;
          if (val) {
            try {
              const [yyyy, mm, dd] = val.split('-');
              const dObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
              const formatted = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(dObj);
              const headerTarget = root.querySelector('.equipment-target strong') || (typeof document !== 'undefined' ? document.querySelector('.equipment-target strong') : null);
              if (headerTarget) {
                headerTarget.textContent = formatted;
              }
              try {
                sessionStorage.setItem('prep_target_date_' + eqId, formatted);
                sessionStorage.setItem('prep_target_date_' + item.id, formatted);
              } catch (e) {}
              if (window.PREPARATION_CATALOG) {
                const match = window.PREPARATION_CATALOG.find(c => (c.equipmentId && c.equipmentId.toLowerCase() === eqId.toLowerCase()) || (c.id && c.id.toLowerCase() === item.id.toLowerCase()));
                if (match) match.targetDate = formatted;
              }
            } catch (e) {}
          }
        };
        targetDateInput.addEventListener('input', syncHeaderDate);
        targetDateInput.addEventListener('change', syncHeaderDate);
      }
    }

    const taskOptions = root.querySelector('.task-options');
    if (taskOptions && item.checklist && item.checklist.length > 0) {
      taskOptions.innerHTML = item.checklist.map((step, idx) => `
        <label>
          <input type="checkbox" name="task" value="${step.id || 'step-' + idx}" ${step.completed ? 'checked' : ''} />
          ${step.title}
        </label>
      `).join('');
    }

    const instInput = root.getElementById ? root.getElementById('assignment-instructions') : root.querySelector('#assignment-instructions');
    if (instInput && item.notes) instInput.value = item.notes;

    const cancelLink = root.querySelector('.detail-actions a[href*="preparation-details.html"]');
    if (cancelLink) cancelLink.href = `preparation-details.html?id=${encodeURIComponent(eqId)}`;

    const assignForm = root.querySelector('.assignment-form');
    if (assignForm) assignForm.action = `preparation-checklist.html?id=${encodeURIComponent(eqId)}`;

    // Step 3: Checklist view
    const checklistItemsContainer = root.querySelector('.checklist-items');
    if (checklistItemsContainer && item.checklist && item.checklist.length > 0) {
      let completedCount = 0;
      checklistItemsContainer.innerHTML = item.checklist.map(step => {
        if (step.completed) completedCount++;
        return `
          <label class="checklist-row">
            <input type="checkbox" data-id="${step.id}" ${step.completed ? 'checked' : ''} />
            <span><strong>${step.title}</strong><small>${step.completed ? 'Complete' : 'Pending'}</small></span>
          </label>
        `;
      }).join('');

      const checklistHeading = root.querySelector('.checklist-heading span');
      if (checklistHeading) checklistHeading.textContent = `${completedCount} / ${item.checklist.length} complete`;

      checklistItemsContainer.querySelectorAll('.checklist-row').forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        const sm = row.querySelector('small');
        if (cb && !cb.dataset.bound) {
          cb.dataset.bound = 'true';
          cb.addEventListener('change', () => {
            if (sm) sm.textContent = cb.checked ? 'Complete' : 'Pending';
            const checked = checklistItemsContainer.querySelectorAll('input:checked').length;
            if (checklistHeading) checklistHeading.textContent = `${checked} / ${item.checklist.length} complete`;
          });
        }
      });
    }

    const issueNotes = root.getElementById ? root.getElementById('issue-notes') : root.querySelector('#issue-notes');
    if (issueNotes && item.notes) issueNotes.value = item.notes;

    const submitBtn = root.querySelector('.detail-actions a.primary-action');
    if (submitBtn && submitBtn.getAttribute('href') && submitBtn.getAttribute('href').includes('preparation-review-details')) {
      submitBtn.href = `preparation-review-details.html?id=${encodeURIComponent(eqId)}`;
    }

    // Step 4: Review Details view
    const reviewStatusBox = root.querySelector('.review-status');
    if (reviewStatusBox) {
      const strong = reviewStatusBox.querySelector('strong');
      const small = reviewStatusBox.querySelector('small');
      if (strong) {
        strong.textContent = item.status === 'review'
          ? 'Preparation submitted for supervisor sign-off'
          : item.status === 'ready'
          ? 'Equipment ready for lending'
          : item.status === 'in-prep'
          ? 'Preparation in progress'
          : 'Awaiting preparation assignment';
      }
      if (small) {
        small.textContent = `Assigned to ${item.assignedStaff || 'Unassigned'} · Target ${effectiveTargetDate || item.targetDate || 'Pending'}`;
      }
    }

    const reviewItemsContainer = root.querySelector('.review-items');
    if (reviewItemsContainer && item.checklist && item.checklist.length > 0) {
      const completedCount = item.checklist.filter(s => s.completed).length;
      reviewItemsContainer.innerHTML = item.checklist.map(step => `
        <div>
          <span>${step.title}</span>
          <strong style="${step.completed ? 'color: #26734d;' : 'color: #6b6474;'}">${step.completed ? 'Complete' : 'Pending'}</strong>
        </div>
      `).join('');

      const reviewChecklistHeading = root.querySelector('.checklist-heading span');
      if (reviewChecklistHeading) reviewChecklistHeading.textContent = `${completedCount} / ${item.checklist.length} complete`;
    }

    const reviewNotes = root.getElementById ? root.getElementById('review-notes') : root.querySelector('#review-notes');
    if (reviewNotes && item.notes) reviewNotes.value = item.notes;

    const returnLink = root.querySelector('.detail-actions a.secondary-action');
    if (returnLink && returnLink.getAttribute('href') && returnLink.getAttribute('href').includes('preparation-checklist')) {
      returnLink.href = `preparation-checklist.html?id=${encodeURIComponent(eqId)}`;
    }

    enforceAllStatusBadgeColors();
  }

  window.hydratePreparationUI = hydratePreparationUI;

  function enforceAllStatusBadgeColors() {
    document.querySelectorAll('.status-badge').forEach((badge) => {
      const explicitStatus = badge.getAttribute('data-status');
      const txt = (badge.textContent || '').trim().toLowerCase();
      let statusKey = explicitStatus;
      if (!statusKey) {
        if (txt === 'needs preparation' || txt.includes('needs prep') || txt === 'awaiting') statusKey = 'awaiting';
        else if (txt === 'in preparation' || txt.includes('in prep') || txt === 'in progress') statusKey = 'in-prep';
        else if (txt === 'awaiting review' || txt.includes('review')) statusKey = 'review';
        else if (txt === 'ready for lending' || txt.includes('ready')) statusKey = 'ready';
      }

      if (statusKey === 'in-prep') {
        badge.classList.remove('needs-prep', 'in-review', 'review', 'ready');
        badge.classList.add('in-progress');
        badge.setAttribute('data-status', 'in-prep');
        badge.style.setProperty('color', '#9a6500', 'important');
        badge.style.setProperty('background', '#fff3d8', 'important');
        badge.style.setProperty('background-color', '#fff3d8', 'important');
      } else if (statusKey === 'review') {
        badge.classList.remove('needs-prep', 'in-progress', 'ready');
        badge.classList.add('in-review');
        badge.setAttribute('data-status', 'review');
        badge.style.setProperty('color', '#46166b', 'important');
        badge.style.setProperty('background', '#f1ebf6', 'important');
        badge.style.setProperty('background-color', '#f1ebf6', 'important');
      } else if (statusKey === 'ready') {
        badge.classList.remove('needs-prep', 'in-progress', 'in-review', 'review');
        badge.classList.add('ready');
        badge.setAttribute('data-status', 'ready');
        badge.style.setProperty('color', '#26734d', 'important');
        badge.style.setProperty('background', '#e8f5ed', 'important');
        badge.style.setProperty('background-color', '#e8f5ed', 'important');
      } else if (statusKey === 'awaiting' || txt === 'needs preparation' || txt.includes('needs prep')) {
        badge.classList.remove('in-progress', 'in-review', 'review', 'ready');
        badge.classList.add('needs-prep');
        badge.setAttribute('data-status', 'awaiting');
        badge.style.setProperty('color', '#a4262c', 'important');
        badge.style.setProperty('background', '#fde8e8', 'important');
        badge.style.setProperty('background-color', '#fde8e8', 'important');
      }
    });
  }

  function enforceReviewBadgeColors() {
    enforceAllStatusBadgeColors();
  }
  window.enforceReviewBadgeColors = enforceAllStatusBadgeColors;
  window.enforceAllStatusBadgeColors = enforceAllStatusBadgeColors;

  // Observe DOM changes to catch dynamically inserted status badges instantly
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const statusObserver = new MutationObserver(() => {
      enforceAllStatusBadgeColors();
    });
    if (document.body) {
      statusObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) statusObserver.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  /* ==========================================================================
     Smooth In-Page Navigation (Eliminates Screen Jump / White Flash on Click)
     ========================================================================== */
  function initSmoothNavigation() {
    document.addEventListener('click', async (e) => {
      // Ignore right clicks or modifier keys
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      // Ensure internal link
      let targetUrl;
      try {
        targetUrl = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;

      // Exclude login.html from client-side SPA routing (login is standalone, outside workspace shell)
      if (targetUrl.pathname.includes('login') || window.location.pathname.includes('login')) {
        return;
      }

      // Check for .html page
      const isHtml = targetUrl.pathname.endsWith('.html') || targetUrl.pathname === '/' || targetUrl.pathname.endsWith('/');
      if (!isHtml) return;

      // If linking to current exact URL, do nothing
      if (targetUrl.href === window.location.href) {
        e.preventDefault();
        return;
      }

      // Try smooth client-side transition
      try {
        e.preventDefault();
        const response = await fetch(targetUrl.href);
        if (!response.ok) {
          window.location.href = targetUrl.href;
          return;
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, 'text/html');

        // Update title and body class
        document.title = newDoc.title;
        document.body.className = newDoc.body.className;

        // Update <app-sidebar>
        const oldSidebar = document.querySelector('app-sidebar');
        const newSidebar = newDoc.querySelector('app-sidebar');
        if (oldSidebar && newSidebar) {
          const currentAttr = newSidebar.getAttribute('current') || '';
          oldSidebar.setAttribute('current', currentAttr);
        }

        // Update <app-header>
        const oldHeader = document.querySelector('app-header');
        const newHeader = newDoc.querySelector('app-header');
        if (oldHeader && newHeader) {
          const breadcrumbsAttr = newHeader.getAttribute('breadcrumbs') || '';
          oldHeader.setAttribute('breadcrumbs', breadcrumbsAttr);
        }

        // Push new URL to history first so window.location matches new page
        history.pushState(null, '', targetUrl.href);
        window.scrollTo(0, 0);

        const targetId = targetUrl.searchParams.get('id') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('current_preparation_id') : null);

        // Update <main id="main-content"> or .login-page
        const oldMain = document.getElementById('main-content') || document.querySelector('main');
        const newMain = newDoc.getElementById('main-content') || newDoc.querySelector('main');
        if (oldMain && newMain) {
          const isPrepTarget = targetUrl.pathname.includes('preparation-details') ||
            targetUrl.pathname.includes('preparation-assignment') ||
            targetUrl.pathname.includes('preparation-checklist') ||
            targetUrl.pathname.includes('preparation-review-details');
          if (isPrepTarget && targetId) {
            hydratePreparationUI(newMain, targetId);
          }
          oldMain.replaceWith(newMain);
        }

        if (targetId) {
          try { sessionStorage.setItem('current_preparation_id', targetId); } catch (e) {}
          document.querySelectorAll('preparation-steps').forEach((steps) => {
            steps.setAttribute('item-id', targetId);
            if (typeof steps.connectedCallback === 'function') {
              steps.connectedCallback();
            }
          });
          const isPrepPageNow = window.location.pathname.includes('preparation-details') ||
            window.location.pathname.includes('preparation-assignment') ||
            window.location.pathname.includes('preparation-checklist') ||
            window.location.pathname.includes('preparation-review-details');
          if (isPrepPageNow) {
            hydratePreparationUI(document, targetId);
          }
        }

        // Re-initialize interactive behaviors for the new content
        initInteractiveBehaviors();
        if (window.LibraryDeskAPI && typeof window.LibraryDeskAPI.init === 'function') {
          window.LibraryDeskAPI.init();
        }
        document.dispatchEvent(new CustomEvent('page:loaded'));
      } catch (err) {
        // Fallback to normal navigation if fetch fails (e.g. CORS on local file:// protocol)
        window.location.href = targetUrl.href;
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', async () => {
      if (window.location.pathname.includes('login')) {
        window.location.reload();
        return;
      }
      try {
        const response = await fetch(window.location.href);
        if (!response.ok) {
          window.location.reload();
          return;
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(htmlText, 'text/html');

        document.title = newDoc.title;
        document.body.className = newDoc.body.className;

        const oldSidebar = document.querySelector('app-sidebar');
        const newSidebar = newDoc.querySelector('app-sidebar');
        if (oldSidebar && newSidebar) {
          oldSidebar.setAttribute('current', newSidebar.getAttribute('current') || '');
        }

        const oldHeader = document.querySelector('app-header');
        const newHeader = newDoc.querySelector('app-header');
        if (oldHeader && newHeader) {
          oldHeader.setAttribute('breadcrumbs', newHeader.getAttribute('breadcrumbs') || '');
        }

        const popUrl = new URL(window.location.href);
        const popId = popUrl.searchParams.get('id') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('current_preparation_id') : null);

        const oldMain = document.getElementById('main-content') || document.querySelector('main');
        const newMain = newDoc.getElementById('main-content') || newDoc.querySelector('main');
        if (oldMain && newMain) {
          const isPrepTarget = popUrl.pathname.includes('preparation-details') ||
            popUrl.pathname.includes('preparation-assignment') ||
            popUrl.pathname.includes('preparation-checklist') ||
            popUrl.pathname.includes('preparation-review-details');
          if (isPrepTarget && popId) {
            hydratePreparationUI(newMain, popId);
          }
          oldMain.replaceWith(newMain);
        }

        if (popId) {
          try { sessionStorage.setItem('current_preparation_id', popId); } catch (e) {}
          document.querySelectorAll('preparation-steps').forEach((steps) => {
            steps.setAttribute('item-id', popId);
            if (typeof steps.connectedCallback === 'function') {
              steps.connectedCallback();
            }
          });
          const isPrepPageNow = window.location.pathname.includes('preparation-details') ||
            window.location.pathname.includes('preparation-assignment') ||
            window.location.pathname.includes('preparation-checklist') ||
            window.location.pathname.includes('preparation-review-details');
          if (isPrepPageNow) {
            hydratePreparationUI(document, popId);
          }
        }

        initInteractiveBehaviors();
        if (window.LibraryDeskAPI && typeof window.LibraryDeskAPI.init === 'function') {
          window.LibraryDeskAPI.init();
        }
        document.dispatchEvent(new CustomEvent('page:loaded'));
        window.scrollTo(0, 0);
      } catch (err) {
        window.location.reload();
      }
    });
  }

  // Initialize interactive behaviors and smooth navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initInteractiveBehaviors();
      initSmoothNavigation();
    });
  } else {
    initInteractiveBehaviors();
    initSmoothNavigation();
  }
})();
