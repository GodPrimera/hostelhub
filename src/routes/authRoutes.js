const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const checkNotAuthenticated = require('../middlewares/checkNotAuthenticated');
const checkAuthenticated = require('../middlewares/checkAuthenticated');

router.get('/signup', checkNotAuthenticated, authController.showRegisterForm);
router.get('/login', checkNotAuthenticated, authController.showLoginForm);
router.post('/signup', checkNotAuthenticated, authController.registerUser);
router.post('/login', checkNotAuthenticated, authController.loginUser);
router.post('/logout', checkAuthenticated, authController.logoutUser)

module.exports = router;
