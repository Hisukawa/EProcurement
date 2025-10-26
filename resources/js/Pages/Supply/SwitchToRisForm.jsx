import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useState } from "react";
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

export default function SwitchToRisForm({ ris, user, type }) {
  const { data, setData, errors, processing, post } = useForm({
    id: ris?.id ?? "",
    type: type || "ris",
    ris_number: ris?.po?.po_number ?? "",
    remarks: ris?.remarks ?? "",
    po_id: ris?.po?.id ?? "",
    requested_by: ris?.requested_by?.id ?? user.id,
    issued_by: user.id,
    items:
      ris?.items?.map((item) => ({
        inventory_item_id: item.inventory_item?.id ?? null,
        quantity: item.quantity ?? 0,
        unit_cost: item.unit_cost ?? 0,
        total_cost: item.total_cost ?? 0,
      })) ?? [],
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.switch_to_ris"), {
      preserveScroll: true,
      data,
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

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...data.items];
    updatedItems[index].quantity = value;
    setData("items", updatedItems);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-2">
        <FileText size={24} /> Requisition and Issue Slip (RIS)
      </h2>

      {/* Display errors */}
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
        <strong>Note:</strong> This form allows you to record a RIS issuance for one or multiple selected items.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* RIS Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 border rounded-md bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Requisition</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  value={ris?.requested_by?.division?.division ?? "N/A"}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RIS No.</label>
                <input
                  type="text"
                  value={data.ris_number}
                  onChange={(e) => setData("ris_number", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-5 border rounded-md bg-green-50">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Issuance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested By</label>
                <input
                  type="text"
                  value={`${ris?.requested_by?.firstname} ${ris?.requested_by?.lastname}`}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  value={data.remarks}
                  onChange={(e) => setData("remarks", e.target.value)}
                  rows="3"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Selected Items ({data.items.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">#</th>
                  <th className="border px-3 py-2 text-left">Item Description</th>
                  <th className="border px-3 py-2 text-left">Quantity</th>
                  <th className="border px-3 py-2 text-left">Unit Cost</th>
                  <th className="border px-3 py-2 text-left">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">
                      {ris?.items[index]?.inventory_item?.item_desc ?? "N/A"}
                    </td>
                    <td className="border px-3 py-2">{item.quantity}</td>
                    <td className="border px-3 py-2 text-right">{item.unit_cost}</td>
                    <td className="border px-3 py-2 text-right">{item.total_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition"
            disabled={processing}
          >
            <SendHorizonal size={16} className="mr-2" />
            {processing ? "Saving..." : "Confirm"}
          </button>
        </div>
      </form>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Issuance</DialogTitle>
            <DialogDescription>
              Are you sure you want to switch the selected items to RIS issuance?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Yes, Record RIS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
