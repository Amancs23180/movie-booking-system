let appData = {};
let selectedCity = "";
let currentMovie = null;
let selectedDate = "";
let selectedTheatre = null;
let selectedTime = "";
let selectedSeats = [];
let chosenPaymentMethod = "";

// Unified BMS Layout Map Matrix
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
        .catch(err => console.error("Initialization initialization setup error:", err));

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

    const seatDOMRefs = {};

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

                seat.onclick = () => {
                    if (seat.classList.contains("occupied")) return;

                    if (seat.classList.contains("selected")) {
                        seat.classList.remove("selected");
                        selectedSeats = selectedSeats.filter(s => s.id !== seatId);
                    } else {
                        seat.classList.add("selected");
                        selectedSeats.push({ id: seatId, price: rowData.price });
                    }
                    calculatePrice();
                };

                seatsWrapper.appendChild(seat);
                seatDOMRefs[seatId] = seat;

                if (rowData.gaps.includes(sNum)) {
                    const gap = document.createElement("div");
                    gap.className = "seat gap";
                    seatsWrapper.appendChild(gap);
                }
            }
            rowDiv.appendChild(seatsWrapper);
            gridContainer.appendChild(rowDiv);
        });
    });

    fetch('/api/bookings')
        .then(res => res.json())
        .then(bookings => {
            if (!Array.isArray(bookings)) return;
            bookings.forEach(b => {
                if (b.city === selectedCity && b.movieId === currentMovie.id && b.theatreId === selectedTheatre.id && b.date === selectedDate && b.time === selectedTime) {
                    if (b.seats) {
                        b.seats.forEach(sId => {
                            if (seatDOMRefs[sId.toString()]) {
                                seatDOMRefs[sId.toString()].classList.add("occupied");
                            }
                        });
                    }
                }
            });
        })
        .catch(err => console.log("Fresh framework tracking layout mapped."));
}

function calculatePrice() {
    let total = 0;
    selectedSeats.forEach(s => total += s.price);
    document.getElementById("total-price-display").innerText = `₹${total}`;
    return total;
}

/* Payment Gateway View Controllers */
function openPaymentModal() {
    if (selectedSeats.length === 0) {
        alert("Please select at least one seat before booking!");
        return;
    }
    chosenPaymentMethod = "";
    document.querySelectorAll(".payment-method").forEach(el => el.classList.remove("selected"));
    
    const amt = calculatePrice();
    document.getElementById("payment-modal-amount").innerText = `₹${amt}`;
    document.getElementById("payment-modal").style.display = "flex";
}

function closePaymentModal() {
    document.getElementById("payment-modal").style.display = "none";
}

function selectPaymentMode(mode, element) {
    chosenPaymentMethod = mode;
    document.querySelectorAll(".payment-method").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");
}

function confirmPaymentAndBook() {
    if (!chosenPaymentMethod) {
        alert("Please select a payment method option to proceed!");
        return;
    }
    closePaymentModal();
    processBooking();
}

function processBooking() {
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
        if (!res.ok) throw new Error("Some seats were booked in an overlapping transaction!");
        return res.json();
    })
    .then(ticket => {
        let total = 0;
        selectedSeats.forEach(s => total += s.price);
        
        // Render Premium High-Fidelity Confirmation Message Receipt Layout
        document.getElementById("receipt-root").innerHTML = `
            <div class="ticket-header">
                <h2 style="margin:0; font-size:22px; letter-spacing:0.5px;">Ticket Confirmed! 🎉</h2>
                <p style="margin:5px 0 0 0; opacity:0.9; font-size:13px;">Booking ID: ${ticket.id || 'BMS-' + Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
            <div class="ticket-body">
                <div style="text-align:center; margin-bottom:20px;">
                    <h3 style="color:#0f172a; margin:0; font-size:22px; font-weight:700;">${ticket.movieTitle}</h3>
                    <p style="margin:5px 0 0 0; color:#10b981; font-weight:700; font-size:14px;">🌟 English (3D)</p>
                </div>
                
                <div class="ticket-row-info">
                    <span class="ticket-label">Cinema</span>
                    <span class="ticket-value">${ticket.theatreName}</span>
                </div>
                <div class="ticket-row-info">
                    <span class="ticket-label">City</span>
                    <span class="ticket-value">${ticket.city}</span>
                </div>
                <div class="ticket-row-info">
                    <span class="ticket-label">Date & Time</span>
                    <span class="ticket-value">${ticket.date} | ${ticket.time}</span>
                </div>
                <div class="ticket-row-info">
                    <span class="ticket-label">Seats</span>
                    <span class="ticket-value" style="color:#10b981;">${ticket.seats.join(", ")}</span>
                </div>
                <div class="ticket-row-info">
                    <span class="ticket-label">Payment Mode</span>
                    <span class="ticket-value" style="text-transform: uppercase;">${chosenPaymentMethod}</span>
                </div>
                
                <div class="ticket-total-box">
                    <span style="font-weight:700; color:#475569; font-size:15px;">Total Paid</span>
                    <span style="font-weight:800; color:#0f172a; font-size:20px;">₹${total}</span>
                </div>
                
                <p style="text-align:center; color:#94a3b8; font-size:11px; margin-top:25px; margin-bottom:0; font-style:italic;">
                    Show this digital ticket at the entrance counter. Enjoy your movie!
                </p>
            </div>
        `;
        switchSection("section-receipt");
    })
    .catch(err => alert(err.message));
}