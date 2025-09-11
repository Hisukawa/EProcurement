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

export default function CreateUser({ divisions, roles }) {
    const { data, setData, post, processing, errors } = useForm({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    password_confirmation: "",
    position: "",
    division_id: "",
    role: ""
    });

    const [open, setOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setOpen(true); // open confirmation dialog
    };

    const confirmSubmit = () => {
        post(route("admin.store_user"), {
            onSuccess: () => setOpen(false), // close after success
        });
    };

    return (
    <AdminLayout header="Add User">
        <Head title="Add User" />
        <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm shadow-sm"
          >
            ← Back
          </button>
        <div className="w-full mt-6 bg-white p-8 rounded-xl shadow">
            
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                <input
                    type="text"
                    placeholder="First Name"
                    value={data.firstname}
                    onChange={(e) => setData("firstname", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.firstname && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
                )}
                </div>
                <div>
                <input
                    type="text"
                    placeholder="Middle Name"
                    value={data.middlename}
                    onChange={(e) => setData("middlename", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                <div>
                <input
                    type="text"
                    placeholder="Last Name"
                    value={data.lastname}
                    onChange={(e) => setData("lastname", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.lastname && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
                )}
                </div>
            </div>
            </div>

            {/* Email */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
            </label>
            <input
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. user@email.com"
            />
            {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
            </div>

            {/* Password */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
            </label>
            <input
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter temporary password"
            />
            {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
            </label>
            <input
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Re-enter password"
            />
            {errors.password_confirmation && (
                <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
            )}
            </div>

            {/* Position */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
            </label>
            <input
                type="text"
                value={data.position}
                onChange={(e) => setData("position", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Procurement Officer"
            />
            </div>

            {/* Division */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Division
            </label>
            <select
                value={data.division_id}
                onChange={(e) => setData("division_id", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">Select Division</option>
                {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                    {division.division}
                </option>
                ))}
            </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
            </label>
            <select
                value={data.role}
                onChange={(e) => setData("role", e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">Select Role</option>
                {roles.map((role) => (
                <option key={role.id} value={role.name}>
                    {role.name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
                ))}
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition"
                >
                    {processing ? "Saving..." : "Add User"}
                </button>
            </div>
            </form>
        </div>
        {/* Confirmation Dialog */}
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
