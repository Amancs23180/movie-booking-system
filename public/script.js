let appData = {};
let selectedCity = "";
let currentMovie = null;
let selectedDate = "";
let selectedTheatre = null;
let selectedTime = "";
let selectedSeats = [];

// Persistent state cache arrays ensuring data models survive state transitions
let localSimulationBookings = [];
let localSimulationParking = []; // Dynamic persistence array tracking taken slots per show parameters

let chosenParking = { type: null, price: 0 };
let chosenSnacks = [];

// Static Basement Parking Lot Matrix Blueprint mapping
const PARKING_LOT_MAPS = {
    "2wheeler": ["B-01", "B-02", "B-03", "B-04", "B-05", "B-06", "B-07", "B-08"],
    "car": ["C-01", "C-02", "C-03", "C-04", "C-05", "C-06", "C-07", "C-08"]
};

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
            overwriteCatalogWithRealBanners();
            buildCityModal();
            selectCity(appData.cities[0]);
        })
        .catch(() => {
            appData = {
                cities: ["Nagpur", "Mumbai", "Pune"],
                theatres: [{ id: "t1", name: "PVR: Empress Mall" }, { id: "t2", name: "Cinepolis: Nexus Seawoods" }]
            };
            overwriteCatalogWithRealBanners();
            buildCityModal();
            selectCity(appData.cities[0]);
        });

    document.getElementById("nav-city-btn").addEventListener("click", () => {
        document.getElementById("city-modal").style.display = "flex";
    });
});

function overwriteCatalogWithRealBanners() {
    appData.movies = [
        {
            id: "m-spider",
            title: "Spider-Man: Brand New Day",
            poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=500&q=80",
            rating: "9.2",
            languages: ["English", "Hindi"],
            formats: ["2D", "3D", "IMAX 3D"],
            cast: ["Tom Holland", "Zendaya"],
            description: "Peter Parker balances life as an engineering university student in the city with high stakes web-slinging heroism."
        },
        {
            id: "m-dhamaal",
            title: "Dhamaal 4",
            poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80",
            rating: "8.9",
            languages: ["Hindi"],
            formats: ["2D"],
            cast: ["Ajay Devgn", "Arshad Warsi", "Riteish Deshmukh"],
            description: "The classic fun-loving squad returns in an explosive, high-gear comedy adventure hunting down an entirely new secret treasure trove."
        },
        {
            id: "m-odyssey",
            title: "Odyssey",
            poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=500&q=80",
            rating: "9.5",
            languages: ["English", "Telugu", "Tamil"],
            formats: ["2D", "IMAX 3D"],
            cast: ["Matthew McConaughey", "Anne Hathaway"],
            description: "A sweeping sci-fi epic tracking a profound exploratory space journey beyond the constraints of known physical wormholes."
        }
    ];
}

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
    chosenSnacks = [];
    chosenParking = { type: null, price: 0 };
    
    document.querySelectorAll(".addon-option").forEach(el => el.classList.remove("selected"));
    document.getElementById("total-price-display").innerText = "₹0";
    
    switchSection("section-seats");
    loadSeatGrid();
}

function selectParking(type, price) {
    const el2w = document.getElementById("park-2w");
    const el4w = document.getElementById("park-4w");

    if (chosenParking.type === type) {
        chosenParking = { type: null, price: 0 };
        el2w.classList.remove("selected");
        el4w.classList.remove("selected");
    } else {
        chosenParking = { type: type, price: price };
        if (type === '2wheeler') {
            el2w.classList.add("selected");
            el4w.classList.remove("selected");
        } else {
            el4w.classList.add("selected");
            el2w.classList.remove("selected");
        }
    }
    calculatePrice();
}

function toggleSnack(snackType, price) {
    const targetElement = document.getElementById(`fnb-${snackType}`);
    const checkIndex = chosenSnacks.findIndex(s => s.type === snackType);

    if (checkIndex > -1) {
        chosenSnacks.splice(checkIndex, 1);
        targetElement.classList.remove("selected");
    } else {
        chosenSnacks.push({ type: snackType, price: price });
        targetElement.classList.add("selected");
    }
    calculatePrice();
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

    const processUnifiedOccupancy = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(b => {
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
    };

    fetch('/api/bookings')
        .then(res => res.json())
        .then(bookings => {
            processUnifiedOccupancy(bookings);
            processUnifiedOccupancy(localSimulationBookings);
        })
        .catch(() => {
            processUnifiedOccupancy(localSimulationBookings);
        });
}

function calculatePrice() {
    let total = 0;
    selectedSeats.forEach(s => total += s.price);
    total += chosenParking.price;
    chosenSnacks.forEach(snack => total += snack.price);
    
    document.getElementById("total-price-display").innerText = `₹${total}`;
    return total;
}

function displayReceiptUI(allocatedSlot) {
    const seatIds = selectedSeats.map(s => s.id);
    const generatedId = 'BMS-' + Math.floor(100000 + Math.random() * 900000);

    let parkingRowHtml = "";
    if (chosenParking.type && allocatedSlot) {
        // Find all slots already reserved for this specific time slot to show them as occupied on the map
        const slotsTakenAtThisTime = localSimulationParking
            .filter(p => p.city === selectedCity && p.theatreId === selectedTheatre.id && p.date === selectedDate && p.time === selectedTime && p.type === chosenParking.type)
            .map(p => p.slot);

        const fullPool = PARKING_LOT_MAPS[chosenParking.type];
        let mapGridNodesHtml = "";

        // Build out the full view map grid dynamically
        fullPool.forEach(slot => {
            if (slot === allocatedSlot) {
                mapGridNodesHtml += `<div class="parking-slot-node booked-active">${slot} (You)</div>`;
            } else if (slotsTakenAtThisTime.includes(slot)) {
                mapGridNodesHtml += `<div class="parking-slot-node occupied">${slot}</div>`;
            } else {
                mapGridNodesHtml += `<div class="parking-slot-node">${slot}</div>`;
            }
        });

        parkingRowHtml = `
            <div class="ticket-row-info" style="border-bottom:none; margin-bottom:0; margin-top:10px;">
                <span class="ticket-label">Allotted Space</span>
                <span class="ticket-value" style="color:#dc2626; font-weight:bold; font-size:16px;">${allocatedSlot}</span>
            </div>
            <div class="parking-map-box">
                <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">📋 Full Basement Layout Map:</span>
                <div class="parking-grid-view">
                    ${mapGridNodesHtml}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:10px; color:#94a3b8; font-weight:500;">
                    <span>🟥 Red = Your Slot</span>
                    <span>❌ Crossed = Occupied</span>
                    <span>⬜ White = Available</span>
                </div>
            </div>
        `;
    }

    let snacksRowHtml = chosenSnacks.length > 0 ? `
        <div class="ticket-row-info">
            <span class="ticket-label">Pre-booked F&B</span>
            <span class="ticket-value">${chosenSnacks.map(s => s.type.toUpperCase()).join(", ")} (+₹${chosenSnacks.reduce((acc, current) => acc + current.price, 0)})</span>
        </div>` : "";

    document.getElementById("receipt-root").innerHTML = `
        <div class="ticket-header">
            <h2 style="margin:0; font-size:22px; letter-spacing:0.5px; font-weight:700;">Ticket Confirmed! 🎉</h2>
            <p style="margin:4px 0 0 0; opacity:0.9; font-size:13px; font-weight:500;">ID: ${generatedId}</p>
        </div>
        <div class="ticket-body">
            <div style="text-align:center; margin-bottom:24px;">
                <h3 style="color:#0f172a; margin:0; font-size:24px; font-weight:700; line-height:1.2;">${currentMovie.title}</h3>
                <span style="display:inline-block; margin-top:6px; background:#f0fdf4; color:#16a34a; font-weight:700; font-size:12px; padding:4px 12px; border-radius:12px;">✓ Confirmed</span>
            </div>
            
            <div class="ticket-row-info">
                <span class="ticket-label">Cinema</span>
                <span class="ticket-value">${selectedTheatre.name}</span>
            </div>
            <div class="ticket-row-info">
                <span class="ticket-label">City</span>
                <span class="ticket-value">${selectedCity}</span>
            </div>
            <div class="ticket-row-info">
                <span class="ticket-label">Date & Time</span>
                <span class="ticket-value">${selectedDate} | ${selectedTime}</span>
            </div>
            <div class="ticket-row-info">
                <span class="ticket-label">Seats</span>
                <span class="ticket-value" style="color:#10b981; font-size:15px;">${seatIds.join(", ")}</span>
            </div>
            ${snacksRowHtml}
            ${parkingRowHtml}
            
            <div class="ticket-total-box">
                <span style="font-weight:600; color:#475569; font-size:14px;">Grand Total</span>
                <span style="font-weight:700; color:#0f172a; font-size:20px;">₹${calculatePrice()}</span>
            </div>
            
            <p style="text-align:center; color:#94a3b8; font-size:11px; margin-top:24px; margin-bottom:0; line-height:1.4;">
                Show this digital receipt at the door entry counter. Enjoy your show!
            </p>
        </div>
    `;
    switchSection("section-receipt");
}

function processBooking() {
    if (selectedSeats.length === 0) {
        alert("Please pick at least one seat first!");
        return;
    }

    let allocatedSlot = null;
    if (chosenParking.type) {
        // Find slots already occupied for this theater show runtime window parameters
        const occupiedSlots = localSimulationParking
            .filter(p => p.city === selectedCity && p.theatreId === selectedTheatre.id && p.date === selectedDate && p.time === selectedTime && p.type === chosenParking.type)
            .map(p => p.slot);

        // Find the first unallocated open node from the pool matrix 
        const pool = PARKING_LOT_MAPS[chosenParking.type];
        allocatedSlot = pool.find(slot => !occupiedSlots.includes(slot));

        if (!allocatedSlot) {
            alert("Sorry, parking slots are completely full for this show timing! Proceeding without parking reservation.");
            chosenParking = { type: null, price: 0 };
        } else {
            // Persist allocation data inside state memory model layer instantly
            localSimulationParking.push({
                city: selectedCity,
                theatreId: selectedTheatre.id,
                date: selectedDate,
                time: selectedTime,
                type: chosenParking.type,
                slot: allocatedSlot
            });
        }
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

    localSimulationBookings.push(payload);

    fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => displayReceiptUI(allocatedSlot))
    .catch(() => displayReceiptUI(allocatedSlot));
}