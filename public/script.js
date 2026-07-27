let appData = {};
let selectedCity = "";
let currentMovie = null;
let selectedDate = "";
let selectedTheatre = null;
let selectedTime = "";
let selectedSeats = [];

document.addEventListener("DOMContentLoaded", () => {
    fetch('/data/data.json')
        .then(res => res.json())
        .then(data => {
            appData = data;
            buildCityModal();
            selectCity(appData.cities[0]);
        });

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
    document.getElementById("city-modal").style.display = "none";
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

function showDashboard() {
    switchSection("section-dashboard");
}

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
        let d = new Date();
        d.setDate(d.getDate() + i);
        let dateString = d.toLocaleDateString('en-IN', options);
        
        const pill = document.createElement("button");
        pill.className = "date-pill";
        if(i === 0) {
            pill.classList.add("selected");
            selectedDate = dateString;
        }
        pill.innerText = dateString;
        pill.onclick = (e) => {
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
    
    const showtimes = ["10:30 AM", "02:15 PM", "06:00 PM", "09:30 PM"];
    
    appData.theatres.forEach(theatre => {
        const row = document.createElement("div");
        row.className = "theatre-row";
        
        let buttonsHtml = "";
        showtimes.forEach(time => {
            buttonsHtml += `<button class="time-btn" onclick="selectTimeSlot('${theatre.id}', '${theatre.name}', '${time}')">${time}</button>`;
        });

        row.innerHTML = `
            <h4 style="margin-top:0; margin-bottom:12px; font-size:16px; color:#0f172a;">${theatre.name}</h4>
            <div>${buttonsHtml}</div>
        `;
        container.appendChild(row);
    });
}

function selectTimeSlot(theatreId, theatreName, time) {
    selectedTheatre = { id: theatreId, name: theatreName };
    selectedTime = time;
    
    document.getElementById("seat-movie-title").innerText = `${currentMovie.title}`;
    document.getElementById("seat-show-details").innerText = `📍 ${selectedCity}  •  🏛️ ${theatreName}  •  📅 ${selectedDate} at ⏰ ${time}`;
    
    selectedSeats = [];
    document.getElementById("total-price-display").innerText = "₹0";
    
    switchSection("section-seats");
    loadSeatGrid();
}

function loadSeatGrid() {
    const container = document.getElementById("seats-container");
    container.innerHTML = "";

    fetch('/api/bookings')
        .then(res => res.json())
        .then(bookings => {
            const takenSeats = [];
            bookings.forEach(b => {
                if(b.city === selectedCity && 
                   b.movieId === currentMovie.id && 
                   b.theatreId === selectedTheatre.id && 
                   b.date === selectedDate && 
                   b.time === selectedTime) {
                    b.seats.forEach(s => takenSeats.push(s.toString()));
                }
            });

            for (let i = 1; i <= 40; i++) {
                const seat = document.createElement("div");
                seat.className = "seat";
                seat.innerText = i;
                
                if(i <= 10) seat.classList.add("vip-seat");

                if(takenSeats.includes(i.toString())) {
                    seat.classList.add("occupied");
                } else {
                    seat.onclick = () => {
                        if(seat.classList.contains("selected")) {
                            seat.classList.remove("selected");
                            selectedSeats = selectedSeats.filter(s => s !== i);
                        } else {
                            seat.classList.add("selected");
                            selectedSeats.push(i);
                        }
                        calculatePrice();
                    };
                }
                container.appendChild(seat);
            }
        })
        .catch(err => console.error("Error loading bookings:", err));
}

function calculatePrice() {
    let total = 0;
    selectedSeats.forEach(seatNum => {
        total += (seatNum <= 10) ? 300 : 150;
    });
    document.getElementById("total-price-display").innerText = `₹${total}`;
}

function processBooking() {
    if(selectedSeats.length === 0) {
        alert("Please pick at least one seat!");
        return;
    }

    const payload = {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title,
        city: selectedCity,
        theatreId: selectedTheatre.id,
        theatreName: selectedTheatre.name,
        date: selectedDate,
        time: selectedTime,
        seats: selectedSeats
    };

    fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if(!res.ok) throw new Error("Seats already taken!");
        return res.json();
    })
    .then(bookingResult => {
        renderReceipt(bookingResult);
        switchSection("section-receipt");
    })
    .catch(err => alert(err.message));
}

function renderReceipt(ticket) {
    let total = 0;
    ticket.seats.forEach(s => total += (parseInt(s) <= 10) ? 300 : 150);

    document.getElementById("receipt-root").innerHTML = `
        <h2 style="color:#10b981; margin-top:0;">Booking Confirmed! 🎉</h2>
        <p style="font-size:13px; color:#64748b;">ID: ${ticket.id}</p>
        <hr style="border:0; border-top:1px dashed #cbd5e1; margin:20px 0;">
        <h3 style="margin:0; color:#dc2626; font-size:22px;">${ticket.movieTitle}</h3>
        <p style="margin:8px 0;"><strong>City:</strong> ${ticket.city}</p>
        <p style="margin:8px 0;"><strong>Theatre:</strong> ${ticket.theatreName}</p>
        <p style="margin:8px 0;"><strong>Date:</strong> ${ticket.date}</p>
        <p style="margin:8px 0;"><strong>Showtime:</strong> ${ticket.time}</p>
        <p style="margin:8px 0;"><strong>Seats Chosen:</strong> ${ticket.seats.join(", ")}</p>
        <hr style="border:0; border-top:1px dashed #cbd5e1; margin:20px 0;">
        <h3 style="margin:0; font-size:20px; color:#0f172a;">Paid Amount: ₹${total}</h3>
    `;
}