import React, { useEffect, useState } from "react";

export default function Supplier({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    supplier_name: "",
    category: "",
    contact_no: "",
  });
  const [editId, setEditId] = useState(null);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const url = editId
      ? `/update/${editId}`
      : "/create";

    const method = editId ? "PUT" : "POST";

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/supplier${url}`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );

    const d = await r.json();
    if (d.success) {
      setForm({ supplier_name: "", category: "", contact_no: "" });
      setEditId(null);
      load();
    } else alert(d.error);
  };

  const del = async (id) => {
    const pass = prompt("Enter password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/supplier/delete/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      }
    );

    const d = await r.json();
    if (d.success) load();
    else alert(d.error);
  };

  return (
    <div className="container p-3">
      <h4 className="fw-bold">🏷 Supplier Profile</h4>

      <div className="card p-3 mb-3">
        <input
          className="form-control mb-2"
          placeholder="Supplier Name"
          value={form.supplier_name}
          onChange={(e) =>
            setForm({ ...form, supplier_name: e.target.value })
          }
        />

        <select
          className="form-select mb-2"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          <option value="">Category</option>
          <option>Ticket</option>
          <option>Hotel</option>
          <option>Visa</option>
          <option>Transport</option>
          <option>Other</option>
        </select>

        <input
          className="form-control mb-2"
          placeholder="Contact No"
          value={form.contact_no}
          onChange={(e) =>
            setForm({ ...form, contact_no: e.target.value })
          }
        />

        <button className="btn btn-success" onClick={save}>
          {editId ? "Update" : "Save"}
        </button>
      </div>

      <table className="table table-sm table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Contact</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.supplier_code}</td>
              <td>{r.supplier_name}</td>
              <td>{r.category}</td>
              <td>{r.contact_no}</td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-1"
                  onClick={() => {
                    setForm(r);
                    setEditId(r.id);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => del(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>
    </div>
  );
}
