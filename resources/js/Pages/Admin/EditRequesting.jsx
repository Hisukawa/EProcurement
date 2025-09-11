import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function EditRequesting({ division, activeOfficer }) {
    const { data, setData, put, processing, errors } = useForm({
        name: activeOfficer ? activeOfficer.name : "",
    });
    const [open, setOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setOpen(true); // open confirmation dialog
    };
    const confirmSubmit = () => {
        put(route("admin.update_requesting", division.id), {
            onSuccess: () => setOpen(false), // close after success
        });
    };

    return (
        <AdminLayout header={`Update Officer - ${division.division}`}>
            <Head title="Update Requisitioning Officer" />

            <div className="max-w-xl mx-auto mt-6 bg-white shadow rounded p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Division: {division.division}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Current Officer
                        </label>
                        <input
                            type="text"
                            value={activeOfficer ? activeOfficer.name : "No active officer"}
                            disabled
                            className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            New Officer Name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="mt-1 block w-full border rounded px-3 py-2"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? "Updating..." : "Update Officer"}
                        </button>
                    </div>
                </form>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Add User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to add this user? Please review the details before proceeding.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={confirmSubmit} disabled={processing}>
                        {processing ? "Saving..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </AdminLayout>
    );
}
