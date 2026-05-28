/**
 * requireAdmin middleware
 * Ensures the authenticated user has an admin-level role.
 * Must be used AFTER the `protect` middleware.
 *
 * Role hierarchy:
 *   admin     — full access (read + write + delete)
 *   moderator — read + write, no destructive actions
 *   support   — read-only
 */
const requireAdmin = (req, res, next) => {
  const adminRoles = ['admin', 'moderator', 'support'];

  if (!req.user || !adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * requireFullAdmin middleware
 * Restricts to admin-only (moderators/support are excluded).
 * Use for destructive actions: delete user, delete document, change role.
 */
const requireFullAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Full admin privileges required.'
    });
  }

  next();
};

module.exports = { requireAdmin, requireFullAdmin };
