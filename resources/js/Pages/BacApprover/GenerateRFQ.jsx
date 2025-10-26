import { useEffect, useState } from "react";
import { FilePlus2, ScrollText } from "lucide-react";
import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head } from "@inertiajs/react";

export default function GenerateRFQ({ pr, purchaseRequest }) {
  const [selectedItems, setSelectedItems] = useState([]);

  // Handle checkbox toggle
  const toggleItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === pr.details.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pr.details.map((item) => item.id));
    }
  };

const handlePrint = () => {
  if (selectedItems.length === 0) {
    // Print all items
    window.open(route("bac_user.print_rfq", { id: pr.id }), "_blank");
  } else {
    // Print only selected items
    window.open(
      route("bac_user.print_rfq_selected", { pr: pr.id }) +
        "?items[]=" +
        selectedItems.join("&items[]="),
      "_blank"
    );

  }
};


  return (
    <ApproverLayout header={"Schools Divisions Office - Ilagan | Request for Quotation"}>
      <Head title="Request for Quotation" />
      <div className="mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-indigo-700" />
            Generate Request for Quotation (RFQ)
          </h1>
        </div>

        <div className="mb-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm shadow-sm"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: PR Info */}
          <div className="xl-col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <FilePlus2 className="w-5 h-5 text-indigo-600" />
              Purchase Request Info
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>PR Number:</strong> {pr.pr_number}</p>
              <p><strong>Purpose:</strong> {pr.purpose || "N/A"}</p>
              <p><strong>Requested By:</strong> {pr.requester_name || "N/A"}</p>
              <p><strong>Division:</strong> {pr.division || "N/A"}</p>
              <p><strong>Date Created:</strong> {new Date(pr.created_at).toLocaleDateString()}</p>
              <p><strong>Focal Person:</strong>{" "}
                {purchaseRequest.focal_person
                  ? `${purchaseRequest.focal_person.firstname} ${purchaseRequest.focal_person.middlename || ""} ${purchaseRequest.focal_person.lastname || ""}`
                  : "N/A"}
              </p>
              {pr.approval_image && (
                <div className="mt-4">
                  <p className="font-medium text-sm mb-1">Approval Image:</p>
                  <img
                    src={`/storage/${pr.approval_image}`}
                    alt="Approval"
                    className="rounded-md shadow max-h-96 border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: PR Items */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <ScrollText className="w-5 h-5 text-indigo-600" />
                Purchase Request Items
              </h2>

              {/* Print Selected Button */}
              <button
                onClick={handlePrint}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm mb-4"
              >
                🖨️ Print {selectedItems.length > 0 ? "Selected Items" : "All Items"}
              </button>

              {/* Items Table */}
              {pr.details && pr.details.length > 0 ? (
                <table className="min-w-full text-sm text-gray-700 border">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="py-2 px-4 border">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === pr.details.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-2 px-4 border">Item Name</th>
                      <th className="py-2 px-4 border">Specs</th>
                      <th className="py-2 px-4 border">Quantity</th>
                      <th className="py-2 px-4 border">Unit</th>
                      <th className="py-2 px-4 border">Estimated Price (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.details.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50">
                        <td className="py-2 px-4 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                          />
                        </td>
                        <td className="py-2 px-4 border">{item.item || "N/A"}</td>
                        <td className="py-2 px-4 border">{item.specs || "N/A"}</td>
                        <td className="py-2 px-4 border">{item.quantity}</td>
                        <td className="py-2 px-4 border">{item.unit}</td>
                        <td className="py-2 px-4 border">
                          {`₱${Number(item.unit_price || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-6 text-gray-400 italic">
                  No items found in this PR.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ApproverLayout>
  );
}
