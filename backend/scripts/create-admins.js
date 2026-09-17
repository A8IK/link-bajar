#!/usr/bin/env node
/**
 * Idempotent admin seeder. Run standalone with:
 *   node scripts/create-admins.js
 *
 * Or import { seedAdmins } and call it from server startup when
 * SEED_ADMINS=true (see src/server.js).
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, User, Wallet } = require('../src/models');
const ids = require('../src/utils/ids');

const ADMINS = [
  {
    email: 'admin@linkbajar.com',
    password: 'Admin@12345',
    firstName: 'Super',
    lastName: 'Admin',
    publicId: 'LBADMIN001',
    referralCode: 'ADMIN001',
  },
  {
    email: 'owner@linkbajar.com',
    password: 'Owner@12345',
    firstName: 'Site',
    lastName: 'Owner',
    publicId: 'LBADMIN002',
    referralCode: 'ADMIN002',
  },
];

const seedAdmins = async (logger = console) => {
  for (const a of ADMINS) {
    const existing = await User.findOne({ where: { email: a.email } });
    if (existing) {
      existing.role = 'admin';
      existing.status = 'active';
      existing.passwordHash = await bcrypt.hash(a.password, 12);
      await existing.save();
      logger.info?.(`Updated existing admin: ${a.email}`) || logger.log?.(`✔ Updated existing admin: ${a.email}`);
    } else {
      const user = await User.create({
        email: a.email,
        passwordHash: await bcrypt.hash(a.password, 12),
        firstName: a.firstName,
        lastName: a.lastName,
        role: 'admin',
        status: 'active',
        publicId: a.publicId || ids.publicUserId(),
        referralCode: a.referralCode || ids.referralCode(),
      });
      await Wallet.findOrCreate({ where: { userId: user.id } });
      logger.info?.(`Created admin: ${a.email}`) || logger.log?.(`✔ Created admin: ${a.email}`);
    }
  }
};

module.exports = { seedAdmins, ADMINS };

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Postgres connected.\n');
      await seedAdmins();
      console.log('\nLogin credentials:');
      for (const a of ADMINS) console.log(`  ${a.email}  /  ${a.password}`);
      console.log('\nDone.');
      process.exit(0);
    } catch (err) {
      console.error('Failed:', err.message);
      process.exit(1);
    }
  })();
}
