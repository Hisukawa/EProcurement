import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RISForm({ purchaseOrder, inventoryItems = [], user, risNumber }) {
  const pr = purchaseOrder?.detail?.pr_detail?.purchase_request ?? null;

  const focal = pr
    ? `${pr?.focal_person?.firstname ?? ""} ${pr?.focal_person?.middlename ?? ""} ${pr?.focal_person?.lastname ?? ""}`.trim()
    : "N/A";

  const { data, setData, post, processing, errors } = useForm({
    po_id: purchaseOrder?.id ?? null,
    ris_number: risNumber ?? "",
    requested_by: pr?.focal_person?.id ?? null,
    issued_by: user?.id ?? null,
    remarks: "",
    items: inventoryItems.map((item) => ({
      inventory_item_id: item.id,
      recipient: "",
      recipient_division: "",
      quantity: item.total_stock > 0 ? 1 : 0,
      unit_cost: item.unit_cost ?? 0,
      total_cost: item.unit_cost ?? 0,
      total_stock: item.total_stock ?? 0,
      description: item.item_desc ?? item.product?.item_description ?? "N/A",
    })),
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (risNumber && !data.ris_number) setData("ris_number", risNumber);
  }, [risNumber]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...data.items];
    if (field === "quantity") {
      let qty = parseFloat(value) || 0;
      if (qty > updatedItems[index].total_stock) qty = updatedItems[index].total_stock;
      updatedItems[index].quantity = qty;
      updatedItems[index].total_cost = qty * (updatedItems[index].unit_cost ?? 0);
    } else {
      updatedItems[index][field] = value;
    }
    setData("items", updatedItems);
  };

  const handleAddItem = () => {
    setData("items", [
      ...data.items,
      {
        inventory_item_id: null,
        recipient: "",
        recipient_division: "",
        quantity: 1,
        unit_cost: 0,
        total_cost: 0,
        total_stock: 0,
        description: "New Item",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = data.items.filter((_, i) => i !== index);
    setData("items", updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.store_ris"), {
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDialogOpen(false);
        toast({
          title: "RIS Recorded",
          description: "Requisition and Issue Slip successfully saved!",
          duration: 3000,
          className: "bg-green-600 text-white",
        });
      },
      onError: () => {
        toast({
          title: "Save Failed",
          description: "Please review inputs and try again.",
          variant: "destructive",
          duration: 4000,
        });
      },
    });
  };

  const [defaultRecipient, setDefaultRecipient] = useState("");
  const [defaultDivision, setDefaultDivision] = useState("");

  const handleRecipientChange = (e) => {
    setDefaultRecipient(e.target.value);
    setData("items", data.items.map((item) => ({
      ...item,
      recipient: e.target.value,
    })));
  };

  const handleDivisionChange = (e) => {
    setDefaultDivision(e.target.value);
    setData("items", data.items.map((item) => ({
      ...item,
      recipient_division: e.target.value,
    })));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <FileText size={24} /> Requisition and Issue Slip (RIS)
      </h2>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 border rounded-md bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Requisition Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input value={pr?.division?.division ?? "N/A"} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">RIS No.</label>
              <input
                type="text"
                value={data.ris_number}
                onChange={(e) => setData("ris_number", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Requested By</label>
              <input value={focal} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
            </div>
          </div>
        </div>



        {/* Multiple Items */}
        {data.items.map((item, index) => (
          <div key={index} className="p-5 border rounded-md bg-green-50 relative">
            {data.items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Minus size={20} />
              </button>
            )}
            <h3 className="text-lg font-semibold text-green-700 mb-4">Item {index + 1}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input value={item.description} readOnly className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm bg-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={item.total_stock}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                  />
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
            </div>
          </div>
        ))}
                {/* Default Recipient and Division (Only once at the bottom) */}
        <div className="p-5 border rounded-md bg-yellow-50 mb-4">
          <h3 className="text-lg font-semibold text-yellow-700 mb-4">Default Recipient (applied to all items)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
              <input
                type="text"
                value={defaultRecipient}
                onChange={handleRecipientChange}
                placeholder="Leave blank to issue to requester"
                className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Division</label>
              <input
                type="text"
                value={defaultDivision}
                onChange={handleDivisionChange}
                placeholder="Optional"
                className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            value={data.remarks}
            onChange={(e) => setData("remarks", e.target.value)}
            rows="4"
            className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
            placeholder="Optional"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
            disabled={processing}
          >
            <SendHorizonal size={16} className="mr-2" /> {processing ? "Saving..." : "Submit Issuance"}
          </button>
        </div>
      </form>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Issuance</DialogTitle>
            <DialogDescription>Are you sure you want to record this RIS issuance?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSave}>Yes, Record RIS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

