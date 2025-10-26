import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AutoCompleteInput from "./AutoCompleteInput";

export default function ParForm({ purchaseOrder, inventoryItem, user, ppeOptions }) {
  const { toast } = useToast();
  const detail = purchaseOrder.detail;
  const pr = detail?.pr_detail?.purchase_request;
  const product = detail?.pr_detail?.product;
  const [ppe, setPpe] = useState(null);
  const [gl, setGl] = useState(null);
  const [office, setOffice] = useState(null);
  const [school, setSchool] = useState(null);
  const [series, setSeries] = useState("0001");
  const [generatedNumber, setGeneratedNumber] = useState("");
const item = product ? `${product.name} (${product.specs})` : "N/A";
  const focal = pr
    ? `${pr.focal_person.firstname} ${pr.focal_person.middlename} ${pr.focal_person.lastname}`
    : "N/A";
  const glOptions = ppe?.general_ledger_accounts ?? [];

  const { data, setData, post, processing, errors, reset } = useForm({
    po_id: detail?.po_id ?? null,
    par_number: purchaseOrder.po_number ?? "",
    requested_by: pr?.focal_person?.id ?? "",
    issued_by: user?.id ?? null,
    remarks: "",
    date_acquired: new Date().toISOString().split("T")[0],
    items: [
      {
        inventory_item_id: inventoryItem?.id ?? null,
        inventory_item_number: "",
        ppe_sub_major_account: "",
        general_ledger_account: "",
        office: "",
        quantity: detail?.quantity ?? 0,
        unit_cost: inventoryItem?.unit_cost ?? 0,
        total_cost: (detail?.quantity ?? 0) * (inventoryItem?.unit_cost ?? 0),
        property_no: "",
      },
    ],
  });
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
    const seriesCode = series?.toString().padStart(4, "0")
  
  
  
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.store_par"), {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: "Success", description: "PAR has been saved successfully!", className: "bg-green-600 text-white", duration: 3000 });
        setConfirmOpen(false);
        reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save PAR. Please check the form.",
        });
        setConfirmOpen(false);
      },
    });
  };

  const updateItemField = (field, value) => {
    setData("items", [
      {
        ...data.items[0],
        [field]: value,
        total_cost:
          field === "quantity"
            ? value * data.items[0].unit_cost
            : field === "unit_cost"
            ? data.items[0].quantity * value
            : data.items[0].total_cost,
      },
    ]);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-2">
        <FileText size={24} /> Property Acknowledgement Receipt (PAR)
      </h2>

      {Object.keys(errors).length > 0 && (
        <div className="col-span-2 bg-red-100 text-red-700 p-4 rounded mb-4">
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm text-gray-700 mb-6">
        <strong>Note:</strong> This is the Property Acknowledgement Receipt (PAR) form page. 
        Fill out the details below to record an PAR issuance.
      </p>


      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section */}
        <div className="p-5 border rounded-md bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Item Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">PAR No.</label>
              <input type="text" value={data.par_number} onChange={(e) => setData("par_number", e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Item</label>
              <input value={item} readOnly className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" value={data.items[0].quantity} onChange={(e) => updateItemField("quantity", Number(e.target.value))} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                <input type="number" value={data.items[0].unit_cost} onChange={(e) => updateItemField("unit_cost", Number(e.target.value))} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Cost</label>
              <input type="text" value={data.items[0].total_cost.toFixed(2)} readOnly className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Received By</label>
              <input type="text" value={focal} readOnly className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Issued By</label>
              <input type="text" value={`${user.firstname} ${user.middlename} ${user.lastname}`} readOnly className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property No.</label>
              <input type="text" value={generatedNumber} onChange={(e) => updateItemField("property_no", e.target.value)} placeholder="Enter property number" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Acquired</label>
              <input type="date" value={data.date_acquired} onChange={(e) => setData("date_acquired", e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-5 border rounded-md bg-green-50">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Acknowledgement</h3>
            <div className="space-y-4">
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
          </div>

        <div className="col-span-full flex justify-end mt-4">
          <button type="submit" disabled={processing} className="inline-flex items-center px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition disabled:opacity-50">
            <SendHorizonal size={16} className="mr-2" />
            Save PAR
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Save</DialogTitle>
            <DialogDescription>Are you sure you want to save this Property Acknowledgement Receipt (PAR)?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSave} disabled={processing}>Confirm Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
