import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function BookingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log("ID Received:", id);   // <-- DEBUG
    if (!id) return;

    fetch(`http://localhost:5001/api/bookings/detail/${id}`)
      .then((res) => res.json())
      .then((res) => {
        console.log("API Response:", res);  // <-- DEBUG
        if (res.success) setData(res.row);
        else alert(res.error);
      })
      .catch(() => alert("Network Error"));
  }, [id]);

  if (!id) {
    return <h2 style={{ padding: 20 }}>❌ Invalid booking ID</h2>;
  }

  if (!data) {
    return <h2 style={{ padding: 20 }}>Loading...</h2>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Booking Detail</h1>
      <hr />

      <h3>Ref No: {data.ref_no}</h3>
      <p>Customer: {data.customer_name}</p>
      <p>Date: {data.booking_date}</p>

      <h3>Flights</h3>
      <pre>{JSON.stringify(data.flights, null, 2)}</pre>

      <h3>Hotels</h3>
      <pre>{JSON.stringify(data.hotels, null, 2)}</pre>

      <h3>Transport</h3>
      <pre>{JSON.stringify(data.transport, null, 2)}</pre>
    </div>
  );
}
