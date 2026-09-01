const { sequelize } = require('../config/database');

const User = require('./User')(sequelize);
const Niche = require('./Niche')(sequelize);
const Listing = require('./Listing')(sequelize);
const Order = require('./Order')(sequelize);
const OrderMessage = require('./OrderMessage')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const WithdrawalRequest = require('./WithdrawalRequest')(sequelize);
const Coupon = require('./Coupon')(sequelize);
const CouponRedemption = require('./CouponRedemption')(sequelize);
const Referral = require('./Referral')(sequelize);
const Project = require('./Project')(sequelize);
const ProjectMember = require('./ProjectMember')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const BankAccount = require('./BankAccount')(sequelize);
const WishlistItem = require('./WishlistItem')(sequelize);

// Associations
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Listing, { foreignKey: 'sellerId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(Order, { foreignKey: 'buyerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Listing.hasMany(Order, { foreignKey: 'listingId' });
Order.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

Order.hasMany(OrderMessage, { foreignKey: 'orderId', as: 'messages' });
OrderMessage.belongsTo(Order, { foreignKey: 'orderId' });
OrderMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WithdrawalRequest, { foreignKey: 'userId' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'userId' });

Coupon.hasMany(CouponRedemption, { foreignKey: 'couponId' });
CouponRedemption.belongsTo(Coupon, { foreignKey: 'couponId' });
User.hasMany(CouponRedemption, { foreignKey: 'userId' });
CouponRedemption.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Referral, { foreignKey: 'referrerId', as: 'referralsMade' });
Referral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
User.hasMany(Referral, { foreignKey: 'referredUserId', as: 'referredAs' });
Referral.belongsTo(User, { foreignKey: 'referredUserId', as: 'referredUser' });

User.hasMany(Project, { foreignKey: 'ownerId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'members' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasOne(Invoice, { foreignKey: 'orderId' });
Invoice.belongsTo(Order, { foreignKey: 'orderId' });
User.hasMany(Invoice, { foreignKey: 'userId' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(BankAccount, { foreignKey: 'userId', as: 'bankAccounts' });
BankAccount.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WishlistItem, { foreignKey: 'userId' });
WishlistItem.belongsTo(User, { foreignKey: 'userId' });
Listing.hasMany(WishlistItem, { foreignKey: 'listingId' });
WishlistItem.belongsTo(Listing, { foreignKey: 'listingId' });

Niche.hasMany(Listing, { foreignKey: 'primaryNicheId', as: 'listings' });
Listing.belongsTo(Niche, { foreignKey: 'primaryNicheId', as: 'primaryNiche' });

module.exports = {
  sequelize,
  User,
  Niche,
  Listing,
  Order,
  OrderMessage,
  Wallet,
  Transaction,
  WithdrawalRequest,
  Coupon,
  CouponRedemption,
  Referral,
  Project,
  ProjectMember,
  Invoice,
  BankAccount,
  WishlistItem,
};
