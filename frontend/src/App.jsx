import { useEffect, useState } from "react";
import {
  getStations,
  getBookings,
  createBooking,
  cancelBooking
} from "./services/api";

function StationCard({ station, onBook }) {
  return (
    <article className="station-card">
      <div className="card-top">
        <span className={`status ${station.status.toLowerCase()}`}>
          {station.status}
        </span>
        <span className="price">₹{station.pricePerKwh}/kWh</span>
      </div>

      <h3>{station.name}</h3>
      <p className="location">📍 {station.location}</p>
      <p>{station.address}</p>

      <div className="chips">
        {station.chargingType.map((type) => (
          <span key={type}>{type}</span>
        ))}
      </div>

      <div className="station-info">
        <span>🔌 {station.connectors.join(", ")}</span>
        <span>🕐 {station.operatingHours}</span>
        <span>⚡ {station.availableSlots}/{station.totalSlots} slots</span>
      </div>

      <button
        className="primary-btn"
        disabled={station.availableSlots === 0}
        onClick={() => onBook(station)}
      >
        {station.availableSlots === 0 ? "Fully Booked" : "Book Slot"}
      </button>
    </article>
  );
}

function BookingModal({ station, onClose, onSuccess }) {
  const [form, setForm] = useState({
    userName: "",
    phone: "",
    date: "",
    time: "",
    vehicleModel: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.userName.trim()) return setError("Name is required.");
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      return setError("Enter a valid 10-digit Indian mobile number.");
    }
    if (!form.date || !form.time) {
      return setError("Please select a date and time.");
    }
    if (!form.vehicleModel.trim()) {
      return setError("Vehicle model is required.");
    }

    setLoading(true);

    try {
      await createBooking({
        ...form,
        stationId: station.id
      });
      onSuccess("Booking confirmed successfully!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Book a Charging Slot</h2>
        <p className="modal-station">{station.name}</p>

        <form onSubmit={submit}>
          <label>
            Your name
            <input
              value={form.userName}
              onChange={(e) => update("userName", e.target.value)}
              placeholder="Enter your name"
            />
          </label>

          <label>
            Mobile number
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="10-digit mobile number"
              maxLength="10"
            />
          </label>

          <div className="two-col">
            <label>
              Date
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </label>

            <label>
              Time
              <input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
              />
            </label>
          </div>

          <label>
            Vehicle model
            <input
              value={form.vehicleModel}
              onChange={(e) => update("vehicleModel", e.target.value)}
              placeholder="e.g. Tata Nexon EV"
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="primary-btn" disabled={loading}>
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BookingList({ bookings, onCancel }) {
  if (!bookings.length) {
    return <div className="empty">No bookings yet.</div>;
  }

  return (
    <div className="bookings">
      {bookings.map((booking) => (
        <article className="booking-card" key={booking.id}>
          <div>
            <h3>{booking.stationName}</h3>
            <p>{booking.date} at {booking.time}</p>
            <p>{booking.userName} • {booking.vehicleModel}</p>
          </div>

          <div className="booking-actions">
            <span className={`status ${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
            {booking.status !== "Cancelled" && (
              <button
                className="danger-btn"
                onClick={() => onCancel(booking.id)}
              >
                Cancel
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [selectedStation, setSelectedStation] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStations() {
    try {
      const result = await getStations({ search, type, availability });
      setStations(result.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadBookings() {
    try {
      const result = await getBookings();
      setBookings(result.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStations().finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [search, type, availability]);

  useEffect(() => {
    loadBookings();
  }, []);

  function showMessage(text) {
    setMessage(text);
    setError("");
    setTimeout(() => setMessage(""), 3500);
    loadStations();
    loadBookings();
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      await cancelBooking(id);
      showMessage("Booking cancelled successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <header className="hero">
        <nav>
          <div className="logo">⚡ ChargeFinder</div>
          <span>EV Charging • India</span>
        </nav>

        <div className="hero-content">
          <div>
            <p className="eyebrow">SMART EV CHARGING</p>
            <h1>Find your next charge.</h1>
            <p>
              Discover charging stations, check availability and reserve
              your slot in seconds.
            </p>
          </div>
        </div>
      </header>

      <main>
        {message && <div className="toast success-toast">{message}</div>}
        {error && <div className="toast error">{error}</div>}

        <section className="controls">
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 Search station or location..."
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>All</option>
            <option>AC</option>
            <option>DC Fast</option>
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option>All</option>
            <option>Available</option>
            <option>Limited</option>
            <option>Full</option>
          </select>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE</p>
              <h2>Charging Stations</h2>
            </div>
            <span>{stations.length} stations</span>
          </div>

          {loading ? (
            <div className="empty">Loading stations...</div>
          ) : stations.length ? (
            <div className="station-grid">
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onBook={setSelectedStation}
                />
              ))}
            </div>
          ) : (
            <div className="empty">No stations match your filters.</div>
          )}
        </section>

        <section className="booking-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR ACTIVITY</p>
              <h2>My Bookings</h2>
            </div>
          </div>

          <BookingList bookings={bookings} onCancel={handleCancel} />
        </section>
      </main>

      <footer>
        <strong>ChargeFinder India</strong>
        <span>Full-stack capstone project • React + Node.js + Express</span>
      </footer>

      {selectedStation && (
        <BookingModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onSuccess={showMessage}
        />
      )}
    </div>
  );
}