import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import ICSForm from "./ICSForm"; // Your ICS form component
import RISForm from "./RISForm"; // Your RIS form component
import ParForm from "./ParForm"; // Optional for other types
import SwitchToRisForm from "./SwitchToRisForm";
import SwitchToIcsForm from "./SwitchToIcsForm";
import SwitchToParForm from "./SwitchToParForm";

export default function SwitchType({ record, user, ppeOptions, type }) {
  const [selectedForm, setSelectedForm] = useState("ris"); // Default form

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Switch Issuance Items">
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
        <SwitchToRisForm
          ris={record}
          user={user}
          ppeOptions={ppeOptions}
          type={type}
          selectedItems={record.items}
        />
      )}
      {selectedForm === "ics" && (
        <SwitchToIcsForm
          ics={record}
          user={user}
          ppeOptions={ppeOptions}
          type={type}
          selectedItems={record.items}
        />
      )}
      {selectedForm === "other" && (
        <SwitchToParForm
          par={record}
          user={user}
          ppeOptions={ppeOptions}
          type={type}
          selectedItems={record.items}
        />
      )}
    </div>

    </SupplyOfficerLayout>
  );
}
