const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to read database safely
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { cities: [], movies: [], theatres: [], bookings: [] };
    }
}

// Helper function to write database safely
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 1. Get initial layout options (Cities, Movies, Theatres)
app.get('/api/initial-data', (req, res) => {
    const db = readData();
    res.json({ cities: db.cities, movies: db.movies, theatres: db.theatres });
});

// 2. Get already booked seats for a specific showtime to disable them in UI
app.get('/api/booked-seats', (req, res) => {
    const { movie, theatre, time } = req.query;
    const db = readData();
    
    const filledSeats = db.bookings
        .filter(b => b.movieId === movie && b.theatreId === theatre && b.showtime === time)
        .reduce((acc, b) => acc.concat(b.seats), []);

    res.json({ bookedSeats: filledSeats });
});

// 3. Process the entire dynamic booking payload
app.post('/api/book', (req, res) => {
    const { name, email, city, movieId, theatreId, showtime, seats, totalPrice } = req.body;

    if (!name || !email || !seats || seats.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const db = readData();

    // Secondary backend check to prevent seat double-booking collisions
    const isOverlap = db.bookings
        .filter(b => b.movieId === movieId && b.theatreId === theatreId && b.showtime === showtime)
        .some(b => b.seats.some(s => seats.includes(s)));

    if (isOverlap) {
        return res.status(400).json({ success: false, message: "One or more selected seats were just booked by another user." });
    }

    const newBooking = {
        bookingId: 'BMS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        name,
        email,
        city,
        movieId,
        theatreId,
        showtime,
        seats,
        totalPrice,
        timestamp: new Date().toLocaleString()
    };

    db.bookings.push(newBooking);
    writeData(db);

    res.status(200).json({ success: true, booking: newBooking });
});

app.listen(PORT, () => console.log(`BookMyShow engine running on port ${PORT}`));