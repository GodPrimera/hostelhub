const express = require('express');
const checkAuthenticated = require('../middlewares/checkAuthenticated');
const dashboardController = require('../controllers/dashboardController')

const router = express.Router();

router.get('/', checkAuthenticated, dashboardController.showDashboard);
router.get('/dashboard', checkAuthenticated, dashboardController.showDashboard);
router.get('/hostels', checkAuthenticated, dashboardController.showHostels);
router.get('/bookings', checkAuthenticated, dashboardController.showBookings);
router.get('/reports', checkAuthenticated, dashboardController.showReports);
router.get('/residents', checkAuthenticated, dashboardController.showResidents);
router.get('/rooms', checkAuthenticated, dashboardController.showRooms);
router.get('/settings', checkAuthenticated, dashboardController.showSettings);
router.get('/hostels/new', checkAuthenticated, dashboardController.showAddHostel);
router.get('/rooms/new', checkAuthenticated, dashboardController.showAddRoom);
router.get('/residents/new', checkAuthenticated, dashboardController.showAddResident);
router.get('/bookings/new', checkAuthenticated, dashboardController.showAddBooking);
router.get('/rooms/:id/edit', checkAuthenticated, dashboardController.showEditRoom)
router.get('/residents/:id/edit', checkAuthenticated, dashboardController.showEditResident)

router.post('/hostels/new', checkAuthenticated, dashboardController.addHostel);
router.post('/rooms', checkAuthenticated, dashboardController.addRoom);
router.post('/rooms/new', checkAuthenticated, dashboardController.addRoom);
router.post('/rooms/:id', checkAuthenticated, dashboardController.updateRoom);
router.post('/residents/new', checkAuthenticated, dashboardController.addResident)
router.post('/bookings/new', checkAuthenticated, dashboardController.addBooking)
router.post('/residents/:id', checkAuthenticated, dashboardController.updateResident)


router.delete('/rooms/:id', checkAuthenticated, dashboardController.deleteRoom)


module.exports = router;
