import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
  Boxes,
  Truck,
  PackageCheck,
  ClipboardList,
  FileSpreadsheet,
  FileCheck,
  FileText,
  Layers,
  Users,
  UserCog
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const iconMap = {
  Boxes,
  Truck,
  PackageCheck,
  ClipboardList,
  FileSpreadsheet,
  FileCheck,
  FileText,
  Layers,
  Users,
  UserCog
};

export default function Dashboard({ stats, documents, recentActivity, user, chartData, activityTrend, usersPerRoleChart, prStatusChart, requestPerDivision, issuedPerDivision }) {
  return (
    <AdminLayout header="Schools Division Office - Ilagan | Dashboard">
      <Head title="Dashboard" />
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Welcome Admin, {user.firstname}</h1>
        <p className="text-gray-600">
            Track purchase requests, monitor statuses, and see division trends.
        </p>
      </div>

      {/* ---- Stats Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon] || Boxes;
          return (
            <div
              key={stat.label}
              className={`relative overflow-hidden p-6 rounded-2xl shadow-lg flex flex-col justify-between bg-white hover:shadow-xl transition`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-opacity-20 ${stat.color}`}>
                  <Icon className={`w-6 h-6 ${stat.color.split(" ")[1]}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-10 text-7xl font-bold select-none">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* ---- Document / Quick Link Cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {documents.map((doc) => {
          const Icon = iconMap[doc.icon] || Boxes;
          return (
            <a
              key={doc.label}
              href={doc.link}
              className="relative p-4 rounded-xl bg-white shadow hover:shadow-xl transition flex flex-col items-center justify-center gap-2"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-opacity-20 ${doc.color}`}>
                <Icon className={`w-5 h-5 ${doc.color.split(" ")[1]}`} />
              </div>
              <p className="text-sm font-medium text-gray-600 text-center">{doc.label}</p>
              <p className="text-lg font-bold text-gray-800">{doc.value}</p>
            </a>
          );
        })}
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* PR Status Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">PR Status (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prStatusChart}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pending" fill="#FBBF24" />
              <Bar dataKey="Reviewed" fill="#3B82F6" />
              <Bar dataKey="Rejected" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issued Items per Division */}
        {/* <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Issued Items per Division</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issuedPerDivision}>
              <XAxis dataKey="division" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issued" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* ---- Commented Old Charts ---- */}
        {/* 
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Activities Summary</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Activity Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activities" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
*/}
    <div className="p-4 rounded-2xl shadow bg-white">
      <h2 className="text-lg font-semibold mb-3">Requests per Division (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={requestPerDivision}>
          <XAxis dataKey="division" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total_requests" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="p-4 rounded-2xl shadow bg-white">
      <h2 className="text-lg font-semibold mb-3">Issued per Division (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={issuedPerDivision}>
          <XAxis dataKey="division" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total_issued" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Users per Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usersPerRoleChart}>
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---- Recent Activity ---- */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
        <ul className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((act, index) => (
              <li
                key={index}
                className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div className="text-gray-700">
                  <span className="font-semibold">{act.id}</span>: {act.action}
                </div>
                <div className="mt-1 sm:mt-0 text-gray-400 text-sm">{act.date}</div>
              </li>
            ))
          ) : (
            <li className="py-4 text-gray-400 text-center">No recent activity</li>
          )}
        </ul>
      </div>
    </AdminLayout>
  );
}
