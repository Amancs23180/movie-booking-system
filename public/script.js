let appData = {};
let selectedCity = "";
let currentMovie = null;
let selectedDate = "";
let selectedTheatre = null;
let selectedTime = "";
let selectedSeats = [];

// Matrix Configuration to replicate user layout
const SEAT_LAYOUT = [
    { category: "₹1350 RECLINER", rows: [{ name: "K", count: 14, gaps: [2, 4, 6, 8, 10, 12], price: 1350 }] },
    { category: "₹540 PREMIUM", rows: [
        { name: "J", count: 19, gaps: [3, 14], price: 540 },
        { name: "I", count: 19, gaps: [3, 14], price: 540 },
        { name: "H", count: 19, gaps: [3, 14], price: 540 },
        { name: "G", count: 19, gaps: [3, 14], price: 540 },
        { name: "F", count: 19, gaps: [3, 14], price: 540 }
    ]},
    { category: "₹520 EXECUTIVE", rows: [
        { name: "E", count: 16, gaps: [2, 13], price: 520 },
        { name: "D", count: 16, gaps: [2, 13], price: 520 },
        { name: "C", count: 16, gaps: [2, 13], price: 520 }
    ]},
    { category: "₹500 NORMAL", rows: [{ name: "B", count: 16, gaps: [2, 13], price: 500 }] }
];

document.addEventListener("DOMContentLoaded", () => {
    fetch('/data/data.json')
        .then(res => res.json())
        .then(data => {
            appData = data;
            buildCityModal();
            selectCity(appData.cities[0]);
        })
        .catch(err => console.error("Initialization failed:", err));

    document.getElementById("nav-city-btn").addEventListener("click", () => {
        document.getElementById("city-modal").style.display = "flex";
    });
});

function buildCityModal() {
    const container = document.getElementById("modal-city-grid");
    container.innerHTML = "";
    appData.cities.forEach(city => {
        const card = document.createElement("div");
        card.className = "city-card";
        card.innerText = city;
        card.onclick = () => {
            selectCity(city);
            document.getElementById("city-modal").style.display = "none";
        };
        container.appendChild(card);
    });
}

function selectCity(city) {
    selectedCity = city;
    document.getElementById("nav-city-btn").innerText = "📍 " + city;
    document.getElementById("dashboard-heading").innerText = `Recommended Movies in ${city}`;
    renderDashboard();
}

function renderDashboard() {
    const container = document.getElementById("movies-container");
    container.innerHTML = "";
    appData.movies.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.onclick = () => showDetails(movie.id);
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}">
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span style="color:#10b981; font-weight:bold;">★ ${movie.rating}</span>
                    <span>${movie.languages[0]}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function showDashboard() { switchSection("section-dashboard"); }
function switchSection(id) {
    document.querySelectorAll(".view-section").forEach(s => s.classList.remove("active-section"));
    document.getElementById(id).classList.add("active-section");
}

function showDetails(movieId) {
    currentMovie = appData.movies.find(m => m.id === movieId);
    switchSection("section-details");
    document.getElementById("details-root").innerHTML = `
        <img class="details-img" src="${currentMovie.poster}">
        <div>
            <h1 style="margin-top:0; color:#dc2626;">${currentMovie.title}</h1>
            <p style="font-size:18px; color:#10b981; font-weight:bold;">Rating: ★ ${currentMovie.rating}</p>
            <p><strong>Cast:</strong> ${currentMovie.cast.join(", ")}</p>
            <p><strong>Formats:</strong> ${currentMovie.formats.join(" | ")}</p>
            <p style="line-height:1.6; color:#475569; margin-top:20px;">${currentMovie.description}</p>
        </div>
    `;
    buildDatePills();
    buildTheatreTimings();
}

function buildDatePills() {
    const container = document.getElementById("dates-root");
    container.innerHTML = "";
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    for(let i = 0; i < 4; i++) {
        let d = new Date(); d.setDate(d.getDate() + i);
        let dateString = d.toLocaleDateString('en-IN', options);
        const pill = document.createElement("button");
        pill.className = "date-pill";
        if(i === 0) { pill.classList.add("selected"); selectedDate = dateString; }
        pill.innerText = dateString;
        pill.onclick = () => {
            document.querySelectorAll(".date-pill").forEach(p => p.classList.remove("selected"));
            pill.classList.add("selected");
            selectedDate = dateString;
        };
        container.appendChild(pill);
    }
}

function buildTheatreTimings() {
    const container = document.getElementById("theatres-root");
    container.innerHTML = "";
    const showtimes = ["06:15 AM", "09:10 AM", "01:35 PM", "06:00 PM"];
    appData.theatres.forEach(theatre => {
        const row = document.createElement("div");
        row.className = "theatre-row";
        let buttonsHtml = "";
        showtimes.forEach(time => {
            buttonsHtml += `<button class="time-btn" onclick="selectTimeSlot('${theatre.id}', '${theatre.name}', '${time}')">${time}</button>`;
        });
        row.innerHTML = `<h4 style="margin-top:0; margin-bottom:12px; font-size:16px;">${theatre.name}</h4><div>${buttonsHtml}</div>`;
        container.appendChild(row);
    });
}

function selectTimeSlot(theatreId, theatreName, time) {
    selectedTheatre = { id: theatreId, name: theatreName };
    selectedTime = time;
    document.getElementById("seat-movie-title").innerText = `${currentMovie.title}`;
    document.getElementById("seat-show-details").innerText = `${selectedTheatre.name} | ${selectedDate}, ${selectedTime}`;
    selectedSeats = [];
    document.getElementById("total-price-display").innerText = "₹0";
    switchSection("section-seats");
    loadSeatGrid();
}

function loadSeatGrid() {
    const gridContainer = document.getElementById("dynamic-seating-grid");
    gridContainer.innerHTML = "";

    fetch('/api/bookings')
        .then(res => res.json())
        .then(bookings => {
            const occupiedMap = new Set();
            if (Array.isArray(bookings)) {
                bookings.forEach(b => {
                    if (b.city === selectedCity && b.movieId === currentMovie.id && b.theatreId === selectedTheatre.id && b.date === selectedDate && b.time === selectedTime) {
                        if (b.seats) b.seats.forEach(s => occupiedMap.add(s.toString()));
                    }
                });
            }

            SEAT_LAYOUT.forEach(catBlock => {
                const header = document.createElement("div");
                header.className = "category-header";
                header.innerText = catBlock.category;
                gridContainer.appendChild(header);

                catBlock.rows.forEach(rowData => {
                    const rowDiv = document.createElement("div");
                    rowDiv.className = "seat-row";

                    const label = document.createElement("div");
                    label.className = "row-label";
                    label.innerText = rowData.name;
                    rowDiv.appendChild(label);

                    const seatsWrapper = document.createElement("div");
                    seatsWrapper.className = "row-seats";

                    for (let sNum = rowData.count; sNum >= 1; sNum--) {
                        const seatId = `${rowData.name}-${sNum}`;

                        const seat = document.createElement("div");
                        seat.className = "seat";
                        seat.innerText = sNum;

                        if (occupiedMap.has(seatId)) {
                            seat.classList.add("occupied");
                        } else {
                            seat.onclick = () => {
                                if (seat.classList.contains("selected")) {
                                    seat.classList.remove("selected");
                                    selectedSeats = selectedSeats.filter(s => s.id !== seatId);
                                } else {
                                    seat.classList.add("selected");
                                    selectedSeats.push({ id: seatId, price: rowData.price });
                                }
                                calculatePrice();
                            };
                        }

                        seatsWrapper.appendChild(seat);

                        if (rowData.gaps.includes(sNum)) {
                            const gap = document.createElement("div");
                            gap.className = "seat.gap";
                            gap.style.width = "28px";
                            seatsWrapper.appendChild(gap);
                        }
                    }
                    rowDiv.appendChild(seatsWrapper);
                    gridContainer.appendChild(rowDiv);
                });
            });
        })
        .catch(err => console.error("Seating layout parsing issue:", err));
}

function calculatePrice() {
    let total = 0;
    selectedSeats.forEach(s => total += s.price);
    document.getElementById("total-price-display").innerText = `₹${total}`;
}

function processBooking() {
    if (selectedSeats.length === 0) {
        alert("Please select at least one seat!");
        return;
    }

    const seatIds = selectedSeats.map(s => s.id);
    const payload = {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title,
        city: selectedCity,
        theatreId: selectedTheatre.id,
        theatreName: selectedTheatre.name,
        date: selectedDate,
        time: selectedTime,
        seats: seatIds
    };

    fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error("Some seats were taken just now!");
        return res.json();
    })
    .then(ticket => {
        let total = 0;
        selectedSeats.forEach(s => total += s.price);
        document.getElementById("receipt-root").innerHTML = `
            <h2 style="color:#10b981; margin-top:0;">Booking Confirmed! 🎉</h2>
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin:20px 0;">
            <h3 style="color:#dc2626; font-size:22px; margin:0 0 15px 0;">${ticket.movieTitle}</h3>
            <p><strong>Theatre:</strong> ${ticket.theatreName}</p>
            <p><strong>Date & Time:</strong> ${ticket.date} at ${ticket.time}</p>
            <p><strong>Seats Chosen:</strong> ${ticket.seats.join(", ")}</p>
            <hr style="border:0; border-top:1px dashed #cbd5e1; margin:20px 0;">
            <h3>Total Paid: ₹${total}</h3>
        `;
        switchSection("section-receipt");
    })
    .catch(err => alert(err.message));
}