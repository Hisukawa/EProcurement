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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/Components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Users({ users, filters, divisions, roles }) {
    const { props } = usePage();
    const success = props.flash?.success;
    const error = props.flash?.error;
    const { toast } = useToast();

    const [editOpen, setEditOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [action, setAction] = useState(""); // 'update' | 'delete'
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState("");
    const [processing, setProcessing] = useState(false);

    const { data, setData, put, get, reset } = useForm({
        search: filters.search || "",
        division: filters.division || "",
        firstname: "",
        middlename: "",
        lastname: "",
        email: "",
        position: "",
        division_id: "",
        role: "",
    });

    // Debounced search
    useEffect(() => {
        const delay = setTimeout(() => {
            get(route("admin.view_users"), { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(delay);
    }, [data.search, data.division]);

    // Flash toast messages
    useEffect(() => {
        if (success)
            toast({ title: "✅ Success", description: success });
        if (error)
            toast({ title: "❌ Error", description: error, variant: "destructive" });
    }, [success, error]);

    /** Prompt password before editing */
    const handleEdit = (user) => {
        setAction("update");
        setSelectedUser(user);
        setPassword("");
        setPasswordModalOpen(true);
    };

    /** Prompt password before deleting */
    const handleDelete = (userId) => {
        setAction("delete");
        setSelectedUser({ id: userId });
        setPassword("");
        setPasswordModalOpen(true);
    };

    /** Verify password then continue */
    const handlePasswordSubmit = async () => {
        if (!password.trim()) {
            toast({ title: "⚠️ Required", description: "Please enter your password." });
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.post(route("admin.verify_password"), { password });

            if (!response.data.success) {
                toast({
                    title: "❌ Error",
                    description: "Incorrect password. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            if (action === "update") {
                openEditModal();
            } else if (action === "delete") {
                await deleteUser();
            }

            setPasswordModalOpen(false);
        } catch (error) {
            toast({
                title: "❌ Error",
                description: "Something went wrong verifying password.",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    /** Open edit modal after password verification */
    const openEditModal = () => {
        if (!selectedUser) return;
        setData({
            firstname: selectedUser.firstname,
            middlename: selectedUser.middleinitial,
            lastname: selectedUser.lastname,
            email: selectedUser.email,
            position: selectedUser.position || "",
            division_id: selectedUser.division?.id || "",
            role: selectedUser.roles[0]?.name || "",
        });
        setEditOpen(true);
    };

    /** Save user update */
    const updateUser = async () => {
        try {
            const response = await axios.put(route("admin.update_user", selectedUser.id), data);
            toast({ title: "✅ Success", description: response.data.message || "User updated successfully" });
            setEditOpen(false);
            reset();
            setSelectedUser(null);
            get(route("admin.view_users"), { preserveState: true });
        } catch (error) {
            toast({
                title: "❌ Error",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    /** Delete user */
    const deleteUser = async () => {
        try {
            await put(route("admin.deactivate_user", selectedUser.id), {});
            toast({ title: "✅ Success", description: "User deactivated successfully" });
            get(route("admin.view_users"), { preserveState: true });
        } catch {
            toast({ title: "❌ Error", description: "Something went wrong", variant: "destructive" });
        }
    };

    return (
        <AdminLayout header="Schools Division Office - Ilagan | Users">
            <Head title="Users" />

            {/* Filters and Add Button */}
            <div className="rounded-lg mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mb-4 md:mb-0">
                        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
                            <input
                                type="text"
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
                                {divisions.map((division) => (
                                    <option key={division.id} value={division.id}>
                                        {division.division}
                                    </option>
                                ))}
                            </select>
                        </form>
                    </div>
                    <Link
                        href={route("admin.create_user_form")}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-md text-center"
                    >
                        + Add User
                    </Link>
                </div>
            </div>

            {/* User Table */}
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
                        {users.data.length > 0 ? (
                            users.data.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className={`hover:bg-blue-50 transition duration-150 ${
                                        user.account_status === "inactive" ? "opacity-50 line-through" : ""
                                    }`}
                                >
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell className="flex items-center">
                                        <UserCircleIcon className="w-5 h-5 text-gray-400 mr-2" />
                                        {user.firstname} {user.middleinitial} {user.lastname}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.division?.division || <span className="text-gray-500 italic">N/A</span>}</TableCell>
                                    <TableCell>{user.position || <span className="text-gray-500 italic">N/A</span>}</TableCell>
                                    <TableCell>
                                        {user.roles.map((role, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                {role.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </span>
                                        ))}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
                                            title="Edit User"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
                            className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition ${
                                link.active
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 border hover:bg-blue-50"
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>

            {/* Password Prompt Modal */}
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Admin Action</DialogTitle>
                        <DialogDescription>
                            Please enter your admin password to continue.
                        </DialogDescription>
                    </DialogHeader>

                    <Input
                        type="password"
                        placeholder="Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={processing}
                    />

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePasswordSubmit} disabled={processing}>
                            {processing ? "Verifying..." : "Submit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Modify the user’s details below.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="First Name"
                            value={data.firstname}
                            onChange={(e) => setData("firstname", e.target.value)}
                        />
                        <Input
                            placeholder="Middle Name"
                            value={data.middlename}
                            onChange={(e) => setData("middlename", e.target.value)}
                        />
                        <Input
                            placeholder="Last Name"
                            value={data.lastname}
                            onChange={(e) => setData("lastname", e.target.value)}
                        />
                        <Input
                            placeholder="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <Input
                            placeholder="Position"
                            value={data.position}
                            onChange={(e) => setData("position", e.target.value)}
                        />
                        <select
                            value={data.division_id}
                            onChange={(e) => setData("division_id", e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                        >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                                <option key={div.id} value={div.id}>{div.division}</option>
                            ))}
                        </select>
                        <select
                            value={data.role}
                            onChange={(e) => setData("role", e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                        >
                            <option value="">Select Role</option>
                            {roles.map((role, idx) => (
                                <option key={idx} value={role.name}>{role.name}</option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateUser}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}