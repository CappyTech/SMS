const express = require('express');
const router = express.Router();
const path = require('path');
const logger = require('../../services/loggerService');
const attendanceService = require('../../services/attendanceService');
const authService = require('../../services/authService');
const taxService = require('../../services/taxService');
const db = require('../../services/sequelizeDatabaseService');
const dateService = require('../../services/dateService');

const createAttendance = async (req, res, next) => {
    try {
        const {
            date,
            locationId,
            employeeId,
            subcontractorId,
            type,
            hoursWorked,
        } = req.body;

        await db.Attendances.create({
            date,
            locationId,
            employeeId: employeeId || null,
            subcontractorId: subcontractorId || null,
            type,
            hoursWorked,
        });

        req.flash('success', 'Attendance record created successfully.');
        res.redirect('/attendance/weekly');
    } catch (error) {
        logger.error('Error creating attendance: ' + error.message);
        req.flash('error', 'Failed to create attendance.');
        next(error); // Pass the error to the error handler
    }
};

const readAttendance = async (req, res, next) => {
    try {
        const attendance = await db.Attendances.findByPk(req.params.attendance, {
            include: [
                { model: db.Employees },
                { model: db.Subcontractors },
                { model: db.Locations }
            ]
        });

        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.render(path.join('attendance', 'viewAttendance'), {
            title: 'Attendance',
            attendance,
            
        });
    } catch (error) {
        logger.error('Error viewing attendance: ' + error.message);
        req.flash('error', 'Error viewing attendance: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const updateAttendance = async (req, res, next) => {
    try {
        const { attendance } = req.params;
        const {
            date,
            locationId,
            employeeId,
            subcontractorId,
            hoursWorked,
            type,
        } = req.body;

        // Convert employeeId and subcontractorId values to null if 'null' is passed as a string or if undefined
        const updatedEmployeeId = employeeId === 'null' || !employeeId ? null : employeeId;
        const updatedSubcontractorId = subcontractorId === 'null' || !subcontractorId ? null : subcontractorId;

        // Set locationId to null if it's not provided or set to 'null'
        const updatedLocationId = locationId === 'null' || !locationId ? null : locationId;

        // Validation: ensure that either employeeId or subcontractorId is set, not both at the same time
        if (updatedEmployeeId && updatedSubcontractorId) {
            req.flash('error', 'Please select either an employee or a subcontractor, but not both.');
            return res.redirect(`/attendance/update/${attendance}`);
        }

        // Validation: If employeeId is set, it must exist in the Employees table
        if (updatedEmployeeId) {
            const employeeExists = await db.Employees.findByPk(updatedEmployeeId);
            if (!employeeExists) {
                req.flash('error', 'Invalid Employee ID. Please select a valid employee.');
                return res.redirect(`/attendance/update/${attendance}`);
            }
        }

        // Validation: If subcontractorId is set, it must exist in the Subcontractors table
        if (updatedSubcontractorId) {
            const subcontractorExists = await db.Subcontractors.findByPk(updatedSubcontractorId);
            if (!subcontractorExists) {
                req.flash('error', 'Invalid Subcontractor ID. Please select a valid subcontractor.');
                return res.redirect(`/attendance/update/${attendance}`);
            }
        }

        // If locationId is provided and not null, validate its existence in the Locations table
        if (updatedLocationId) {
            const locationExists = await db.Locations.findByPk(updatedLocationId);
            if (!locationExists) {
                req.flash('error', 'Invalid Location ID. Please select a valid location.');
                return res.redirect(`/attendance/update/${attendance}`);
            }
        }

        // Update the attendance record with validated values
        await db.Attendances.update(
            {
                date,
                locationId: updatedLocationId, // Set the validated or null location ID
                employeeId: updatedEmployeeId, // Set the validated or null employee ID
                subcontractorId: updatedSubcontractorId, // Set the validated or null subcontractor ID
                hoursWorked: updatedEmployeeId ? hoursWorked : null, // Set hoursWorked only if it's an employee
                type,
            },
            { where: { id: attendance } }
        );

        req.flash('success', 'Attendance record updated successfully.');
        res.redirect('/attendance/weekly');
    } catch (error) {
        logger.error('Error updating attendance: ' + error.message);
        req.flash('error', `Failed to update attendance: ${error.message}`);
        res.redirect(`/`);
    }
};


const deleteAttendance = async (req, res, next) => {
    try {
        const attendance = req.params.attendance;

        await db.Attendances.destroy({ where: { attendance } });

        req.flash('success', 'Attendance record deleted successfully.');
        res.redirect('/dashboard/attendance');
    } catch (error) {
        logger.error('Error deleting attendance: ' + error.message);
        req.flash('error', 'Failed to delete attendance.');
        next(error); // Pass the error to the error handler
    }
};

router.get('/fetch/attendance/:id', authService.ensureAuthenticated, async (req, res, next) => {
    try {
        const attendance = await db.Attendances.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ attendance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

router.post('/attendance/create', authService.ensureAuthenticated, createAttendance);
router.get('/attendance/read/:attendance', authService.ensureAuthenticated, readAttendance);
router.post('/attendance/update/:attendance', authService.ensureAuthenticated, updateAttendance);
router.post('/attendance/delete/:attendance', authService.ensureAuthenticated, deleteAttendance);

module.exports = router;