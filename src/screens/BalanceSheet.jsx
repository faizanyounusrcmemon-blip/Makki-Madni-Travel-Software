import React, { useEffect, useState, useMemo } from "react";

const fmt = (v) => (v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState({ customers: [], purchases: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
        const d = await res.json();
        setData({
          customers: Array.isArray(d?.customers) ? d.customers : [],
          purchases: Array.isArray(d?.purchases) ? d.purchases : [],
        });
      } catch (err) {
        console.error(err);
        setData({ customers: [], purchases: [] });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-4 text-white">Loading...</div>;

  // ================= SAFE ROWS =================
  const customerRows = useMemo(
    () => (Array.isArray(data.customers) ? data.customers : []).filter((r) => Number(r?.balance || 0) > 0),
    [data.customers]
  );

  const purchaseRows = useMemo(
    () => (Array.isArray(data.purchases) ? data.purchases : []).filter((r) => Number(r?.balance || 0) > 0),
    [data.purchases]
  );

  // ================= SAFE TOTALS =================
  const customerTotals = useMemo(() => {
    return customerRows.reduce(
      (acc, r) => {
        acc.sale += Number(r?.sale_total || 0);
        acc.received += Number(r?.received || 0);
        acc.balance += Number(r?.balance || 0);
        return acc;
      },
      { sale: 0, received: 0, balance: 0 }
    );
  }, [customerRows]);

  const purchaseTotals = useMemo(() => {
    return purchaseRows.reduce(
      (acc, r) => {
        acc.purchase += Number(r?.purchase_total || 0);
        acc.paid += Number(r?.paid || 0);
        acc.balance += Number(r?.balance || 0);
        return acc;
      },
      { purchase: 0, paid: 0, balance: 0 }
    );
  }, [purchaseRows]);

  const netPosition = (customerTotals.balance || 0) - (purchaseTotals.balance || 0);

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>📊 BALANCE SHEET</h3>
        <button className="btn btn-secondary" onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
      </div>

      {/* CUSTOMER RECEIVABLE */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-info text-white fw-bold">💰 Customer Receivable</div>
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Customer</th>
                <th className="text-end">Total Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r?.ref_no || "-"}</td>
                  <td className="text-info fw-semibold">{r?.customer_name || "-"}</td>
                  <td className="text-end">{fmt(r?.sale_total)}</td>
                  <td className="text-end">{fmt(r?.received)}</td>
                  <td className="text-end text-danger fw-bold">{fmt(r?.balance)}</td>
                </tr>
              ))}
              {customerRows.length > 0 && (
                <tr className="table-secondary fw-bold">
                  <td colSpan={3} className="text-end">GRAND TOTAL</td>
                  <td className="text-end">{fmt(customerTotals.sale)}</td>
                  <td className="text-end">{fmt(customerTotals.received)}</td>
                  <td className="text-end text-danger fw-bold">{fmt(customerTotals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPPLIER PAYABLE */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-warning text-dark fw-bold">📦 Supplier Payable</div>
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Supplier</th>
                <th className="text-end">Total Purchase</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r?.ref_no || "-"}</td>
                  <td className="text-info fw-semibold">{r?.customer_name || "-"}</td>
                  <td className="text-end">{fmt(r?.purchase_total)}</td>
                  <td className="text-end">{fmt(r?.paid)}</td>
                  <td className="text-end text-danger fw-bold">{fmt(r?.balance)}</td>
                </tr>
              ))}
              {purchaseRows.length > 0 && (
                <tr className="table-secondary fw-bold">
                  <td colSpan={3} className="text-end">GRAND TOTAL</td>
                  <td className="text-end">{fmt(purchaseTotals.purchase)}</td>
                  <td className="text-end">{fmt(purchaseTotals.paid)}</td>
                  <td className="text-end text-danger fw-bold">{fmt(purchaseTotals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-dark text-white fw-bold">📌 SUMMARY</div>
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <tbody>
              <tr>
                <td>1</td>
                <td>💰 Lene Hain (Customer)</td>
                <td className="text-success fw-bold">{fmt(customerTotals.balance)}</td>
              </tr>
              <tr>
                <td>2</td>
                <td>📦 Dene Hain (Supplier)</td>
                <td className="text-danger fw-bold">{fmt(purchaseTotals.balance)}</td>
              </tr>
              <tr className="table-secondary fw-bold">
                <td>3</td>
                <td>
                  🔄 Net Position<br/>
                  <small>{netPosition >= 0 ? "Aap lene wale ho" : "Aap dene wale ho"}</small>
                </td>
                <td className={netPosition >= 0 ? "text-success" : "text-danger"}>
                  {fmt(Math.abs(netPosition))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
