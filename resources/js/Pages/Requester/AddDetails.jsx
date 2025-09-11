import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head, useForm } from "@inertiajs/react";
import { PlusCircle, CheckCircle, TrashIcon } from "lucide-react";
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { usePage } from "@inertiajs/react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { router } from '@inertiajs/react';


export default function AddDetails({ prId, products, pr_number, prDetails }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: null, // for editing
        pr_number: pr_number,
        product_id: "",
        item: "",
        specs: "",
        unit: "",
        unit_price: "",
        quantity: "",
    });


    const handleProductSelect = (productId) => {
    const alreadyAdded = prDetails.some((detail) => detail.product_id == productId);

    if (alreadyAdded) {
        Swal.fire({
            icon: 'error',
            title: 'Product already added',
            text: 'This product has already been added to the purchase request.',
            confirmButtonColor: '#d33',
        });
        return;
    }

    if (!productId) {
        setData({
            ...data,
            product_id: "",
            item: "",
            specs: "",
            unit: "",
            unit_price: "",
        });
        return;
    }

    const selected = products.find((p) => p.id == productId);
    if (selected) {
        setData({
            ...data,
            product_id: selected.id,
            item: selected.name,
            specs: selected.specs,
            unit: selected.unit?.unit || "",
            unit_price: selected.default_price || "",
        });
    }
};

const pageProps = usePage().props;

useEffect(() => {
    if (pageProps.flash?.success) {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: pageProps.flash.success,
            confirmButtonColor: '#2563EB',
        });
    }

    if (pageProps.flash?.error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: pageProps.flash.error,
            confirmButtonColor: '#d33',
        });
    }
}, [pageProps.flash]);



const handleConfirmAdd = () => {
    console.log(data.quantity);
    if (!data.quantity) return;

    Swal.fire({
        title: data.id ? 'Update Item?' : 'Add Item?',
        text: data.id
            ? 'This will update the selected item in your PR.'
            : 'Do you want to add this item to the PR?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563EB',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirm',
    }).then((result) => {
        if (result.isConfirmed) {
            const formRoute = data.id
                ? route("requester.update_details", data.id)
                : route("requester.store_details", prId);

            const formMethod = data.id ? put : post;

            formMethod(formRoute, {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    });
};


const handleConfirmFinish = (e) => {
    e.preventDefault();
    Swal.fire({
        title: 'Finish PR?',
        text: 'Once you finish, you will go back to the request list.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563EB',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirm',
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = route("requester.manage_requests");
        }
    });
};

function handleEdit(detail) {
    setData({
        id: detail.id,
        product_id: detail.product_id,
        item: detail.item,
        specs: detail.specs,
        unit: detail.unit,
        unit_price: detail.unit_price,
        quantity: detail.quantity,
        pr_number: pr_number,
    });
}


const handleDelete = (detail) => {
    Swal.fire({
        title: "Are you sure?",
        text: `Delete item "${detail.item}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Confirm",
    }).then((result) => {
        if (result.isConfirmed) {
            router.delete(route("requester.delete_details", detail.id), {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire("Deleted!", "Item has been removed.", "success");
                },
                onError: (err) => {
                    console.error("Delete failed:", err);
                    Swal.fire("Error!", "Failed to delete item.", "error");
                },
            });
        }
    });
};



    return (
        <RequesterLayout header={"Schools Division Office - Ilagan | Add Details"}>
            <Head title="PR Details"/>
            <div className="mx-auto mt-10 bg-white p-10 shadow-2xl">
                <h2 className="text-3xl font-bold mb-8 text-left text-gray-800">
                    Purchase Request Details — <span className="text-blue-600">{pr_number}</span>
                </h2>
                    <div className="max-w-5xl mx-auto mb-5 bg-white shadow-md border border-gray-200 rounded-xl p-6">
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: "100%" }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 font-semibold px-1">
                        <span className="text-gray-500">Step 1: Create PR</span>
                        <span className="text-blue-600">Step 2: Add Items</span>
                    </div>
                    </div>

                

                {/*Current PR Items*/}
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
                                                <button
                                                    onClick={() => handleDelete(detail)}
                                                    
                                                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    <TrashIcon className="w-4 h-4 mr-1" />
                                                    Delete
                                                </button>
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

                {/*Add Form Title*/}
                <h3 className="text-2xl font-semibold mb-6 text-center text-gray-700">
                    Add Item to PR <span className="text-blue-600">{pr_number}</span>
                </h3>

                {/*Add Item Form*/}
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
                        {errors.product_id && <p className="text-red-500 text-sm mt-2">{errors.product_id}</p>}
                    </div>

                    {/*Selected Product Preview*/}
                    <div>
                        {data.id && (
                            <p className="text-sm text-yellow-600 font-medium mb-4">
                                You are editing item <strong>{data.item}</strong>. Click "Add to PR" to update.
                            </p>
                        )}
                        <h4 className="text-lg font-semibold mb-2 text-gray-800">Selected Product Details</h4>
                        <table className="w-full border border-gray-200 rounded-lg shadow text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="px-4 py-2 border-b">Item</th>
                                    <th className="px-4 py-2 border-b">Specs</th>
                                    <th className="px-4 py-2 border-b">Unit</th>
                                    <th className="px-4 py-2 border-b">Unit Price (₱)</th>
                                    <th className="px-4 py-2 border-b">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-gray-800">
                                    <td className="px-4 py-2 border-b">{data.item || "-"}</td>
                                    <td className="px-4 py-2 border-b">{data.specs || "-"}</td>
                                    <td className="px-4 py-2 border-b">{data.unit || "-"}</td>
                                    <td className="px-4 py-2 border-b">
                                        {data.unit_price ? Number(data.unit_price).toFixed(2) : "-"}
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.quantity}
                                            onChange={(e) => setData("quantity", e.target.value)}
                                            className={`w-24 border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.quantity ? "border-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        {errors.quantity && (
                                            <p className="text-red-500 mt-1 text-sm">{errors.quantity}</p>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                        <div className="flex justify-center gap-6 mt-6">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleConfirmAdd}
                                className="flex items-center gap-2 disabled:opacity-60 text-blue-600 hover:bg-blue-700 hover:text-white font-semibold px-10 py-3 rounded-xl border border-blue-600 transition"
                            >
                                {processing ? (
                                    <>
                                        <PlusCircle className="w-5 h-5 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="w-5 h-5" />
                                        Add to PR
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmFinish}
                                className="flex items-center gap-2 text-gray-600 hover:bg-gray-600 hover:text-white font-semibold px-10 py-3 rounded-xl border border-gray-700 transition"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Finish
                            </button>
                        </div>



                </form>
            </div>
        </RequesterLayout>
    );
}
