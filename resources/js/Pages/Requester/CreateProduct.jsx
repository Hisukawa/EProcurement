
import { useForm, Head } from "@inertiajs/react";
import RequesterLayout from "@/Layouts/RequesterLayout";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CreateProduct({ units, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        specs: "",
        unit_id: "",
        default_price: "",
    });

    const [openConfirm, setOpenConfirm] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setOpenConfirm(true); // open the dialog instead of swal
    };

    const confirmSave = () => {
        post(route("requester.store_product"), {
            onSuccess: () => {
                setOpenConfirm(false);
            },
            onError: () => {
                setOpenConfirm(false);
            },
        });
    };

    return (
        <RequesterLayout header="Add New Product">
            <Head title="Add Product" />

            <div className="mx-auto mt-6 bg-white p-8 shadow-xl rounded w-full max-w-2xl">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Product</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Item Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg w-full"
                            placeholder="Enter product name"
                        />
                        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                    </div>

                    {/* Specs */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Specifications</label>
                        <textarea
                            value={data.specs}
                            onChange={(e) => setData("specs", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg w-full"
                            placeholder="Enter specifications..."
                            rows={3}
                        />
                        {errors.specs && <p className="text-red-600 text-sm">{errors.specs}</p>}
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Unit</label>
                        <select
                            value={data.unit_id}
                            onChange={(e) => setData("unit_id", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg w-full"
                        >
                            <option value="">-- Select Unit --</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.unit}
                                </option>
                            ))}
                        </select>
                        {errors.unit_id && <p className="text-red-600 text-sm">{errors.unit_id}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                            value={data.category_id}
                            onChange={(e) => setData("category_id", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg w-full"
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <p className="text-red-600 text-sm">{errors.category_id}</p>}
                    </div>

                    {/* Price */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Default Price (₱)</label>
                        <input
                            type="number"
                            value={data.default_price}
                            onChange={(e) => setData("default_price", e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg w-full"
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                        />
                        {errors.default_price && <p className="text-red-600 text-sm">{errors.default_price}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving..." : "Save Product"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Save</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600 mt-2">
                        Are you sure you want to save this new product?
                    </p>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setOpenConfirm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmSave} disabled={processing}>
                            {processing ? "Saving..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </RequesterLayout>
    );
}
