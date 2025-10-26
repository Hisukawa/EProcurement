import { useToast } from "@/hooks/use-toast";
import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useState } from "react";
import AutoCompleteInput from "./AutoCompleteInput";

export default function SwitchToIcsForm({ ics, user, ppeOptions, type }) {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const focal = `${ics?.po?.details[0]?.pr_detail?.purchase_request?.focal_person?.firstname ?? ""} ${ics?.po?.details[0]?.pr_detail?.purchase_request?.focal_person?.middlename ?? ""} ${ics?.po?.details[0]?.pr_detail?.purchase_request?.focal_person?.lastname ?? ""}`.trim() || "N/A";
  const designation = ics?.requested_by?.division?.division ?? "N/A";

  // ✅ Use fallback data from existing ICS
  const { data, setData, post, processing, errors } = useForm({
    id: ics?.id ?? "",
    type: type || "ics",
    po_id: ics?.po?.id ?? null,
    ics_number: ics?.po?.po_number ?? "",
    requested_by: ics?.requested_by?.id ?? user.id,
    received_from: user?.id ?? null,
    remarks: "",
    items: (ics?.items || []).map((item) => ({
      inventory_item_id: item?.inventory_item?.id ?? null,
      // ✅ If it already has a number, keep it
      inventory_item_number: item?.inventory_item_number ?? "",
      quantity: item?.quantity ?? 0,
      unit_cost: item?.unit_cost ?? 0,
      total_cost: item?.total_cost ?? 0,
      ppe_sub_major_account: item?.ppe_sub_major_account ?? null,
      general_ledger_account: item?.general_ledger_account ?? null,
      office: item?.office ?? null,
      school: item?.school ?? null,
      series_number: item?.series_number ?? "0001",
      generated_number: item?.generated_number ?? "",
    })),
  });

  // ✅ Global cache for shared series (ICS + PAR)
  if (!window.__globalSeriesCache) window.__globalSeriesCache = null;

  // ✅ Function to generate inventory number (only if missing)
  const updateInventoryNumber = async (index) => {
    const item = data.items[index];
    const { ppe, gl, office, school, inventory_item_number } = item;

    // 🚫 Skip if item already has inventory number
    if (inventory_item_number && inventory_item_number.trim() !== "") {
      toast({
        title: "Already generated",
        description: "This item already has an inventory number.",
        variant: "default",
      });
      return;
    }

    // ⚠️ Check required fields
    if (!ppe || !gl) {
      toast({
        title: "Missing selection",
        description: "Please select PPE and GL before generating.",
        variant: "destructive",
      });
      return;
    }

    try {
      let baseSeries = 1;

      // ✅ Fetch latest series only once (ICS + PAR combined)
      if (!window.__globalSeriesCache) {
        const res = await fetch(`/api/ics-next-series`);
        const response = await res.json();

        if (!res.ok || !response.series) throw new Error("Invalid response from server.");

        baseSeries = response.series;
        window.__globalSeriesCache = baseSeries;
      } else {
        // Increment for each next item
        window.__globalSeriesCache++;
        baseSeries = window.__globalSeriesCache;
      }

      const series = baseSeries.toString().padStart(4, "0");
      const year = new Date().getFullYear().toString();
      const ppeCode = ppe?.code?.padStart(2, "0") || "00";
      const glCode = gl?.code?.padStart(2, "0") || "00";
      const officeCode = office?.code?.padStart(2, "0") || "";
      const schoolCode =
        office?.name === "Schools" && school?.code
          ? school.code.padStart(2, "0")
          : "";

      const parts = [year, ppeCode, glCode, series, officeCode];
      if (schoolCode) parts.push(schoolCode);
      const fullNumber = parts.filter(Boolean).join("-");

      // ✅ Update item with new generated values
      setData(
        "items",
        data.items.map((i, idx) =>
          idx === index
            ? {
                ...i,
                series_number: series,
                inventory_item_number: fullNumber,
                generated_number: fullNumber,
                ppe_sub_major_account: ppe.name,
                general_ledger_account: gl.name,
                office: office?.name ?? "",
                school: school?.name ?? "",
              }
            : i
        )
      );
    } catch (err) {
      console.error("Series generation failed:", err);
      toast({
        title: "⚠️ Warning",
        description: "Failed to fetch next series number.",
        variant: "destructive",
      });
    }
  };

  // ✅ Submit logic
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    post(route("supply_officer.switch_to_ics"), {
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

  return (
    <div className="bg-blue-50 p-8 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-2">
        <FileText size={24} /> Inventory Custodian Slip (ICS)
      </h2>
      <p className="text-sm text-gray-700 mb-6">
        <strong>Note:</strong> Each item must have PPE, GL, and location before generation.
      </p>

      {/* Show errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {data.items.map((item, index) => {
          const itemDesc = ics.items[index]?.inventory_item?.item_desc ?? "N/A";

          return (
            <div key={index} className="border border-gray-300 bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">
                Item {index + 1}: {itemDesc}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT SIDE */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        setData(
                          "items",
                          data.items.map((i, idx) =>
                            idx === index ? { ...i, quantity: e.target.value } : i
                          )
                        )
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                    <input
                      type="number"
                      value={item.unit_cost}
                      onChange={(e) =>
                        setData(
                          "items",
                          data.items.map((i, idx) =>
                            idx === index ? { ...i, unit_cost: e.target.value } : i
                          )
                        )
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                    <input
                      type="number"
                      value={item.total_cost}
                      readOnly
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Requested By
                    </label>
                    <input
                      type="text"
                      value={focal}
                      readOnly
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    PPE Sub-major Account
                  </label>
                  <select
                    value={item.ppe?.id || ""}
                    onChange={(e) => {
                      const selected = ppeOptions.find((p) => p.id == e.target.value);
                      setData(
                        "items",
                        data.items.map((i, idx) =>
                          idx === index ? { ...i, ppe: selected, gl: null } : i
                        )
                      );
                    }}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select PPE</option>
                    {ppeOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `${p.code} - ${p.name}` : p.name}
                      </option>
                    ))}
                  </select>

                  <label className="block text-sm font-medium text-gray-700">
                    General Ledger Account
                  </label>
                  <select
                    value={item.gl?.id || ""}
                    onChange={(e) => {
                      const selected =
                        item.ppe?.general_ledger_accounts?.find(
                          (g) => g.id == e.target.value
                        ) ?? null;
                      setData(
                        "items",
                        data.items.map((i, idx) =>
                          idx === index ? { ...i, gl: selected } : i
                        )
                      );
                    }}
                    disabled={!item.ppe}
                    className="w-full mt-1 px-3 py-2 border rounded-md disabled:bg-gray-100"
                  >
                    <option value="">Select GL</option>
                    {item.ppe?.general_ledger_accounts?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code ? `${g.code} - ${g.name}` : g.name}
                      </option>
                    ))}
                  </select>

                  <AutoCompleteInput
                    label="Location Office"
                    apiRoute="/api/office-search"
                    value={item.office?.code || ""}
                    onChange={(office) =>
                      setData(
                        "items",
                        data.items.map((i, idx) => (idx === index ? { ...i, office } : i))
                      )
                    }
                    placeholder="Type Location Office..."
                  />

                  {item.office?.name === "Schools" && (
                    <AutoCompleteInput
                      label="School"
                      apiRoute="/api/school-search"
                      value={item.school?.name || ""}
                      onChange={(school) =>
                        setData(
                          "items",
                          data.items.map((i, idx) => (idx === index ? { ...i, school } : i))
                        )
                      }
                      placeholder="Type School..."
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => updateInventoryNumber(index)}
                    disabled={!!item.inventory_item_number}
                    className={`px-3 py-2 text-sm rounded-md ${
                      item.inventory_item_number
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {item.inventory_item_number ? "Already Generated" : "Generate Inventory No."}
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Inventory Item No.
                    </label>
                    <input
                      type="text"
                      value={item.generated_number || item.inventory_item_number || ""}
                      readOnly
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
          >
            <SendHorizonal size={16} className="mr-2" />
            {processing ? "Submitting..." : "Submit ICS"}
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
