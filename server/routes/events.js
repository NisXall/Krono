const express = require('express');
const eventRoutes = express.Router();
const {protect, admin} = require('../middleware/auth.js');
const {getAllEvents, getEventById, createEvent, updateEvent, deleteEvent} = require('../controllers/eventController.js');
// Get All Events

eventRoutes.get('/', getAllEvents);

//get event by id
eventRoutes.get('/:id', getEventById);


//create event(admin only)
eventRoutes.post('/', protect, admin, createEvent);

//update event (admin only)
eventRoutes.put('/:id', protect, admin, updateEvent);


// delete event *admin only)
eventRoutes.delete('/:id', protect, admin, deleteEvent);

module.exports = eventRoutes;

