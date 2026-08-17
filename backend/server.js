import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let stations = [
  {
    id: 1,
    name: "GreenCharge Central",
    location: "Mysuru",
    address: "Bengaluru-Mysuru Road, Mysuru",
    chargingType: ["AC", "DC Fast"],
    connectors: ["Type 2", "CCS2"],
    availableSlots: 4,
    totalSlots: 6,
    pricePerKwh: 14,
    operatingHours: "24/7",
    contact: "+91 98765 43210"
  },
  {
    id: 2,
    name: "VoltPoint Hebbal",
    location: "Bengaluru",
    address: "Hebbal Ring Road, Bengaluru",
    chargingType: ["DC Fast"],
    connectors: ["CCS2"],
    availableSlots: 2,
    totalSlots: 8,
    pricePerKwh: 16,
    operatingHours: "06:00 - 23:00",
    contact: "+91 98765 12345"
  },
  {
    id: 3,
    name: "ChargeHub Whitefield",
    location: "Bengaluru",
    address: "ITPL Main Road, Whitefield",
    chargingType: ["AC", "DC Fast"],
    connectors: ["Type 2", "CCS2"],
    availableSlots: 0,
    totalSlots: 5,
    pricePerKwh: 15,
    operatingHours: "24/7",
    contact: "+91 99887 66554"
  },
  {
    id: 4,
    name: "EcoVolt Mangaluru",
    location: "Mangaluru",
    address: "NH 66, Mangaluru",
    chargingType: ["AC"],
    connectors: ["Type 2"],
    availableSlots: 3,
    totalSlots: 4,
    pricePerKwh: 12,
    operatingHours: "07:00 - 22:00",
    contact: "+91 91234 56789"
  }
];

let bookings = [];
let nextBookingId = 1;

function validateBooking(body) {
  const required = ["userName", "phone", "stationId", "date", "time", "vehicleModel"];
  const missing = required.filter((field) => !body[field]);

  if (missing.length) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  if (!/^[6-9]\d{9}$/.test(String(body.phone))) {
    return "Enter a valid 10-digit Indian mobile number.";
  }

  const station = stations.find((s) => s.id === Number(body.stationId));
  if (!station) return "Charging station not found.";

  if (station.availableSlots <= 0) {
    return "This station is currently full.";
  }

  const selectedDate = new Date(`${body.date}T${body.time}`);
  if (Number.isNaN(selectedDate.getTime())) {
    return "Invalid date or time.";
  }

  return null;
}

function stationStatus(station) {
  if (station.availableSlots === 0) return "Full";
  if (station.availableSlots <= Math.ceil(station.totalSlots * 0.3)) return "Limited";
  return "Available";
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "EV Charging API is running" });
});

// GET all stations + search/filter
app.get("/api/stations", (req, res) => {
  const { search = "", type = "All", availability = "All" } = req.query;

  let result = stations.filter((station) => {
    const text = `${station.name} ${station.location} ${station.address}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());

    const matchesType =
      type === "All" || station.chargingType.includes(type);

    const status = stationStatus(station);
    const matchesAvailability =
      availability === "All" || status === availability;

    return matchesSearch && matchesType && matchesAvailability;
  });

  result = result.map((station) => ({
    ...station,
    status: stationStatus(station)
  }));

  res.status(200).json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET one station
app.get("/api/stations/:id", (req, res) => {
  const station = stations.find((s) => s.id === Number(req.params.id));

  if (!station) {
    return res.status(404).json({
      success: false,
      message: "Charging station not found."
    });
  }

  res.status(200).json({
    success: true,
    data: { ...station, status: stationStatus(station) }
  });
});

// GET bookings
app.get("/api/bookings", (req, res) => {
  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// GET individual booking
app.get("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === Number(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  res.status(200).json({ success: true, data: booking });
});

// POST booking
app.post("/api/bookings", (req, res) => {
  const error = validateBooking(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error
    });
  }

  const stationId = Number(req.body.stationId);
  const station = stations.find((s) => s.id === stationId);

  // Prevent duplicate booking for the same station/date/time.
  const conflict = bookings.some(
    (b) =>
      b.stationId === stationId &&
      b.date === req.body.date &&
      b.time === req.body.time &&
      b.status !== "Cancelled"
  );

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: "That time slot is already booked."
    });
  }

  const booking = {
    id: nextBookingId++,
    userName: String(req.body.userName).trim(),
    phone: String(req.body.phone).trim(),
    stationId,
    stationName: station.name,
    date: req.body.date,
    time: req.body.time,
    vehicleModel: String(req.body.vehicleModel).trim(),
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  station.availableSlots--;

  res.status(201).json({
    success: true,
    message: "Booking created successfully.",
    data: booking
  });
});

// PUT booking
app.put("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === Number(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  if (booking.status === "Cancelled") {
    return res.status(400).json({
      success: false,
      message: "Cancelled bookings cannot be updated."
    });
  }

  const allowed = ["userName", "phone", "date", "time", "vehicleModel"];

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      booking[field] = String(req.body[field]).trim();
    }
  }

  if (booking.phone && !/^[6-9]\d{9}$/.test(booking.phone)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 10-digit Indian mobile number."
    });
  }

  res.status(200).json({
    success: true,
    message: "Booking updated successfully.",
    data: booking
  });
});

// DELETE/cancel booking
app.delete("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === Number(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  if (booking.status === "Cancelled") {
    return res.status(400).json({
      success: false,
      message: "Booking is already cancelled."
    });
  }

  booking.status = "Cancelled";

  const station = stations.find((s) => s.id === booking.stationId);
  if (station && station.availableSlots < station.totalSlots) {
    station.availableSlots++;
  }

  res.status(200).json({
    success: true,
    message: "Booking cancelled successfully.",
    data: booking
  });
});

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Invalid JSON / server errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body."
    });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

app.listen(PORT, () => {
  console.log(`EV Charging API running at http://localhost:${PORT}`);
});