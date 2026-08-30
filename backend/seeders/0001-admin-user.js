const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    await queryInterface.bulkInsert('users', [
      {
        id: crypto.randomUUID(),
        publicId: 'LBADMIN001',
        email: 'admin@linkbajar.com',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        referralCode: 'ADMIN001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@linkbajar.com' });
  },
};
