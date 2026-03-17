// src/modules/admin/admin.controller.js
import { adminService } from './admin.service.js';

// GET /admin/dashboard
async function getDashboard(req, res) {
    try {
        const result = await adminService.getDashboard();
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET /admin/companies
async function getCompanies(req, res) {
    try {
        const { search } = req.query;
        const result = await adminService.getCompanies({ search });
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET /admin/companies/:id
async function getCompanyById(req, res) {
    try {
        const { id } = req.params;
        const result = await adminService.getCompanyById(id);
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET /admin/candidates
async function getCandidates(req, res) {
    try {
        const { search } = req.query;
        const result = await adminService.getCandidates({ search });
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// GET /admin/candidates/:id
async function getCandidateById(req, res) {
    try {
        const { id } = req.params;
        const result = await adminService.getCandidateById(id);
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// PATCH /admin/users/:id/status
async function toggleUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'is_active debe ser true o false' });
        }

        const result = await adminService.toggleUserStatus(id, is_active);
        return res.json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

export const adminController = {
    getDashboard,
    getCompanies,
    getCompanyById,
    getCandidates,
    getCandidateById,
    toggleUserStatus,
};