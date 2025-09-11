import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head } from "@inertiajs/react";
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Approved({ purchaseRequests }) {
  return (
    <ApproverLayout header="Schools Divisions Office - Ilagan | Purchase Requests">
      <Head title="Approved Purchase Requests" />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Approved Purchase Requests
          </h2>

          {/* <div className="flex flex-wrap gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow">
              Monthly Report
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow">
              Export PDF
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm shadow">
              Export Excel
            </button>
          </div> */}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            name="prNumber"
            placeholder="Filter by PR Number"
            className="rounded-md border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            name="focalPerson"
            placeholder="Filter by Focal Person"
            className="rounded-md border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            name="division"
            defaultValue=""
            className="rounded-md border-gray-300 px-8 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Divisions</option>
            {/* Optionally map divisions here */}
          </select>
        </div>

        {/* Table or No Data Message */}
        {purchaseRequests.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-lg font-medium">
            No Purchase Request found
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-center">
                <tr>
                  {[
                    "PR Number",
                    "Focal Person",
                    "Division",
                    "Item",
                    "Specs",
                    "Unit",
                    // "Quantity",
                    "Total Price",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-center">
                {purchaseRequests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                      {pr.pr_number}
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {`${pr.focal_person.firstname} ${pr.focal_person.middlename} ${pr.focal_person.lastname}`}
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {pr.division.division}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {pr.details.length > 0 ? pr.details[0].item : "—"}
                      {pr.details.length > 1 && (
                        <span className="text-gray-400 text-xs ml-1 italic">
                          +{pr.details.length - 1} more
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {pr.details.length > 0 ? pr.details[0].specs : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {pr.details.length > 0 ? pr.details[0].unit : "—"}
                    </td>
                    {/* <td className="px-6 py-4 text-gray-700">
                      {pr.details.reduce((sum, d) => sum + d.quantity, 0)}
                    </td> */}
                    <td className="px-6 py-4 text-gray-700">
                      {pr.details.reduce(
                        (sum, d) => sum + parseFloat(d.total_item_price || 0),
                        0
                      ).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      {pr.rfqs?.pr_id ? (
                        <span className="text-sm font-medium text-green-700">RFQs Submitted</span>
                      ) : (
                        <a
                          href={route("bac_approver.generate_rfq", pr.id)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm shadow transition"
                        >
                          <DocumentTextIcon className="w-5 h-5 mr-2" />
                          Generate RFQ
                        </a>
                      )}
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
            
          </div>
        )}
      </div>
    </ApproverLayout>
  );
}
