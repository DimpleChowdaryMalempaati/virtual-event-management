const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

async function register(req, res) {
  const user = await authService.registerUser(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully. You can now log in.',
    data: user,
  });
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);

  sendSuccess(res, {
    message: 'Login successful.',
    data: result,
  });
}

async function refresh(req, res) {
  const result = authService.refreshAccessToken(req.body.refreshToken);

  sendSuccess(res, {
    message: 'Token refreshed successfully.',
    data: result,
  });
}

async function logout(req, res) {
  authService.logoutUser({
    accessToken: req.token,
    refreshToken: req.body.refreshToken,
  });

  sendSuccess(res, {
    message: 'Logged out successfully. Tokens have been revoked.',
  });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
