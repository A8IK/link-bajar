const { Coupon, CouponRedemption, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');

const validate = async ({ code, userId, orderAmount }) => {
  const coupon = await Coupon.findOne({ where: { code } });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  if (coupon.status !== 'active') throw ApiError.badRequest('Coupon is not active');

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) throw ApiError.badRequest('Coupon not yet active');
  if (coupon.expiryDate && now > coupon.expiryDate) throw ApiError.badRequest('Coupon has expired');
  if (coupon.maxTotalUsage && coupon.usesCount >= coupon.maxTotalUsage) {
    throw ApiError.badRequest('Coupon usage limit reached');
  }
  if (coupon.minOrderAmount && Number(orderAmount) < Number(coupon.minOrderAmount)) {
    throw ApiError.badRequest(`Minimum order amount is $${coupon.minOrderAmount}`);
  }
  const existing = await CouponRedemption.findOne({ where: { couponId: coupon.id, userId } });
  if (existing) throw ApiError.badRequest('You have already used this coupon');

  let discount =
    coupon.discountType === 'percentage'
      ? (Number(orderAmount) * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
  if (coupon.maxDiscountAmount) discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  discount = Math.min(discount, Number(orderAmount));

  return { coupon, discount: Number(discount.toFixed(2)) };
};

const redeem = async ({ coupon, userId, orderId, discountApplied }, t) => {
  await CouponRedemption.create(
    { couponId: coupon.id, userId, orderId, discountApplied },
    { transaction: t },
  );
  coupon.usesCount += 1;
  if (coupon.maxTotalUsage && coupon.usesCount >= coupon.maxTotalUsage) coupon.status = 'expired';
  await coupon.save({ transaction: t });
};

module.exports = { validate, redeem, sequelize };
