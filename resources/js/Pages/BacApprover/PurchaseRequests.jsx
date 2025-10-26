import TooltipLink from "@/Components/Tooltip";
import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function PurchaseRequests({ purchaseRequests, filters = {} }) {
  const [prNumber, setPrNumber] = useState(filters.prNumber || "");
  const [focalPerson, setFocalPerson] = useState(filters.focalPerson || "");
  const [division, setDivision] = useState(filters.division || "");

  // Debounced filter update
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(
        route("bac_user.purchase_requests"),
        { prNumber, focalPerson, division },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 400);
    return () => clearTimeout(delay);
  }, [prNumber, focalPerson, division]);

  return (
    <ApproverLayout header="Schools Division Office - Ilagan | Purchase Requests">
      <Head title="Purchase Requests" />

      <div className="bg-white rounded-lg p-6 shadow space-y-6">
        <h2 className="text-lg font-bold text-gray-800">Purchase Requests</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            placeholder="Search PR Number..."
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-60"
          />
          <input
            type="text"
            value={focalPerson}
            onChange={(e) => setFocalPerson(e.target.value)}
            placeholder="Search Focal Person..."
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-60"
          />
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-44"
          >
            <option value="">All Divisions</option>
            <option value="1">SGOD</option>
            <option value="2">OSDS</option>
            <option value="3">CID</option>
          </select>
        </div>

        {/* Table */}
        {purchaseRequests.data.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-lg font-medium">
            No Purchase Requests found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {["PR Number", "Focal Person", "Division", "Requested By", "Status", "Items Summary"].map((title) => (
                    <th
                      key={title}
                      className="px-6 py-3 text-center font-semibold uppercase tracking-wider text-xs"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {purchaseRequests.data.map((pr) => (
                  <tr key={pr.id} className="text-center hover:bg-indigo-50 transition">
                    <td className="px-6 py-4 text-gray-800">
                      <TooltipLink
                        // to={route("bac_user.show_details", pr.id)}
                        // tooltip="View PR details"
                        // className="hover:underline focus:underline"
                      >
                        {pr.pr_number}
                      </TooltipLink>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {[pr.focal_person.firstname, pr.focal_person.middlename, pr.focal_person.lastname]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td className="px-6 py-4 text-gray-800">{pr.division.division}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.requested_by}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          pr.status.toLowerCase() === "approved"
                            ? "bg-green-100 text-green-800"
                            : pr.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : pr.status.toLowerCase() === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-left">
                      {pr.details.length > 0
                        ? pr.details.map((d, index) => (
                            <div key={index} className="italic">
                              {d.item} {pr.details.length > 1 && index === 0 ? `and ${pr.details.length - 1} more...` : ""}
                            </div>
                          ))
                        : "No items"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 my-6 flex-wrap">
              {purchaseRequests.links.map((link, i) => (
                <button
                  key={i}
                  disabled={!link.url}
                  onClick={() =>
                    link.url &&
                    router.visit(link.url, {
                      preserveScroll: true,
                      preserveState: true,
                    })
                  }
                  className={`px-4 py-2 text-sm rounded-md border transition ${
                    link.active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                  } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ApproverLayout>
  );
}
