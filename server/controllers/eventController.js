const Event = require('../models/Event.js');


// Get All Events
exports.getAllEvents = async (req, res) => {
    try {

        const filters = {};
        if(req.query.category) {
            filters.category = req.query.category;
        }
        if(req.query.location){
            filters.location = req.query.location;
        }
        if(req.query.ticketPrice){
            filters.ticketPrice = { $lte: parseFloat(req.query.ticketPrice) };
        }


        const events = await Event.find(filters);
        res.json(events);

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
};


exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if(!event){
            return res.status(404).json({message:'Event not found'});
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event' });
    }
};

exports.createEvent = async (req, res) => {
    const {title, description, date, location, category, totalSeats, ticketPrice, imageUrl} = req.body;
    try{
        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            imageUrl
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    const {title, description, date, location, category, totalSeats, ticketPrice, imageUrl} = req.body;

    try{
        const event = await Event.findByIdAndUpdate(req.params.id, {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            imageUrl
        }, {new:true});
        if(!event){
            return res.status(404).json({message:'Event not found'});
        }
        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try{
        const event = await Event.findByIdAndDelete(req.params.id);
        if(!event){
            return res.status(404).json({message:'Event not found'});
        }
        res.json({message:'Event deleted successfully'});
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
};
