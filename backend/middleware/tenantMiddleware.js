const tenantMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Tenant scoping error: User is not associated with an organization"
      });
    }

    // Attach organizationId to request object for convenience in controllers
    req.organizationId = req.user.organizationId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during tenant validation"
    });
  }
};

module.exports = tenantMiddleware;
