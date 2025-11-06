import { useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
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

export default function RISForm({ purchaseOrder, inventoryItem, user, risNumber }) {
  const detail = purchaseOrder?.detail ?? null;
  const pr = detail?.pr_detail?.purchase_request ?? null;
  const product = detail?.pr_detail?.product ?? null;

  // ✅ Graceful fallbacks
  const focal = pr
    ? `${pr?.focal_person?.firstname ?? ""} ${pr?.focal_person?.middlename ?? ""} ${pr?.focal_person?.lastname ?? ""}`.trim()
    : "N/A";

  const item = inventoryItem?.item_desc ?? product?.item_description ?? "N/A";
  const isInStock = inventoryItem?.total_stock > 0;

  // ✅ Safe defaults in form initialization
  const { data, setData, post, processing, errors } = useForm({
    po_id: purchaseOrder?.id ?? null,
    ris_number: risNumber ?? "",
    requested_by: pr?.focal_person?.id ?? null,
    issued_by: user?.id ?? null,
    remarks: "",
    items: [
      {
        recipient: "",
        recipient_division: "",
        inventory_item_id: inventoryItem?.id ?? null,
        quantity: detail?.pr_detail?.quantity ?? 1,
        unit_cost: inventoryItem?.unit_cost ?? 0,
        total_cost:
          (inventoryItem?.unit_cost ?? 0) *
          (inventoryItem?.total_stock ?? 1),
      },
    ],
  });

  // ✅ Auto-update ris_number when changed from backend
  useEffect(() => {
    if (risNumber && !data.ris_number) {
      setData("ris_number", risNumber);
    }
  }, [risNumber]);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleQuantityChange = (e) => {
    let qty = parseFloat(e.target.value) || 0;
    const maxQty = inventoryItem?.total_stock ?? 0;
    if (qty > maxQty) qty = maxQty;

    const unit = data.items[0].unit_cost ?? 0;
    setData("items", [{ ...data.items[0], quantity: qty, total_cost: qty * unit }]);
  };

  const handleRecipientChange = (field, value) => {
    setData("items", [{ ...data.items[0], [field]: value }]);
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-2">
        <FileText size={24} /> Requisition and Issue Slip (RIS)
      </h2>

      {/* Validation Errors */}
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
        <strong>Note:</strong> Fill out the details below to record a new RIS
        issuance.
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Left Section: Requisition */}
        <div className="p-5 border rounded-md bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Requisition
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Designation
              </label>
              <input
                value={pr?.division?.division ?? "N/A"}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                RIS No.
              </label>
              <input
                type="text"
                value={data.ris_number}
                onChange={(e) => setData("ris_number", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated ({risNumber}) — you may edit if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                value={item}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity Requested
                </label>
                <input
                  value={detail?.pr_detail?.quantity ?? "N/A"}
                  readOnly
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stock Available?
                </label>
                <input
                  value={isInStock ? "Yes" : "No"}
                  readOnly
                  className={`w-full mt-1 px-3 py-2 border rounded-md shadow-sm ${
                    isInStock
                      ? "border-green-400 bg-green-50"
                      : "border-red-400 bg-red-50"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Issuance */}
        <div className="p-5 border rounded-md bg-green-50">
          <h3 className="text-lg font-semibold text-green-700 mb-4">
            Issuance
          </h3>
          <div className="space-y-4">
            {/* ✅ Recipient Info */}
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
              <label className="block text-sm font-medium text-gray-700">
                Quantity to Issue
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Unit Cost
              </label>
              <input
                type="number"
                value={data.items[0].unit_cost}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Cost
              </label>
              <input
                type="number"
                value={data.items[0].total_cost}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
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
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                value={data.remarks}
                onChange={(e) => setData("remarks", e.target.value)}
                rows="4"
                placeholder="Enter remarks (optional)"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="col-span-full flex justify-end mt-4">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition"
            disabled={processing}
          >
            <SendHorizonal size={16} className="mr-2" />
            {processing ? "Saving..." : "Submit Issuance"}
          </button>
        </div>
      </form>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Issuance</DialogTitle>
            <DialogDescription>
              Are you sure you want to record this RIS issuance?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Yes, Record RIS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
