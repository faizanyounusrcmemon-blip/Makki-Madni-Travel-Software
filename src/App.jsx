import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Login from "./screens/Login";

// DASHBOARD
import Dashboard from "./screens/Dashboard";

// ARCHIVE
import ArchiveManager from "./screens/ArchiveManager";
import ArchiveList from "./screens/ArchiveList";
import ArchiveView from "./screens/ArchiveView";
import ArchiveLogs from "./screens/ArchiveLogs";
import PasswordSettings from "./screens/PasswordSettings";

// SALES
import Packages from "./screens/Packages";
import Hotels from "./screens/Hotels";
import Ticketing from "./screens/Ticketing";
import Transport from "./screens/Transport";
import Ziyarat from "./screens/Ziyarat";
import Visa from "./screens/Visa";
import Card from "./screens/Card";
import Groups from "./screens/Groups";

// PURCHASE
import Purchase from "./screens/Purchase";
import PurchaseList from "./screens/PurchaseList";
import PurchaseDetail from "./screens/PurchaseDetail";
import PendingPurchase from "./screens/PendingPurchase";
import Supplier from "./screens/Supplier";
import CustomersList from "./screens/CustomersList";

// LEDGERS
import CustomerLedger from "./screens/CustomerLedger";
import RegisteredCustomerLedger from "./screens/RegisteredCustomerLedger";
import PurchaseLedger from "./screens/PurchaseLedger";
import SupplierLedger from "./screens/SupplierLedger";
import BankLedger from "./screens/BankLedger";
import CashLedger from "./screens/CashLedger";
import BalanceSheet from "./screens/BalanceSheet";
import ExpenseLedger from "./screens/ExpenseLedger";

// REPORTS / MASTER
import AllReports from "./screens/AllReports";
import AllReportsToday from "./screens/AllReportsToday";
import ProfitReport from "./screens/ProfitReport";
import SaleAdjustmentReport from "./screens/SaleAdjustmentReport";
import SupplierAdjustmentOnly from "./screens/SupplierAdjustmentOnly";
import SupplierPurchaseDetailReport from "./screens/SupplierPurchaseDetailReport";
import CreateUser from "./screens/CreateUser";
import DeletedReports from "./screens/DeletedReports";
import Restore from "./screens/Restore";
import SystemStorage from "./screens/SystemStorage";
import SaleChangeCheckReport from "./screens/SaleChangeCheckReport";
import ItemLossZeroReport from "./screens/ItemLossZeroReport";
import MonthlyProfitDashboard from "./screens/MonthlyProfitDashboard";

// VOUCHERS
import HotelVoucher from "./screens/HotelVoucher";
import HotelVoucher3in1 from "./screens/HotelVoucher3in1";
import TransportVoucher from "./screens/TransportVoucher";
import ManageUsers from "./screens/ManageUsers";

// VIEWS
import PackagesView from "./screens/PackagesView";
import PackagesSummaryView from "./screens/PackagesSummaryView";
import HotelsView from "./screens/HotelsView";
import TicketingView from "./screens/TicketingView";
import VisaView from "./screens/VisaView";
import CardView from "./screens/CardView";
import GroupsView from "./screens/GroupsView";
import TransportView from "./screens/TransportView";
import ZiyaratView from "./screens/ZiyaratView";

import PackagesViewDeleted from "./screens/PackagesViewDeleted";
import HotelsViewDeleted from "./screens/HotelsViewDeleted";
import TicketingViewDeleted from "./screens/TicketingViewDeleted";
import VisaViewDeleted from "./screens/VisaViewDeleted";
import CardViewDeleted from "./screens/CardViewDeleted";
import GroupsViewDeleted from "./screens/GroupsViewDeleted";
import TransportViewDeleted from "./screens/TransportViewDeleted";
import ZiyaratViewDeleted from "./screens/ZiyaratViewDeleted";
import PurchaseDetailDeleted from "./screens/PurchaseDetailDeleted";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [detail, setDetail] = useState(null);

  // 🔐 LOGIN CHECK (sessionStorage)
  const loggedIn = !!sessionStorage.getItem("user");

  // NAVIGATION HANDLER
  const navigate = (p, d = null) => {
    setPage(p);
    setDetail(d);
  };

  const handleView = (id) => {
    navigate("archiveView", id);
  };

  const handleLogs = (id) => {
    navigate("archiveLogs", id);
  };

  // 🔐 LOGIN GUARD
  if (!loggedIn) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return (
    <div>
      <Navbar onNavigate={navigate} />

      {/* ================= DASHBOARD ================= */}
      {page === "dashboard" && <Dashboard onNavigate={navigate} />}

      {/* ================= ARCHIVE ================= */}
      {page === "archiveManager" && <ArchiveManager onNavigate={navigate} />}
      {page === "passwordSettings" && <PasswordSettings onNavigate={navigate} />}
      
      {/* Case matching validation secured */}
      {(page === "archiveList" || page === "dashboard/archiveList") && (
        <ArchiveList
          onNavigate={navigate}
          onView={handleView}
          onLogs={handleLogs}
        />
      )}

      {page === "archiveView" && (
        <ArchiveView
          archiveId={detail}
          onNavigate={navigate}
        />
      )}

      {page === "archiveLogs" && (
        <ArchiveLogs
          archiveId={detail}
          onNavigate={navigate}
        />
      )}

      {/* ================= SALES ================= */}
      {page === "packages" && <Packages onNavigate={navigate} />}
      {page === "hotels" && <Hotels onNavigate={navigate} />}
      {page === "ticketing" && <Ticketing onNavigate={navigate} />}
      {page === "transport" && <Transport onNavigate={navigate} />}
      {page === "ziyarat" && <Ziyarat onNavigate={navigate} />}
      {page === "manageUsers" && <ManageUsers onNavigate={navigate} />}
      {page === "visa" && <Visa onNavigate={navigate} />}
      {page === "card" && <Card onNavigate={navigate} />}
      {page === "groups" && <Groups onNavigate={navigate} />}
      {page === "systemStorage" && <SystemStorage onNavigate={navigate} />}

      {/* ================= PURCHASE ================= */}
      {page === "purchase" && <Purchase onNavigate={navigate} />}
      {page === "supplier" && <Supplier onNavigate={navigate} />}
      {page === "customersList" && <CustomersList onNavigate={navigate} />}
      {page === "purchaseList" && <PurchaseList onNavigate={navigate} />}
      {page === "pendingPurchase" && <PendingPurchase onNavigate={navigate} />}
      {page === "purchase_detail" && (
        <PurchaseDetail refNo={detail} onNavigate={navigate} />
      )}

      {/* ================= LEDGERS ================= */}
      {page === "customerLedger" && <CustomerLedger onNavigate={navigate} />}
      {page === "registeredCustomerLedger" && <RegisteredCustomerLedger onNavigate={navigate} />}
      {page === "purchaseLedger" && <PurchaseLedger onNavigate={navigate} />}
      {page === "supplierLedger" && <SupplierLedger onNavigate={navigate} />}
      {page === "bankLedger" && <BankLedger onNavigate={navigate} />}
      {page === "cashLedger" && <CashLedger onNavigate={navigate} />}
      {page === "balanceSheet" && <BalanceSheet onNavigate={navigate} />}
      {page === "expenseLedger" && <ExpenseLedger onNavigate={navigate} />}

      {/* ================= REPORTS / MASTER ================= */}
      {page === "allreports" && <AllReports onNavigate={navigate} />}
      {page === "allreportstoday" && <AllReportsToday onNavigate={navigate} />}
      {page === "profitReport" && <ProfitReport onNavigate={navigate} />}
      {page === "saleAdjustmentReport" && <SaleAdjustmentReport onNavigate={navigate} />}
      {page === "supplierAdjustmentOnly" && <SupplierAdjustmentOnly onNavigate={navigate} />}
      {page === "supplierPurchaseDetailReport" && <SupplierPurchaseDetailReport onNavigate={navigate} />}
      {page === "saleChangeCheckReport" && <SaleChangeCheckReport onNavigate={navigate} />}
      {page === "itemLossZeroReport" && <ItemLossZeroReport onNavigate={navigate} />}
      {page === "monthlyProfitDashboard" && <MonthlyProfitDashboard onNavigate={navigate} />}
      {page === "createUser" && <CreateUser onNavigate={navigate} />}
      {page === "deletedReports" && (
        <DeletedReports onNavigate={navigate} />
      )}
      {page === "restore" && <Restore onNavigate={navigate} />}

      {/* ================= VOUCHERS (FIXED) ================= */}
      {page === "hotelVoucher" && (
        <HotelVoucher onNavigate={navigate} />
      )}
      {page === "hotelVoucher3in1" && (
        <HotelVoucher3in1 onNavigate={navigate} />
      )}
      {page === "transportVoucher" && (
        <TransportVoucher onNavigate={navigate} />
      )}

      {/* ================= DETAIL VIEWS ================= */}
      {page === "packages_view" && (
        <PackagesView id={detail} onNavigate={navigate} />
      )}
      {page === "packages_summary_view" && (
        <PackagesSummaryView id={detail} onNavigate={navigate} />
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
      {page === "card_view" && (
        <CardView id={detail} onNavigate={navigate} />
      )}
      {page === "groups_view" && (
        <GroupsView id={detail} onNavigate={navigate} />
      )}
      {page === "transport_view" && (
        <TransportView id={detail} onNavigate={navigate} />
      )}
      {page === "ziyarat_view" && (
        <ZiyaratView id={detail} onNavigate={navigate} />
      )}

      {page === "packages_view_deleted" && (
        <PackagesViewDeleted id={detail} onNavigate={navigate} />
      )}

      {page === "hotels_view_deleted" && (
        <HotelsViewDeleted id={detail} onNavigate={navigate} />
      )}

      {page === "ticket_view_deleted" && (
        <TicketingViewDeleted id={detail} onNavigate={navigate} />
      )}
      {page === "visa_view_deleted" && (
        <VisaViewDeleted id={detail} onNavigate={navigate} />
      )}
      {page === "card_view_deleted" && (
        <CardViewDeleted id={detail} onNavigate={navigate} />
      )}
      {page === "groups_view_deleted" && (
        <GroupsViewDeleted id={detail} onNavigate={navigate} />
      )}
      {page === "transport_view_deleted" && (
        <TransportViewDeleted id={detail} onNavigate={navigate} />
      )}
      {page === "ziyarat_view_deleted" && (
        <ZiyaratViewDeleted id={detail} onNavigate={navigate} />
      )}

      {page === "purchase_view_deleted" && (
        <PurchaseDetailDeleted id={detail} onNavigate={navigate} />
      )}
    </div>
  );
}