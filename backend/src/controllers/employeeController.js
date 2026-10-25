const store = require('../models/store');

exports.getEmployees = (req, res) => {
  try {
    const employees = store.getEmployees();
    return res.json({ success: true, employees });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEmployeeById = (req, res) => {
  try {
    const { id } = req.params;
    const employee = store.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    return res.json({ success: true, employee });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createEmployee = (req, res) => {
  try {
    const { name, email, department, role, avatarUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    const newEmp = store.addEmployee({ name, email, department, role, avatarUrl });
    return res.status(201).json({ success: true, message: 'Employee created successfully', employee: newEmp });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.enrollFace = (req, res) => {
  try {
    const { id } = req.params;
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        error: 'A valid 128-dimensional face descriptor array is required'
      });
    }

    const updated = store.enrollEmployeeFace(id, descriptor);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    return res.json({
      success: true,
      message: 'Face enrolled successfully for employee',
      employee: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
