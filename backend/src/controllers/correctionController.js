const store = require('../models/store');

exports.getCorrections = (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const corrections = store.getCorrectionRequests({ employeeId, status });
    return res.json({ success: true, corrections, count: corrections.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCorrection = (req, res) => {
  try {
    const { employeeId, requestedType, targetDate, targetTime, reason } = req.body;

    if (!employeeId || !reason) {
      return res.status(400).json({ success: false, error: 'employeeId and reason are required' });
    }

    const employee = store.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const newRequest = store.addCorrectionRequest({
      employeeId,
      employeeName: employee.name,
      requestedType: requestedType || 'CHECK_IN',
      targetDate: targetDate || new Date().toISOString().split('T')[0],
      targetTime: targetTime || '09:00',
      reason
    });

    return res.status(201).json({
      success: true,
      message: 'HR correction request submitted successfully. Awaiting HR review.',
      correction: newRequest
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.reviewCorrection = (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, reviewedBy } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be APPROVED or REJECTED' });
    }

    const updated = store.updateCorrectionRequest(id, status, reviewNotes, reviewedBy);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Correction request not found' });
    }

    return res.json({
      success: true,
      message: `Correction request ${status.toLowerCase()} successfully`,
      correction: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
