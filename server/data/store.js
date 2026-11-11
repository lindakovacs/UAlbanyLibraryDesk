/**
 * Data store and persistence layer for UAlbany LibraryDesk
 * Communicates with MySQL database (ualbanylibrarydesk) with transaction support.
 * Automatically falls back to in-memory store if MySQL is offline or in test mode.
 */

const { pool } = require('../config/db');

const defaultStaff = {
  netid: 'linda.kovacs',
  name: 'Linda Kovacs',
  universityId: '001239847',
  department: 'University Libraries',
  division: 'Access & Circulation Services',
  email: 'linda.kovacs@ualbany.edu',
  role: 'Circulation Supervisor',
  deskStation: 'Uptown Circulation Desk #2',
  workstationId: 'DESK-CIRC-02 (Uptown)',
  permissions: ['checkout', 'return', 'review', 'reports', 'supervisor', 'admin'],
  status: 'active',
  shiftDate: '11 Oct 2026'
};

const specialistStaff = {
  netid: 'maria.santos',
  name: 'Maria Santos',
  universityId: '001298452',
  department: 'University Libraries',
  division: 'Access & Circulation Services',
  email: 'msantos@albany.edu',
  role: 'Circulation Specialist',
  deskStation: 'Uptown Circulation Desk #1',
  workstationId: 'DESK-CIRC-01 (Uptown)',
  permissions: ['checkout', 'return', 'preparation'],
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
  },
  {
    id: 'EQ-014',
    name: 'Game Console',
    category: 'Gaming Consoles and Accessories',
    available: 1,
    total: 2,
    status: 'available',
    description: 'Universal video game console system.',
    accessories: ['Console base', 'Power supply']
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
    checkoutDate: '2026-10-06T18:30:00.000Z',
    dueDate: '2026-10-13T21:00:00.000Z',
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
    checkoutDate: '2026-10-04T14:15:00.000Z',
    dueDate: '2026-10-11T21:00:00.000Z',
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
    checkoutDate: '2026-10-02T15:00:00.000Z',
    dueDate: '2026-10-09T21:00:00.000Z',
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
    checkoutDate: '2026-10-05T17:45:00.000Z',
    dueDate: '2026-10-12T21:00:00.000Z',
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
    checkoutDate: '2026-10-04T13:30:00.000Z',
    dueDate: '2026-10-11T21:00:00.000Z',
    status: 'due-today',
    assetTag: 'ALB-EQ-005-B',
    accessories: ['Dual transmitters', 'Single receiver', '2x furry windshields', '3.5mm TRS cable', 'Pouch']
  }
];

const initialPreparation = [
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
    notes: 'Routine prep and sanitization after return'
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

class DataStore {
  constructor() {
    this.staff = { ...defaultStaff };
    this.specialistStaff = { ...specialistStaff };
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
  async getSession() {
    return this.session;
  }

  async login(netid, password) {
    try {
      const [rows] = await pool.query('SELECT * FROM staff_users WHERE netid = ?;', [netid]);
      if (rows && rows.length > 0) {
        const u = rows[0];
        let permissions = u.permissions;
        if (typeof permissions === 'string') {
          try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
        }
        this.session = {
          authenticated: true,
          user: {
            netid: u.netid,
            name: u.name,
            universityId: u.university_id,
            department: u.department,
            division: u.division,
            email: u.email,
            role: u.role,
            deskStation: u.desk_station,
            workstationId: u.workstation_id,
            permissions,
            status: u.status
          },
          signedInAt: new Date().toISOString()
        };
        return this.session;
      }
    } catch (e) {
      // fallback to in-memory
    }

    const candidate = (netid && this.specialistStaff && netid.toLowerCase() === this.specialistStaff.netid.toLowerCase())
      ? this.specialistStaff
      : this.staff;

    this.session = {
      authenticated: true,
      user: {
        ...candidate,
        netid: netid || candidate.netid
      },
      signedInAt: new Date().toISOString()
    };
    return this.session;
  }

  async logout() {
    this.session = {
      authenticated: false,
      user: null,
      signedInAt: null
    };
    return { status: 'logged_out' };
  }

  // Equipment
  async getEquipment(query = {}) {
    try {
      let sql = `
        SELECT e.*, GROUP_CONCAT(a.accessory_name SEPARATOR '||') AS accessories_str
        FROM equipment e
        LEFT JOIN equipment_accessories a ON e.id = a.equipment_id
        WHERE 1=1
      `;
      const params = [];
      if (query.category) {
        sql += ' AND LOWER(e.category) = LOWER(?)';
        params.push(query.category);
      }
      if (query.search) {
        const raw = query.search.trim().toLowerCase();
        const q = `%${raw}%`;
        sql += ` AND (
          LOWER(e.name) LIKE ? OR 
          LOWER(e.id) LIKE ? OR 
          LOWER(e.category) LIKE ? OR 
          LOWER(e.status) LIKE ? OR 
          LOWER(COALESCE(e.description, '')) LIKE ? OR 
          LOWER(COALESCE(a.accessory_name, '')) LIKE ?
        )`;
        params.push(q, q, q, q, q, q);
      }
      sql += ' GROUP BY e.id ORDER BY e.id ASC;';

      const [rows] = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          available: r.available_quantity,
          total: r.total_quantity,
          status: r.status,
          description: r.description || '',
          accessories: r.accessories_str ? r.accessories_str.split('||') : []
        }));
      }
    } catch (e) {
      // fallback to in-memory
    }

    let list = [...this.equipment];
    if (query.category) {
      list = list.filter(item => item.category.toLowerCase() === query.category.toLowerCase());
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.status && item.status.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.accessories && item.accessories.some(a => a.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  async getEquipmentById(id) {
    try {
      const sql = `
        SELECT e.*, GROUP_CONCAT(a.accessory_name SEPARATOR '||') AS accessories_str
        FROM equipment e
        LEFT JOIN equipment_accessories a ON e.id = a.equipment_id
        WHERE LOWER(e.id) = LOWER(?)
        GROUP BY e.id;
      `;
      const [rows] = await pool.query(sql, [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          available: r.available_quantity,
          total: r.total_quantity,
          status: r.status,
          description: r.description || '',
          accessories: r.accessories_str ? r.accessories_str.split('||') : []
        };
      }
    } catch (e) {
      // fallback
    }
    return this.equipment.find(item => item.id.toLowerCase() === id.toLowerCase()) || null;
  }

  async createEquipment(data) {
    const nextId = `EQ-${String(this.equipment.length + 1).padStart(3, '0')}`;
    const id = data.id || nextId;
    const name = data.name;
    const category = data.category || 'Creative Technology';
    const available = Number(data.available) || 1;
    const total = Number(data.total) || available;
    const status = data.status || 'available';
    const description = data.description || '';
    const accessories = Array.isArray(data.accessories) ? data.accessories : [];

    try {
      await pool.query(
        'INSERT INTO equipment (id, name, category, available_quantity, total_quantity, status, description) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [id, name, category, available, total, status, description]
      );
      for (const acc of accessories) {
        await pool.query(
          'INSERT INTO equipment_accessories (equipment_id, accessory_name) VALUES (?, ?);',
          [id, acc]
        );
      }
    } catch (e) {
      // fallback
    }

    const newItem = { id, name, category, available, total, status, description, accessories };
    this.equipment.push(newItem);
    return newItem;
  }

  async updateEquipment(id, data) {
    try {
      const updates = [];
      const params = [];
      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
      if (data.category !== undefined) { updates.push('category = ?'); params.push(data.category); }
      if (data.available !== undefined) { updates.push('available_quantity = ?'); params.push(data.available); }
      if (data.total !== undefined) { updates.push('total_quantity = ?'); params.push(data.total); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }

      if (updates.length > 0) {
        params.push(id);
        await pool.query(`UPDATE equipment SET ${updates.join(', ')} WHERE LOWER(id) = LOWER(?);`, params);
        return this.getEquipmentById(id);
      }
    } catch (e) {
      // fallback
    }

    const item = this.equipment.find(i => i.id.toLowerCase() === id.toLowerCase());
    if (!item) return null;
    Object.assign(item, data);
    return item;
  }

  // Borrowers
  async getBorrowers(query = {}) {
    try {
      let sql = 'SELECT * FROM borrowers WHERE 1=1';
      const params = [];
      if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }
      if (query.search) {
        const raw = query.search.trim().toLowerCase();
        const q = `%${raw}%`;
        sql += ` AND (
          LOWER(name) LIKE ? OR 
          LOWER(netid) LIKE ? OR 
          LOWER(university_id) LIKE ? OR 
          LOWER(email) LIKE ? OR 
          LOWER(department) LIKE ? OR 
          LOWER(role) LIKE ? OR 
          LOWER(status) LIKE ?
        )`;
        params.push(q, q, q, q, q, q, q);
      }
      sql += ' ORDER BY name ASC;';

      const [rows] = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          netid: r.netid,
          name: r.name,
          universityId: r.university_id,
          email: r.email,
          department: r.department,
          role: r.role,
          openLoans: r.open_loans,
          status: r.status
        }));
      }
    } catch (e) {
      // fallback
    }

    let list = [...this.borrowers];
    if (query.status) {
      list = list.filter(b => b.status === query.status);
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.netid.toLowerCase().includes(q) ||
        (b.universityId && b.universityId.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.department && b.department.toLowerCase().includes(q)) ||
        (b.role && b.role.toLowerCase().includes(q)) ||
        (b.status && b.status.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getBorrowerByNetId(netid) {
    try {
      const [rows] = await pool.query('SELECT * FROM borrowers WHERE LOWER(netid) = LOWER(?);', [netid]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          netid: r.netid,
          name: r.name,
          universityId: r.university_id,
          email: r.email,
          department: r.department,
          role: r.role,
          openLoans: r.open_loans,
          status: r.status
        };
      }
    } catch (e) {
      // fallback
    }
    return this.borrowers.find(b => b.netid.toLowerCase() === netid.toLowerCase()) || null;
  }

  // Loans
  async getLoans(query = {}) {
    try {
      let sql = `
        SELECT l.*, e.name AS equipment_name, e.category, b.name AS borrower_name, b.university_id
        FROM loans l
        JOIN equipment e ON l.equipment_id = e.id
        JOIN borrowers b ON l.borrower_netid = b.netid
        WHERE 1=1
      `;
      const params = [];
      if (query.status && query.status !== 'all') {
        sql += ' AND l.status = ?';
        params.push(query.status);
      }
      if (query.search) {
        const raw = query.search.trim().toLowerCase();
        const q = `%${raw}%`;
        const searchClauses = [
          'LOWER(l.id) LIKE ?',
          'LOWER(b.name) LIKE ?',
          'LOWER(b.netid) LIKE ?',
          'LOWER(b.university_id) LIKE ?',
          'LOWER(e.name) LIKE ?',
          'LOWER(e.id) LIKE ?',
          'LOWER(e.category) LIKE ?',
          'LOWER(l.asset_tag) LIKE ?',
          'LOWER(l.status) LIKE ?',
          'LOWER(l.due_date) LIKE ?',
          'LOWER(l.checkout_date) LIKE ?'
        ];
        params.push(q, q, q, q, q, q, q, q, q, q, q);

        if (raw === 'overdue') {
          searchClauses.push("l.status = 'overdue'");
        } else if (raw === 'due' || raw === 'due today' || raw === 'due-today' || raw === 'today') {
          searchClauses.push("l.status IN ('due-today', 'overdue')");
        } else if (raw === 'active') {
          searchClauses.push("l.status = 'active'");
        } else if (raw === 'returned') {
          searchClauses.push("l.status = 'returned'");
        }

        sql += ` AND (${searchClauses.join(' OR ')})`;
      }
      sql += ' ORDER BY l.due_date ASC;';

      const [rows] = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          equipmentId: r.equipment_id,
          equipmentName: r.equipment_name,
          category: r.category,
          borrowerNetId: r.borrower_netid,
          borrowerName: r.borrower_name,
          borrower: r.borrower_name,
          netid: r.borrower_netid,
          universityId: r.university_id,
          checkoutDate: r.checkout_date,
          dueDate: r.due_date,
          returnDate: r.return_date,
          status: r.status,
          assetTag: r.asset_tag,
          returnCondition: r.return_condition,
          destination: r.destination,
          returnNotes: r.return_notes
        }));
      }
    } catch (e) {
      // fallback
    }

    let list = [...this.loans];
    if (query.status && query.status !== 'all') {
      list = list.filter(l => l.status === query.status);
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(l => {
        const s = (l.status || '').toLowerCase();
        const bName = (l.borrowerName || l.borrower || '').toLowerCase();
        const bNet = (l.borrowerNetId || l.netid || '').toLowerCase();
        const uId = (l.universityId || '').toLowerCase();
        const eName = (l.equipmentName || '').toLowerCase();
        const eId = (l.equipmentId || '').toLowerCase();
        const cat = (l.category || '').toLowerCase();
        const lId = (l.id || '').toLowerCase();
        const tag = (l.assetTag || '').toLowerCase();
        const dDate = (l.dueDate || '').toLowerCase();
        const cDate = (l.checkoutDate || '').toLowerCase();

        const statusMatch = (
          s.includes(q) ||
          (q === 'overdue' && s === 'overdue') ||
          ((q === 'due' || q === 'due today' || q === 'today') && (s === 'due-today' || s === 'overdue')) ||
          (q === 'active' && s === 'active') ||
          (q === 'returned' && s === 'returned')
        );

        return (
          lId.includes(q) ||
          bName.includes(q) ||
          bNet.includes(q) ||
          uId.includes(q) ||
          eName.includes(q) ||
          eId.includes(q) ||
          cat.includes(q) ||
          tag.includes(q) ||
          dDate.includes(q) ||
          cDate.includes(q) ||
          statusMatch
        );
      });
    }
    return list;
  }

  async getLoanById(id) {
    try {
      const sql = `
        SELECT l.*, e.name AS equipment_name, e.category, b.name AS borrower_name, b.university_id
        FROM loans l
        JOIN equipment e ON l.equipment_id = e.id
        JOIN borrowers b ON l.borrower_netid = b.netid
        WHERE LOWER(l.id) = LOWER(?);
      `;
      const [rows] = await pool.query(sql, [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          equipmentId: r.equipment_id,
          equipmentName: r.equipment_name,
          category: r.category,
          borrowerNetId: r.borrower_netid,
          borrowerName: r.borrower_name,
          borrower: r.borrower_name,
          netid: r.borrower_netid,
          universityId: r.university_id,
          checkoutDate: r.checkout_date,
          dueDate: r.due_date,
          returnDate: r.return_date,
          status: r.status,
          assetTag: r.asset_tag,
          returnCondition: r.return_condition,
          destination: r.destination,
          returnNotes: r.return_notes
        };
      }
    } catch (e) {
      // fallback
    }
    return this.loans.find(l => l.id.toLowerCase() === id.toLowerCase()) || null;
  }

  async createLoan(data) {
    const nextNum = 1043 + this.loans.length - 5;
    const loanId = `LN-${nextNum}`;
    const checkoutDate = new Date().toISOString();
    const dueDate = data.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const assetTag = data.assetTag || `ALB-${data.equipmentId}-A`;

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      await conn.query(
        'INSERT INTO loans (id, equipment_id, borrower_netid, asset_tag, checkout_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [loanId, data.equipmentId, data.netid, assetTag, new Date(checkoutDate), new Date(dueDate), 'active']
      );

      await conn.query(
        'UPDATE equipment SET available_quantity = available_quantity - 1 WHERE id = ? AND available_quantity > 0;',
        [data.equipmentId]
      );

      await conn.query(
        'UPDATE borrowers SET open_loans = open_loans + 1 WHERE netid = ?;',
        [data.netid]
      );

      await conn.commit();
      conn.release();
    } catch (e) {
      if (conn) {
        await conn.rollback();
        conn.release();
      }
    }

    // In-memory update
    const eq = await this.getEquipmentById(data.equipmentId);
    if (eq && eq.available > 0) {
      eq.available -= 1;
    }
    let borrower = await this.getBorrowerByNetId(data.netid);
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
      checkoutDate,
      dueDate,
      status: 'active',
      assetTag,
      accessories: eq ? eq.accessories : []
    };

    this.loans.unshift(newLoan);
    return newLoan;
  }

  async returnLoan(id, returnData = {}) {
    const loan = await this.getLoanById(id);
    if (!loan) return null;

    const returnDate = new Date().toISOString();
    const condition = returnData.condition || 'good';
    const destination = returnData.destination || 'ready-shelf';
    const notes = returnData.notes || '';

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      await conn.query(
        'UPDATE loans SET status = ?, return_date = ?, return_condition = ?, destination = ?, return_notes = ? WHERE id = ?;',
        ['returned', new Date(returnDate), condition, destination, notes, id]
      );

      if (destination === 'ready-shelf') {
        await conn.query(
          'UPDATE equipment SET available_quantity = LEAST(total_quantity, available_quantity + 1) WHERE id = ?;',
          [loan.equipmentId]
        );
      }

      await conn.query(
        'UPDATE borrowers SET open_loans = GREATEST(0, open_loans - 1) WHERE netid = ?;',
        [loan.borrowerNetId]
      );

      if (destination === 'prep-queue') {
        const nextPrepId = `PREP-${String(this.preparation.length + 1).padStart(3, '0')}`;
        await conn.query(
          'INSERT INTO preparation_items (id, equipment_id, equipment_name, category, assigned_staff, target_date, status, current_step, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [nextPrepId, loan.equipmentId, loan.equipmentName, loan.category || 'Creative Technology', 'Unassigned', '14 Oct 2026', 'awaiting', 1, `Returned from ${id} in ${condition} condition`]
        );
      }

      await conn.commit();
      conn.release();
    } catch (e) {
      if (conn) {
        await conn.rollback();
        conn.release();
      }
    }

    loan.status = 'returned';
    loan.returnDate = returnDate;
    loan.returnCondition = condition;
    loan.destination = destination;
    loan.returnNotes = notes;

    const eq = this.equipment.find(e => e.id === loan.equipmentId);
    if (eq && destination === 'ready-shelf') {
      eq.available = Math.min(eq.total, eq.available + 1);
    }
    const b = this.borrowers.find(br => br.netid === loan.borrowerNetId);
    if (b && b.openLoans > 0) {
      b.openLoans -= 1;
    }

    return loan;
  }

  // Preparation
  async getPreparation(query = {}) {
    try {
      let sql = `
        SELECT p.*, GROUP_CONCAT(CONCAT(c.step_key, '::', c.title, '::', c.completed) SEPARATOR '||') AS checklist_str
        FROM preparation_items p
        LEFT JOIN preparation_checklist_items c ON p.id = c.preparation_id
        WHERE 1=1
      `;
      const params = [];
      if (query.status && query.status !== 'all') {
        sql += ' AND p.status = ?';
        params.push(query.status);
      }
      if (query.search) {
        const raw = query.search.trim().toLowerCase();
        const q = `%${raw}%`;
        const searchClauses = [
          'LOWER(p.id) LIKE ?',
          'LOWER(p.equipment_id) LIKE ?',
          'LOWER(p.equipment_name) LIKE ?',
          'LOWER(p.assigned_staff) LIKE ?',
          'LOWER(p.category) LIKE ?',
          'LOWER(p.target_date) LIKE ?',
          'LOWER(p.status) LIKE ?',
          'LOWER(COALESCE(p.notes, "")) LIKE ?'
        ];
        params.push(q, q, q, q, q, q, q, q);

        if (raw.includes('need') || raw.includes('await') || raw === 'awaiting') {
          searchClauses.push("p.status = 'awaiting'");
        } else if (raw.includes('prep') || raw.includes('progress')) {
          searchClauses.push("p.status = 'in-prep'");
        } else if (raw.includes('review')) {
          searchClauses.push("p.status = 'review'");
        } else if (raw.includes('ready') || raw.includes('lend')) {
          searchClauses.push("p.status = 'ready'");
        }

        sql += ` AND (${searchClauses.join(' OR ')})`;
      }
      sql += ' GROUP BY p.id ORDER BY p.id ASC;';

      const [rows] = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => {
          const checklist = r.checklist_str
            ? r.checklist_str.split('||').map(step => {
                const [id, title, completed] = step.split('::');
                return { id, title, completed: completed === '1' || completed === 'true' };
              })
            : [];
          return {
            id: r.id,
            equipmentId: r.equipment_id,
            equipmentName: r.equipment_name,
            category: r.category,
            assignedStaff: r.assigned_staff,
            targetDate: r.target_date,
            status: r.status,
            currentStep: r.current_step,
            checklist,
            notes: r.notes
          };
        });
      }
    } catch (e) {
      // fallback
    }

    let list = [...this.preparation];
    if (query.status && query.status !== 'all') {
      list = list.filter(p => p.status === query.status);
    }
    if (query.search) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(p => {
        const s = (p.status || '').toLowerCase();
        const eName = (p.equipmentName || '').toLowerCase();
        const eId = (p.equipmentId || '').toLowerCase();
        const pId = (p.id || '').toLowerCase();
        const staff = (p.assignedStaff || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const tDate = (p.targetDate || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        const statusMatch = (
          s.includes(q) ||
          ((q.includes('need') || q.includes('await')) && s === 'awaiting') ||
          ((q.includes('prep') || q.includes('progress')) && s === 'in-prep') ||
          (q.includes('review') && s === 'review') ||
          ((q.includes('ready') || q.includes('lend')) && s === 'ready')
        );

        return (
          pId.includes(q) ||
          eId.includes(q) ||
          eName.includes(q) ||
          staff.includes(q) ||
          cat.includes(q) ||
          tDate.includes(q) ||
          notes.includes(q) ||
          statusMatch
        );
      });
    }
    return list;
  }

  async getPreparationById(id) {
    try {
      const sql = `
        SELECT p.*, GROUP_CONCAT(CONCAT(c.step_key, '::', c.title, '::', c.completed) SEPARATOR '||') AS checklist_str
        FROM preparation_items p
        LEFT JOIN preparation_checklist_items c ON p.id = c.preparation_id
        WHERE LOWER(p.id) = LOWER(?)
        GROUP BY p.id;
      `;
      const [rows] = await pool.query(sql, [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        const checklist = r.checklist_str
          ? r.checklist_str.split('||').map(step => {
              const [sId, title, completed] = step.split('::');
              return { id: sId, title, completed: completed === '1' || completed === 'true' };
            })
          : [];
        return {
          id: r.id,
          equipmentId: r.equipment_id,
          equipmentName: r.equipment_name,
          category: r.category,
          assignedStaff: r.assigned_staff,
          targetDate: r.target_date,
          status: r.status,
          currentStep: r.current_step,
          checklist,
          notes: r.notes
        };
      }
    } catch (e) {
      // fallback
    }
    return this.preparation.find(p => p.id.toLowerCase() === id.toLowerCase()) || null;
  }

  async updatePreparation(id, data) {
    try {
      const updates = [];
      const params = [];
      if (data.assignedStaff !== undefined) { updates.push('assigned_staff = ?'); params.push(data.assignedStaff); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.currentStep !== undefined) { updates.push('current_step = ?'); params.push(data.currentStep); }
      if (data.notes !== undefined) { updates.push('notes = ?'); params.push(data.notes); }

      if (updates.length > 0) {
        params.push(id);
        await pool.query(`UPDATE preparation_items SET ${updates.join(', ')} WHERE LOWER(id) = LOWER(?);`, params);
      }
    } catch (e) {
      // fallback
    }

    const item = this.preparation.find(p => p.id.toLowerCase() === id.toLowerCase());
    if (!item) return null;
    if (data.assignedStaff !== undefined) item.assignedStaff = data.assignedStaff;
    if (data.status !== undefined) item.status = data.status;
    if (data.currentStep !== undefined) item.currentStep = data.currentStep;
    if (data.checklist !== undefined) item.checklist = data.checklist;
    if (data.notes !== undefined) item.notes = data.notes;
    return item;
  }

  // Reports
  async getReports(query = {}) {
    try {
      const targetSem = query.semester || 'Fall 2026';
      let semesterFilter = '';
      const params = [];

      if (targetSem !== 'all' && targetSem !== 'custom') {
        const cleanSem = targetSem.replace('-', ' ').trim();
        semesterFilter = 'AND LOWER(r.semester) LIKE ?';
        params.push(`%${cleanSem.toLowerCase()}%`);
      }

      let sql = `
        SELECT e.id, e.name, e.category, 
               COALESCE(r.checkouts_count, 0) AS checkouts, 
               COALESCE(r.avg_loan_days, 0.0) AS avgDays, 
               COALESCE(r.total_days_out, 0) AS totalDays,
               COALESCE(r.semester, 'Fall 2026') AS semester
        FROM equipment e
        LEFT JOIN report_metrics r ON e.id = r.equipment_id ${semesterFilter}
        WHERE 1=1
      `;
      if (query.semester && query.semester !== 'all') {
        sql += ' AND r.checkouts_count IS NOT NULL AND r.checkouts_count > 0';
      }
      if (query.category) {
        sql += ' AND LOWER(e.category) LIKE ?';
        params.push(`%${query.category.toLowerCase()}%`);
      }
      if (query.search) {
        sql += ' AND (LOWER(e.name) LIKE ? OR LOWER(e.id) LIKE ? OR LOWER(e.category) LIKE ?)';
        const q = `%${query.search.toLowerCase()}%`;
        params.push(q, q, q);
      }
      sql += ' ORDER BY checkouts DESC, e.id ASC;';

      const [rows] = await pool.query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          checkouts: Number(r.checkouts),
          avgDays: Number(r.avgDays),
          totalDays: Number(r.totalDays),
          semester: r.semester
        }));
      }
    } catch (e) {
      // fallback
    }

    let list = [...defaultReports];
    if (query.semester && query.semester.includes('summer')) {
      list = list.slice(0, 8).map(r => ({
        ...r,
        checkouts: Math.max(1, Math.round(r.checkouts * 0.5)),
        totalDays: Math.max(2, Math.round(r.totalDays * 0.5)),
        avgDays: Number((r.avgDays * 0.9).toFixed(1))
      }));
    } else if (query.semester && query.semester.includes('spring')) {
      list = list.map(r => ({
        ...r,
        checkouts: Math.max(1, Math.round(r.checkouts * 0.8)),
        totalDays: Math.max(2, Math.round(r.totalDays * 0.8)),
        avgDays: Number((r.avgDays * 1.05).toFixed(1))
      }));
    }
    if (query.category) {
      list = list.filter(r => r.category.toLowerCase().includes(query.category.toLowerCase()));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || (r.category && r.category.toLowerCase().includes(q)));
    }
    return list;
  }

  // Summary KPIs for dashboard & reports
  async getSummaryKPIs() {
    try {
      const [eqRows] = await pool.query('SELECT SUM(total_quantity) AS total FROM equipment;');
      const [loanRows] = await pool.query("SELECT COUNT(*) AS total FROM loans WHERE status IN ('active', 'due-today', 'overdue');");
      const [dueRows] = await pool.query("SELECT COUNT(*) AS total FROM loans WHERE status = 'due-today';");
      const [overdueRows] = await pool.query("SELECT COUNT(*) AS total FROM loans WHERE status = 'overdue';");

      const [pTotal] = await pool.query('SELECT COUNT(*) AS total FROM preparation_items;');
      const [pNeeds] = await pool.query("SELECT COUNT(*) AS total FROM preparation_items WHERE status = 'awaiting';");
      const [pIn] = await pool.query("SELECT COUNT(*) AS total FROM preparation_items WHERE status = 'in-prep';");
      const [pRev] = await pool.query("SELECT COUNT(*) AS total FROM preparation_items WHERE status = 'review';");
      const [pReady] = await pool.query("SELECT COUNT(*) AS total FROM preparation_items WHERE status = 'ready';");

      return {
        totalEquipment: Number(eqRows[0].total) || 28,
        activeLoans: Number(loanRows[0].total),
        dueToday: Number(dueRows[0].total),
        overdue: Number(overdueRows[0].total),
        preparation: {
          total: Number(pTotal[0].total),
          needsPreparation: Number(pNeeds[0].total),
          inPreparation: Number(pIn[0].total),
          awaitingReview: Number(pRev[0].total),
          readyForLending: Number(pReady[0].total)
        }
      };
    } catch (e) {
      // fallback
    }

    const totalEquipment = this.equipment.reduce((acc, eq) => acc + eq.total, 0);
    const activeLoans = this.loans.filter(l => l.status === 'active' || l.status === 'due-today' || l.status === 'overdue').length;
    const dueToday = this.loans.filter(l => l.status === 'due-today').length;
    const overdue = this.loans.filter(l => l.status === 'overdue').length;

    const prepNeeds = this.preparation.filter(p => p.status === 'awaiting').length;
    const prepIn = this.preparation.filter(p => p.status === 'in-prep').length;
    const prepReview = this.preparation.filter(p => p.status === 'review').length;
    const prepReady = this.preparation.filter(p => p.status === 'ready').length;

    return {
      totalEquipment: 28,
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
