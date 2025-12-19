import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Login from "./screens/Login";

// DASHBOARD
import Dashboard from "./screens/Dashboard";

// SALES
import Packages from "./screens/Packages";
import Hotels from "./screens/Hotels";
import Ticketing from "./screens/Ticketing";
import Transport from "./screens/Transport";
import Visa from "./screens/Visa";

// PURCHASE
import Purchase from "./screens/Purchase";
import PurchaseList from "./screens/PurchaseList";

// LEDGERS
import CustomerLedger from "./screens/CustomerLedger";
import PurchaseLedger from "./screens/PurchaseLedger";
import BankLedger from "./screens/BankLedger";
import BalanceSheet from "./screens/BalanceSheet";

// REPORTS
import AllReports from "./screens/AllReports";
import ProfitReport from "./screens/ProfitReport";
import CreateUser from "./screens/CreateUser";
import HotelVoucher from "./screens/HotelVoucher";


// VIEWS
import PackagesView from "./screens/PackagesView";
import HotelsView from "./screens/HotelsView";
import TicketingView from "./screens/TicketingView";
import VisaView from "./screens/VisaView";
import TransportView from "./screens/TransportView";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [detail, setDetail] = useState(null);

  const loggedIn = !!localStorage.getItem("token");

  const navigate = (p, d = null) => {
    setPage(p);
    setDetail(d);
  };

  /* 🔐 LOGIN GUARD */
  if (!loggedIn) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <div>
      <Navbar onNavigate={navigate} />

      {/* DASHBOARD */}
      {page === "dashboard" && <Dashboard onNavigate={navigate} />}

      {/* SALES */}
      {page === "packages" && <Packages onNavigate={navigate} />}
      {page === "hotels" && <Hotels onNavigate={navigate} />}
      {page === "ticketing" && <Ticketing onNavigate={navigate} />}
      {page === "transport" && <Transport onNavigate={navigate} />}
      {page === "visa" && <Visa onNavigate={navigate} />}

      {/* PURCHASE */}
      {page === "purchase" && <Purchase onNavigate={navigate} />}
      {page === "purchaseList" && <PurchaseList onNavigate={navigate} />}

      {/* LEDGERS */}
      {page === "customerLedger" && <CustomerLedger onNavigate={navigate} />}
      {page === "purchaseLedger" && <PurchaseLedger onNavigate={navigate} />}
      {page === "bankLedger" && <BankLedger onNavigate={navigate} />}
      {page === "balanceSheet" && <BalanceSheet onNavigate={navigate} />}

      {/* REPORTS */}
      {page === "allreports" && <AllReports onNavigate={navigate} />}
      {page === "profitReport" && <ProfitReport onNavigate={navigate} />}
      {page === "createUser" && <CreateUser onNavigate={navigate} />}
      {page === "hotelVoucher" && <HotelVoucher onNavigate={navigate} />}

      {/* VIEW */}
      {page === "packages_view" && (
        <PackagesView id={detail} onNavigate={navigate} />
      )}
      {page === "hotels_view" && (
        <HotelsView id={detail} onNavigate={navigate} />
      )}
      {page === "ticket_view" && (
        <TicketingView id={detail} onNavigate={navigate} />
      )}
      {page === "visa_view" && (
        <VisaView id={detail} onNavigate={navigate} />
      )}
      {page === "transport_view" && (
        <TransportView id={detail} onNavigate={navigate} />
      )}
    </div>
  );
}
