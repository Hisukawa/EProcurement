import { Head, useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useState, useMemo } from "react";
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
import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";

export default function DisposalForm({ record, user, type, rrsp_number, selected_items = [] }) {
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // ✅ Filter only selected items from the record
  const filteredItems = useMemo(() => {
    if (!Array.isArray(selected_items) || selected_items.length === 0) {
      return record?.items ?? [];
    }
    return record?.items?.filter((item) =>
      selected_items.includes(item.id?.toString())
    ) ?? [];
  }, [record, selected_items]);

// Compute the top-level Returned By input, deduplicated
const returnedBy = Array.from(
  new Set(
    filteredItems.map((item) => {
      if (item.recipient) return item.recipient;
      const reqBy = record?.requested_by || record?.received_from;
      if (!reqBy) return "";
      return `${reqBy.firstname ?? ""} ${reqBy.middlename ?? ""} ${reqBy.lastname ?? ""}`.trim();
    }).filter(Boolean)
  )
).join(", ");


const { data, setData, errors, processing, post } = useForm({
  rrsp_number: rrsp_number ?? "",
  ics_number: record?.po?.po_number ?? "",
  items: filteredItems.map((item) => {
    const totalQty = Number(item.quantity ?? 0);
    const reissuedQty = Number(item.reissued_item?.quantity ?? 0);
    const disposedQty = Number(item.disposed_item?.quantity ?? 0);
    const remainingQty = Math.max(totalQty - (reissuedQty + disposedQty), 0);

    return {
      inventory_item_id: item.inventory_item_id,
      returned_by: item.recipient ?? "", // ✅ use recipient from record
      recipient: "", // optional, can leave empty
      quantity: remainingQty,
      max_quantity: remainingQty,
      remarks: "",
      item_desc: item.inventory_item?.item_desc ?? item.inventoryItem?.product?.name ?? "N/A",
      unit: item.inventory_item?.unit?.unit_name ?? item.inventoryItem?.product?.unit?.unit_name ?? "",
    };
  }),
});

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialogOpen(true);
  };

const handleConfirmSave = () => {
  const payload = {
    ics_number: data.ics_number || null,
    date_disposed: new Date().toISOString().split('T')[0], // today's date
    items: data.items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      returned_by: item.returned_by,
      quantity: item.quantity,
      remarks: item.remarks || "",
    })),
  };

  post(route("supply_officer.submit_disposal"), payload, {
    preserveScroll: true,
    onSuccess: () => {
      setConfirmDialogOpen(false);
      toast({
        title: "Disposal Recorded",
        description: "Disposal record successfully saved!",
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


  const handleItemChange = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData("items", newItems);
  };

  return (
    <SupplyOfficerLayout
      header="Schools Division Office - Ilagan | Disposal Form">
        <Head title="Disposal Form" />
      <div className="flex items-center justify-center py-10 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-7xl border border-gray-200">
        <h2 className="text-3xl font-bold text-red-700 mb-4 flex items-center gap-2">
          <FileText size={24} /> Disposal Form
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

        <p className="text-sm text-gray-700 mb-6">
          <strong>Note:</strong> This form records items returned for disposal.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="p-5 border rounded-md bg-red-50 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Returned By / End-User
              </label>
              <input
                type="text"
                value={returnedBy}
                readOnly
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  RRSP No.
                </label>
                <input
                  type="text"
                  value={data.rrsp_number}
                  onChange={(e) => setData("rrsp_number", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ICS No.
                </label>
                <input
                  type="text"
                  value={data.ics_number}
                  onChange={(e) => setData("ics_number", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-2">
                Returned Items
              </h3>

              {data.items.length === 0 ? (
                <p className="text-gray-600 text-sm p-2 italic">
                  No items selected for disposal.
                </p>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="p-2 border">Item Description</th>
                        <th className="p-2 border">Quantity</th>
                        <th className="p-2 border">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={index} className="odd:bg-white even:bg-gray-50">
                          <td className="p-2 border">{item.item_desc}</td>
                          <td className="p-2 border text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", e.target.value)
                              }
                              className="w-20 text-center border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="p-2 border">
                            <textarea
                              value={item.remarks || ""}
                              onChange={(e) =>
                                handleItemChange(index, "remarks", e.target.value)
                              }
                              className="w-full border-gray-300 rounded-md text-sm p-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 bg-red-700 text-white text-sm font-medium rounded-md hover:bg-red-800 transition"
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
              <DialogTitle>Confirm Disposal</DialogTitle>
              <DialogDescription>
                Are you sure you want to record this disposal entry?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="secondary"
                onClick={() => setConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSave}>Yes, Record Disposal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </SupplyOfficerLayout>
  );
}
