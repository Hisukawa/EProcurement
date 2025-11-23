import { useEffect, useState } from "react";
import { FilePlus2, ScrollText } from "lucide-react";
import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head } from "@inertiajs/react";
import axios from "axios"; // Import axios for API requests

export default function GenerateRFQ({ pr, purchaseRequest }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [bacCn, setBacCn] = useState("");
  const [services, setServices] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [deliveryPeriod, setDeliveryPeriod] = useState("");
  const [abc, setAbc] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for Save button

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(route("get.rfq.data", { pr_id: pr.id }));
      
      if (response.data) {
        setBacCn(response.data.bac_cn || "");
        setServices(response.data.services || "");
        setLocation(response.data.location || "");
        setSubject(response.data.subject || "");
        setDeliveryPeriod(response.data.delivery_period || "");
        setAbc(response.data.abc || "");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // RFQ NOT FOUND = FIRST TIME OPENING THE PAGE = NOT AN ERROR
        console.log("No RFQ data yet — this is normal.");
      } else {
        console.error("Error fetching RFQ data:", error);
      }
    }
  };

  fetchData();
}, [pr.id]);


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

  // Handle saving form data
  const saveData = async () => {
    setLoading(true);
    try {
      // Send the form data to your backend API
      const response = await axios.post(route("save.rfq.data"), {
        bac_cn: bacCn,
        services,
        location,
        subject,
        delivery_period: deliveryPeriod,
        abc,
        pr_id: pr.id, // You might need to include the pr_id to associate it
      });

      if (response.status === 200) {
        // Show success message or handle success case
        alert("Data saved successfully!");
      } else {
        // Handle failure
        alert("Failed to save data.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving data.");
    } finally {
      setLoading(false);
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

              {/* Input fields for the RFQ info */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bacCn" className="block text-sm font-medium text-gray-700">BAC CN</label>
                  <input
                    id="bacCn"
                    type="text"
                    value={bacCn}
                    onChange={(e) => setBacCn(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="services" className="block text-sm font-medium text-gray-700">Services to be Provided</label>
                  <input
                    id="services"
                    type="text"
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="deliveryPeriod" className="block text-sm font-medium text-gray-700">Delivery Period</label>
                  <input
                    id="deliveryPeriod"
                    type="text"
                    value={deliveryPeriod}
                    onChange={(e) => setDeliveryPeriod(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="abc" className="block text-sm font-medium text-gray-700">Approved Budget for Contract (ABC)</label>
                  <input
                    id="abc"
                    type="number"
                    value={abc}
                    onChange={(e) => setAbc(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Print Selected Button */}
              <button
                onClick={handlePrint}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm mb-4 me-2"
              >
                🖨️ Print {selectedItems.length > 0 ? "Selected Items" : "All Items"}
              </button>

              {/* Save Button */}
              <button
                onClick={saveData}
                className={`text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Info"}
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
