import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { PlusCircle, CheckCircle, TrashIcon } from "lucide-react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { router } from "@inertiajs/react";
import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Shadcn Dialog import
import { Button } from "@/components/ui/button"; // Shadcn Button import

export default function AddDetails({ prId, products, pr_number, prDetails, purpose, sendBackReason, units, rejectionReason }) {
    console.log(rejectionReason);
const { data, setData, post, put, processing, errors, reset } = useForm({
        id: null,
        pr_number: pr_number,
        product_id: "",
        item: "",
        specs: "",
        unit_id: "", // Unit ID for selecting unit
        custom_unit: "", // Custom unit input
        unit_price: "",
        quantity: "",
        purpose: purpose || "",
    });

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteDetailId, setDeleteDetailId] = useState(null);
    const [isDeleteSuccessDialogOpen, setIsDeleteSuccessDialogOpen] = useState(false); // For delete success dialog

    // Handle product selection
    const handleProductSelect = (productId) => {
        const existingItem = prDetails.find((detail) => detail.product_id == productId);

        if (existingItem) {
            setData({
                ...data,
                product_id: existingItem.product_id,
                item: existingItem.item,
                specs: existingItem.specs,
                unit_id: existingItem.unit_id,
                custom_unit: "",
                unit_price: existingItem.unit_price,
                quantity: existingItem.quantity,
            });
            setModalIsOpen(true);
        } else {
            const selected = products.find((p) => p.id == productId);
            if (selected) {
                setData({
                    ...data,
                    product_id: selected.id,
                    item: selected.name,
                    specs: selected.specs,
                    unit_id: selected.unit_id || "", // Preselect if unit exists
                    custom_unit: "", // Preselect unit name if exists
                    unit_price: selected.default_price || "",
                    quantity: "",
                });
                setModalIsOpen(true);
            }
        }
    };

    // Handle adding or updating the product
    const handleConfirmAdd = () => {
        const customUnit = data.custom_unit.trim();

        // If custom unit is entered
        if (customUnit) {
            const existingUnit = units.find(u => u.unit.toLowerCase() === customUnit.toLowerCase());
            if (existingUnit) {
                // If the unit exists, use its ID
                setData("unit_id", existingUnit.id);
                setData("custom_unit", ""); // Clear the custom unit field
            } else {
                // If the unit doesn't exist, proceed with the entered custom unit
                setData("unit_id", ""); // Clear the unit_id
            }
        } else if (!data.unit_id) {
            // If no custom unit is entered and no unit is selected, return
            return;
        }

        if (!data.quantity) return;

        const formRoute = data.id
            ? route("requester.update_details", data.id)
            : route("requester.store_details", prId);

        const formMethod = data.id ? put : post;

        formMethod(formRoute, {
            preserveScroll: true,
            data: {
                ...data,
                purpose: data.purpose,
            },
            onSuccess: () => {
                setModalIsOpen(false);
                reset();
            },
        });
    };

    // Open modal to edit an existing item
    const handleEdit = (detail) => {
        setData({
            ...data,
            id: detail.id,
            product_id: detail.product_id,
            item: detail.item,
            specs: detail.specs,
            unit_id: detail.unit_id,
            custom_unit: "",
            unit_price: detail.unit_price,
            quantity: detail.quantity,
        });
        setModalIsOpen(true);
    };

    const handleDelete = (detail) => {
        if (detail && detail.id) {
            setDeleteDetailId(detail.id); // Store the valid id for deletion
            setIsDeleteConfirmOpen(true); // Open delete confirmation dialog
        } else {
            console.error("Error: Invalid detail provided for deletion");
        }
    };

    const handleConfirmDelete = () => {
        if (deleteDetailId) {
            router.delete(route("requester.delete_details", { detailId: deleteDetailId }), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteConfirmOpen(false);
                    setIsDeleteSuccessDialogOpen(true); // Open success dialog
                },
                onError: (err) => {
                    console.error("Delete failed:", err);
                    setIsDeleteConfirmOpen(false); // Close the confirmation dialog
                },
            });
        } else {
            console.error("Error: No valid ID provided for deletion.");
        }
    };

    const handleSavePurpose = () => {
        setIsPurposeSaveConfirmOpen(true); // Open purpose save confirmation dialog
    };

    const handleConfirmSavePurpose = () => {
        put(route("requester.update_purpose", prId), {
            preserveScroll: true,
            data: {
                purpose: data.purpose,
            },
            onSuccess: () => {
                setIsPurposeSaveConfirmOpen(false); // Close the purpose save confirmation dialog
                setIsPurposeSuccessDialogOpen(true); // Open success dialog
            },
            onError: (error) => {
                setIsPurposeSaveConfirmOpen(false); // Close the purpose save confirmation dialog
                alert("Failed to update purpose.");
            },
        });
    };
    const [isPurposeSaveConfirmOpen, setIsPurposeSaveConfirmOpen] = useState(false); // For purpose save confirmation dialog
    const [isPurposeSuccessDialogOpen, setIsPurposeSuccessDialogOpen] = useState(false);
    return (
        <RequesterLayout header={"Schools Division Office - Ilagan | Add Details"}>
            <Head title="PR Details" />
            <div className="mx-auto mt-10 bg-white p-10 shadow-2xl">
                <h2 className="text-3xl font-bold mb-8 text-left text-gray-800">
                    Purchase Request Details — <span className="text-blue-600">{pr_number}</span>
                </h2>

                {/* Display Purpose Field */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Purpose</label>
                    <textarea
                        value={data.purpose}
                        onChange={(e) => setData("purpose", e.target.value)}
                        className="w-full border rounded px-3 py-1 mt-2"
                        placeholder="Enter the purpose of the request"
                    ></textarea>
                    {errors.purpose && (
                        <p className="text-red-500 mt-1 text-sm">{errors.purpose}</p>
                    )}
                    <button
                        onClick={handleSavePurpose}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Save Purpose
                    </button>
                </div>

                {/* Highlight send back reason if available */}
                {rejectionReason && rejectionReason !== null && (
                    <div className="mb-4 p-4 bg-red-200 border-l-4 border-red-600 text-red-800">
                        <strong>Rejection Reason: </strong>
                        {rejectionReason}
                    </div>
                )}

                {/* Dialog for Finish Confirmation */}
                <Dialog open={isConfirmingFinish} onOpenChange={setIsConfirmingFinish}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Finish PR?</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            Once you finish, you will go back to the request list.
                        </DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsConfirmingFinish(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    window.location.href = route("requester.manage_requests");
                                }}
                            >
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                                {/* Dialog for Saving Purpose Confirmation */}
                <Dialog open={isPurposeSaveConfirmOpen} onOpenChange={setIsPurposeSaveConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Save Purpose</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            Are you sure you want to save the updated purpose?
                        </DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPurposeSaveConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmSavePurpose}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog for Deleting an Item */}
                <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            Delete item? This action cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmDelete}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog for Deletion */}
                <Dialog open={isDeleteSuccessDialogOpen} onOpenChange={setIsDeleteSuccessDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-green-600">Success</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>Item deleted successfully.</DialogDescription>
                        <DialogFooter>
                            <Button onClick={() => setIsDeleteSuccessDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isPurposeSuccessDialogOpen} onOpenChange={setIsPurposeSuccessDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-green-600">Success</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>Purpose saved successfully.</DialogDescription>
                        <DialogFooter>
                            <Button onClick={() => setIsPurposeSuccessDialogOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal for Item Editing */}
                <Dialog open={modalIsOpen} onOpenChange={setModalIsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Item</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>Edit the details of the selected item.</DialogDescription>

                        {/* Item Details Form */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Item Name</label>
                            <input
                                type="text"
                                value={data.item}
                                onChange={(e) => setData("item", e.target.value)}
                                className="w-full border rounded px-3 py-1 mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700">Specifications</label>
                            <input
                                type="text"
                                value={data.specs}
                                onChange={(e) => setData("specs", e.target.value)}
                                className="w-full border rounded px-3 py-1 mt-2"
                            />
                        </div>

                        {/* Unit Selection or Custom Input */}
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700">Unit</label>
                            <div className="flex items-center gap-4">
                                {/* Dropdown for selecting existing unit */}
                                <select
                                    value={data.unit_id}
                                    onChange={(e) => setData("unit_id", e.target.value)}
                                    className="w-1/2 border rounded px-3 py-1 mt-2"
                                >
                                    <option value="">-- Select Unit --</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.unit}
                                        </option>
                                    ))}
                                </select>

                                {/* Input for custom unit */}
                                <input
                                    type="text"
                                    value={data.custom_unit}
                                    onChange={(e) => setData("custom_unit", e.target.value)}
                                    className="w-1/2 border rounded px-3 py-1 mt-2"
                                    placeholder="Enter custom unit"
                                />
                            </div>
                            {errors.unit_id && <p className="text-red-500 mt-1 text-sm">{errors.unit_id}</p>}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700">Quantity</label>
                            <input
                                type="number"
                                value={data.quantity}
                                onChange={(e) => setData("quantity", e.target.value)}
                                className="w-full border rounded px-3 py-1 mt-2"
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmAdd}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Table for displaying current PR items */}
                <div className="overflow-x-auto mb-10">
                    <table className="w-full min-w-[700px] border border-gray-300 shadow rounded-lg text-sm">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 border-b">Item</th>
                                <th className="px-4 py-3 border-b">Specs</th>
                                <th className="px-4 py-3 border-b">Unit</th>
                                <th className="px-4 py-3 border-b text-right">Qty</th>
                                <th className="px-4 py-3 border-b text-right">Default Unit Price (₱)</th>
                                <th className="px-4 py-3 border-b text-right">Total (₱)</th>
                                <th className="px-4 py-3 border-b text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prDetails.length > 0 ? (
                                prDetails.map((detail) => (
                                    <tr key={detail.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-b">{detail.item}</td>
                                        <td className="px-4 py-3 border-b">{detail.specs}</td>
                                        <td className="px-4 py-3 border-b">{detail.unit}</td>
                                        <td className="px-4 py-3 border-b text-right">{detail.quantity}</td>
                                        <td className="px-4 py-3 border-b text-right">
                                            {Number(detail.unit_price).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 border-b text-right">
                                            {(Number(detail.unit_price) * detail.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 border-b text-right">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(detail)}
                                                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4 mr-1" />
                                                    Edit
                                                </button>
                                                <Button
                                                    onClick={() => handleDelete(detail)}
                                                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    <TrashIcon className="w-4 h-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-6 text-gray-500">
                                        No items added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <h3 className="text-2xl font-semibold mb-6 text-center text-gray-700">
                    Add Item to PR <span className="text-blue-600">{pr_number}</span>
                </h3>

                {/* Add Item Form */}
                <form onSubmit={(e) => e.preventDefault()} className="mx-auto space-y-8">
                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-800">Select a Product</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border border-gray-300 rounded-lg shadow">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 border">Item</th>
                                        <th className="px-3 py-2 border">Specifications</th>
                                        <th className="px-3 py-2 border">Unit</th>
                                        <th className="px-3 py-2 border">Default Price (₱)</th>
                                        <th className="px-3 py-2 border text-center">Select</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => {
                                        const alreadyAdded = prDetails.some((detail) => detail.product_id === product.id);

                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 border">{product.name}</td>
                                            <td className="px-3 py-2 border">{product.specs}</td>
                                            <td className="px-3 py-2 border">{product.unit?.unit || "-"}</td>
                                            <td className="px-3 py-2 border">{Number(product.default_price).toFixed(2)}</td>
                                            <td className="px-3 py-2 border text-center">
                                                {alreadyAdded ? (
                                                <span className="text-green-600 font-semibold text-xs">Added</span>
                                                ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleProductSelect(product.id)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full text-lg font-bold transition"
                                                    title="Add Product"
                                                >
                                                    +
                                                </button>
                                                )}
                                            </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </div>
        </RequesterLayout>
    );
}
