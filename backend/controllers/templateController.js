const Template = require('../models/Template');

// Get all templates for an organization
exports.getAllTemplates = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { type, page = 1, limit = 10 } = req.query;

    let query = { organizationId: orgId };
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const templates = await Template.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Template.countDocuments(query);

    res.json({
      success: true,
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('[Template] Get all error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch templates' });
  }
};

// Get single template by ID
exports.getTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const template = await Template.findOne({ _id: id, organizationId: orgId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (err) {
    console.error('[Template] Get single error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch template' });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.userId;
    const { name, type, description, fields, customization, layout, isDefault } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }

    // If marking as default, unset other defaults of same type
    if (isDefault) {
      await Template.updateMany(
        { organizationId: orgId, type, isDefault: true },
        { isDefault: false }
      );
    }

    const template = new Template({
      organizationId: orgId,
      name,
      type,
      description,
      fields: fields || [],
      customization: customization || {},
      layout: layout || {},
      isDefault: isDefault || false,
      createdBy: userId
    });

    await template.save();
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (err) {
    console.error('[Template] Create error:', err);
    res.status(500).json({ success: false, message: 'Unable to create template' });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;
    const { name, description, fields, customization, layout, isDefault } = req.body;

    const template = await Template.findOne({ _id: id, organizationId: orgId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // If marking as default, unset other defaults of same type
    if (isDefault && !template.isDefault) {
      await Template.updateMany(
        { organizationId: orgId, type: template.type, isDefault: true },
        { isDefault: false }
      );
    }

    template.name = name || template.name;
    template.description = description || template.description;
    template.fields = fields || template.fields;
    template.customization = customization || template.customization;
    template.layout = layout || template.layout;
    template.isDefault = isDefault !== undefined ? isDefault : template.isDefault;
    template.updatedAt = new Date();

    await template.save();
    res.json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (err) {
    console.error('[Template] Update error:', err);
    res.status(500).json({ success: false, message: 'Unable to update template' });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;

    const template = await Template.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (err) {
    console.error('[Template] Delete error:', err);
    res.status(500).json({ success: false, message: 'Unable to delete template' });
  }
};

// Get default template for a type
exports.getDefaultTemplate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { type } = req.params;

    const template = await Template.findOne({
      organizationId: orgId,
      type,
      isDefault: true
    });

    res.json({
      success: true,
      template: template || null
    });
  } catch (err) {
    console.error('[Template] Get default error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch default template' });
  }
};

// Duplicate a template
exports.duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId;
    const userId = req.userId;

    const original = await Template.findOne({ _id: id, organizationId: orgId });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const duplicate = new Template({
      organizationId: orgId,
      name: `${original.name} (Copy)`,
      type: original.type,
      description: original.description,
      fields: JSON.parse(JSON.stringify(original.fields)),
      customization: JSON.parse(JSON.stringify(original.customization)),
      layout: JSON.parse(JSON.stringify(original.layout)),
      isDefault: false,
      createdBy: userId
    });

    await duplicate.save();
    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      template: duplicate
    });
  } catch (err) {
    console.error('[Template] Duplicate error:', err);
    res.status(500).json({ success: false, message: 'Unable to duplicate template' });
  }
};

module.exports = {
  getAllTemplates: exports.getAllTemplates,
  getTemplate: exports.getTemplate,
  createTemplate: exports.createTemplate,
  updateTemplate: exports.updateTemplate,
  deleteTemplate: exports.deleteTemplate,
  getDefaultTemplate: exports.getDefaultTemplate,
  duplicateTemplate: exports.duplicateTemplate
};
