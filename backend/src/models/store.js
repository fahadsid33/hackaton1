const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Helper to generate a sample 128-d mock descriptor vector for demo seeds
function generateSampleDescriptor(seed = 1) {
  const descriptor = [];
  for (let i = 0; i < 128; i++) {
    descriptor.push(Math.sin(i * seed * 0.1) * 0.15);
  }
  return descriptor;
}

const defaultInitialData = {
  office: {
    id: 'off-main-01',
    name: 'TechCorp Innovation Hub',
    address: '100 Silicon Way, Tech City, CA',
    // Default location (e.g. San Francisco Financial District / Market St)
    latitude: 37.789172,
    longitude: -122.401449,
    radiusMeters: 150,
    maxGpsAccuracyMeters: 100,
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateGraceMinutes: 15,
    requireFaceMatch: true,
    requireLiveness: true,
    storePhotos: false,
    matchThreshold: 0.55,
    updatedAt: new Date().toISOString()
  },
  employees: [
    {
      id: 'EMP-001',
      name: 'Alex Morgan',
      email: 'alex.morgan@techcorp.io',
      department: 'Engineering',
      role: 'Senior Software Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      faceEnrolled: true,
      faceEnrolledAt: '2026-10-01T08:00:00.000Z',
      faceDescriptor: generateSampleDescriptor(1.2)
    },
    {
      id: 'EMP-002',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.io',
      department: 'Design',
      role: 'Lead UI/UX Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      faceEnrolled: true,
      faceEnrolledAt: '2026-10-05T09:30:00.000Z',
      faceDescriptor: generateSampleDescriptor(2.5)
    },
    {
      id: 'EMP-003',
      name: 'David Kumar',
      email: 'david.kumar@techcorp.io',
      department: 'DevOps',
      role: 'Cloud Architect',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      faceEnrolled: false,
      faceEnrolledAt: null,
      faceDescriptor: null
    },
    {
      id: 'EMP-004',
      name: 'Elena Rostova',
      email: 'elena.rostova@techcorp.io',
      department: 'Human Resources',
      role: 'HR Business Partner',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      faceEnrolled: true,
      faceEnrolledAt: '2026-10-10T11:00:00.000Z',
      faceDescriptor: generateSampleDescriptor(3.8)
    }
  ],
  attendance: [
    {
      id: 'att-hist-01',
      employeeId: 'EMP-001',
      employeeName: 'Alex Morgan',
      type: 'CHECK_IN',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: 'camera',
      status: 'APPROVED',
      officeDistanceMeters: 42.5,
      officeRadiusMeters: 150,
      gpsLatitude: 37.7892,
      gpsLongitude: -122.4014,
      gpsAccuracyMeters: 15.2,
      faceDetectedCount: 1,
      faceMatched: true,
      faceMatchScore: 0.18,
      livenessVerified: true,
      isLate: false,
      photoUrl: null
    },
    {
      id: 'att-hist-02',
      employeeId: 'EMP-002',
      employeeName: 'Sarah Chen',
      type: 'CHECK_IN',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: 'camera',
      status: 'APPROVED',
      officeDistanceMeters: 65.1,
      officeRadiusMeters: 150,
      gpsLatitude: 37.7893,
      gpsLongitude: -122.4016,
      gpsAccuracyMeters: 18.0,
      faceDetectedCount: 1,
      faceMatched: true,
      faceMatchScore: 0.22,
      livenessVerified: true,
      isLate: false,
      photoUrl: null
    }
  ],
  corrections: [
    {
      id: 'corr-001',
      employeeId: 'EMP-003',
      employeeName: 'David Kumar',
      requestedType: 'CHECK_IN',
      targetDate: new Date().toISOString().split('T')[0],
      targetTime: '09:05',
      reason: 'GPS drift while in basement server room (camera attendance rejected with accuracy > 100m)',
      submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    }
  ]
};

class Store {
  constructor() {
    this.data = defaultInitialData;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.persist();
      }
    } catch (err) {
      console.warn('[Store] Could not read persisted store, using defaults in memory:', err.message);
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Store] Failed to write data file:', err.message);
    }
  }

  // --- Office Settings ---
  getOfficeSettings() {
    return { ...this.data.office };
  }

  updateOfficeSettings(updates) {
    this.data.office = {
      ...this.data.office,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return { ...this.data.office };
  }

  // --- Employees ---
  getEmployees() {
    // Exclude raw descriptors when listing for lightweight response
    return this.data.employees.map(({ faceDescriptor, ...rest }) => ({
      ...rest,
      hasFaceDescriptor: Boolean(faceDescriptor && faceDescriptor.length > 0)
    }));
  }

  getEmployeeById(id, includeDescriptor = false) {
    const emp = this.data.employees.find((e) => e.id === id);
    if (!emp) return null;
    if (includeDescriptor) return { ...emp };
    const { faceDescriptor, ...rest } = emp;
    return { ...rest, hasFaceDescriptor: Boolean(faceDescriptor && faceDescriptor.length > 0) };
  }

  addEmployee(employee) {
    const newEmp = {
      id: employee.id || `EMP-${String(this.data.employees.length + 1).padStart(3, '0')}`,
      name: employee.name,
      email: employee.email,
      department: employee.department || 'General',
      role: employee.role || 'Staff',
      avatarUrl: employee.avatarUrl || null,
      faceEnrolled: false,
      faceEnrolledAt: null,
      faceDescriptor: null
    };
    this.data.employees.push(newEmp);
    this.persist();
    return newEmp;
  }

  enrollEmployeeFace(id, descriptor) {
    const empIndex = this.data.employees.findIndex((e) => e.id === id);
    if (empIndex === -1) return null;

    this.data.employees[empIndex].faceDescriptor = descriptor;
    this.data.employees[empIndex].faceEnrolled = true;
    this.data.employees[empIndex].faceEnrolledAt = new Date().toISOString();
    this.persist();

    const { faceDescriptor, ...rest } = this.data.employees[empIndex];
    return { ...rest, hasFaceDescriptor: true };
  }

  // --- Attendance ---
  getAttendanceRecords(filters = {}) {
    let results = [...this.data.attendance];

    if (filters.employeeId) {
      results = results.filter((r) => r.employeeId === filters.employeeId);
    }
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters.date) {
      results = results.filter((r) => r.timestamp.startsWith(filters.date));
    }
    if (filters.source) {
      results = results.filter((r) => r.source === filters.source);
    }

    // Sort descending by timestamp
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return results;
  }

  getTodayAttendanceForEmployee(employeeId) {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.data.attendance
      .filter((r) => r.employeeId === employeeId && r.timestamp.startsWith(todayStr))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addAttendanceRecord(record) {
    const newRecord = {
      id: record.id || `att-${Date.now()}-${uuidv4().substring(0, 6)}`,
      ...record,
      timestamp: record.timestamp || new Date().toISOString()
    };
    this.data.attendance.unshift(newRecord);
    this.persist();
    return newRecord;
  }

  // --- HR Corrections ---
  getCorrectionRequests(filters = {}) {
    let results = [...this.data.corrections];

    if (filters.employeeId) {
      results = results.filter((c) => c.employeeId === filters.employeeId);
    }
    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return results;
  }

  addCorrectionRequest(req) {
    const newCorr = {
      id: `corr-${Date.now()}-${uuidv4().substring(0, 6)}`,
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      requestedType: req.requestedType || 'CHECK_IN',
      targetDate: req.targetDate || new Date().toISOString().split('T')[0],
      targetTime: req.targetTime || '09:00',
      reason: req.reason,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    };
    this.data.corrections.unshift(newCorr);
    this.persist();
    return newCorr;
  }

  updateCorrectionRequest(id, status, reviewNotes = '', reviewedBy = 'HR Admin') {
    const index = this.data.corrections.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.data.corrections[index].status = status;
    this.data.corrections[index].reviewNotes = reviewNotes;
    this.data.corrections[index].reviewedBy = reviewedBy;
    this.data.corrections[index].reviewedAt = new Date().toISOString();

    // If approved, create an attendance entry marked as HR_APPROVED
    if (status === 'APPROVED') {
      const corr = this.data.corrections[index];
      const targetDateTime = new Date(`${corr.targetDate}T${corr.targetTime}:00.000Z`).toISOString();
      this.addAttendanceRecord({
        employeeId: corr.employeeId,
        employeeName: corr.employeeName,
        type: corr.requestedType,
        timestamp: targetDateTime,
        source: 'hr_correction',
        status: 'APPROVED',
        officeDistanceMeters: 0,
        officeRadiusMeters: this.data.office.radiusMeters,
        gpsLatitude: this.data.office.latitude,
        gpsLongitude: this.data.office.longitude,
        gpsAccuracyMeters: 10,
        faceDetectedCount: 1,
        faceMatched: true,
        faceMatchScore: 0.0,
        livenessVerified: true,
        isLate: false,
        note: `Approved by HR: ${corr.reason}`
      });
    }

    this.persist();
    return this.data.corrections[index];
  }

  // --- Summary Statistics ---
  getStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = this.data.attendance.filter((r) => r.timestamp.startsWith(todayStr));
    const approvedToday = todayRecords.filter((r) => r.status === 'APPROVED');
    const rejectedToday = todayRecords.filter((r) => r.status === 'REJECTED');
    const pendingCorrections = this.data.corrections.filter((c) => c.status === 'PENDING').length;

    const uniqueEmployeesPresentToday = new Set(
      approvedToday.filter((r) => r.type === 'CHECK_IN').map((r) => r.employeeId)
    ).size;

    return {
      totalEmployees: this.data.employees.length,
      enrolledEmployees: this.data.employees.filter((e) => e.faceEnrolled).length,
      presentToday: uniqueEmployeesPresentToday,
      totalTodayCheckIns: approvedToday.length,
      rejectedTodayCheckIns: rejectedToday.length,
      pendingCorrections,
      officeName: this.data.office.name,
      officeRadius: this.data.office.radiusMeters,
      maxGpsAccuracy: this.data.office.maxGpsAccuracyMeters
    };
  }
}

const store = new Store();
module.exports = store;
