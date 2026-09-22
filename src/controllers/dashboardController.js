const Hostel = require("../models/hostel");
const Room = require("../models/room");
const Resident = require("../models/resident");
const Booking = require("../models/booking");
const mongoose = require("mongoose");

// Rooms that still have at least one free space
const getAvailableRooms = () =>
  Room.find({ $expr: { $lt: ["$occupiedSpaces", "$capacity"] } })
    .populate("hostel")
    .sort({ roomNumber: 1 })
    .lean();

exports.showDashboard = async (req, res) => {
  const [hostels, rooms, bookings, residents] = await Promise.all([
    Hostel.find().lean(),
    Room.find().lean(),
    Booking.find().lean(),
    Resident.find().lean(),
  ]);
  const dashboardCard = {
    hostelRooms: rooms.length,
    totalHostels: hostels.length,
    totalResidents: residents.length,
  };

  res.render("dashboard", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    dashboardCard,
  });
};

exports.showBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate("resident room")
    .populate({ path: "room", populate: { path: "hostel" } })
    .sort({ createdAt: -1 })
    .lean();
  res.render("bookings", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    bookings,
  });
};

exports.showHostels = async (req, res) => {
  const [hostels, rooms] = await Promise.all([
    Hostel.find().sort({ name: 1 }).lean(),
    Room.find().lean(),
  ]);

  const hostelCards = hostels.map((hostel) => {
    const hostelRooms = rooms.filter(
      (room) => String(room.hostel) === String(hostel._id)
    );
    const capacity = hostelRooms.reduce(
      (total, room) => total + room.capacity,
      0
    );
    const occupied = hostelRooms.reduce(
      (total, room) => total + room.occupiedSpaces,
      0
    );
    return {
      ...hostel,
      roomCount: hostelRooms.length,
      capacity,
      occupied,
      available: capacity - occupied,
      occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0,
    };
  });

  res.render("hostels", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    hostels: hostelCards,
  });
};

exports.showReports = async (req, res) => {
  const [hostels, rooms, bookings] = await Promise.all([
    Hostel.find().lean(),
    Room.find().lean(),
    Booking.find().lean(),
  ]);
  const capacity = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupied = rooms.reduce(
    (total, room) => total + room.occupiedSpaces,
    0
  );
  const occupancyByHostel = hostels.map((hostel) => {
    const hostelRooms = rooms.filter(
      (room) => String(room.hostel) === String(hostel._id)
    );
    const hostelCapacity = hostelRooms.reduce(
      (total, room) => total + room.capacity,
      0
    );
    const hostelOccupied = hostelRooms.reduce(
      (total, room) => total + room.occupiedSpaces,
      0
    );
    return {
      name: hostel.name,
      occupancy: hostelCapacity
        ? Math.round((hostelOccupied / hostelCapacity) * 100)
        : 0,
    };
  });
  res.render("reports", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    report: {
      capacity,
      occupied,
      available: capacity - occupied,
      occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0,
      bookings: bookings.length,
      fullRooms: rooms.filter((room) => room.occupiedSpaces >= room.capacity)
        .length,
      occupancyByHostel,
    },
  });
};

exports.showResidents = async (req, res) => {
  const [residents, bookings] = await Promise.all([
    Resident.find().sort({ name: 1 }).lean(),
    Booking.find({ status: "Active" })
      .populate({ path: "room", populate: { path: "hostel" } })
      .lean(),
  ]);
  const residentsWithBooking = residents.map((resident) => ({
    ...resident,
    booking: bookings.find(
      (booking) => String(booking.resident) === String(resident._id)
    ),
  }));
  res.render("residents", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    residents: residentsWithBooking,
  });
};

exports.showRooms = async (req, res) => {
  const [rooms, hostels] = await Promise.all([
    Room.find().populate("hostel").sort({ roomNumber: 1 }).lean(),
    Hostel.find().sort({ name: 1 }).lean(),
  ]);
  const capacity = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupied = rooms.reduce(
    (total, room) => total + room.occupiedSpaces,
    0
  );
  res.render("rooms", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
    rooms,
    hostels,
    summary: {
      capacity,
      occupied,
      available: capacity - occupied,
      occupancy: capacity ? Math.round((occupied / capacity) * 100) : 0,
    },
  });
};

exports.showSettings = (req, res) => {
  res.render("settings", {
    message: req.flash("success")[0] || null,
    userName: req.session.userName,
  });
};

exports.showAddHostel = (req, res) => {
  res.render("add-hostel", {
    userName: req.session.userName,
    error: req.flash("error")[0] || null,
    formData: {},
  });
};

exports.showAddRoom = async (req, res) => {
  const hostels = await Hostel.find().sort({ name: 1 }).lean();
  res.render("add-room", {
    userName: req.session.userName,
    hostels,
    room: null,
    error: req.flash("error")[0] || null,
    formData: {},
  });
};

exports.showAddResident = (req, res) => {
  res.render("add-resident", {
    userName: req.session.userName,
    error: req.flash("error")[0] || null,
    formData: {},
  });
};

exports.showAddBooking = async (req, res) => {
  const rooms = await getAvailableRooms();
  res.render("add-booking", {
    userName: req.session.userName,
    rooms,
    error: req.flash("error")[0] || null,
    formData: {},
  });
};

exports.addHostel = async (req, res) => {
  const name = req.body.name?.trim();
  const location = req.body.location?.trim();
  const description = req.body.description?.trim() || "";
  const formData = { name, location, description };
  const fail = (error) =>
    res.render("add-hostel", {
      userName: req.session.userName,
      error,
      formData,
    });

  if (!name || !location) return fail("Hostel name and location are required.");

  try {
    if (await Hostel.findOne({ name }))
      return fail("A hostel with that name already exists.");
    await Hostel.create({ name, location, description });
    req.flash("success", "Hostel created successfully.");
    return res.redirect("/hostels");
  } catch (err) {
    console.error("Error creating hostel", err);
    return fail("Unable to create the hostel. Please try again.");
  }
};

// Validates room form input. Returns { error } or { values }.
function parseRoomBody(body) {
  const roomNumber = body.roomNumber?.trim();
  const hostel = body.hostel;
  const capacity = Number(body.capacity);
  const occupiedSpaces =
    body.occupiedSpaces === "" || body.occupiedSpaces == null
      ? 0
      : Number(body.occupiedSpaces);

  if (!roomNumber || !hostel)
    return { error: "Room number and hostel are required." };
  if (!mongoose.isValidObjectId(hostel))
    return { error: "Please select a valid hostel." };
  if (!Number.isInteger(capacity) || capacity < 1)
    return { error: "Capacity must be a whole number of at least 1." };
  if (!Number.isInteger(occupiedSpaces) || occupiedSpaces < 0)
    return { error: "Occupied spaces must be a whole number, 0 or more." };
  if (occupiedSpaces > capacity)
    return { error: "Occupied spaces cannot be more than the room capacity." };
  return { values: { roomNumber, hostel, capacity, occupiedSpaces } };
}

exports.addRoom = async (req, res) => {
  const formData = req.body;
  const fail = async (error) =>
    res.render("add-room", {
      userName: req.session.userName,
      hostels: await Hostel.find().sort({ name: 1 }).lean(),
      room: null,
      error,
      formData,
    });

  const { error, values } = parseRoomBody(req.body);
  if (error) return fail(error);

  try {
    // Room numbers only need to be unique within the same hostel
    if (
      await Room.findOne({
        roomNumber: values.roomNumber,
        hostel: values.hostel,
      })
    ) {
      return fail("That hostel already has a room with this number.");
    }
    await Room.create(values);
    req.flash("success", "Room created successfully.");
    return res.redirect("/rooms");
  } catch (err) {
    console.error("Error creating room", err);
    return fail("Unable to create this room. Please try again.");
  }
};

exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const formData = req.body;
  const fail = async (error) =>
    res.render("add-room", {
      userName: req.session.userName,
      hostels: await Hostel.find().sort({ name: 1 }).lean(),
      room: { _id: id },
      error,
      formData,
    });

  if (!mongoose.isValidObjectId(id))
    return res.status(404).send("Room not found");

  const { error, values } = parseRoomBody(req.body);
  if (error) return fail(error);

  try {
    const duplicate = await Room.findOne({
      _id: { $ne: id },
      roomNumber: values.roomNumber,
      hostel: values.hostel,
    });
    if (duplicate)
      return fail("That hostel already has a room with this number.");

    const room = await Room.findByIdAndUpdate(id, values, {
      runValidators: true,
    });
    if (!room) return res.status(404).send("Room not found");

    req.flash("success", "Room updated successfully.");
    return res.redirect("/rooms");
  } catch (err) {
    console.error("Error updating room", err);
    return fail("Unable to update this room. Please try again.");
  }
};

exports.addResident = async (req, res) => {
  const name = req.body.name?.trim();
  const studentId = req.body.studentId?.trim();
  const email = req.body.email?.trim();
  const phone = req.body.phone?.trim();
  const formData = { name, studentId, email, phone };
  const fail = (error) =>
    res.render("add-resident", {
      userName: req.session.userName,
      error,
      formData,
    });

  if (!name || !studentId || !email || !phone)
    return fail("All fields are required.");

  try {
    if (await Resident.findOne({ studentId }))
      return fail("A resident with this student ID already exists.");
    await Resident.create({ name, studentId, email, phone });
    req.flash("success", "Resident created successfully.");
    return res.redirect("/residents");
  } catch (err) {
    console.error("Error creating resident", err);
    return fail("Unable to create this resident. Please try again.");
  }
};

exports.addBooking = async (req, res) => {
  const studentId = req.body.studentId?.trim();
  const { room: roomId, checkInDate, checkOutDate } = req.body;
  const formData = { studentId, room: roomId, checkInDate, checkOutDate };

  // Re-render the form with an error and the values the user typed
  const fail = async (message) =>
    res.render("add-booking", {
      userName: req.session.userName,
      rooms: await getAvailableRooms(),
      error: message,
      formData,
    });

  if (!studentId || !roomId || !checkInDate) {
    return fail("Student ID, room and check-in date are required.");
  }
  if (!mongoose.isValidObjectId(roomId)) {
    return fail("Please select a valid room.");
  }

  const checkIn = new Date(checkInDate);
  const checkOut = checkOutDate ? new Date(checkOutDate) : null;
  if (
    Number.isNaN(checkIn.getTime()) ||
    (checkOut && Number.isNaN(checkOut.getTime()))
  ) {
    return fail("Please enter valid dates.");
  }
  if (checkOut && checkOut <= checkIn) {
    return fail("Check-out date must be after the check-in date.");
  }

  try {
    const resident = await Resident.findOne({ studentId });
    if (!resident) return fail("No resident with this student ID exists.");

    // A resident may have many bookings over time, but only one Active at once
    const activeBooking = await Booking.findOne({
      resident: resident._id,
      status: "Active",
    });
    if (activeBooking)
      return fail("This resident already has an active booking.");

    // Atomically reserve a space: only succeeds if the room still has room.
    // This prevents two managers from over-booking the last space.
    const room = await Room.findOneAndUpdate(
      { _id: roomId, $expr: { $lt: ["$occupiedSpaces", "$capacity"] } },
      { $inc: { occupiedSpaces: 1 } },
      { new: true }
    );
    if (!room)
      return fail(
        "That room is full or no longer exists. Please choose another."
      );

    try {
      await Booking.create({
        resident: resident._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: "Active",
      });
    } catch (createErr) {
      // Booking failed, so give the reserved space back
      await Room.updateOne({ _id: room._id }, { $inc: { occupiedSpaces: -1 } });
      throw createErr;
    }

    req.flash("success", "Room booked successfully.");
    return res.redirect("/bookings");
  } catch (err) {
    console.error("Error creating booking", err);
    return fail("Unable to book this room. Please try again.");
  }
};

exports.showEditRoom = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).send("Room not found");
  }
    

  const [room, hostels] = await Promise.all([
    Room.findById(req.params.id).lean(),
    Hostel.find().sort({ name: 1 }).lean(),
  ]);
  if (!room) return res.status(404).send("Room not found");

  res.render("add-room", {
    userName: req.session.userName,
    room,
    hostels,
    error: null,
    formData: {},
  });
};

exports.showEditResident = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send('Resident not found');
        }

        const resident = await Resident.findById(req.params.id).lean();

        if (!resident) {
            return res.status(404).send('Resident not found');
        }

        res.render('add-resident', {
            userName: req.session.userName,
            resident,
            error: null,
            formData: {}
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.updateResident = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send('Resident not found');
        }

        const { name, studentId, email, phone } = req.body;

        const resident = await Resident.findById(req.params.id);

        if (!resident) {
            return res.status(404).send('Resident not found');
        }

        // Check whether another resident already uses this student ID
        const existingResident = await Resident.findOne({
            studentId: studentId.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingResident) {
            return res.render('add-resident', {
                userName: req.session.userName,
                resident,
                error: 'A resident with this student ID already exists.',
                formData: {
                    name,
                    studentId,
                    email,
                    phone
                }
            });
        }

        // Update the resident
        resident.name = name.trim();
        resident.studentId = studentId.trim();
        resident.email = email.trim();
        resident.phone = phone.trim();

        await resident.save();

        req.flash('success', 'Resident updated successfully.');

        return res.redirect('/residents');

    } catch (error) {
        console.error('Something went wrong:', error);

        return res.status(500).send('Unable to update resident.');
    }
};

exports.deleteRoom = async (req, res) => {
 await Room.findByIdAndDelete(req.params.id)
 res.redirect('/rooms');
}

exports.deleteResident = async (req, res) => {
 await Room.findByIdAndDelete(req.params.id)
 res.redirect('/rooms');
}

exports.deleteBooking = async (req, res) => {
 await Room.findByIdAndDelete(req.params.id)
 res.redirect('/rooms');
}
