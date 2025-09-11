import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, Link } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Boxes,
    ClipboardList,
    Truck,
    PackageCheck,
    AlertTriangle,
    FileSpreadsheet,
    FileCheck,
    FileText,
    Layers,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LabelList,
} from "recharts";

export default function Dashboard({stats, documents, stockData, recentActivity, user}) {
    
    const stockDataArray = Object.values(stockData);
    const iconMap = {
        Boxes: Boxes,
        Truck: Truck,
        PackageCheck: PackageCheck,
        ClipboardList: ClipboardList,
        FileSpreadsheet: FileSpreadsheet,
        FileCheck: FileCheck,
        FileText: FileText,
        Layers: Layers
    };


    // Pie chart: Requests Status handled by Supply Officer
    const requestStatusData = [
        { name: "Processed", value: 5, color: "#16a34a" },
        { name: "Pending", value: 0, color: "#eab308" },
        { name: "On-Hold", value: 2, color: "#dc2626" },
    ];


    return (
        <SupplyOfficerLayout header={"Schools Division Office - Ilagan | Dashboard"}>
            <Head title="Dashboard" />

            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user.firstname}</h1>
                <p className="text-gray-600">
                    Manage inventory, RIS, ICS, PAR, PO, and Issuance efficiently from your dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = iconMap[stat.icon];
                    return (
                        <Card key={idx} className="rounded-2xl shadow hover:shadow-md transition">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <h3 className="text-xl font-semibold text-gray-800">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Documents & Logs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {documents.map((doc, idx) => {
                    const Icon = iconMap[doc.icon];
                    return (
                        <Link href={route(doc.link)} key={idx}>
                            <Card className="rounded-2xl shadow hover:shadow-lg transition">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className={`p-3 rounded-xl ${doc.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{doc.label}</p>
                                        <h3 className="text-xl font-semibold text-gray-800">{doc.value}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )

                })}
            </div>

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart - Stock Levels */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock Levels by Category</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart width={500} height={300} data={stockDataArray || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />

                                <Bar dataKey="qty" fill="#2563eb">
                                    <LabelList
                                    dataKey="qty"
                                    position="insideTop" // you can also try "insideBottom", "center"
                                    style={{ fontSize: 14, fontWeight: 600, fill: "#fff" }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart - Request Handling */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Requests Status</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={requestStatusData || []}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {requestStatusData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                            {requestStatusData.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                                    <span className="text-sm text-gray-600">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead>
                        <tr className="border-b">
                            <th className="px-4 py-2">PR Number</th>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.map((act, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-800">{act.id}</td>
                                <td className="px-4 py-2">{act.action}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium
                                            ${
                                                act.status === "Processed"
                                                    ? "bg-green-100 text-green-600"
                                                    : act.status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-600"
                                                    : "bg-red-100 text-red-600"
                                            }
                                        `}
                                    >
                                        {act.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{act.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SupplyOfficerLayout>
    );
}
