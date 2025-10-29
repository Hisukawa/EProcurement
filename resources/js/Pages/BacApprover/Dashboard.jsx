import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { CardContent } from "@/Components/ui/card";

import {
    ClipboardList,
    CheckCircle2,
    Hourglass,
    XCircle,
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

export default function Dashboard({auth, stats, deptData, approvalData, recentApprovals}) {
    const iconMap = {
    ClipboardList: ClipboardList,
    CheckCircle2: CheckCircle2,
    Hourglass: Hourglass,
    XCircle: XCircle,
    };

    return (
        <ApproverLayout header={"Schools Division Office - Ilagan | Dashboard"}>
            <Head title="Dashboard" />

            {/* Welcome */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Welcome back, {auth.user.firstname}!
                </h1>
                <p className="text-gray-600">
                    Here’s an overview of your purchase requests.
                </p>
            </div>

            {/* Stats */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart by Department */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Requests by Division</h2>
                        <ResponsiveContainer width="100%" height={250}>
                        <BarChart width={500} height={300} data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="division" />
                            <YAxis />
                            <Tooltip />

                            <Bar dataKey="approved" fill="#16a34a">
                                <LabelList
                                dataKey="approved"
                                position="insideTop"
                                style={{ fontSize: 14, fontWeight: 600, fill: "#fff" }}
                                />
                            </Bar>

                            <Bar dataKey="pending" fill="#eab308">
                                <LabelList
                                dataKey="pending"
                                position="insideTop"
                                style={{ fontSize: 14, fontWeight: 600, fill: "#fff" }}
                                />
                            </Bar>

                            <Bar dataKey="rejected" fill="#dc2626">
                                <LabelList
                                dataKey="rejected"
                                position="insideTop"
                                style={{ fontSize: 14, fontWeight: 600, fill: "#fff" }}
                                />
                            </Bar>
                        </BarChart>

                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart Approval Ratio */}
                <Card className="rounded-2xl shadow">
                    <CardContent className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Approval Ratio</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={approvalData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {approvalData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                            {approvalData.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                                    <span className="text-sm text-gray-600">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Approvals */}
            <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Requests Reviewed</h2>
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
                        {recentApprovals.map((req, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-800">{req.pr_number}</td>
                                <td className="px-4 py-2">{req.items}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium
                                            ${
                                                req.status === "Reviewed"
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
        </ApproverLayout>
    );
}
