import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";

export default function ActivityLog({ activities }) {
  return (
    <AdminLayout header="System Activity Log">
      <Head title="Activity Log" />

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          All System Activities
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Issued By</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Issued To</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((act, idx) => (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-gray-50 transition`}
                  >
                    <td className="px-4 py-3 text-gray-700 font-semibold">{act.id}</td>
                    <td className="px-4 py-3 text-gray-700">{act.action}</td>
                    <td className="px-4 py-3 text-gray-700">{act.issued_by ?? act.user ?? 'System'}</td>
                    <td className="px-4 py-3 text-gray-700">{act.issued_to ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{act.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-gray-400"
                  >
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
