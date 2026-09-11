const { User, Referral, Wallet, sequelize } = require('../models');
const wallet = require('./walletService');

/**
 * Attribution when a new user signs up with a referrer code.
 * Creates the Referral row, with status active. Bonus is granted later
 * when the referred user pays their first order (handled by orderService hook).
 */
const attribute = async ({ newUser, referredByCode }) => {
  if (!referredByCode) return null;
  const referrer = await User.findOne({ where: { referralCode: referredByCode } });
  if (!referrer) return null;

  return Referral.create({
    referrerId: referrer.id,
    referredUserId: newUser.id,
    referralCode: referredByCode,
    discountType: 'percentage',
    discountValue: 10,
    isFirstOrderOnly: true,
    expiryDays: 30,
    status: 'active',
  });
};

const grantBonusForOrder = async ({ buyerId, orderAmount, sellerCommissionPct = 10 }) => {
  const ref = await Referral.findOne({
    where: { referredUserId: buyerId, status: 'active' },
  });
  if (!ref) return null;
  return sequelize.transaction(async (t) => {
    const bonus = (Number(orderAmount) * sellerCommissionPct) / 100;
    const w = await Wallet.findOne({ where: { userId: ref.referrerId }, transaction: t });
    if (w) {
      w.referralBalance = Number(w.referralBalance) + Number(bonus);
      w.bonusBalance = Number(w.bonusBalance) + Number(bonus);
      await w.save({ transaction: t });
    }
    ref.bonusEarned = Number(ref.bonusEarned) + Number(bonus);
    if (ref.isFirstOrderOnly) ref.status = 'expired';
    await ref.save({ transaction: t });
    return { bonus, referrerId: ref.referrerId };
  });
};

const myStats = async (userId) => {
  const refs = await Referral.findAll({
    where: { referrerId: userId },
    include: [{ model: User, as: 'referredUser', attributes: ['id', 'publicId', 'email'] }],
    order: [['createdAt', 'DESC']],
  });
  const totalUsed = refs.length;
  const totalEarned = refs.reduce((s, r) => s + Number(r.bonusEarned || 0), 0);
  return { totalUsed, totalEarned, items: refs };
};

module.exports = { attribute, grantBonusForOrder, myStats };
