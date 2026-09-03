const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Project, ProjectMember, User } = require('../models');
const ids = require('../utils/ids');
const mailer = require('../services/mailer');

exports.list = asyncHandler(async (req, res) => {
  const owned = await Project.findAll({
    where: { ownerId: req.user.id },
    include: [{ model: ProjectMember, as: 'members' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: owned });
});

exports.create = asyncHandler(async (req, res) => {
  const p = await Project.create({ ...req.body, ownerId: req.user.id });
  await ProjectMember.create({
    projectId: p.id,
    userId: req.user.id,
    email: req.user.email,
    status: 'accepted',
    role: 'owner',
    acceptedAt: new Date(),
  });
  res.status(201).json({ success: true, data: p });
});

exports.getOne = asyncHandler(async (req, res) => {
  const p = await Project.findByPk(req.params.id, {
    include: [{ model: ProjectMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'publicId', 'email', 'firstName', 'lastName'] }] }],
  });
  if (!p) throw ApiError.notFound();
  const isMember =
    p.ownerId === req.user.id || p.members.some((m) => m.userId === req.user.id);
  if (!isMember) throw ApiError.forbidden();
  res.json({ success: true, data: p });
});

exports.update = asyncHandler(async (req, res) => {
  const p = await Project.findByPk(req.params.id);
  if (!p) throw ApiError.notFound();
  if (p.ownerId !== req.user.id) throw ApiError.forbidden();
  await p.update(req.body);
  res.json({ success: true, data: p });
});

exports.remove = asyncHandler(async (req, res) => {
  const p = await Project.findByPk(req.params.id);
  if (!p) throw ApiError.notFound();
  if (p.ownerId !== req.user.id) throw ApiError.forbidden();
  await p.destroy();
  res.json({ success: true });
});

exports.invite = asyncHandler(async (req, res) => {
  const { emails } = req.body; // array
  const p = await Project.findByPk(req.params.id);
  if (!p) throw ApiError.notFound();
  if (p.ownerId !== req.user.id) throw ApiError.forbidden();

  const queued = [];
  for (const email of emails) {
    const inviteToken = ids.inviteToken();
    const existing = await User.findOne({ where: { email } });
    const member = await ProjectMember.create({
      projectId: p.id,
      userId: existing?.id || null,
      email,
      inviteToken,
      status: 'invited',
      role: 'editor',
    });

    const inviteUrl = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/projects/invite/${inviteToken}`;
    const tpl = mailer.templates.projectInvite({
      projectName: p.name,
      inviteUrl,
      senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
    });
    mailer.send({ to: email, ...tpl }).catch(() => {});
    queued.push(member);
  }
  res.status(201).json({ success: true, data: queued });
});

exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const member = await ProjectMember.findOne({ where: { inviteToken: token } });
  if (!member) throw ApiError.notFound('Invalid invite');
  if (member.status === 'accepted') return res.json({ success: true, data: member });
  if (req.user.email !== member.email && member.userId !== req.user.id) {
    throw ApiError.forbidden('Invite is for a different email');
  }
  member.status = 'accepted';
  member.userId = req.user.id;
  member.acceptedAt = new Date();
  await member.save();
  res.json({ success: true, data: member });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const p = await Project.findByPk(req.params.id);
  if (!p) throw ApiError.notFound();
  if (p.ownerId !== req.user.id) throw ApiError.forbidden();
  const m = await ProjectMember.findOne({ where: { id: req.params.memberId, projectId: p.id } });
  if (!m) throw ApiError.notFound();
  m.status = 'removed';
  await m.save();
  res.json({ success: true });
});
