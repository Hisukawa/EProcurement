import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import ICSForm from "./ICSForm"; // your existing ICS form component
import RISForm from "./RISForm"; // create similar for RIS
import ParForm from "./ParForm"; // optional for other types

export default function IssuancePage({
  purchaseOrder,
  inventoryItem,
  inventoryItems = [],
  user,
  ppeOptions,
  risNumber,
  icsNumber,
  parNumber,
  isMulti,
}) {
  const [selectedForm, setSelectedForm] = useState("ris"); // default

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Issue Items">
      <Head title="Issuance Forms" />

      {/* Form Selector */}
      <div className="mb-6 flex gap-4">
        <button onClick={() => setSelectedForm("ris")} className={`px-4 py-2 rounded-md ${selectedForm==="ris"?"bg-blue-700 text-white":"bg-gray-200"}`}>RIS</button>
        <button onClick={() => setSelectedForm("ics")} className={`px-4 py-2 rounded-md ${selectedForm==="ics"?"bg-blue-700 text-white":"bg-gray-200"}`}>ICS</button>
        <button onClick={() => setSelectedForm("par")} className={`px-4 py-2 rounded-md ${selectedForm==="par"?"bg-blue-700 text-white":"bg-gray-200"}`}>PAR</button>
      </div>

      <div className="bg-blue-50 p-8 rounded-xl shadow-md">
        {selectedForm === "ris" && (
          <RISForm
            purchaseOrder={purchaseOrder}
            inventoryItem={inventoryItem}
            inventoryItems={isMulti ? inventoryItems : [inventoryItem]}
            user={user}
            ppeOptions={ppeOptions}
            risNumber={risNumber}
          />
        )}
        {selectedForm === "ics" && (
          <ICSForm
            purchaseOrder={purchaseOrder}
            inventoryItem={inventoryItem}
            inventoryItems={isMulti ? inventoryItems : [inventoryItem]}
            user={user}
            ppeOptions={ppeOptions}
            icsNumber={icsNumber}
          />
        )}
        {selectedForm === "par" && (
          <ParForm
            purchaseOrder={purchaseOrder}
            inventoryItem={inventoryItem}
            inventoryItems={isMulti ? inventoryItems : [inventoryItem]}
            user={user}
            ppeOptions={ppeOptions}
            parNumber={parNumber}
          />
        )}
      </div>
    </SupplyOfficerLayout>
  );
}

