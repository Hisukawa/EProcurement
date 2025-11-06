import { useToast } from "@/hooks/use-toast";
import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import AutoCompleteInput from "./AutoCompleteInput";

export default function ICSForm({ purchaseOrder, inventoryItem, user, ppeOptions, icsNumber }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const [ppe, setPpe] = useState(null);
  const [gl, setGl] = useState(null);
  const [office, setOffice] = useState(null);
  const [school, setSchool] = useState(null);
  const [series, setSeries] = useState("0001");
  const [generatedNumber, setGeneratedNumber] = useState("");

  const detail = purchaseOrder?.detail ?? null;
  const pr = detail?.pr_detail?.purchase_request ?? null;

  const focal = pr
    ? `${pr.focal_person.firstname} ${pr.focal_person.middlename} ${pr.focal_person.lastname}`
    : "N/A";

  const itemDesc = inventoryItem ? inventoryItem.item_desc: "N/A";
  const glOptions = ppe?.general_ledger_accounts ?? [];
const { data, setData, post, processing, errors } = useForm({
    po_id: purchaseOrder?.id ?? null,
    ics_number: icsNumber ?? "",
    requested_by: pr?.focal_person?.id ?? null,
    received_from: user?.id ?? null,
    remarks: "",
    items: [
      {
        inventory_item_id: inventoryItem?.id ?? null,
        recipient: "",
        recipient_division: "",
        estimated_useful_life: null,
        inventory_item_number: "",
        ppe_sub_major_account: "",
        general_ledger_account: "",
        office: "",
        quantity: detail?.quantity ?? 1,
        unit_cost: inventoryItem?.unit_cost ?? 0,
        total_cost:
          (inventoryItem?.unit_cost ?? 0) * (detail?.quantity ?? 1),
        series_number: series,
      },
    ],
  });
const itemType = data.items[0].unit_cost <= 5000 ? "low" : "high";
useEffect(() => {
  if (!ppe || !gl) return;

  fetch(`/api/ics-next-series?ppe=${encodeURIComponent(ppe.name.trim())}&gl=${encodeURIComponent(gl.name.trim())}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.series) {
        setSeries(data.series); // string "0008"
        setData("items.0.series_number", data.series); // store as string
      }

    })
    .catch(() => {
      setSeries(1);
      setData("items.0.series_number", 1);
    });
}, [ppe, gl, office, school]);




useEffect(() => {
  if (!ppe || !gl || !series) return;

  const year = new Date().getFullYear().toString();
  const ppeCode = ppe.code?.padStart(2, "0") || "00";
  const glCode = gl.code?.padStart(2, "0") || "00";
  const seriesCode = series?.toString().padStart(4, "0");// keep "0008"



  // location (office)
  const locationCode = office?.code?.padStart(2, "0") || "";

  // if office is "Schools", append school code
  const schoolCode =
    office?.name === "Schools" && school?.code
      ? school.code.padStart(2, "0")
      : "";


  let parts = [year, ppeCode, glCode, seriesCode, locationCode];
  if (schoolCode) parts.push(schoolCode);

  const fullNumber = parts.filter(Boolean).join("-");

  setGeneratedNumber(fullNumber);

  // keep form data in sync
  setData("items.0.inventory_item_number", fullNumber);
  setData("items.0.ppe_sub_major_account", ppe.name || "");
  setData("items.0.general_ledger_account", gl.name || "");
  setData("items.0.office", office?.name || "");
  setData("items.0.series_number", parseInt(series, 10));
  if (school) setData("items.0.school", school.name || "");
}, [ppe, gl, office, school, series]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    post(route("supply_officer.store_ics"), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "✅ Success",
          description: "ICS issuance submitted successfully!",
          className: "bg-green-600 text-white",
        });
        setShowConfirm(false);
      },
      onError: () => {
        toast({
          title: "❌ Error",
          description: "Failed to submit ICS issuance.",
          variant: "destructive",
        });
        setShowConfirm(false);
      },
    });
  };

    const handleQuantityChange = (e) => {
    let qty = parseFloat(e.target.value) || 0;
    const maxQty = inventoryItem.total_stock;
    if (qty > maxQty) qty = maxQty;

    const unit = data.items[0].unit_cost ?? 0;
    setData("items", [
      { ...data.items[0], quantity: qty, total_cost: qty * unit },
    ]);
  };

  const handleRecipientChange = (field, value) => {
    setData("items", [
      { ...data.items[0], [field]: value },
    ]);
  };

  return (
    <div className="bg-blue-50 p-8 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-2">
        <FileText size={24} /> Inventory Custodian Slip (ICS)
      </h2>
      <p className="text-sm text-gray-700 mb-6">
        <strong>Note:</strong> This is the Inventory Custodian Slip (ICS) form page. 
        Fill out the details below to record an ICS issuance.
      </p>

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="col-span-2 bg-red-100 text-red-700 p-4 rounded mb-4">
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Designation</label>
            <input
              value={pr?.division?.division ?? "N/A"}
              readOnly
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ICS No.</label>
            <input
              type="text"
              value={data.ics_number}
              onChange={(e) => setData("ics_number", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
                Auto-generated ({icsNumber}) — you may edit if needed.
              </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              value={itemDesc}
              readOnly
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                max={inventoryItem.total_stock}
                onChange={handleQuantityChange}
                placeholder={`Max: ${inventoryItem.total_stock}`}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                value={inventoryItem.unit?.unit ?? "N/A"}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
              <input
                type="number"
                value={data.items[0].unit_cost}
                onChange={(e) => setData("items.0.unit_cost", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Cost</label>
              <input
                type="number"
                value={data.items[0].total_cost}
                onChange={(e) => setData("items.0.total_cost", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Requested By</label>
            <input
              type="text"
              value={focal}
              readOnly
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-4">
          {/* PPE Dropdown */}
          <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient Name
              </label>
              <input
                type="text"
                value={data.items[0].recipient}
                onChange={(e) =>
                  handleRecipientChange("recipient", e.target.value)
                }
                placeholder="Leave blank to issue to requester"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient Office / Division
              </label>
              <input
                type="text"
                value={data.items[0].recipient_division}
                onChange={(e) =>
                  handleRecipientChange("recipient_division", e.target.value)
                }
                placeholder="Optional"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PPE Sub-major Account</label>
            <select
              value={ppe?.id || ""}
              onChange={(e) => {
                const selected = ppeOptions.find(p => p.id == e.target.value);
                setPpe(selected || null);
                setGl(null); // reset GL
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <option value="">Select PPE</option>
              {ppeOptions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} - ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* GL Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">General Ledger Account</label>
            <select
              value={gl?.id || ""}
              onChange={(e) => {
                const selected = glOptions.find(g => g.id == e.target.value);
                setGl(selected || null);
              }}
              disabled={!ppe}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white disabled:bg-gray-100"
            >
              <option value="">Select GL</option>
              {glOptions.map(g => (
                <option key={g.id} value={g.id}>
                  {g.code ? `${g.code} - ${g.name}` : g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Office Autocomplete */}
          <AutoCompleteInput
            label="Location Office"
            apiRoute="/api/office-search"
            value={office?.code  || ""}
            onChange={setOffice}
            placeholder="Type Location Office..."
          />

          {/* School Autocomplete */}
          {office?.name === "Schools" && (
            <AutoCompleteInput
              label="School"
              apiRoute="/api/school-search"
              value={school?.name || ""}
              onChange={setSchool}
              placeholder="Type School..."
            />
          )}

          {/* Inventory Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Inventory Item No.</label>
            <input
              type="text"
              value={generatedNumber}
              readOnly
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
            />
          </div>
          {/* Estimated Life*/}
          <input
            type="number"
            value={data.items[0].estimated_useful_life ?? ""}
            onChange={(e) => setData("items.0.estimated_useful_life", e.target.value)}
            placeholder="Enter Estimated Useful Life in years (optional)"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            onWheel={(e) => e.currentTarget.blur()}
          />


          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              value={data.remarks}
              onChange={(e) => setData("remarks", e.target.value)}
              rows="4"
              placeholder="Enter remarks (optional)"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            />
          </div>
        </div>

        <div className="col-span-full flex justify-end mt-4">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition disabled:opacity-50"
          >
            <SendHorizonal size={16} className="mr-2" />
            {processing ? "Submitting..." : "Submit Issuance"}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Submission
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit this ICS issuance?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
