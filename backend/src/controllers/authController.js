const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register({
    ...req.body,
    ip: req.ip,
    location: req.headers['x-geo-location'] || null,
  });
  res.status(201).json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.json({ success: true, data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req.body.refreshToken);
  res.json({ success: true });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
