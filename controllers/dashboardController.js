const Hostel = require('../models/hostel');
const Room = require('../models/room');
const Resident = require('../models/resident');
const Booking = require('../models/booking');
const room = require('../models/room');

exports.showDashboard = async (req, res) => {
    const [hostels, rooms, bookings, residents] = await Promise.all([Hostel.find().lean(), Room.find().lean(), Booking.find().lean(), Resident.find().lean()]);
    const dashboardCard = {
        hostelRooms: rooms.length,
        totalHostels: hostels.length,
        totalResidents: residents.length
    }
    
    res.render('dashboard', { message: req.flash('success')[0] || null, userName: req.session.userName, dashboardCard });
};

exports.showBookings = async (req, res) => {
    const bookings = await Booking.find().populate('resident room').populate({ path: 'room', populate: { path: 'hostel' } }).sort({ createdAt: -1 }).lean();
    res.render('bookings', { message: req.flash('success')[0] || null, userName: req.session.userName, bookings });
}


exports.showHostels = async (req, res) => {
    const [hostels, rooms] = await Promise.all([Hostel.find().sort({ name: 1 }).lean(), Room.find().lean()]);

    const hostelCards = hostels.map((hostel) => {
        const hostelRooms = rooms.filter((room) => String(room.hostel) === String(hostel._id));
        const capacity = hostelRooms.reduce((total, room) => total + room.capacity, 0);
        const occupied = hostelRooms.reduce((total, room) => total + room.occupiedSpaces, 0);
        return { ...hostel, roomCount: hostelRooms.length, capacity, occupied, available: capacity - occupied, occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0 };
    });

    res.render('hostels', { message: req.flash('success')[0] || null, userName: req.session.userName, hostels: hostelCards });
}


exports.showReports = async (req, res) => {
    const [hostels, rooms, bookings] = await Promise.all([Hostel.find().lean(), Room.find().lean(), Booking.find().lean()]);
    const capacity = rooms.reduce((total, room) => total + room.capacity, 0);
    const occupied = rooms.reduce((total, room) => total + room.occupiedSpaces, 0);
    const occupancyByHostel = hostels.map((hostel) => {
        const hostelRooms = rooms.filter((room) => String(room.hostel) === String(hostel._id));
        const hostelCapacity = hostelRooms.reduce((total, room) => total + room.capacity, 0);
        const hostelOccupied = hostelRooms.reduce((total, room) => total + room.occupiedSpaces, 0);
        return { name: hostel.name, occupancy: hostelCapacity ? Math.round((hostelOccupied / hostelCapacity) * 100) : 0 };
    });
    res.render('reports', { message: req.flash('success')[0] || null, userName: req.session.userName, report: { capacity, occupied, available: capacity - occupied, occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0, bookings: bookings.length, fullRooms: rooms.filter((room) => room.occupiedSpaces >= room.capacity).length, occupancyByHostel } });
}



exports.showResidents = async (req, res) => {
    const [residents, bookings] = await Promise.all([Resident.find().sort({ name: 1 }).lean(), Booking.find({ status: 'Active' }).populate({ path: 'room', populate: { path: 'hostel' } }).lean()]);
    const residentsWithBooking = residents.map((resident) => ({ ...resident, booking: bookings.find((booking) => String(booking.resident) === String(resident._id)) }));
    res.render('residents', { message: req.flash('success')[0] || null, userName: req.session.userName, residents: residentsWithBooking });
}


exports.showRooms = async (req, res) => {
    const [rooms, hostels] = await Promise.all([Room.find().populate('hostel').sort({ roomNumber: 1 }).lean(), Hostel.find().sort({ name: 1 }).lean()]);
    const capacity = rooms.reduce((total, room) => total + room.capacity, 0);
    const occupied = rooms.reduce((total, room) => total + room.occupiedSpaces, 0);
    res.render('rooms', { message: req.flash('success')[0] || null, userName: req.session.userName, rooms, hostels, summary: { capacity, occupied, available: capacity - occupied, occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0 } });
}


exports.showSettings = (req, res) => {
    res.render('settings', {
        message: req.flash('success')[0] || null,
        userName: req.session.userName
    });
}


exports.showAddHostel = (req, res) => {
    res.render('add-hostel', { userName: req.session.userName });
}


exports.showAddRoom = async (req, res) => {
    const hostels = await Hostel.find().sort({ name: 1 }).lean();
    res.render('add-room', { userName: req.session.userName, hostels, room: null });
}


exports.showAddResident = (req, res) => {
    res.render('add-resident', { userName: req.session.userName });
}


exports.showAddBooking = async (req, res) => {
    const rooms = await Room.find({ $expr: { $lt: ['$occupiedSpaces', '$capacity'] } }).populate('hostel').sort({ roomNumber: 1 }).lean();
    res.render('add-booking', { userName: req.session.userName, rooms });
}


exports.addHostel = async (req, res) => {
    const { name, location, description } = req.body;

    const exist = await Hostel.findOne({ name: name.trim() });
    if (exist) {
        req.flash('error', 'A hostel with that name already exists.');
        return res.redirect('/hostels/new');
    }

    try {
        await Hostel.create({ name, location, description });
        req.flash('success', 'Hostel created successfully.');
        return res.redirect('/hostels')
        
    } catch (err) {
        console.log('Something went wrong', err)
        return res.render('add-hostel', { userName: req.session.userName, error: 'Unable to create the hostel. Please try again.' });
    }
}

exports.addRoom = async (req, res) => {
    const { roomNumber, hostel, capacity, occupiedSpaces } = req.body;

    const exist = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (exist) {
        req.flash('error', 'A room with that number already exists.');
        return res.redirect('/rooms/new');
    }

    try {
        await Room.create({ roomNumber, hostel, capacity, occupiedSpaces });
        req.flash('success', 'Room created successfully.');
        return res.redirect('/rooms')
        
    } catch (err) {
        console.log('Something went wrong', err)
        return res.render('add-room', { userName: req.session.userName, error: 'Unable to create this room. Please try again.' });
    }
}


exports.addResident = async (req, res) => {
    const { name, studentId, email, phone } = req.body;

    const exist = await Resident.findOne({ studentId: studentId.trim() });
    if (exist) {
        req.flash('error', 'A resident with this student ID already exists.');
        return res.redirect('/residents/new');
    }

    try {
        await Resident.create({ name, studentId, email, phone });
        req.flash('success', 'Resident created successfully.');
        return res.redirect('/residents')
        
    } catch (err) {
        console.log('Something went wrong', err)
        return res.render('add-resident', { userName: req.session.userName, error: 'Unable to create this Resident. Please try again.' });
    }
}



exports.addBooking = async (req, res) => {
    const { studentId, room, checkInDate, CheckOutDate } = req.body;

    console.log(room);
 // a resident can have 2 bookings after one have expired so check this code later
    const resident = await Resident.findOne({ studentId: studentId.trim() });

    if (!resident) {
        req.flash('error', 'No resident with this student ID exists.');
        return res.redirect('/bookings/new');
    }

    const existingBooking = await Booking.findOne({ resident: resident._id, status: "active"});

    if (existingBooking) {
        req.flash('error', 'This resident already has an active booking');
        return res.redirect('/bookings/new');
    }

    try {
        await Booking.create({ resident, room, checkInDate, CheckOutDate });
        req.flash('success', 'Room booked successfully.');
        return res.redirect('/bookings')
        
    } catch (err) {
        console.log('Something went wrong', err)
        return res.render('add-booking', { userName: req.session.userName, error: 'Unable to book this room. Please try again.' });
    }
}


exports.showEditRoom = async (req, res) => {
    try {
        const [room, hostels] = await Promise.all([
            Room.findById(req.params.id).lean(),
            Hostel.find().sort({ name: 1 }).lean()
        ]);

        if (!room) {
            return res.status(404).send('Room not found');
        }

        res.render('add-room', {
            userName: req.session.userName,
            room,
            hostels
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};