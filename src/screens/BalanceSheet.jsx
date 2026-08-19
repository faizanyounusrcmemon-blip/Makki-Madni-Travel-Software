import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const EPS = 1;
const cleanBalance = (v) => {
  const n = Number(v || 0);
  return Math.abs(n) <= EPS ? 0 : n;
};

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
      const d = await res.json();
      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch (e) {
      console.error(e);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center text-primary fw-bold fs-5">⏳ Loading Real Balance Sheet...</div>;
  if (!data) return null;

  // Filters & Cleaning
  const standardRows = (data.customers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const registeredRows = (data.registeredCustomers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const supplierRows = (data.suppliers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case "PENDING": return <span className="badge bg-danger">PENDING</span>;
      case "PARTIAL": return <span className="badge bg-warning text-dark">PARTIAL</span>;
      case "PAID": return <span className="badge bg-success">PAID</span>;
      case "EXTRA PAID": return <span className="badge bg-primary">EXTRA PAID</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const cashInHand = Number(data.summary?.cash_in_hand || 0);
  const bankBalance = Number(data.summary?.bank_balance || 0);
  
  // Split Receivables Breakdown
  const walkinReceivable = Number(data.summary?.walkin_receivable || 0);
  const registeredReceivable = Number(data.summary?.registered_receivable || 0);
  const totalReceivable = Number(data.summary?.total_receivable || (walkinReceivable + registeredReceivable));

  const totalPayable = Number(data.summary?.total_payable || 0);
  
  const walkinExtraReceived = Number(data.summary?.walkin_extra_received || 0);
  const registeredExtraReceived = Number(data.summary?.registered_extra_received || 0);
  const totalExtraReceived = Number(data.summary?.total_extra_received || (walkinExtraReceived + registeredExtraReceived));
  
  const totalExtraPaid = Number(data.summary?.total_extra_paid || 0);

  const totalAssets = Number(data.summary?.total_assets || (cashInHand + bankBalance + totalReceivable + totalExtraPaid));
  const totalLiabilities = Number(data.summary?.total_liabilities || (totalPayable + totalExtraReceived));
  const netPosition = totalAssets - totalLiabilities;

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="mb-4 p-4 rounded-3 shadow-sm text-white" style={{ background: "linear-gradient(90deg, #0f172a, #1e3a8a)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-20" style={{ width: 50, height: 50, fontSize: 24 }}>🏛️</div>
            <div>
              <h4 className="mb-1 fw-bold">Final Real Balance Sheet Audit Statement</h4>
              <small className="opacity-75">Complete Cash in Hand, Bank, Customer Ledger, Supplier Payables & Adjustments</small>
            </div>
          </div>
          <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => onNavigate("dashboard")}>← Back to Dashboard</button>
        </div>
      </div>

      {/* QUICK LIQUIDITY CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body">
              <small className="text-muted fw-bold text-uppercase">💵 Cash in Hand</small>
              <h5 className={`fw-bold mt-1 mb-0 ${cashInHand < 0 ? "text-danger" : "text-success"}`}>PKR {fmt(cashInHand)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md">
          <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
            <div className="card-body">
              <small className="text-muted fw-bold text-uppercase">🏦 Bank Balance</small>
              <h5 className={`fw-bold mt-1 mb-0 ${bankBalance < 0 ? "text-danger" : "text-primary"}`}>PKR {fmt(bankBalance)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md">
          <div className="card shadow-sm border-0 border-start border-4 border-info h-100">
            <div className="card-body">
              <small className="text-muted fw-bold text-uppercase">🚶 Walk-In Receivable</small>
              <h5 className="fw-bold text-info mt-1 mb-0">PKR {fmt(walkinReceivable)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body">
              <small className="text-muted fw-bold text-uppercase">🔑 Registered Receivable</small>
              <h5 className="fw-bold text-warning mt-1 mb-0">PKR {fmt(registeredReceivable)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md">
          <div className="card shadow-sm border-0 border-start border-4 border-danger h-100">
            <div className="card-body">
              <small className="text-muted fw-bold text-uppercase">📦 Supplier Payable</small>
              <h5 className="fw-bold text-danger mt-1 mb-0">PKR {fmt(totalPayable)}</h5>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: STANDARD CUSTOMERS */}
      <div className="card shadow-sm mb-4 border-start border-success border-3">
        <div className="card-header bg-white fw-bold text-success d-flex justify-content-between align-items-center">
          <span>📋 Standard Customer Receivable (Walk-In)</span>
          <span className="badge bg-success-subtle text-success border border-success">Walk-In Ledger</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Booking Ref</th>
                <th>Customer Name</th>
                <th className="text-end">Total Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {standardRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-3">No walk-in balances pending.</td></tr>}
              {standardRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name}</td>
                  <td className="text-end">{fmt(r.sale_total)}</td>
                  <td className="text-end">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-success"}`}>{fmt(r.balance)}</td>
                  <td className="text-center">{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: REGISTERED CUSTOMERS */}
      <div className="card shadow-sm mb-4 border-start border-info border-3">
        <div className="card-header bg-white fw-bold text-info d-flex justify-content-between align-items-center">
          <span>🔑 Registered Ledger Customers Accounts</span>
          <span className="badge bg-info-subtle text-info border border-info">Client Ledger</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer Code</th>
                <th>Account Name</th>
                <th className="text-end">Total Sales</th>
                <th className="text-end">Total Received</th>
                <th className="text-end">Current Balance</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {registeredRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-3">No registered customer balances pending.</td></tr>}
              {registeredRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-dark">{r.customer_code}</td>
                  <td className="fw-semibold text-primary">{r.customer_name}</td>
                  <td className="text-end text-dark">{fmt(r.sale_total)}</td>
                  <td className="text-end text-dark">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td className="text-center">{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: SUPPLIERS */}
      <div className="card shadow-sm mb-4 border-start border-danger border-3">
        <div className="card-header bg-white fw-bold text-danger d-flex justify-content-between align-items-center">
          <span>📦 Supplier Payable Accounts</span>
          <span className="badge bg-danger-subtle text-danger border border-danger">Vendors Ledger</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Supplier Code</th>
                <th>Supplier Name</th>
                <th className="text-end">Total Purchase</th>
                <th className="text-end">Paid Amount</th>
                <th className="text-end">Payable Balance</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-3">No supplier payables pending.</td></tr>}
              {supplierRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.supplier_code}</td>
                  <td className="fw-semibold">{r.supplier_name}</td>
                  <td className="text-end">{fmt(r.purchase_total)}</td>
                  <td className="text-end">{fmt(r.paid)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td className="text-center">{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOCK-WISE FINAL BALANCE SHEET SUMMARY */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-dark text-white fw-bold py-3 d-flex justify-content-between align-items-center">
          <span>📊 Block-wise Balance Sheet Audit Summary</span>
          <small className="text-warning">Real-Time Ledger Audit</small>
        </div>
        <div className="card-body p-0">
          <table className="table table-bordered mb-0 align-middle">
            <tbody>
              <tr className="table-light">
                <td colSpan="2" className="fw-bold text-uppercase text-secondary">Block A: Cash & Bank Liquid Assets</td>
              </tr>
              <tr>
                <td>💵 Cash in Hand Balance</td>
                <td className="text-end fw-bold text-success">{fmt(cashInHand)}</td>
              </tr>
              <tr>
                <td>🏦 Bank Account Balance</td>
                <td className="text-end fw-bold text-primary">{fmt(bankBalance)}</td>
              </tr>
              <tr className="table-success table-opacity-10 fw-bold">
                <td>💰 Total Liquid Funds (Cash + Bank)</td>
                <td className="text-end text-success">{fmt(cashInHand + bankBalance)}</td>
              </tr>

              <tr className="table-light">
                <td colSpan="2" className="fw-bold text-uppercase text-secondary">Block B: Receivables & Payables Ledger</td>
              </tr>
              <tr>
                <td>🚶 Walk-In Customer Receivables</td>
                <td className="text-end fw-bold text-info">{fmt(walkinReceivable)}</td>
              </tr>
              <tr>
                <td>🔑 Registered Customer Receivables</td>
                <td className="text-end fw-bold text-warning">{fmt(registeredReceivable)}</td>
              </tr>
              <tr className="fw-bold bg-light">
                <td>📈 Total Customer Receivables</td>
                <td className="text-end text-dark">{fmt(totalReceivable)}</td>
              </tr>
              <tr>
                <td>📦 Total Supplier Payables</td>
                <td className="text-end fw-bold text-danger">{fmt(totalPayable)}</td>
              </tr>

              <tr className="table-light">
                <td colSpan="2" className="fw-bold text-uppercase text-secondary">Block C: Advance & Extra Adjustments</td>
              </tr>
              <tr>
                <td>💎 Extra Received from Customers (Walk-In: {fmt(walkinExtraReceived)} | Reg: {fmt(registeredExtraReceived)})</td>
                <td className="text-end fw-bold text-primary">{fmt(totalExtraReceived)}</td>
              </tr>
              <tr>
                <td>💸 Extra Paid to Suppliers (Advance Supplier Credit / Asset)</td>
                <td className="text-end fw-bold text-primary">{fmt(totalExtraPaid)}</td>
              </tr>

              <tr className="table-dark fw-bold fs-5">
                <td>
                  🔄 Net System Financial Position
                  <br />
                  <small className="fw-normal fs-6 text-light opacity-75">
                    {netPosition >= 0 ? "Positive Net Position (Assets exceed Liabilities)" : "Negative Net Position (Liabilities exceed Assets)"}
                  </small>
                </td>
                <td className={`text-end ${netPosition >= 0 ? "text-success" : "text-danger"}`}>
                  PKR {fmt(Math.abs(netPosition))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}