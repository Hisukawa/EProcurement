import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import ICSForm from "./ICSForm"; // your existing ICS form component
import RISForm from "./RISForm"; // create similar for RIS
import ParForm from "./ParForm"; // optional for other types

export default function IssuancePage({ purchaseOrder, inventoryItem, user, ppeOptions }) {
  const [selectedForm, setSelectedForm] = useState("ris"); // default form

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Issue Items">
      <Head title="Issuance Forms" />

      {/* Form Selector */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSelectedForm("ris")}
          className={`px-4 py-2 rounded-md ${
            selectedForm === "ris" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          RIS
        </button>
        <button
          onClick={() => setSelectedForm("ics")}
          className={`px-4 py-2 rounded-md ${
            selectedForm === "ics" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          ICS
        </button>
        
        <button
          onClick={() => setSelectedForm("other")}
          className={`px-4 py-2 rounded-md ${
            selectedForm === "other" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          PAR
        </button>
      </div>

      {/* Render the selected form */}
      <div className="bg-blue-50 p-8 rounded-xl shadow-md">
        {selectedForm === "ris" && (
          <RISForm purchaseOrder={purchaseOrder} inventoryItem={inventoryItem} user={user} ppeOptions={ppeOptions}/>
        )}
        {selectedForm === "ics" && (
          <ICSForm purchaseOrder={purchaseOrder} inventoryItem={inventoryItem} user={user} ppeOptions={ppeOptions}/>
        )}
        {selectedForm === "other" && (
          <ParForm purchaseOrder={purchaseOrder} inventoryItem={inventoryItem} user={user} ppeOptions={ppeOptions} />
        )}
      </div>
    </SupplyOfficerLayout>
  );
}
