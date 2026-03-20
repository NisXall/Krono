/**
 * seed.js — Krono Backend Test Seeder
 *
 * Usage:  cd server && node seed.js
 *
 * What it does:
 *  1. Connects to MongoDB using the .env MONGODB_URI
 *  2. Clears Users, Events, Bookings, and Otps collections
 *  3. Creates 1 admin + 2 regular (verified) users
 *  4. Creates 4 events (all created by the admin)
 *  5. Creates 2 bookings (one confirmed, one pending)
 *  6. Logs a summary of all created documents
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Bookings');
const { Otp } = require('./models/OTP');

// ─── Seed Data ─────────────────────────────────────────────────────────────

const PLAIN_PASSWORD = 'Password@123';

const usersData = [
    {
        name: 'Admin Krono',
        email: 'admin@krono.dev',
        role: 'admin',
        isVerified: true,
    },
    {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'user',
        isVerified: true,
    },
    {
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        isVerified: true,
    },
];

const eventsData = (adminId) => [
    {
        title: 'Tech Summit 2025',
        description: 'A premier technology conference bringing together innovators, engineers, and entrepreneurs from across the globe.',
        date: new Date('2025-06-15T09:00:00Z'),
        location: 'Mumbai, India',
        category: 'Technology',
        totalSeats: 500,
        availableSeats: 498,
        ticketPrice: 1499,
        imageUrl: 'https://picsum.photos/seed/techsummit/800/400',
        createdBy: adminId,
    },
    {
        title: 'Indie Music Fest',
        description: 'A two-day open-air festival celebrating independent artists across genres — folk, jazz, electronic, and more.',
        date: new Date('2025-07-20T17:00:00Z'),
        location: 'Bangalore, India',
        category: 'Music',
        totalSeats: 2000,
        availableSeats: 2000,
        ticketPrice: 799,
        imageUrl: 'https://picsum.photos/seed/musicfest/800/400',
        createdBy: adminId,
    },
    {
        title: 'Startup Pitch Night',
        description: 'Watch rising founders pitch their ideas to a panel of top-tier investors. Networking dinner included.',
        date: new Date('2025-08-05T18:30:00Z'),
        location: 'Delhi, India',
        category: 'Business',
        totalSeats: 150,
        availableSeats: 149,
        ticketPrice: 2999,
        imageUrl: 'https://picsum.photos/seed/startuppitch/800/400',
        createdBy: adminId,
    },
    {
        title: 'Art & Craft Expo',
        description: 'Explore handcrafted artwork, live painting sessions, and workshops with artists from across the country.',
        date: new Date('2025-09-12T10:00:00Z'),
        location: 'Pune, India',
        category: 'Art',
        totalSeats: 300,
        availableSeats: 300,
        ticketPrice: 299,
        imageUrl: 'https://picsum.photos/seed/artexpo/800/400',
        createdBy: adminId,
    },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function seed() {
    try {
        console.log('\n🌱  Krono Seeder Starting...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅  Connected to MongoDB');

        // ── Clear existing data ──────────────────────────────────────────
        await Promise.all([
            User.deleteMany({}),
            Event.deleteMany({}),
            Booking.deleteMany({}),
            Otp.deleteMany({}),
        ]);
        console.log('🗑️   Cleared existing Users, Events, Bookings, and Otps\n');

        // ── Hash the shared password ─────────────────────────────────────
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, salt);

        // ── Create Users ─────────────────────────────────────────────────
        const createdUsers = await User.insertMany(
            usersData.map((u) => ({ ...u, password: hashedPassword }))
        );

        const admin = createdUsers.find((u) => u.role === 'admin');
        const alice = createdUsers.find((u) => u.email === 'alice@example.com');
        const bob = createdUsers.find((u) => u.email === 'bob@example.com');

        console.log('👤  Users Created:');
        createdUsers.forEach((u) =>
            console.log(`    [${u.role.toUpperCase()}] ${u.name} — ${u.email}`)
        );
        console.log(`    (All passwords: ${PLAIN_PASSWORD})\n`);

        // ── Create Events ─────────────────────────────────────────────────
        const createdEvents = await Event.insertMany(eventsData(admin._id));

        const techSummit = createdEvents[0];
        const startupPitch = createdEvents[2];

        console.log('🎉  Events Created:');
        createdEvents.forEach((e) =>
            console.log(`    [${e.category}] "${e.title}" — ₹${e.ticketPrice} — ${e.availableSeats} seats left`)
        );
        console.log();

        // ── Create Bookings ──────────────────────────────────────────────
        const bookingsData = [
            {
                userId: alice._id,
                eventId: techSummit._id,
                amount: techSummit.ticketPrice,
                status: 'confirmed',
                paymentStatus: 'paid',
            },
            {
                userId: bob._id,
                eventId: startupPitch._id,
                amount: startupPitch.ticketPrice,
                status: 'pending',
                paymentStatus: 'not_paid',
            },
        ];

        const createdBookings = await Booking.insertMany(bookingsData);

        console.log('📋  Bookings Created:');
        for (const booking of createdBookings) {
            const user = createdUsers.find((u) => u._id.equals(booking.userId));
            const event = createdEvents.find((e) => e._id.equals(booking.eventId));
            console.log(
                `    [${booking.status.toUpperCase()} / ${booking.paymentStatus}] ` +
                `${user.name} → "${event.title}" — ₹${booking.amount}  (ID: ${booking._id})`
            );
        }

        // ── Summary ───────────────────────────────────────────────────────
        console.log('\n─────────────────────────────────────────────');
        console.log('✅  Seed Complete!');
        console.log(`    Users:    ${createdUsers.length}`);
        console.log(`    Events:   ${createdEvents.length}`);
        console.log(`    Bookings: ${createdBookings.length}`);
        console.log('─────────────────────────────────────────────');
        console.log('\n🔑  Test Credentials (all share the same password):');
        console.log(`    Password: ${PLAIN_PASSWORD}`);
        console.log(`    Admin  :  admin@krono.dev`);
        console.log(`    User 1 :  alice@example.com`);
        console.log(`    User 2 :  bob@example.com\n`);

    } catch (error) {
        console.error('\n❌  Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌  Disconnected from MongoDB\n');
    }
}

seed();
