import TwgUserLayout from "@/Layouts/TwgUserLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import {
    ClipboardList,
    FileCheck,
    AlertTriangle,
    Layers,
    FileText,
} from "lucide-react";

export default function Dashboard({ user, stats, monthlyStats, topDivisions, recentPRs }) {
    const statCards = [
        { title: "Total PRs", icon: Layers, value: stats?.total || 0, color: "bg-indigo-500" },
        { title: "Reviewed", icon: FileCheck, value: stats?.reviewed || 0, color: "bg-green-500" },
        { title: "Pending", icon: ClipboardList, value: stats?.pending || 0, color: "bg-yellow-500" },
        { title: "Sent Back", icon: AlertTriangle, value: stats?.sent_back || 0, color: "bg-red-500" },
    ];

    return (
        <TwgUserLayout header={"Schools Division Office - Ilagan | Dashboard"}>
            <Head title="Dashboard" />

            {/* Greeting Section */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user.firstname}</h1>
                <p className="text-gray-600">
                    Track purchase requests, monitor statuses, and see division trends.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                <h2 className="text-3xl font-bold">{stat.value}</h2>
                            </div>
                            <div
                                className={`p-3 rounded-full text-white ${stat.color}`}
                            >
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly PR Trend */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Purchase Requests Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyStats?.length ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={monthlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-10">No data available.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Divisions */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Requesting Divisions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topDivisions?.length ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topDivisions}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="division" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-10">No division data yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent PRs Section */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Recent Purchase Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentPRs?.length ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border-t">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="text-left px-4 py-2">PR Number</th>
                                        <th className="text-left px-4 py-2">Division</th>
                                        <th className="text-left px-4 py-2">Focal Person</th>
                                        <th className="text-left px-4 py-2">Status</th>
                                        <th className="text-left px-4 py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPRs.map((pr) => (
                                        <tr key={pr.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{pr.pr_number}</td>
                                            <td className="px-4 py-2">{pr.division}</td>
                                            <td className="px-4 py-2">{pr.focal_person}</td>
                                            <td className="px-4 py-2">{pr.status}</td>
                                            <td className="px-4 py-2">{pr.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No recent purchase requests found.</p>
                    )}
                </CardContent>
            </Card>
        </TwgUserLayout>
    );
}
