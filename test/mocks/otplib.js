module.exports = {
  generateSecret: jest.fn().mockReturnValue('TEST_SECRET'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/test'),
  verify: jest.fn().mockResolvedValue({ valid: true }),
};
