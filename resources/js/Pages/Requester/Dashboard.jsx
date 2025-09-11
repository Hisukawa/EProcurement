import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import {
    FilePlus2,
    ClipboardList,
    CheckCircle2,
    Hourglass,
    XCircle,
} from "lucide-react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

export default function Dashboard({stats, trendData, statusData, recentRequests}) {
    const iconMap = {
        ClipboardList: ClipboardList,
        CheckCircle2: CheckCircle2,
        Hourglass: Hourglass,
        XCircle: XCircle,
    };
    const { auth } = usePage().props;

    return (
        <RequesterLayout header={"Schools Division Office - Ilagan | Dashboard"}>
            <Head title="Dashboard" />

            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Welcome back, {auth.user.firstname}!
                </h1>
                <p className="text-gray-600">
                    Here’s an overview of your purchase requests.
                </p>
            </div>

            {/* Quick Action */}
            <div className="mb-8">
                <Link
                    href={route("requester.create")}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-2xl shadow hover:bg-blue-700"
                >
                    <FilePlus2 className="w-5 h-5" />
                    Create New Purchase Request
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = iconMap[stat.icon]; // map string to component
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
                    );
                })}
            </div>

            {/* Data Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Line Chart: Trends */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Requests Over Time
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                    label
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart: Status Breakdown */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Status Breakdown
                        </h2>
                        <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>


                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                            {statusData.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: s.color }}
                                    ></span>
                                    <span className="text-sm text-gray-600">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Recent Requests
                </h2>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead>
                        <tr className="border-b">
                            <th className="px-4 py-2">PR ID</th>
                            <th className="px-4 py-2">Item</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentRequests.map((req, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-800">
                                    {req.pr_number}
                                </td>
                                <td className="px-4 py-2">{req.items}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium
                                            ${
                                                req.status === "Approved"
                                                    ? "bg-green-100 text-green-600"
                                                    : req.status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-600"
                                                    : "bg-red-100 text-red-600"
                                            }
                                        `}
                                    >
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{req.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </RequesterLayout>
    );
}
