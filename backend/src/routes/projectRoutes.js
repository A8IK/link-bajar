const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/projectController');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', body('name').isString().notEmpty(), validate, ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

router.post('/:id/invites', body('emails').isArray({ min: 1 }), validate, ctrl.invite);
router.post('/invites/:token/accept', ctrl.acceptInvite);
router.delete('/:id/members/:memberId', ctrl.removeMember);

module.exports = router;
