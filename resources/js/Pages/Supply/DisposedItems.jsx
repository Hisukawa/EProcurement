import { Head, Link, router, useForm } from "@inertiajs/react";
import { FileText, PrinterCheck } from "lucide-react";
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
import { PrinterIcon } from "@heroicons/react/16/solid";

export default function DisposedItems({ filters, records, user }) {
  const { data, setData } = useForm({
    search: filters?.search || "",
    page: filters?.page || 1,
  });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConfirmSave = () => {
    toast({
      title: "Record Updated",
      description: "Disposal successfully confirmed!",
      duration: 3000,
      className: "bg-green-600 text-white",
    });
    setConfirmDialogOpen(false);
  };

  const handleSearch = (value) => {
    setData("search", value);
    router.get(
      route("supply_officer.disposed_items"), // or .disposed_items
      { search: value },
      { preserveState: true, replace: true }
    );
  };

  return (
    <SupplyOfficerLayout header="Disposed Items">
      <Head title="Disposed Items" />
      <div className="justify-center items-center bg-red-50 p-6 rounded-xl shadow-md">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-800">Disposed Items</h2>

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
                  "Disposed Quantity",
                  "Remarks",
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
                  <td
                    colSpan="7"
                    className="py-12 text-gray-500 text-lg font-medium text-center"
                  >
                    No Disposed Items Found.
                  </td>
                </tr>
              ) : (
                records.data.map((record, i) => {
                  const items = record.items || [];
                  const rows = [];

                  // Group 2 items per row
                  for (let j = 0; j < items.length; j += 2) {
                    const pair = items.slice(j, j + 2);

                    rows.push(
                      <tr
                        key={`${record.id}-${j}`}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-gray-700">
                          {record.rrsp_number}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.ics_number}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {pair[0]?.returned_by?.firstname}{" "}
                          {pair[0]?.returned_by?.lastname}
                        </td>

                        {/* Item Descriptions */}
                        <td className="px-6 py-4 text-gray-700 text-left">
                          <div className="space-y-1">
                            {pair.map((it, k) => (
                              <div key={k} className="border-b last:border-0 py-1">
                                {it?.inventory_item?.item_desc}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Quantities */}
                        <td className="px-6 py-4 text-gray-700">
                          <div className="space-y-1">
                            {pair.map((it, k) => (
                              <div key={k} className="border-b last:border-0 py-1">
                                {it?.quantity}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="px-6 py-4 text-gray-700">
                          <div className="space-y-1">
                            {pair.map((it, k) => (
                              <div key={k} className="border-b last:border-0 py-1 italic text-gray-500">
                                {it?.remarks || "—"}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <a
                            href={route('supply_officer.print_disposed_items', record.id)}
                            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
                            target="_blank"
                          >
                            <PrinterCheck size={16} /> Print
                          </a>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
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
                  link.active
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
            <DialogTitle>Confirm Disposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this item as disposed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Yes, Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
