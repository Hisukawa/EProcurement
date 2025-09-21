import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ParForm({ purchaseOrder, inventoryItem, user }) {
  const { toast } = useToast();
  const detail = purchaseOrder.detail;
  const pr = detail?.pr_detail?.purchase_request;
  const product = detail?.pr_detail?.product;

  // Recipient = focal person from PR
  const focal = pr
    ? `${pr.focal_person.firstname} ${pr.focal_person.middlename} ${pr.focal_person.lastname}`
    : "N/A";

  const { data, setData, post, processing, errors, reset } = useForm({
    po_id: detail.po_id,
    par_number: purchaseOrder.po_number,
    received_by: pr?.focal_person?.id ?? "",
    issued_by: user.id,
    remarks: "",
    date_acquired: new Date().toISOString().split("T")[0],
    items: [
      {
        inventory_item_id: inventoryItem.id,
        quantity: detail?.quantity ?? 0,
        unit_cost: inventoryItem.unit_cost ?? 0,
        total_cost: (detail?.quantity ?? 0) * (inventoryItem.unit_cost ?? 0),
        property_no: "",
      },
    ],
  });

  const item = product ? `${product.name} (${product.specs})` : "N/A";

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.store_par"), {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: "Success", description: "PAR has been saved successfully!" });
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

  // Helpers to update items[0] fields
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
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Property Acknowledgement Receipt">
      <Head title="PAR Form" />

      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 bg-white text-blue-800 border border-blue-300 text-sm font-semibold rounded-md hover:bg-blue-100 hover:border-blue-400 mr-4 mb-4 shadow-sm transition"
      >
        ← Back
      </button>

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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="po_id" value={data.po_id} />

          {/* Left Section: Item Info */}
          <div className="p-5 border rounded-md bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Item Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">PAR No.</label>
                <input
                  type="text"
                  value={data.par_number}
                  onChange={(e) => setData("par_number", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Item</label>
                <input
                  value={item}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={data.items[0].quantity}
                    onChange={(e) => updateItemField("quantity", Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                  <input
                    type="number"
                    value={data.items[0].unit_cost}
                    onChange={(e) => updateItemField("unit_cost", Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                <input
                  type="text"
                  value={data.items[0].total_cost.toFixed(2)}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Right Section: Acknowledgement Info */}
          <div className="p-5 border rounded-md bg-green-50">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Acknowledgement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Received By</label>
                <input
                  type="text"
                  value={focal}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issued By</label>
                <input
                  type="text"
                  value={`${user.firstname} ${user.middlename} ${user.lastname}`}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Property No.</label>
                <input
                  type="text"
                  value={data.items[0].property_no}
                  onChange={(e) => updateItemField("property_no", e.target.value)}
                  placeholder="Enter property number"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Acquired</label>
                <input
                  type="date"
                  value={data.date_acquired}
                  onChange={(e) => setData("date_acquired", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  value={data.remarks}
                  onChange={(e) => setData("remarks", e.target.value)}
                  rows="3"
                  placeholder="Enter remarks (optional)"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full flex justify-end mt-4">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition disabled:opacity-50"
            >
              <SendHorizonal size={16} className="mr-2" />
              Save PAR
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Save</DialogTitle>
            <DialogDescription>
              Are you sure you want to save this Property Acknowledgement Receipt (PAR)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={processing}>
              Confirm Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
