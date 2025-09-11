import AdminLayout from "@/Layouts/AdminLayout";
import { PencilSquareIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// ✅ import toast
import { useToast } from "@/hooks/use-toast";

export default function Users({ users, filters }) {
    const { props } = usePage();
    const success = props.flash?.success;
    const error = props.flash?.error;
    const [open, setOpen] = useState(false);
    const { data, setData, get } = useForm({
        search: filters.search || "",
        division: filters.division || ""
    });

    const { toast } = useToast(); // ✅ initialize toast

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            get(route("admin.view_users"), {
                preserveState: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [data.search, data.division]);

    // ✅ show toast + dialog if success/error
    useEffect(() => {
        if (success) {
            toast({
                title: "✅ Success",
                description: success,
            });
            setOpen(true);
        }
        if (error) {
            toast({
                title: "❌ Error",
                description: error,
                variant: "destructive",
            });
        }
    }, [success, error]);

    // Placeholder functions for actions
    const handleEdit = (userId) => {
        console.log(`Editing user with ID: ${userId}`);
    };

    const handleDelete = (userId) => {
        console.log(`Deleting user with ID: ${userId}`);
    };

    return (
        <AdminLayout
            header={'Schools Division Office - Ilagan | Users'}
        >
            <Head title="Users" />
            <div className=" rounded-lg mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mb-4 md:mb-0">
                        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            name="search"
                            placeholder="Name..."
                            className="w-96 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                        />
                        <select
                        value={data.division}
                        onChange={(e) => setData("division", e.target.value)}
                        className="border border-gray-300 px-10 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="">All Divisions</option>
                        {filters.divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                            {division.division}
                            </option>
                        ))}
                        </select>

                        </form>
                    </div>
                    <a
                        href={route("admin.create_user_form")}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg w-full md:w-auto text-center"
                    >
                        + Add User
                    </a>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data && users.data.length > 0 ? (
                            users.data.map((user) => (
                                <TableRow key={user.id} className="hover:bg-blue-50 transition duration-150">
                                    <TableCell className="font-medium">{user.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <UserCircleIcon className="w-5 h-5 text-gray-400 mr-2" />
                                            {user.firstname} {user.middleinitial} {user.lastname}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.division?.division || <span className="text-gray-500 italic">N/A</span>}
                                    </TableCell>
                                    <TableCell>
                                        {user.position || <span className="text-gray-500 italic">N/A</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((role, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                                >
                                                    {role.name
                                                        .replace(/_/g, " ")
                                                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => handleEdit(user.id)}
                                            className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition mr-2"
                                            title="Edit User"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                            title="Delete User"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-center space-x-1 mt-6">
                    {users.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url || "#"}
                            className={`
                                min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition
                                ${link.active
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 border hover:bg-blue-50"}
                                ${!link.url ? "cursor-not-allowed opacity-50" : ""}
                            `}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>

            {/* Keep dialog for strong confirmation */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Success</DialogTitle>
                        <DialogDescription>{success}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
