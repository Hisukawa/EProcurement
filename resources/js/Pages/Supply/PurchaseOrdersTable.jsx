import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { CheckCircle2, ClipboardCheck, PrinterCheckIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PurchaseOrdersTable({ purchaseOrders, filters }) {
  const { props } = usePage();
  const { data, setData, get } = useForm({
    search: filters.search || "",
    division: filters.division || "",
  });
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  useEffect(() => {
      const message = props.flash.success;
      if (message) {
        setSuccessMessage(message);
        setIsSuccessDialogOpen(true);
      }
    }, [props.flash.success]); 
    console.log(props.flash.success);

  // Debounced filter handling
  useEffect(() => {
    const timeout = setTimeout(() => {
      get(route("supply_officer.purchase_orders_table"), {
        preserveState: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [data.search, data.division]);

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Purchase Orders">
      <Head title="Purchase Orders" />

      {/* Filter and Heading */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">All Purchase Orders</h2>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search PO number or focal person"
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
            className="w-72 border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={data.division}
            onChange={(e) => setData("division", e.target.value)}
            className="border border-gray-300 px-10 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Divisions</option>
            {filters.divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.division}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["PO Number", "Focal Person", "Supplier", "Division", "Status", "Actions"].map(
                (title) => (
                  <th
                    key={title}
                    className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center whitespace-nowrap"
                  >
                    {title}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-center">
            {purchaseOrders.data.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-gray-500 text-lg font-medium">
                  No Purchase Orders found.
                </td>
              </tr>
            ) : (
              purchaseOrders.data.map((po) => (
                <tr key={po.id} className="hover:bg-blue-50 transition duration-200 whitespace-nowrap">
                  <td className="px-6 py-4 font-medium text-blue-700">{po.po_number}</td>
                  <td className="px-6 py-4">
                    {po.rfq?.purchase_request?.focal_person
                      ? `${po.rfq.purchase_request.focal_person.firstname} ${po.rfq.purchase_request.focal_person.middlename} ${po.rfq.purchase_request.focal_person.lastname}`
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">{po.supplier?.company_name ?? "N/A"}</td>
                  <td className="px-6 py-4">{po.rfq?.purchase_request?.division?.division || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-center">
                    {!po.iar && (
                      <a
                        href={route("supply_officer.record_iar", po.id)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition"
                      >
                        <ClipboardCheck size={16} /> Record IAR
                      </a>
                    )}

                    <a
                      href={route("supply_officer.print_po", po.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition"
                      target="_blank"
                    >
                      <PrinterCheckIcon size={16} /> Print PO
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center flex-wrap gap-2">
        {purchaseOrders.links.map((link, i) => (
          <button
            key={i}
            disabled={!link.url}
            onClick={() => link.url && get(link.url)}
            className={`px-3 py-1 text-sm border rounded-md ${
              link.active
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={24} />
              Success!
            </DialogTitle>
            <DialogDescription className="pt-4 text-base">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
