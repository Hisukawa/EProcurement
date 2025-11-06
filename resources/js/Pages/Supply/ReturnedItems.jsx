import { Head, Link, router, useForm } from "@inertiajs/react";
import { PrinterCheck, Edit3 } from "lucide-react";
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
import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";

export default function ReturnedItems({ filters, records, user }) {
  const { data, setData } = useForm({
    search: filters?.search || "",
    page: filters?.page || 1,
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { toast } = useToast();

  const { data: editData, setData: setEditData, post, processing } = useForm({
    recipient: "",
    remarks: "",
  });

  const handleConfirmSave = () => {
    toast({
      title: "RIS Recorded",
      description: "Requisition and Issue Slip successfully saved!",
      duration: 3000,
      className: "bg-green-600 text-white",
    });
    setConfirmDialogOpen(false);
  };

  const handleSearch = (value) => {
    setData("search", value);
    router.get(route("supply_officer.reissued_items"), { search: value }, { preserveState: true, replace: true });
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditData({
      recipient: item?.recipient || "",
      remarks: item?.remarks || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    post(route("supply_officer.update_reissued_item", selectedItem.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Updated Successfully",
          description: "The reissued item details were updated.",
          duration: 3000,
          className: "bg-green-600 text-white",
        });
        setEditDialogOpen(false);
        // Auto-refresh the table to reflect the new data
        router.reload({ only: ["records"] });
      },
      onError: (errors) => {
        toast({
          title: "Update Failed",
          description: "Please check your input fields.",
          duration: 3000,
          className: "bg-red-600 text-white",
        });
      },
    });
  };

  return (
    <SupplyOfficerLayout header="Reissued Items">
      <Head title="Reissued Items" />
      <div className="p-6 rounded-xl shadow-md bg-green-50">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-800">Returned Items</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search End User or Focal Person"
              className="w-64 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.search}
              onChange={(e) => {
                setData("search", e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="w-full table-auto text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "RRSP No.",
                  "ICS No.",
                  "Returned By / End-User",
                  "Item Description",
                  "Returned Qty",
                  "Actions",
                ].map((title) => (
                  <th
                    key={title}
                    className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-center">
              {records.data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-gray-500 text-lg font-medium text-center">
                    No Returned Items Found.
                  </td>
                </tr>
              ) : (
                records.data.map((record) => {
                  const items = record.items || [];
                  return items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-700">{record.rrsp_number}</td>
                      <td className="px-6 py-4 text-gray-700">{record.ics_number}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {it?.returned_by?.firstname} {it?.returned_by?.lastname}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-left">{it?.inventory_item?.item_desc}</td>
                      <td className="px-6 py-4 text-gray-700">{it?.quantity}</td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <a
                          href={route("supply_officer.print_reissued_items", record.id)}
                          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center gap-1"
                          target="_blank"
                        >
                          <PrinterCheck size={16} /> Print
                        </a>

                        {/* Only show edit if recipient is empty */}
                        {(!it.recipient || it.recipient.trim() === "") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                            onClick={() => handleEditClick(it)}
                          >
                            <Edit3 size={16} /> Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {records.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || "#"}
                className={`px-3 py-1 text-sm rounded-md ${
                  link.active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </nav>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Issuance</DialogTitle>
            <DialogDescription>Are you sure you want to switch this to RIS issuance?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Yes, Record RIS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reissued Item</DialogTitle>
            <DialogDescription>Update the recipient or remarks.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <input
                type="text"
                value={editData.recipient}
                onChange={(e) => setEditData("recipient", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                value={editData.remarks}
                onChange={(e) => setEditData("remarks", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              ></textarea>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
