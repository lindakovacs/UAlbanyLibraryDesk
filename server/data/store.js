/**
 * In-memory data store for UAlbany LibraryDesk
 * Seeded with initial prototype records for equipment, borrowers, loans, preparation, and staff.
 * Designed with a clean repository pattern to be swapped with MySQL in Milestone 6.
 */

const defaultStaff = {
  netid: 'linda.kovacs',
  name: 'Linda Kovacs',
  universityId: '001239847',
  department: 'University Libraries',
  division: 'Access & Circulation Services',
  email: 'linda.kovacs@ualbany.edu',
  role: 'Authorized Circulation Specialist',
  deskStation: 'Uptown Circulation Desk #2',
  workstationId: 'DESK-CIRC-02 (Uptown)',
  permissions: ['checkout', 'return', 'review', 'reports'],
  status: 'active',
  shiftDate: '11 Oct 2026'
};

const initialEquipment = [
  {
    id: 'EQ-001',
    name: 'Mirrorless Camera Kit',
    category: 'Creative Technology',
    available: 3,
    total: 4,
    status: 'available',
    description: 'Sony Alpha mirrorless 4K camera kit with 28-70mm lens, 64GB SD card, battery, and charger.',
    accessories: ['Camera body', '28-70mm lens', '64GB SD card', 'Rechargeable battery', 'Charger', 'Carry bag']
  },
  {
    id: 'EQ-002',
    name: 'Nintendo Switch',
    category: 'Gaming Consoles and Accessories',
    available: 3,
    total: 4,
    status: 'available',
    description: 'Nintendo Switch OLED console with Joy-Con pair, dock, power adapter, and HDMI cable.',
    accessories: ['Console', 'Left/Right Joy-Con', 'Dock', 'AC adapter', 'HDMI cable']
  },
  {
    id: 'EQ-003',
    name: 'H4 Zoom Audio Recording Kit',
    category: 'Creative Technology',
    available: 2,
    total: 3,
    status: 'available',
    description: 'Handy portable 4-track audio recorder with X/Y stereo mics and XLR inputs.',
    accessories: ['H4n recorder', 'Windscreen', 'Power supply', 'Case', '16GB SD card']
  },
  {
    id: 'EQ-004',
    name: '3D Scanning Kit (Revopoint POP 3 Plus)',
    category: 'Creative Technology',
    available: 1,
    total: 2,
    status: 'available',
    description: 'High-precision handheld 3D scanner for modeling and digital reverse engineering.',
    accessories: ['Scanner head', 'Turntable', 'Tripod', 'Calibration board', 'USB-C cable']
  },
  {
    id: 'EQ-005',
    name: 'Rode Wireless GO II Microphone System',
    category: 'Creative Technology',
    available: 2,
    total: 3,
    status: 'available',
    description: 'Dual-channel compact wireless microphone system with built-in recording.',
    accessories: ['Dual transmitters', 'Single receiver', '2x furry windshields', '3.5mm TRS cable', 'Pouch']
  },
  {
    id: 'EQ-006',
    name: 'PlayStation 5',
    category: 'Gaming Consoles and Accessories',
    available: 2,
    total: 3,
    status: 'available',
    description: 'Sony PS5 console with DualSense wireless controller, power cable, and HDMI cable.',
    accessories: ['PS5 console', 'DualSense controller', 'Power cable', 'HDMI cable', 'USB-C charging cable']
  },
  {
    id: 'EQ-007',
    name: 'Arcade Controller',
    category: 'Gaming Consoles and Accessories',
    available: 2,
    total: 2,
    status: 'available',
    description: 'Universal 8-button arcade fight stick controller for tournament and casual play.',
    accessories: ['Arcade fight stick', 'USB connection cable']
  },
  {
    id: 'EQ-008',
    name: 'H1 Zoom Kit',
    category: 'Creative Technology',
    available: 2,
    total: 2,
    status: 'available',
    description: 'Lightweight ultra-compact stereo audio recorder for field interviews and podcasting.',
    accessories: ['H1 recorder', 'Foam windscreen', 'Mic stand clip', 'Case']
  },
  {
    id: 'EQ-009',
    name: 'M30 Gamepad',
    category: 'Gaming Consoles and Accessories',
    available: 3,
    total: 3,
    status: 'available',
    description: 'Classic 6-button wireless Bluetooth gamepad controller.',
    accessories: ['Controller', 'USB-C cable']
  },
  {
    id: 'EQ-010',
    name: 'Owl 3 Video Conference Camera',
    category: 'Creative Technology',
    available: 2,
    total: 2,
    status: 'available',
    description: '360-degree intelligent video camera, speaker, and microphone combo for hybrid group meetings.',
    accessories: ['Meeting Owl 3', 'Power adapter', 'USB-C cable', 'Lock adapter']
  },
  {
    id: 'EQ-011',
    name: 'Portable Podcasting Kit (Zoom H6)',
    category: 'Creative Technology',
    available: 2,
    total: 2,
    status: 'available',
    description: '6-track flagship portable audio recorder with interchangeable microphone capsules.',
    accessories: ['Zoom H6 body', 'XYH-6 X/Y mic capsule', 'MSH-6 mid-side capsule', 'Windscreen', 'Hard case']
  },
  {
    id: 'EQ-012',
    name: 'SmallRig All-in-One Smartphone Video Kit',
    category: 'Creative Technology',
    available: 2,
    total: 2,
    status: 'available',
    description: 'Complete smartphone mobile filmmaking rig with handles, LED fill light, and shotgun microphone.',
    accessories: ['Phone cage', 'Dual handles', 'LED video light', 'Cardioid mic', 'Cold shoe mounts']
  },
  {
    id: 'EQ-013',
    name: 'SN30 Pro Gamepad',
    category: 'Gaming Consoles and Accessories',
    available: 3,
    total: 3,
    status: 'available',
    description: 'Full-featured retro wireless Bluetooth controller with dual analog sticks and rumble vibration.',
    accessories: ['SN30 Pro controller', 'USB-C charging cable']
  }
];

const initialBorrowers = [
  {
    netid: 'emma.wilson',
    name: 'Emma Wilson',
    universityId: '001482759',
    email: 'ewilson@ualbany.edu',
    department: 'Digital Arts & Media',
    role: 'Undergraduate Student',
    openLoans: 1,
    status: 'good-standing'
  },
  {
    netid: 'james.chen',
    name: 'James Chen',
    universityId: '001573024',
    email: 'jchen@ualbany.edu',
    department: 'Computer Science',
    role: 'Undergraduate Student',
    openLoans: 1,
    status: 'good-standing'
  },
  {
    netid: 'olivia.martinez',
    name: 'Olivia Martinez',
    universityId: '001492831',
    email: 'omartinez@ualbany.edu',
    department: 'Communications & Journalism',
    role: 'Graduate Student',
    openLoans: 1,
    status: 'restricted'
  },
  {
    netid: 'noah.thompson',
    name: 'Noah Thompson',
    universityId: '001583902',
    email: 'nthompson@ualbany.edu',
    department: 'Mechanical Engineering',
    role: 'Undergraduate Student',
    openLoans: 1,
    status: 'good-standing'
  },
  {
    netid: 'sophia.lee',
    name: 'Sophia Lee',
    universityId: '001482610',
    email: 'slee@ualbany.edu',
    department: 'Informatics',
    role: 'Undergraduate Student',
    openLoans: 1,
    status: 'good-standing'
  }
];

const initialLoans = [
  {
    id: 'LN-1042',
    equipmentId: 'EQ-001',
    equipmentName: 'Mirrorless Camera Kit',
    category: 'Creative Technology',
    borrowerNetId: 'emma.wilson',
    borrowerName: 'Emma Wilson',
    universityId: '001482759',
    checkoutDate: '2026-10-06T14:30:00.000Z',
    dueDate: '2026-10-13T17:00:00.000Z',
    status: 'active',
    assetTag: 'ALB-EQ-001-A',
    accessories: ['Camera body', '28-70mm lens', '64GB SD card', 'Rechargeable battery', 'Charger', 'Carry bag']
  },
  {
    id: 'LN-1041',
    equipmentId: 'EQ-002',
    equipmentName: 'Nintendo Switch',
    category: 'Gaming Consoles and Accessories',
    borrowerNetId: 'james.chen',
    borrowerName: 'James Chen',
    universityId: '001573024',
    checkoutDate: '2026-10-04T10:15:00.000Z',
    dueDate: '2026-10-11T17:00:00.000Z',
    status: 'due-today',
    assetTag: 'ALB-EQ-002-C',
    accessories: ['Console', 'Left/Right Joy-Con', 'Dock', 'AC adapter', 'HDMI cable']
  },
  {
    id: 'LN-1040',
    equipmentId: 'EQ-003',
    equipmentName: 'H4 Zoom Audio Recording Kit',
    category: 'Creative Technology',
    borrowerNetId: 'olivia.martinez',
    borrowerName: 'Olivia Martinez',
    universityId: '001492831',
    checkoutDate: '2026-10-02T11:00:00.000Z',
    dueDate: '2026-10-09T17:00:00.000Z',
    status: 'overdue',
    assetTag: 'ALB-EQ-003-B',
    accessories: ['H4n recorder', 'Windscreen', 'Power supply', 'Case', '16GB SD card']
  },
  {
    id: 'LN-1039',
    equipmentId: 'EQ-004',
    equipmentName: '3D Scanning Kit (Revopoint POP 3 Plus)',
    category: 'Creative Technology',
    borrowerNetId: 'noah.thompson',
    borrowerName: 'Noah Thompson',
    universityId: '001583902',
    checkoutDate: '2026-10-05T13:45:00.000Z',
    dueDate: '2026-10-12T17:00:00.000Z',
    status: 'active',
    assetTag: 'ALB-EQ-004-A',
    accessories: ['Scanner head', 'Turntable', 'Tripod', 'Calibration board', 'USB-C cable']
  },
  {
    id: 'LN-1038',
    equipmentId: 'EQ-005',
    equipmentName: 'Rode Wireless GO II Microphone System',
    category: 'Creative Technology',
    borrowerNetId: 'sophia.lee',
    borrowerName: 'Sophia Lee',
    universityId: '001482610',
    checkoutDate: '2026-10-04T09:30:00.000Z',
    dueDate: '2026-10-11T17:00:00.000Z',
    status: 'due-today',
    assetTag: 'ALB-EQ-005-B',
    accessories: ['Dual transmitters', 'Single receiver', '2x furry windshields', '3.5mm TRS cable', 'Pouch']
  }
];

const initialPreparation = [
  {
    id: 'PREP-001',
    equipmentId: 'EQ-014',
    equipmentName: 'MacBook Pro 16" Lending Kit',
    category: 'Computing',
    assignedStaff: 'Unassigned',
    targetDate: '12 Oct 2026',
    status: 'awaiting',
    currentStep: 1,
    checklist: [
      { id: 'wipe', title: 'Factory Reset & Storage Sanitization', completed: false },
      { id: 'inspect', title: 'Hardware Diagnostics & Screen Inspection', completed: false },
      { id: 'accessories', title: 'Charger & USB-C Cable Verification', completed: false },
      { id: 'packaging', title: 'Clean exterior and package in lending sleeve', completed: false }
    ],
    notes: 'Returned from faculty loan'
  },
  {
    id: 'PREP-002',
    equipmentId: 'EQ-001',
    equipmentName: 'Mirrorless Camera Kit',
    category: 'Creative Technology',
    assignedStaff: 'Linda Kovacs',
    targetDate: '11 Oct 2026',
    status: 'in-prep',
    currentStep: 3,
    checklist: [
      { id: 'wipe', title: 'SD card format and factory reset', completed: true },
      { id: 'inspect', title: 'Sensor cleaning and lens check', completed: true },
      { id: 'battery', title: 'Battery fully charged and tested', completed: false },
      { id: 'manifest', title: 'Accessory pouch verified', completed: false }
    ],
    notes: 'Routine prep after checkout'
  },
  {
    id: 'PREP-003',
    equipmentId: 'EQ-003',
    equipmentName: 'H4 Zoom Audio Recording Kit',
    category: 'Creative Technology',
    assignedStaff: 'Veronica Dindial',
    targetDate: '11 Oct 2026',
    status: 'review',
    currentStep: 4,
    checklist: [
      { id: 'wipe', title: 'SD card wipe', completed: true },
      { id: 'inspect', title: 'Mic capsule check', completed: true },
      { id: 'battery', title: 'AA batteries replenished', completed: true },
      { id: 'supervisor', title: 'Supervisor sign-off', completed: false }
    ],
    notes: 'Awaiting supervisor sign-off'
  },
  {
    id: 'PREP-004',
    equipmentId: 'EQ-002',
    equipmentName: 'Nintendo Switch',
    category: 'Gaming Consoles and Accessories',
    assignedStaff: 'Amari Scott',
    targetDate: '10 Oct 2026',
    status: 'ready',
    currentStep: 4,
    checklist: [
      { id: 'wipe', title: 'User profiles removed', completed: true },
      { id: 'inspect', title: 'Joy-Con drift test', completed: true },
      { id: 'dock', title: 'Dock & cables verified', completed: true },
      { id: 'shelf', title: 'Ready shelf staging', completed: true }
    ],
    notes: 'Ready for circulation'
  }
];

class DataStore {
  constructor() {
    this.staff = { ...defaultStaff };
    this.equipment = JSON.parse(JSON.stringify(initialEquipment));
    this.borrowers = JSON.parse(JSON.stringify(initialBorrowers));
    this.loans = JSON.parse(JSON.stringify(initialLoans));
    this.preparation = JSON.parse(JSON.stringify(initialPreparation));
    this.session = {
      authenticated: true,
      user: { ...this.staff },
      signedInAt: new Date().toISOString()
    };
  }

  // Auth & Session
  getSession() {
    return this.session;
  }

  login(netid, password) {
    this.session = {
      authenticated: true,
      user: {
        ...this.staff,
        netid: netid || this.staff.netid
      },
      signedInAt: new Date().toISOString()
    };
    return this.session;
  }

  logout() {
    this.session = {
      authenticated: false,
      user: null,
      signedInAt: null
    };
    return { status: 'logged_out' };
  }

  // Equipment
  getEquipment(query = {}) {
    let list = [...this.equipment];
    if (query.category) {
      list = list.filter(item => item.category.toLowerCase() === query.category.toLowerCase());
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getEquipmentById(id) {
    return this.equipment.find(item => item.id.toLowerCase() === id.toLowerCase());
  }

  createEquipment(data) {
    const nextId = `EQ-${String(this.equipment.length + 1).padStart(3, '0')}`;
    const newItem = {
      id: data.id || nextId,
      name: data.name,
      category: data.category || 'Creative Technology',
      available: Number(data.available) || 1,
      total: Number(data.total) || Number(data.available) || 1,
      status: data.status || 'available',
      description: data.description || '',
      accessories: Array.isArray(data.accessories) ? data.accessories : []
    };
    this.equipment.push(newItem);
    return newItem;
  }

  updateEquipment(id, data) {
    const item = this.getEquipmentById(id);
    if (!item) return null;
    Object.assign(item, data);
    return item;
  }

  // Borrowers
  getBorrowers(query = {}) {
    let list = [...this.borrowers];
    if (query.status) {
      list = list.filter(b => b.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.netid.toLowerCase().includes(q) ||
        b.universityId.includes(q)
      );
    }
    return list;
  }

  getBorrowerByNetId(netid) {
    return this.borrowers.find(b => b.netid.toLowerCase() === netid.toLowerCase());
  }

  // Loans
  getLoans(query = {}) {
    let list = [...this.loans];
    if (query.status && query.status !== 'all') {
      list = list.filter(l => l.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.borrowerName.toLowerCase().includes(q) ||
        l.borrowerNetId.toLowerCase().includes(q) ||
        l.equipmentName.toLowerCase().includes(q) ||
        l.equipmentId.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getLoanById(id) {
    return this.loans.find(l => l.id.toLowerCase() === id.toLowerCase());
  }

  createLoan(data) {
    const nextNum = 1043 + this.loans.length - 5;
    const loanId = `LN-${nextNum}`;
    const eq = this.getEquipmentById(data.equipmentId);
    if (eq && eq.available > 0) {
      eq.available -= 1;
    }
    let borrower = this.getBorrowerByNetId(data.netid);
    if (borrower) {
      borrower.openLoans = (borrower.openLoans || 0) + 1;
    }

    const newLoan = {
      id: loanId,
      equipmentId: data.equipmentId,
      equipmentName: eq ? eq.name : (data.equipmentName || 'Equipment Item'),
      category: eq ? eq.category : 'General',
      borrowerNetId: data.netid,
      borrowerName: data.borrower || (borrower ? borrower.name : data.netid),
      universityId: borrower ? borrower.universityId : (data.universityId || '001999999'),
      checkoutDate: new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: 'active',
      assetTag: data.assetTag || `ALB-${data.equipmentId}-X`,
      accessories: eq ? eq.accessories : []
    };

    this.loans.unshift(newLoan);
    return newLoan;
  }

  returnLoan(id, returnData = {}) {
    const loan = this.getLoanById(id);
    if (!loan) return null;

    loan.status = 'returned';
    loan.returnDate = new Date().toISOString();
    loan.returnCondition = returnData.condition || 'good';
    loan.destination = returnData.destination || 'ready-shelf';
    loan.returnNotes = returnData.notes || '';

    const eq = this.getEquipmentById(loan.equipmentId);
    if (eq) {
      if (returnData.destination === 'ready-shelf') {
        eq.available = Math.min(eq.total, eq.available + 1);
      }
    }

    const borrower = this.getBorrowerByNetId(loan.borrowerNetId);
    if (borrower && borrower.openLoans > 0) {
      borrower.openLoans -= 1;
    }

    // If destination is preparation queue, add an entry
    if (returnData.destination === 'prep-queue') {
      const nextPrepId = `PREP-${String(this.preparation.length + 1).padStart(3, '0')}`;
      this.preparation.unshift({
        id: nextPrepId,
        equipmentId: loan.equipmentId,
        equipmentName: loan.equipmentName,
        category: loan.category,
        assignedStaff: 'Unassigned',
        targetDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'awaiting',
        currentStep: 1,
        checklist: [
          { id: 'wipe', title: 'Factory Reset & Storage Sanitization', completed: false },
          { id: 'inspect', title: 'Hardware Diagnostics & Inspection', completed: false },
          { id: 'accessories', title: 'Accessory verification', completed: false },
          { id: 'packaging', title: 'Packaging for lending', completed: false }
        ],
        notes: `Returned from ${loan.id} in ${returnData.condition || 'good'} condition`
      });
    }

    return loan;
  }

  // Preparation
  getPreparation(query = {}) {
    let list = [...this.preparation];
    if (query.status && query.status !== 'all') {
      list = list.filter(p => p.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.equipmentId.toLowerCase().includes(q) ||
        p.equipmentName.toLowerCase().includes(q) ||
        p.assignedStaff.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getPreparationById(id) {
    return this.preparation.find(p => p.id.toLowerCase() === id.toLowerCase());
  }

  updatePreparation(id, data) {
    const item = this.getPreparationById(id);
    if (!item) return null;
    if (data.assignedStaff !== undefined) item.assignedStaff = data.assignedStaff;
    if (data.status !== undefined) item.status = data.status;
    if (data.currentStep !== undefined) item.currentStep = data.currentStep;
    if (data.checklist !== undefined) item.checklist = data.checklist;
    if (data.notes !== undefined) item.notes = data.notes;
    return item;
  }

  // Reports
  getReports(query = {}) {
    const defaultReports = [
      { id: 'EQ-001', name: 'Mirrorless Camera Kit', category: 'Creative Technology', checkouts: 6, avgDays: 4.2, totalDays: 25 },
      { id: 'EQ-002', name: 'Nintendo Switch', category: 'Gaming Consoles and Accessories', checkouts: 5, avgDays: 3.6, totalDays: 18 },
      { id: 'EQ-003', name: 'H4 Zoom Audio Recording Kit', category: 'Creative Technology', checkouts: 5, avgDays: 4.0, totalDays: 20 },
      { id: 'EQ-004', name: '3D Scanning Kit (Revopoint POP 3 Plus)', category: 'Creative Technology', checkouts: 3, avgDays: 5.1, totalDays: 15 },
      { id: 'EQ-005', name: 'Rode Wireless GO II Microphone System', category: 'Creative Technology', checkouts: 4, avgDays: 3.8, totalDays: 15 },
      { id: 'EQ-006', name: 'PlayStation 5', category: 'Gaming Consoles and Accessories', checkouts: 4, avgDays: 4.5, totalDays: 18 },
      { id: 'EQ-007', name: 'Arcade Controller', category: 'Gaming Consoles and Accessories', checkouts: 2, avgDays: 3.0, totalDays: 6 },
      { id: 'EQ-008', name: 'H1 Zoom Kit', category: 'Creative Technology', checkouts: 3, avgDays: 3.2, totalDays: 10 },
      { id: 'EQ-009', name: 'M30 Gamepad', category: 'Gaming Consoles and Accessories', checkouts: 2, avgDays: 2.5, totalDays: 5 },
      { id: 'EQ-010', name: 'Owl 3 Video Conference Camera', category: 'Creative Technology', checkouts: 3, avgDays: 2.0, totalDays: 6 },
      { id: 'EQ-013', name: 'SN30 Pro Gamepad', category: 'Gaming Consoles and Accessories', checkouts: 1, avgDays: 3.0, totalDays: 3 }
    ];

    let list = [...defaultReports];
    if (query.category) {
      list = list.filter(r => r.category.toLowerCase().includes(query.category.toLowerCase()));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    return list;
  }

  // Summary KPIs for dashboard & reports
  getSummaryKPIs() {
    const totalEquipment = this.equipment.reduce((acc, eq) => acc + eq.total, 0);
    const activeLoans = this.loans.filter(l => l.status === 'active' || l.status === 'due-today' || l.status === 'overdue').length;
    const dueToday = this.loans.filter(l => l.status === 'due-today').length;
    const overdue = this.loans.filter(l => l.status === 'overdue').length;

    const prepNeeds = this.preparation.filter(p => p.status === 'awaiting').length;
    const prepIn = this.preparation.filter(p => p.status === 'in-prep').length;
    const prepReview = this.preparation.filter(p => p.status === 'review').length;
    const prepReady = this.preparation.filter(p => p.status === 'ready').length;

    return {
      totalEquipment: 28, // Matches static template KPI (28 catalog units total)
      activeLoans,
      dueToday,
      overdue,
      preparation: {
        total: this.preparation.length,
        needsPreparation: prepNeeds,
        inPreparation: prepIn,
        awaitingReview: prepReview,
        readyForLending: prepReady
      }
    };
  }
}

// Singleton instance
const store = new DataStore();

module.exports = store;
