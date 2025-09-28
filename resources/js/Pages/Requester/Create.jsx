import NavLink from "@/Components/NavLink";
import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { User, FileText, ClipboardList, Building2, UserPlus, SendHorizonalIcon } from "lucide-react";
import Swal from 'sweetalert2';
import { useState, useMemo, useEffect, useCallback } from "react"; // ✅ Added useCallback
import { router } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";

function CreateProductModal({ open, onClose, units, onProductSaved }) {
    const { data, setData, processing, errors, reset } = useForm({
        name: "",
        specs: "",
        unit_id: "",
        custom_unit: "",
        default_price: "",
        quantity: 1, // ✅ quantity is already here
    });

    useEffect(() => {
        if (!open) reset();
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...data,
                unit: data.custom_unit && data.custom_unit.trim() !== "" ? data.custom_unit : data.unit_id,
            };

            // save to backend
            const response = await axios.post(
                route("requester.store_product"),
                payload
            );
            const newProduct = response.data.product;

            if (newProduct) {
                // ✅ pass back product with quantity included
                // No need for a separate dialog to ask if they want to add it
                onProductSaved({
                    ...newProduct,
                    quantity: Number(data.quantity),
                    total_item_price: Number(newProduct.default_price) * Number(data.quantity),
                });
            }
            onClose(); // Close the modal after saving
        } catch (error) {
            console.error("Error saving product:", error);
            // You might want to show an error message to the user here
            Swal.fire('Error!', 'Failed to save product. Please try again.', 'error');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium">Item Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.name && (
                            <p className="text-red-600 text-sm">{errors.name}</p>
                        )}
                    </div>
                    {/* Specs */}
                    <div>
                        <label className="text-sm font-medium">Specifications</label>
                        <textarea
                            value={data.specs}
                            onChange={(e) => setData("specs", e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                        />
                        {errors.specs && (
                            <p className="text-red-600 text-sm">{errors.specs}</p>
                        )}
                    </div>
                    {/* Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">Unit</label>
                            <select
                                value={data.unit_id}
                                onChange={(e) => setData("unit_id", e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">-- Select Unit --</option>
                                {units.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.unit}
                                    </option>
                                ))}
                            </select>
                            {errors.unit_id && (
                                <p className="text-red-600 text-xs mt-1">{errors.unit_id}</p>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">
                                Enter Unit (if not listed)
                            </label>
                            <input
                                type="text"
                                value={data.custom_unit}
                                onChange={(e) => setData("custom_unit", e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter custom unit"
                            />
                        </div>
                    </div>
                    {/* Price */}
                    <div>
                        <label className="text-sm font-medium">Default Price (₱)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.default_price}
                            onChange={(e) => setData("default_price", e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.default_price && (
                            <p className="text-red-600 text-sm">{errors.default_price}</p>
                        )}
                    </div>
                    {/* ✅ Quantity */}
                    <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={data.quantity}
                            onChange={(e) => setData("quantity", e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.quantity && ( // Add error handling for quantity
                            <p className="text-red-600 text-sm">{errors.quantity}</p>
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving..." : "Save & Add to PR"} {/* Changed button text */}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProductTable({ products, handleProductSelect, setOpenProductModal, onProductPriceUpdated }) { // ✅ Add onProductPriceUpdated
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editedPrices, setEditedPrices] = useState({}); // track changes
    const itemsPerPage = 10;

    const filteredProducts = useMemo(() => {
        return products.filter(
            (product) =>
                `${product.name} ${product.specs}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
        );
    }, [search, products]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const handlePriceInputChange = (id, newPrice) => {
        setEditedPrices((prev) => ({ ...prev, [id]: newPrice }));
    };

    const handlePriceSave = (id) => {
        const newPrice = parseFloat(editedPrices[id]);
        if (isNaN(newPrice) || newPrice < 0) {
            Swal.fire('Invalid Price', 'Please enter a valid positive number for the price.', 'warning');
            return;
        }
        router.put(
            route("requester.update_price", id),
            { default_price: newPrice },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setEditedPrices((prev) => {
                        const updated = { ...prev };
                        delete updated[id];
                        return updated;
                    });
                    // ✅ Notify parent component that a price was updated,
                    // so the `products` prop can be reloaded/updated if needed.
                    if (onProductPriceUpdated) {
                        onProductPriceUpdated();
                    }
                    Swal.fire('Success!', 'Product price updated successfully.', 'success');
                },
                onError: (errors) => {
                    console.error("Error updating price:", errors);
                    Swal.fire('Error!', 'Failed to update product price.', 'error');
                },
            }
        );
    };

    return (
        <div className="flex flex-col md:col-span-2">
            {/* Header + Add Button */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-semibold text-gray-800">Available Items</h4>
                <button
                    type="button"
                    onClick={() => setOpenProductModal(true)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                    Add New Item
                </button>
            </div>
            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search by item name or specifications..."
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-400"
                />
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300 rounded-lg shadow">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-3 py-2 border">Item</th>
                            <th className="px-3 py-2 border">Specifications</th>
                            <th className="px-3 py-2 border">Unit</th>
                            <th className="px-3 py-2 border">Default Price (₱)</th>
                            <th className="px-3 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.length > 0 ? (
                            paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 border">{product.name}</td>
                                    <td className="px-3 py-2 border">{product.specs}</td>
                                    <td className="px-3 py-2 border">{product.unit?.unit || "-"}</td>
                                    <td className="px-3 py-2 border flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            defaultValue={product.default_price}
                                            onChange={(e) => handlePriceInputChange(product.id, e.target.value)}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500"
                                        />
                                        {editedPrices[product.id] !== undefined && (
                                            <button
                                                type="button"
                                                onClick={() => handlePriceSave(product.id)}
                                                className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition"
                                            >
                                                Save
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleProductSelect(product.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full text-lg font-bold transition"
                                            title="Add Product"
                                        >
                                            +
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">
                                    No products match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                            currentPage === 1
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                            currentPage === totalPages
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function ProductModal({ isOpen, onClose, onConfirm, product }) {
    const [quantity, setQuantity] = useState("");

    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1); // Default quantity when modal opens
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const handleConfirmClick = () => {
        const qtyNum = Number(quantity);
        if (qtyNum > 0) {
            onConfirm(qtyNum);
            onClose(); // Close the modal after confirmation
        } else {
            Swal.fire('Invalid Quantity', 'Please enter a positive number for quantity.', 'warning');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Item to PR</h3>
                <div className="space-y-3 text-sm text-gray-700">
                    <p><strong>Item:</strong> {product.name}</p>
                    <p><strong>Specs:</strong> {product.specs}</p>
                    <p><strong>Unit:</strong> {product.unit?.unit || '-'}</p>
                    <p><strong>Unit Price (₱):</strong> {Number(product.default_price).toFixed(2)}</p>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Create({ requestedBy, products: initialProducts, units }) { // ✅ Renamed products to initialProducts
    const user = usePage().props.auth.user;
    const fullName = `${user.firstname} ${user.middlename ?? ''} ${user.lastname}`.trim();
    const prNumberFromServer = usePage().props.pr_number;

    const [modalOpen, setModalOpen] = useState(false); // Controls ProductModal (for existing products)
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { pr_number, latestPr } = usePage().props;
    const [currentPr, setCurrentPr] = useState(pr_number);

    const [openProductModal, setOpenProductModal] = useState(false); // Controls CreateProductModal (for new product entry)
    const [availableProducts, setAvailableProducts] = useState(initialProducts); // ✅ State for products in table

    useEffect(() => {
        setData("pr_number", currentPr);
    }, [currentPr]);

    // Removed showSavedDialog and pendingProduct states

    // ✅ This function will now directly add the new product to the PR
    const handleProductSaved = (newProductWithQuantity) => {
        // Here, `newProductWithQuantity` already contains the quantity
        // from the CreateProductModal.
        handleConfirmProduct(newProductWithQuantity.quantity, newProductWithQuantity);
        // After saving a new product, we need to refresh the available products in the table
        // This is crucial for the newly added item to appear in the ProductTable
        router.reload({ only: ["products"],
            onSuccess: (page) => {
                setAvailableProducts(page.props.products);
            }
         });
    };

    const { data, setData, post, processing, errors } = useForm({
        focal_person: user.id,
        pr_number: currentPr || '',
        purpose: '',
        division_id: user.division.id,
        requested_by: requestedBy.name || "",
        products: [], // items added to the current PR
    });

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [resultMessage, setResultMessage] = useState({ title: "", text: "", success: true });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.products.length === 0) {
            Swal.fire('No Items', 'Please add at least one item to the Purchase Request.', 'warning');
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await axios.post(route("requester.store"), data);
            if (response.data.success) {
                localStorage.setItem("flashSuccess", response.data.message);
                localStorage.setItem("highlightPrId", response.data.highlightPrId);
                window.location.href = route("requester.manage_requests");
            } else {
                 Swal.fire('Error!', response.data.message || 'Failed to create PR.', 'error');
            }
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.message) {
                 Swal.fire('Error!', error.response.data.message, 'error');
            } else {
                 Swal.fire('Error!', 'An unexpected error occurred while creating the PR.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // This function is used for selecting existing products from the table
    const handleProductSelect = (productId) => {
        const selected = availableProducts.find(p => p.id === productId);
        if (selected) {
            setSelectedProduct(selected);
            setModalOpen(true); // Open ProductModal to ask for quantity
        }
    };

    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingQuantity, setPendingQuantity] = useState(null);
    const [duplicateIndex, setDuplicateIndex] = useState(null);

    // ✅ Modified handleConfirmProduct to accept an optional product object
    const handleConfirmProduct = useCallback((quantity, productToAdd = selectedProduct) => {
        if (!productToAdd) return; // Should not happen if logic is correct

        const existingIndex = data.products.findIndex(
            (p) => p.product_id === productToAdd.id
        );

        const qtyNum = Number(quantity);
        if (qtyNum <= 0) {
            Swal.fire('Invalid Quantity', 'Quantity must be a positive number.', 'warning');
            return;
        }

        if (existingIndex !== -1) {
            // If already exists → show duplicate dialog
            setPendingQuantity(qtyNum);
            setDuplicateIndex(existingIndex);
            setSelectedProduct(productToAdd); // Keep track of the product for the dialog
            setShowDuplicateDialog(true);
        } else {
            // Add as new
            const newProduct = {
                product_id: productToAdd.id,
                item: productToAdd.name,
                specs: productToAdd.specs,
                unit: productToAdd.unit?.unit,
                unit_price: Number(productToAdd.default_price),
                total_item_price: Number(productToAdd.default_price * qtyNum),
                quantity: qtyNum,
            };
            setData("products", [...data.products, newProduct]);
            setModalOpen(false); // Close the ProductModal
            setSelectedProduct(null); // Clear selected product
            Swal.fire('Added!', `${newProduct.item} added to PR.`, 'success');
        }
    }, [data.products, setData, selectedProduct]);


    // Callback for when a price is updated in ProductTable
    const handleProductPriceUpdated = () => {
        router.reload({ only: ["products"],
            onSuccess: (page) => {
                setAvailableProducts(page.props.products);
            }
        });
    };


    useEffect(() => {
        let intervalId = setInterval(() => {
            if (document.visibilityState === "visible") {
                router.reload({
                    only: ["latestPr", "products"], // ✅ Also reload products for immediate updates
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: (page) => {
                        const lastPr = page.props.latestPr;
                        if (lastPr) {
                            const base = lastPr.slice(0, -3); // prefix (YY-MM-)
                            const num = parseInt(lastPr.slice(-3)) + 1;
                            const nextPr = base + num.toString().padStart(3, "0");
                            setCurrentPr(nextPr);
                        }
                        setAvailableProducts(page.props.products); // Update available products
                    },
                });
            }
        }, 5000); // every 5s
        return () => clearInterval(intervalId);
    }, []);

    return (
        <RequesterLayout header="Schools Division Office - Ilagan | Create PR">
            <Head title="Create PR" />
            <div className="mx-auto mt-6 bg-white p-8 shadow-xl rounded">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Create Purchase Request
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="focal_person" className="text-sm font-medium text-gray-700 mb-2">
                            Focal Person
                        </label>
                        <div className="relative">
                            <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="focal_person"
                                type="text"
                                value={fullName}
                                readOnly
                                placeholder="Auto-filled"
                                className="pl-10 pr-4 py-3 border border-gray-300 bg-gray-100 rounded-lg text-sm w-full"
                            />
                        </div>
                        {errors.focal_person && <p className="text-red-600 text-sm mt-1">{errors.focal_person}</p>}
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="pr_number" className="text-sm font-medium text-gray-700 mb-2">
                            PR Number
                        </label>
                        <div className="relative">
                            <FileText className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="pr_number"
                                type="text"
                                value={data.pr_number}
                                onChange={(e) => setData('pr_number', e.target.value)}
                                placeholder="Enter PR Number"
                                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full"
                            />
                        </div>
                        <div className="flex flex-col items-center text-gray-400">
                            <small className="text-xs italic text-red-500">
                                Note that the PR Number is AUTO GENERATED based on the last PR across the system
                            </small>
                        </div>
                        {errors.pr_number && <p className="text-red-600 text-sm mt-1">{errors.pr_number}</p>}
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <label htmlFor="purpose" className="text-sm font-medium text-gray-700 mb-2">
                            Purpose
                        </label>
                        <div className="relative">
                            <ClipboardList className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <textarea
                                id="purpose"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                placeholder="Describe the purpose of this request..."
                                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm resize-y focus:ring-2 focus:ring-blue-500 w-full"
                                rows={4}
                            />
                        </div>
                        {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
                    </div>

                    {/*Selected Product Preview*/}
                    <div className="flex flex-col md:col-span-2">
                        <h4 className="text-lg font-semibold mb-2 text-gray-800">Selected Items</h4>
                        <table className="w-full border border-gray-200 rounded-lg shadow text-sm mb-4">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="px-4 py-2 border-b">Item</th>
                                    <th className="px-4 py-2 border-b">Specs</th>
                                    <th className="px-4 py-2 border-b">Unit</th>
                                    <th className="px-4 py-2 border-b">Unit Price (₱)</th>
                                    <th className="px-4 py-2 border-b">Quantity</th>
                                    <th className="px-4 py-2 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.products.length > 0 ? (
                                    data.products.map((item, index) => (
                                        <tr key={item.product_id || index} className="text-gray-800"> {/* Use product_id for key if available */}
                                            <td className="px-4 py-2 border-b text-center">{item.item}</td>
                                            <td className="px-4 py-2 border-b text-center">{item.specs}</td>
                                            <td className="px-4 py-2 border-b text-center">{item.unit}</td>
                                            <td className="px-4 py-2 border-b text-center">{Number(item.unit_price).toFixed(2)}</td>
                                            <td className="px-4 py-2 border-b text-center">{item.quantity}</td>
                                            <td className="px-4 py-2 border-b text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newProducts = [...data.products];
                                                        newProducts.splice(index, 1);
                                                        setData("products", newProducts);
                                                    }}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-gray-500 py-4">
                                            No Items added yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Modal for adding quantity for existing products */}
                    <ProductModal
                        isOpen={modalOpen}
                        onClose={() => { setModalOpen(false); setSelectedProduct(null); }}
                        onConfirm={handleConfirmProduct}
                        product={selectedProduct}
                    />

                    {/* Modal for creating new product (includes quantity) */}
                    <CreateProductModal
                        open={openProductModal}
                        onClose={() => setOpenProductModal(false)}
                        units={units}
                        onProductSaved={handleProductSaved}
                    />

                    {/* Table of available products */}
                    <ProductTable
                        products={availableProducts} // Use the state variable
                        handleProductSelect={handleProductSelect}
                        setOpenProductModal={setOpenProductModal}
                        onProductPriceUpdated={handleProductPriceUpdated} // Pass the callback
                    />

                    <div className="flex flex-col">
                        <label htmlFor="division" className="text-sm font-medium text-gray-700 mb-2">
                            Division
                        </label>
                        <div className="relative">
                            <Building2 className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="division"
                                type="text"
                                value={user.division.division}
                                readOnly // Division should likely be read-only if tied to user
                                placeholder="Auto-filled division"
                                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full"
                            />
                        </div>
                        {errors.division_id && <p className="text-red-600 text-sm mt-1">{errors.division_id}</p>}
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="requested_by" className="text-sm font-medium text-gray-700 mb-2">
                            Requested By
                        </label>
                        <div className="relative">
                            <UserPlus className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="requested_by"
                                type="text"
                                value={data.requested_by}
                                onChange={(e) => setData('requested_by', e.target.value)}
                                placeholder="Enter requestor's name"
                                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full"
                            />
                        </div>
                        {errors.requested_by && <p className="text-red-600 text-sm mt-1">{errors.requested_by}</p>}
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4 gap-5">
                        <Button
                            type="button"
                            onClick={() => window.history.back()}
                            className="bg-red-600 hover:bg-red-400 text-white font-medium px-6 py-3 rounded-lg text-base transition-all duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg text-base transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Proceed
                                    <SendHorizonalIcon className="h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600 mt-2">
                Do you want to proceed with creating this Purchase Request?
                </p>
                <DialogFooter className="mt-4 flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting ? "Submitting..." : "Confirm"}
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>

            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                <DialogTitle
                    className={resultMessage.success ? "text-green-600" : "text-red-600"}
                >
                    {resultMessage.title}
                </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600 mt-2">{resultMessage.text}</p>
                <DialogFooter className="mt-4 flex justify-end">
                <Button onClick={() => setShowResultDialog(false)}>OK</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>

            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                <DialogTitle className="text-yellow-600">
                    Item already added
                </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600 mt-2">
                This item is already in your PR. What would you like to do?
                </p>
                <DialogFooter className="mt-4 flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => {
                    setShowDuplicateDialog(false);
                    setPendingQuantity(null);
                    setDuplicateIndex(null);
                    }}
                >
                    ❌ Cancel
                </Button>
                <Button
  onClick={() => {
    const updatedProducts = [...data.products];
    updatedProducts[duplicateIndex].quantity += pendingQuantity;
    updatedProducts[duplicateIndex].total_item_price =
      updatedProducts[duplicateIndex].quantity *
      updatedProducts[duplicateIndex].unit_price;

    setData("products", updatedProducts);

    // close both dialogs
    setShowDuplicateDialog(false);
    setPendingQuantity(null);
    setDuplicateIndex(null);
    setModalOpen(false);        // 👈 close ProductModal
    setSelectedProduct(null);   // 👈 clear product
  }}
>
  ➕ Increase Quantity
</Button>

<Button
  onClick={() => {
    const updatedProducts = [...data.products];
    updatedProducts[duplicateIndex].quantity = pendingQuantity;
    updatedProducts[duplicateIndex].total_item_price =
      updatedProducts[duplicateIndex].quantity *
      updatedProducts[duplicateIndex].unit_price;

    setData("products", updatedProducts);

    // close both dialogs
    setShowDuplicateDialog(false);
    setPendingQuantity(null);
    setDuplicateIndex(null);
    setModalOpen(false);        // 👈 close ProductModal
    setSelectedProduct(null);   // 👈 clear product
  }}
>
  🔄 Replace Quantity
</Button>

                </DialogFooter>

            </DialogContent>
            </Dialog>


        </RequesterLayout>
    );
}
