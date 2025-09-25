import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Approved({ purchaseRequests, filters = {} }) {
  const [prNumber, setPrNumber] = useState(filters.prNumber || "");
  const [focalPerson, setFocalPerson] = useState(filters.focalPerson || "");
  const [division, setDivision] = useState(filters.division || "");

  // Debounced filter update
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(
        route("bac_approver.approved_requests"),
        { prNumber, focalPerson, division },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 400);
    return () => clearTimeout(delay);
  }, [prNumber, focalPerson, division]);

  return (
    <ApproverLayout header="Schools Divisions Office - Ilagan | Approved Purchase Requests">
      <Head title="Approved Purchase Requests" />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Approved Purchase Requests
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            placeholder="Filter by PR Number"
            className="rounded-md border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            value={focalPerson}
            onChange={(e) => setFocalPerson(e.target.value)}
            placeholder="Filter by Focal Person"
            className="rounded-md border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-md border-gray-300 px-8 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Divisions</option>
            <option value="1">SGOD</option>
            <option value="2">OSDS</option>
            <option value="3">CID</option>
          </select>
        </div>

        {/* Table or No Data */}
        {purchaseRequests.data.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-lg font-medium">
            No Purchase Requests found
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-center">
                <tr>
                  {[
                    "PR Number", "Focal Person", "Division", "Item", "Specs",
                    "Unit", "Total Price", "Action"
                  ].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-center">
                {purchaseRequests.data.map((pr) => (
                  <tr key={pr.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">{pr.pr_number}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{`${pr.focal_person.firstname} ${pr.focal_person.middlename} ${pr.focal_person.lastname}`}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{pr.division.division}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.details.length > 0 ? pr.details[0].item : "—"}{pr.details.length > 1 && (<span className="text-gray-400 text-xs ml-1 italic">+{pr.details.length - 1} more</span>)}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.details.length > 0 ? pr.details[0].specs : "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.details.length > 0 ? pr.details[0].unit : "—"}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.details.reduce((sum, d) => sum + parseFloat(d.total_item_price || 0), 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {pr.rfqs?.pr_id ? (
                        <span className="text-sm font-medium text-green-700">RFQs Submitted</span>
                      ) : (
                        <a href={route("bac_approver.generate_rfq", pr.id)} className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm shadow transition">
                          <DocumentTextIcon className="w-5 h-5 mr-2" />
                          Generate RFQ
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {purchaseRequests.links.length > 1 && (
              <div className="flex justify-center items-center gap-2 my-6 flex-wrap">
                {purchaseRequests.links.map((link, i) => (
                  <button
                    key={i}
                    disabled={!link.url}
                    onClick={() =>
                      link.url &&
                      router.visit(link.url, { preserveScroll: true, preserveState: true })
                    }
                    className={`px-4 py-2 text-sm rounded-md border transition ${link.active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"} ${!link.url && "opacity-50 cursor-not-allowed"}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ApproverLayout>
  );
}
