import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import TooltipLink from "@/Components/Tooltip";

export default function Quotation({ purchaseRequests, filters = {} }) {
  const [prNumber, setPrNumber] = useState(filters.prNumber || "");
  const [focalPerson, setFocalPerson] = useState(filters.focalPerson || "");
  const [division, setDivision] = useState(filters.division || "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.get(
        route("bac_user.for_quotations"),
        { prNumber, focalPerson, division },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 400);

    return () => clearTimeout(timeout);
  }, [prNumber, focalPerson, division]);

  return (
    <ApproverLayout header="Schools Divisions Office - Ilagan | Purchase Requests">
      <Head title="Purchase Requests for Quotation" />

      <div className="bg-white rounded-lg p-6 shadow space-y-6">
        <h2 className="text-lg font-bold text-gray-800">Purchase Requests for Quotation</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* Table */}
        {purchaseRequests.data.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-lg font-medium">
            No Purchase Request found
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr className="text-center">
                  {[
                    "PR Number",
                    "Focal Person",
                    "Division",
                    "Item",
                    "Specs",
                    "Unit",
                    "Quantity",
                    "Total Price",
                    "Actions",
                  ].map((title) => (
                    <th key={title} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-center">
                {purchaseRequests.data.map((pr) => {
                  const items = pr.details.map((d) => d.item);
                  const units = pr.details.map((d) => d.unit);
                  const specs = pr.details.map((d) => d.specs);
                  const quantities = pr.details.map((d) => d.quantity);
                  const totalPrice = pr.details.reduce((sum, d) => sum + (d.unit_price * d.quantity), 0);

                  const displayItems = items.slice(0, 2).join(", ");
                  const moreCount = items.length > 2 ? ` +${items.length - 2} more` : "";

                  return (
                    <tr key={pr.id} className="hover:bg-blue-50">
                      <td className="px-4 py-2 font-semibold">
                        {pr.rfqs && pr.rfqs.length > 0 ? (
                          <TooltipLink
                            to={route("bac_user.abstract_of_quotations", pr.id)}
                            tooltip="View Abstract of Quotations"
                            className="text-indigo-600 hover:underline"
                          >
                            {pr.pr_number}
                          </TooltipLink>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <span className="cursor-not-allowed">{pr.pr_number}</span>
                            <small className="text-xs italic text-red-500">No quotations submitted</small>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{[pr.focal_person.firstname, pr.focal_person.middlename, pr.focal_person.lastname].filter(Boolean).join(" ")}</td>
                      <td className="px-4 py-2 text-gray-700">{pr.division.division}</td>
                      <td className="px-4 py-2 text-gray-700">{displayItems}{moreCount}</td>
                      <td className="px-4 py-2 text-left">
                        <ul className="list-disc list-inside space-y-1">
                          {pr.details.slice(0, 2).map((d, i) => <li key={i}>{d.specs}</li>)}
                          {pr.details.length > 2 && <li className="text-gray-500 italic">+{pr.details.length - 2} more</li>}
                        </ul>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{units.slice(0, 2).join(", ")}{units.length > 2 ? ` +${units.length - 2} more` : ""}</td>
                      <td className="px-4 py-2 text-gray-700">{quantities.slice(0, 2).join(", ")}{quantities.length > 2 ? ` +${quantities.length - 2} more` : ""}</td>
                      <td className="px-4 py-2 text-gray-700">₱{totalPrice.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {pr.rfqs?.some(rfq => rfq.details?.some(d => d.is_winner_as_calculated)) ? (
                          <div className="flex flex-col items-center">
                            <button disabled className="inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md cursor-not-allowed">
                              Enter Quoted Price
                            </button>
                            <small className="text-xs text-red-500 mt-1 text-center">
                              Winner already selected
                            </small>
                          </div>
                        ) : (
                          <a href={route("bac_user.quoted_price", pr.id)} className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition">
                            Enter Quoted Price
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {purchaseRequests.links.length > 1 && (
              <div className="flex justify-center items-center gap-2 my-6 flex-wrap">
                {purchaseRequests.links.map((link, i) => (
                  <button
                    key={i}
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
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
