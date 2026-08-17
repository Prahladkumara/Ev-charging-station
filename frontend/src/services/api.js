const API_URL = import.meta.env.DEV 
? "http://localhost:5000/api"
: "https://ev-charging-backend-2rub.onrender.com/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const getStations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/stations${query ? `?${query}` : ""}`);
};

export const getStation = (id) => request(`/stations/${id}`);

export const getBookings = () => request("/bookings");

export const createBooking = (booking) =>
  request("/bookings", {
    method: "POST",
    body: JSON.stringify(booking)
  });

export const updateBooking = (id, booking) =>
  request(`/bookings/${id}`, {
    method: "PUT",
    body: JSON.stringify(booking)
  });

export const cancelBooking = (id) =>
  request(`/bookings/${id}`, {
    method: "DELETE"
  });