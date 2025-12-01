import { Head, useForm } from "@inertiajs/react";
import { FileText, SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
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

export default function ReturnForm({
  record,
  user,
  type,
  rrsp_number,
  selected_items,
}) {
  const filteredItems = useMemo(() => {
    if (!Array.isArray(selected_items) || selected_items.length === 0) {
      return record?.items ?? [];
    }
    return (
      record?.items?.filter((item) =>
        selected_items.includes(item.id?.toString())
      ) ?? []
    );
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
      const reissuedQty = Array.isArray(item.reissued_item)
        ? item.reissued_item.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0)
        : Number(item.reissued_item?.quantity ?? 0);

      const disposedQty = Array.isArray(item.disposed_item)
        ? item.disposed_item.reduce((sum, d) => sum + Number(d.quantity ?? 0), 0)
        : Number(item.disposed_item?.quantity ?? 0);

      const remainingQty = Math.max(totalQty - (reissuedQty + disposedQty), 0);

      return {
        inventory_item_id: item.inventory_item_id,
        quantity: remainingQty,
        max_quantity: remainingQty,
        remarks: "",
        returned_by: item.recipient ?? "",
        item_desc:
          item.inventory_item?.item_desc ??
          item.inventoryItem?.product?.name ??
          "N/A",
        unit:
          item.inventory_item?.unit?.unit_name ??
          item.inventoryItem?.product?.unit?.unit_name ??
          "",
      };
    }),
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...data.items];
    if (field === "quantity") {
      const max = updatedItems[index].max_quantity;
      let qty = parseFloat(value);
      if (isNaN(qty) || qty < 0) qty = 0;
      if (qty > max) qty = max;
      updatedItems[index][field] = qty;
    } else {
      updatedItems[index][field] = value;
    }
    setData("items", updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = () => {
    post(route("supply_officer.submit_return"), {
      ...data,
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDialogOpen(false);
        toast({
          title: "Return Recorded",
          description: "Items successfully reissued!",
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
    <SupplyOfficerLayout header="Schools Division Office - Ilagan | Reissuance Form">
      <Head title="Return Form" />

      {/* Centered container */}
      <div className="flex items-center justify-center py-10 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-7xl border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-6">
            <FileText className="text-blue-700" size={30} />
            <h2 className="text-3xl font-bold text-blue-800">
              Reissuance/Reissuance Form
            </h2>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              <ul className="list-disc list-inside">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    ICS / PAR / RIS No.
                  </label>
                  <input
                    type="text"
                    value={data.ics_number}
                    onChange={(e) => setData("ics_number", e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-2">
                Reissued Items
              </h3>
              <div className="overflow-x-auto border rounded-md shadow-sm">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-blue-100 text-gray-700">
                    <tr>
                      <th className="p-2 border">Item Description</th>
                      <th className="p-2 border w-24 text-center">Qty</th>
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
                            min="0"
                            step="0.01"
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            className="w-20 text-center border-gray-300 rounded-md p-1"
                          />
                          <div className="text-xs text-gray-500">
                            Max: {item.max_quantity}
                          </div>
                        </td>
                        <td className="p-2 border">
                          <textarea
                            value={item.remarks}
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
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-md transition"
                disabled={processing}
              >
                <SendHorizonal size={16} />
                {processing ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to record this Return?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Yes, Record Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
