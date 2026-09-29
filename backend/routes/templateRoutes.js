const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const templateController = require('../controllers/templateController');

// Get all templates for organization
router.get('/', protect, templateController.getAllTemplates);

// Get single template by ID
router.get('/:id', protect, templateController.getTemplate);

// Create new template
router.post('/', protect, templateController.createTemplate);

// Update template
router.put('/:id', protect, templateController.updateTemplate);

// Delete template
router.delete('/:id', protect, templateController.deleteTemplate);

// Get default template for type
router.get('/default/:type', protect, templateController.getDefaultTemplate);

// Duplicate template
router.post('/:id/duplicate', protect, templateController.duplicateTemplate);

module.exports = router;
