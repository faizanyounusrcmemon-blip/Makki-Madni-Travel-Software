import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BookingsList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5001/api/bookings/list")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setList(d.rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} className="btn btn-dark mb-3">
        ← Back
      </button>

      <h2>Bookings List</h2>

      {list.length === 0 && <p>No bookings found.</p>}

      {list.map((b) => (
        <div
          key={b.id}
          style={{
            padding: "12px",
            margin: "10px 0",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div><b>Ref:</b> {b.ref_no}</div>
            <div><b>Name:</b> {b.customer_name}</div>
            <div><b>Date:</b> {b.booking_date}</div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate(`/booking/${b.id}`)}
          >
            View Detail
          </button>
        </div>
      ))}
    </div>
  );
}
