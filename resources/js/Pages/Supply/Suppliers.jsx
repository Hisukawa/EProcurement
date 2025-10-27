import { Input } from "@/Components/ui/input";
import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { PencilSquareIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers({ filters, records }) {
  const { toast } = useToast();

  // Search + Pagination form
  const { data, setData } = useForm({
    search: filters?.search || "",
    page: filters?.page || 1,
  });

  // Edit form
  const editForm = useForm({
    company_name: "",
    address: "",
    tin_num: "",
    representative_name: "",
    contact_number: "",
    email: "",
  });

  // Add supplier form
  const addForm = useForm({
    company_name: "",
    address: "",
    tin_num: "",
    representative_name: "",
    contact_number: "",
    email: "",
  });

  const [editSupplier, setEditSupplier] = useState(null);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [deleteSupplierId, setDeleteSupplierId] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Search handler
  const handleSearch = (value) => {
    setData("search", value);
    router.get(route("supply_officer.suppliers"), { search: value }, { preserveState: true, replace: true });
  };

  // Pagination
  const handlePageChange = (page) => {
    setData("page", page);
    router.get(route("supply_officer.suppliers"), { search: data.search, page }, { preserveState: true, replace: true });
  };

  // Open edit modal
  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    editForm.setData({
      company_name: supplier.company_name,
      address: supplier.address,
      tin_num: supplier.tin_num,
      representative_name: supplier.representative_name,
      contact_number: supplier.contact_number || "",
      email: supplier.email || "",
    });
  };

  // Update supplier
  const handleEditSupplier = () => {
    editForm.put(route("supply_officer.update_supplier", editSupplier.id), {
      onSuccess: () => {
        setEditSupplier(null);
        router.get(route("supply_officer.suppliers"), { preserveState: true });
        toast({
          title: "Supplier Updated",
          description: `${editForm.data.company_name} has been successfully updated.`,
          variant: "default",
        });
      },
      onError: () =>
        toast({
          title: "Update Failed",
          description: "There was an error updating the supplier.",
          variant: "destructive",
        }),
    });
  };

  // Add supplier
  const handleAddSupplier = () => {
    addForm.post(route("supply_officer.add_supplier"), {
      onSuccess: () => {
        setAddSupplierOpen(false);
        addForm.reset();
        router.get(route("supply_officer.suppliers"), { preserveState: true });
        toast({
          title: "Supplier Added",
          description: "The new supplier has been successfully added.",
          variant: "default",
        });
      },
      onError: () =>
        toast({
          title: "Add Failed",
          description: "There was an error adding the supplier.",
          variant: "destructive",
        }),
    });
  };

  // Delete / Activate supplier
  const handleDelete = () => {
    if (deleteSupplierId) {
      const supplier = records.data.find((s) => s.id === deleteSupplierId);
      const isInactive = supplier?.status === "inactive";

      router.put(
        route(isInactive ? "supply_officer.activate_supplier" : "supply_officer.delete_supplier", deleteSupplierId),
        {},
        {
          preserveState: true,
          onSuccess: () => {
            setConfirmationOpen(false);
            toast({
              title: isInactive ? "Supplier Activated" : "Supplier Marked as Inactive",
              description: isInactive
                ? "The supplier has been successfully activated."
                : "The supplier has been successfully marked as inactive.",
              variant: "default",
            });
          },
          onError: () => {
            toast({
              title: "Action Failed",
              description: isInactive
                ? "Unable to activate supplier."
                : "Unable to mark supplier as inactive.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <SupplyOfficerLayout header="Suppliers">
      <Head title="Suppliers" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3 justify-between">
          <h2 className="text-3xl font-semibold text-gray-800">Suppliers</h2>

        </div>

        {/* Search */}
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-3">
          <Button onClick={() => setAddSupplierOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-5">
            <PlusIcon className="w-4 h-4 mr-1" /> Add Supplier
          </Button>
          <Input
            type="text"
            placeholder="Search by company name or representative name..."
            value={data.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="px-6 py-5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-96 bg-white"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full table-auto text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "#",
                "Company Name",
                "Address",
                "Tin Number",
                "Representative Name",
                "Contact Number",
                "Email",
                "Status",
                "Actions",
              ].map((title) => (
                <th key={title} className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-left">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.data.map((supplier) => {
              const isInactive = supplier.status === "inactive";
              return (
                <tr
                  key={supplier.id}
                  className={`transition-colors ${isInactive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {records.data.indexOf(supplier) + 1}
                  </td>
                  <td
                    className={`px-6 py-4 font-semibold whitespace-nowrap ${
                      isInactive ? "text-gray-400 line-through opacity-70" : "text-blue-700"
                    }`}
                  >
                    {supplier.company_name}
                  </td>
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.address}
                  </td>
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.tin_num}
                  </td>
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.representative_name}
                  </td>
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.contact_number}
                  </td>
                  <td className={`px-6 py-4 ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.email}
                  </td>
                  <td className={`px-6 py-4 capitalize ${isInactive ? "text-gray-400 line-through opacity-70" : ""}`}>
                    {supplier.status}
                  </td>

                  <td className="px-6 py-4 flex gap-2 justify-center items-center">
                    <button
                      onClick={() => handleEdit(supplier)}
                      disabled={isInactive}
                      className={`inline-flex items-center px-3 py-2 rounded-md ${
                        isInactive
                          ? "bg-gray-400 text-white cursor-not-allowed hidden"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit
                    </button>

                    <button
                      onClick={() => {
                        setDeleteSupplierId(supplier.id);
                        setConfirmationOpen(true);
                      }}
                      className={`inline-flex items-center px-3 py-2 rounded-md ${
                        isInactive
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      {isInactive ? "Activate" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center flex-wrap gap-1">
        {records.links.map((link, i) => (
          <button
            key={i}
            disabled={!link.url}
            onClick={() => link.url && handlePageChange(link.url.split("page=")[1])}
            className={`px-3 py-1 text-sm border rounded-md ${
              link.active ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Enter the supplier's details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {["company_name", "address", "tin_num", "representative_name", "contact_number", "email"].map((field) => (
              <Input
                key={field}
                placeholder={field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                value={addForm.data[field]}
                onChange={(e) => addForm.setData(field, e.target.value)}
              />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSupplierOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog open={editSupplier !== null} onOpenChange={(open) => !open && setEditSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Modify the supplier's details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {["company_name", "address", "tin_num", "representative_name", "contact_number", "email"].map((field) => (
              <Input
                key={field}
                placeholder={field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                value={editForm.data[field]}
                onChange={(e) => editForm.setData(field, e.target.value)}
              />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSupplier(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Activate/Delete */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {records.data.find((s) => s.id === deleteSupplierId)?.status === "inactive"
                ? "Activate Supplier"
                : "Confirm Deactivation"}
            </DialogTitle>
            <DialogDescription>
              {records.data.find((s) => s.id === deleteSupplierId)?.status === "inactive"
                ? "Are you sure you want to activate this supplier? They will become available again."
                : "Are you sure you want to mark this supplier as inactive? They won’t be available for transactions."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className={
                records.data.find((s) => s.id === deleteSupplierId)?.status === "inactive"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {records.data.find((s) => s.id === deleteSupplierId)?.status === "inactive" ? "Activate" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupplyOfficerLayout>
  );
}
