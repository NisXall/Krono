const Event = require('../models/Event.js');


// Get All Events
exports.getAllEvents = async (req, res) => {
    try {

        const filters = {};
        if (req.query.search) {
            const keywordRegex = new RegExp(req.query.search.trim(), 'i');
            filters.$or = [
                { title: keywordRegex },
                { description: keywordRegex },
                { category: keywordRegex },
                { location: keywordRegex }
            ];
        }
        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.location) {
            filters.location = req.query.location;
        }
        if (req.query.ticketPrice) {
            const maxPrice = Number(req.query.ticketPrice);
            if (!Number.isFinite(maxPrice) || maxPrice < 0) {
                return res.status(400).json({ message: 'ticketPrice filter must be a non-negative number' });
            }
            filters.ticketPrice = { $lte: maxPrice };
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
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event' });
    }
};

exports.createEvent = async (req, res) => {
    const { title, description, date, location, category, totalSeats, ticketPrice, image:imageUrl } = req.body;
    console.log(req.body);
    try {
        const parsedTotalSeats = Number(totalSeats);
        const parsedTicketPrice = Number(ticketPrice);
        const parsedDate = new Date(date);

        if (!title || !description || !location || !category) {
            return res.status(400).json({ message: 'All required event fields must be provided' });
        }
        if (!Number.isInteger(parsedTotalSeats) || parsedTotalSeats <= 0) {
            return res.status(400).json({ message: 'totalSeats must be a positive integer' });
        }
        if (!Number.isFinite(parsedTicketPrice) || parsedTicketPrice < 0) {
            return res.status(400).json({ message: 'ticketPrice must be a non-negative number' });
        }
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'Please provide a valid event date' });
        }

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date: parsedDate,
            location: location.trim(),
            category: category.trim(),
            totalSeats: parsedTotalSeats,
            availableSeats: parsedTotalSeats,
            ticketPrice: parsedTicketPrice,
            imageUrl,
            createdBy: req.user._id,
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
};

exports.updateEvent = async (req, res) => {
    const { title, description, date, location, category, totalSeats, ticketPrice, imageUrl } = req.body;

    try {
        const updates = {};

        if (title !== undefined) {
            const normalizedTitle = String(title).trim();
            if (!normalizedTitle) {
                return res.status(400).json({ message: 'title cannot be empty' });
            }
            updates.title = normalizedTitle;
        }
        if (description !== undefined) {
            const normalizedDescription = String(description).trim();
            if (!normalizedDescription) {
                return res.status(400).json({ message: 'description cannot be empty' });
            }
            updates.description = normalizedDescription;
        }
        if (location !== undefined) {
            const normalizedLocation = String(location).trim();
            if (!normalizedLocation) {
                return res.status(400).json({ message: 'location cannot be empty' });
            }
            updates.location = normalizedLocation;
        }
        if (category !== undefined) {
            const normalizedCategory = String(category).trim();
            if (!normalizedCategory) {
                return res.status(400).json({ message: 'category cannot be empty' });
            }
            updates.category = normalizedCategory;
        }
        if (imageUrl !== undefined) {
            const normalizedImageUrl = String(imageUrl).trim();
            if (!normalizedImageUrl) {
                return res.status(400).json({ message: 'imageUrl cannot be empty' });
            }
            updates.imageUrl = normalizedImageUrl;
        }
        if (date !== undefined) {
            const parsedDate = new Date(date);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Please provide a valid event date' });
            }
            updates.date = parsedDate;
        }
        if (totalSeats !== undefined) {
            const parsedTotalSeats = Number(totalSeats);
            if (!Number.isInteger(parsedTotalSeats) || parsedTotalSeats <= 0) {
                return res.status(400).json({ message: 'totalSeats must be a positive integer' });
            }
            updates.totalSeats = parsedTotalSeats;
        }
        if (ticketPrice !== undefined) {
            const parsedTicketPrice = Number(ticketPrice);
            if (!Number.isFinite(parsedTicketPrice) || parsedTicketPrice < 0) {
                return res.status(400).json({ message: 'ticketPrice must be a non-negative number' });
            }
            updates.ticketPrice = parsedTicketPrice;
        }

        const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
};
