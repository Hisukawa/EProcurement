import { Head, useForm } from "@inertiajs/react";
import React, { useEffect, useState, useMemo } from "react";
import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CreatePurchaseOrder({ pr, rfq, suppliers, winners, supplierQuotedPrices }) {
  const winningSupplierIds = useMemo(
    () => [...new Set(winners.map((w) => w.supplier_id))],
    [winners]
  );
  const winningSuppliers = useMemo(
    () => suppliers.filter((s) => winningSupplierIds.includes(s.id)),
    [suppliers, winningSupplierIds]
  );

  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [reason, setReason] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

const getItemsForSupplier = (supplierId) => {
  return winners
    .filter((w) => w.supplier_id === supplierId)
    .map((w) => ({
      pr_detail_id: w.pr_detail_id,
      item: w.item,
      specs: w.specs,
      unit: w.unit,
      quantity: w.quantity,
      unit_price: parseFloat(w.quoted_price || 0),
      total_price: parseFloat(w.quoted_price || 0) * parseFloat(w.quantity || 0),
      priceSource: "Quoted Price",
    }));
};



  const { data, setData, post, processing } = useForm({
    rfq_id: rfq.id,
    items: [],
  });

useEffect(() => {
  const allItems = winningSuppliers.flatMap((supplier) =>
    getItemsForSupplier(supplier.id).map((item) => ({
      ...item,
      supplier_id: supplier.id, // ✅ keep grouping
    }))
  );

  setData("items", allItems);
}, [winningSuppliers]);


  const handleChange = (index, field, value) => {
    if (field === "quantity") {
      const numericValue = Number(value) >= 0 ? Number(value) : 0;
      const originalQty = pr.details.find(
        (d) => d.id === data.items[index].pr_detail_id
      )?.quantity;

      if (numericValue !== originalQty) {
        setPendingChange({ index, field, value: numericValue });
        setIsReasonDialogOpen(true);
        return;
      }
    }

    const updatedItems = [...data.items];
    const numericValue = Number(value) >= 0 ? Number(value) : 0;
    updatedItems[index][field] = numericValue;
    updatedItems[index].total_price =
      Number(updatedItems[index].quantity) * Number(updatedItems[index].unit_price);
    setData("items", updatedItems);
  };

  const handleConfirmReason = () => {
    if (!pendingChange) return;

    const { index, field, value } = pendingChange;
    const updatedItems = [...data.items];
    updatedItems[index][field] = value;
    updatedItems[index].total_price =
      Number(updatedItems[index].quantity) * Number(updatedItems[index].unit_price);
    updatedItems[index].change_reason = reason;

    setData("items", updatedItems);
    setPendingChange(null);
    setReason("");
    setIsReasonDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    post(route("supply_officer.store_po"), {
      onFinish: () => setIsConfirmDialogOpen(false),
    });
  };

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Create Purchase Order">
      <Head title={`Create PO for PR #${pr.pr_number}`} />
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow mx-auto max-w-6xl"
      >
        <h2 className="text-2xl font-bold mb-6">
          Create PO for PR #{pr.pr_number}
        </h2>

        {winningSuppliers.map((supplier) => {
          const supplierItems = data.items.filter(
            (i) => i.supplier_id === supplier.id
          );
          const supplierTotal = supplierItems.reduce(
            (sum, i) => sum + Number(i.total_price),
            0
          );

          return (
            <div
              key={supplier.id}
              className="mb-8 border rounded-lg shadow-sm overflow-hidden"
            >
              <div className="bg-gray-100 px-4 py-3 font-semibold text-lg">
                Supplier: {supplier.company_name}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-separate border-spacing-0 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-y border-l px-4 py-2 text-left">Item</th>
                      <th className="border-y px-4 py-2 text-left">Specs</th>
                      <th className="border-y px-4 py-2 text-center">Unit</th>
                      <th className="border-y px-4 py-2 text-right text-blue-600">
                        Quantity
                      </th>
                      <th className="border-y px-4 py-2 text-right">Unit Price</th>
                      <th className="border-y border-r px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierItems.map((item, index) => (
                      <tr key={`${supplier.id}-${item.pr_detail_id}`} className="hover:bg-gray-50">
                        <td className="border-b border-l px-4 py-2">{item.item}</td>
                        <td className="border-b px-4 py-2 text-gray-600">{item.specs}</td>
                        <td className="border-b px-4 py-2 text-center">{item.unit}</td>
                        <td className="border-b px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              handleChange(index, "quantity", e.target.value)
                            }
                            className="w-20 border rounded px-2 py-1 text-right bg-yellow-50"
                          />
                        </td>
                        <td className="border-b px-4 py-2 text-right">
                          ₱
                          {Number(item.unit_price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          <div
                            className={`text-xs ${
                              item.priceSource === "Quoted Price"
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {item.priceSource}
                          </div>
                        </td>
                        <td className="border-b border-r px-4 py-2 text-right font-medium">
                          ₱
                          {Number(item.total_price).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                    {/* Supplier total row */}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan="5" className="border-t px-4 py-2 text-right">
                        Supplier Total:
                      </td>
                      <td className="border-t border-r px-4 py-2 text-right">
                        ₱
                        {supplierTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <Button
          type="submit"
          disabled={processing || data.items.length === 0}
          className="mt-6"
        >
          {processing ? "Submitting..." : "Submit Purchase Order"}
        </Button>
      </form>

      {/* Confirm Submit Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription className="pt-4 text-base">
              Are you sure you want to create this Purchase Order? Please review
              the items and quantities before proceeding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? "Submitting..." : "Confirm & Create PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason for Change Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Quantity Change</DialogTitle>
            <DialogDescription className="pt-2">
              You changed the quantity from the original PR. Please provide a
              reason for this adjustment.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-3"
            rows="3"
            placeholder="Enter reason..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReasonDialogOpen(false);
                setPendingChange(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReason}
              disabled={!reason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
