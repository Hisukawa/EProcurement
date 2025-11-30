import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AutoCompleteInput from "./AutoCompleteInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ICSForm({ purchaseOrder, inventoryItems = [], user, ppeOptions = [], icsNumber }) {
  const pr = purchaseOrder?.detail?.pr_detail?.purchase_request ?? null;
  const focal = pr
    ? `${pr?.focal_person?.firstname ?? ""} ${pr?.focal_person?.middlename ?? ""} ${pr?.focal_person?.lastname ?? ""}`.trim()
    : "N/A";

  const { data, setData, post, processing, errors } = useForm({
    po_id: purchaseOrder?.id ?? null,
    ics_number: icsNumber ?? "",
    requested_by: pr?.focal_person?.id ?? null,
    received_from: user?.id ?? null,
    remarks: "",
    items: inventoryItems.map(item => ({
      inventory_item_id: item.id,
      recipient: "",
      recipient_division: "",
      estimated_useful_life: null,
      inventory_item_number: "",
      ppe_sub_major_account: "",
      general_ledger_account: "",
      office: "",
      school: "",
      quantity: item.total_stock > 0 ? 1 : 0,
      unit_cost: item.unit_cost ?? 0,
      total_cost: item.unit_cost ?? 0,
      series_number: "0001",
      description: item.item_desc ?? item.product?.item_description ?? "N/A",
      ppe: null,
      gl: null,
      officeObj: null,
      schoolObj: null
    })),
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const [defaultRecipient, setDefaultRecipient] = useState("");
  const [defaultDivision, setDefaultDivision] = useState("");

  // Set ICS number if passed
  useEffect(() => {
    if (icsNumber && !data.ics_number) setData("ics_number", icsNumber);
  }, [icsNumber]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...data.items];
    if (field === "quantity") {
      let qty = parseFloat(value) || 0;
      updatedItems[index].quantity = qty;
      updatedItems[index].total_cost = qty * (updatedItems[index].unit_cost ?? 0);
    } else {
      updatedItems[index][field] = value;
    }
    setData("items", updatedItems);
  };

  const handleRemoveItem = index => {
    setData("items", data.items.filter((_, i) => i !== index));
  };

  // --- Generate inventory number for a single item ---
  const generateNumberForItem = async () => {
  // Filter items that have PPE and GL selected and quantity > 0
  const itemsToGenerate = data.items.filter(item => item.ppe && item.gl && item.quantity > 0);

  if (!itemsToGenerate.length) return;

  try {
    // Fetch last series number for the PPE + GL combination of the first item (or fetch per unique PPE+GL)
    const firstItem = itemsToGenerate[0];
    const res = await fetch(
      `/api/ics-next-series?ppe=${encodeURIComponent(firstItem.ppe.name.trim())}&gl=${encodeURIComponent(firstItem.gl.name.trim())}`
    );
    const api = await res.json();
    let nextSeries = parseInt(api.series || "0", 10); // start from last series + 1

    const updatedItems = [...data.items];

    itemsToGenerate.forEach(item => {
      const seriesCode = nextSeries.toString().padStart(4, "0");
      const year = new Date().getFullYear().toString();
      const ppeCode = item.ppe.code?.padStart(2, "0") || "00";
      const glCode = item.gl.code?.padStart(2, "0") || "00";
      const locationCode = item.officeObj?.code?.padStart(2, "0") || "";
      const schoolCode = item.officeObj?.name === "Schools" && item.schoolObj?.code ? item.schoolObj.code.padStart(2, "0") : "";

      const inventoryNumber = [year, ppeCode, glCode, seriesCode, locationCode]
        .filter(Boolean)
        .concat(schoolCode ? [schoolCode] : [])
        .join("-");

      // Update item in the data
      const index = updatedItems.findIndex(i => i === item);
      updatedItems[index] = {
        ...item,
        inventory_item_number: inventoryNumber,
        series_number: seriesCode,
        ppe_sub_major_account: item.ppe.name,
        general_ledger_account: item.gl.name,
        office: item.officeObj?.name || "",
        school: item.schoolObj?.name || ""
      };

      nextSeries++; // increment for the next item
    });

    setData("items", updatedItems);
  } catch (err) {
    console.error("Error generating inventory numbers", err);
  }
};

  const handleItemPPEChange = (index, selectedPPE) => {
    const updatedItems = [...data.items];
    updatedItems[index].ppe = selectedPPE;
    updatedItems[index].gl = null;
    updatedItems[index].ppe_sub_major_account = selectedPPE?.name || "";
    updatedItems[index].general_ledger_account = "";
    setData("items", updatedItems);
  };

  const handleItemGLChange = (index, selectedGL) => {
    const updatedItems = [...data.items];
    updatedItems[index].gl = selectedGL;
    updatedItems[index].general_ledger_account = selectedGL?.name || "";
    setData("items", updatedItems);
    generateNumberForItem(index, updatedItems[index]);
  };

  const handleItemOfficeChange = (index, selectedOffice) => {
    const updatedItems = [...data.items];
    updatedItems[index].officeObj = selectedOffice;
    updatedItems[index].office = selectedOffice?.name || "";
    setData("items", updatedItems);
    generateNumberForItem(index, updatedItems[index]);
  };

  const handleItemSchoolChange = (index, selectedSchool) => {
    const updatedItems = [...data.items];
    updatedItems[index].schoolObj = selectedSchool;
    updatedItems[index].school = selectedSchool?.name || "";
    setData("items", updatedItems);
    generateNumberForItem(index, updatedItems[index]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.store_ics"), {
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDialogOpen(false);
        toast({ title: "ICS Recorded", description: "Inventory Custodian Slip successfully saved!", className: "bg-green-600 text-white", duration: 3000 });
      },
      onError: () => {
        toast({ title: "Save Failed", description: "Please review inputs and try again.", variant: "destructive", duration: 4000 });
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <FileText size={24} /> Inventory Custodian Slip (ICS)
      </h2>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ICS Info */}
        <div className="p-5 border rounded-md bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">ICS Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input value={pr?.division?.division ?? "N/A"} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ICS No.</label>
              <input type="text" value={data.ics_number} onChange={e => setData("ics_number", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Requested By</label>
              <input value={focal} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>
          </div>
        </div>

        {/* Items */}
        {data.items.map((item, index) => (
          <div key={index} className="p-5 border rounded-md bg-green-50 relative">
            {data.items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-600 hover:text-red-800">
                <Minus size={20} />
              </button>
            )}
            <h3 className="text-lg font-semibold text-green-700 mb-4">Item {index + 1}</h3>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input value={item.description} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>

            {/* PPE / GL / Office / School / Inventory Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">PPE Sub-major Account</label>
                <select value={item.ppe?.id || ""} onChange={e => handleItemPPEChange(index, ppeOptions.find(p => p.id == e.target.value))} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm">
                  <option value="">Select PPE</option>
                  {ppeOptions.map(p => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ${p.name}` : p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">General Ledger Account</label>
                <select value={item.gl?.id || ""} onChange={e => handleItemGLChange(index, item.ppe?.general_ledger_accounts.find(g => g.id == e.target.value))} disabled={!item.ppe} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm disabled:bg-gray-100">
                  <option value="">Select GL</option>
                  {item.ppe?.general_ledger_accounts?.map(g => <option key={g.id} value={g.id}>{g.code ? `${g.code} - ${g.name}` : g.name}</option>)}
                </select>
              </div>
              <AutoCompleteInput label="Location Office" apiRoute="/api/office-search" value={item.officeObj?.code || ""} onChange={val => handleItemOfficeChange(index, val)} placeholder="Type Location Office..." />
              {item.officeObj?.name === "Schools" && <AutoCompleteInput label="School" apiRoute="/api/school-search" value={item.schoolObj?.name || ""} onChange={val => handleItemSchoolChange(index, val)} placeholder="Type School..." />}
              <div>
                <label className="block text-sm font-medium text-gray-700">Inventory Item No.</label>
                <input value={item.inventory_item_number || ""} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-gray-100" />
              </div>
            </div>

            {/* Quantity / Cost / Estimated Life */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" min="1" max={item.total_stock} value={item.quantity} onChange={e => handleItemChange(index, "quantity", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                <input type="number" value={item.unit_cost} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                <input type="number" value={item.total_cost} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-gray-50" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Estimated Useful Life (years)</label>
              <input type="number" value={item.estimated_useful_life ?? ""} onChange={e => handleItemChange(index, "estimated_useful_life", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm" onWheel={e => e.currentTarget.blur()} />
            </div>
          </div>
        ))}

        {/* Default Recipient */}
        <div className="p-5 border rounded-md bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-700 mb-4">Default Recipient (applied to all items)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
              <input type="text" value={defaultRecipient} onChange={e => { setDefaultRecipient(e.target.value); setData("items", data.items.map(i => ({ ...i, recipient: e.target.value }))); }} placeholder="Leave blank to issue to requester" className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Division</label>
              <input type="text" value={defaultDivision} onChange={e => { setDefaultDivision(e.target.value); setData("items", data.items.map(i => ({ ...i, recipient_division: e.target.value }))); }} placeholder="Optional" className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea value={data.remarks} onChange={e => setData("remarks", e.target.value)} rows="4" className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm" placeholder="Optional" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800" disabled={processing}>
            <SendHorizonal size={16} className="mr-2" /> {processing ? "Saving..." : "Submit Issuance"}
          </button>
        </div>
      </form>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Issuance</DialogTitle>
            <DialogDescription>Are you sure you want to record this ICS issuance?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSave}>Yes, Record ICS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
