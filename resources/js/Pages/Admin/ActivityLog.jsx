import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { useState, useMemo } from "react";
import ReactPaginate from "react-paginate";

export default function ActivityLog({ activities }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Filter activities based on the search query
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const action = activity.action || "";
      const issuedBy = activity.issued_by || "";
      const issuedTo = activity.issued_to || "";

      return (
        action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issuedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issuedTo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activities, searchQuery]);

  // Paginate filtered activities
  const paginatedActivities = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  // Handle page change
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <AdminLayout header="System Activity Log">
      <Head title="Activity Log" />

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          All System Activities
        </h2>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Action, Issued By, or Issued To..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
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
              {paginatedActivities.length > 0 ? (
                paginatedActivities.map((act, idx) => (
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

        {/* Pagination */}
        {filteredActivities.length > itemsPerPage && (
          <div className="mt-4 flex justify-center">
            <ReactPaginate
              pageCount={Math.ceil(filteredActivities.length / itemsPerPage)}
              pageRangeDisplayed={5}
              marginPagesDisplayed={2}
              onPageChange={handlePageChange}
              containerClassName="pagination"
              previousLabel="Previous"
              nextLabel="Next"
              breakLabel="..."
              className="flex items-center space-x-2"
              pageClassName="px-4 py-2 bg-gray-200 rounded-md cursor-pointer"
              activeClassName="active bg-blue-500 text-white"
              disabledClassName="text-gray-400 cursor-not-allowed"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
