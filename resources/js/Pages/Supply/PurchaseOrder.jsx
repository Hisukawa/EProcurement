import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, useForm } from "@inertiajs/react";
import React, { useEffect } from "react";

export default function PurchaseOrder({ purchaseRequests, filters }) {
  const { data, setData, get } = useForm({
    search: filters.search || "",
    division: filters.division || "",
  });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      get(route("supply_officer.purchase_orders"), {
        preserveState: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [data.search, data.division]);

  return (
    <SupplyOfficerLayout header="Schools Division Office - Ilagan | Create Purchase Order">
      <Head title="Purchase Order" />

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">
          Purchase Requests with Selected Suppliers
        </h2>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            name="search"
            placeholder="Search PR number or focal person"
            className="w-96 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
          />
          <select
            value={data.division}
            onChange={(e) => setData("division", e.target.value)}
            className="border border-gray-300 px-10 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Divisions</option>
            {filters.divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.division}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "PR Number",
                "Focal Person",
                "Division",
                "Item",
                "Specs",
                "Quantity",
                "Unit",
                "Winner Supplier",
                "Quoted Price",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center whitespace-nowrap"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-center">
            {purchaseRequests.data.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-gray-500 text-lg font-medium">
                  No Purchase Requests with winners found.
                </td>
              </tr>
            ) : (
              purchaseRequests.data.map((pr) => {
                const winningDetails = pr.details.filter((detail) =>
                  pr.rfqs?.flatMap((r) => r.details).some(
                    (d) => d.pr_details_id === detail.id && d.is_winner
                  )
                );

                if (winningDetails.length === 0) return null;

                const winners = pr.rfqs
                  ?.flatMap((r) => r.details ?? [])
                  .filter((d) => winningDetails.some((wd) => wd.id === d.pr_details_id) && d.is_winner);

                // Total quoted price
                const totalQuotedPrice = winners.reduce(
                  (sum, w) => sum + parseFloat(w.quoted_price || 0),
                  0
                );

                return (
                  <tr key={`pr-${pr.id}`} className="hover:bg-blue-50 transition duration-200">
                    <td className="px-6 py-4 font-semibold text-blue-700 whitespace-nowrap">
                      {pr.pr_number}
                    </td>
                    <td className="px-6 py-4">
                      {pr.focal_person.firstname} {pr.focal_person.lastname}
                    </td>
                    <td className="px-6 py-4">{pr.division.division}</td>

                    {/* Item */}
                    <td className="px-6 py-4">
                      {winningDetails[0]?.product.name || "—"}
                      {winningDetails.length > 1 && (
                        <span className="text-gray-400 text-xs ml-1 italic">
                          +{winningDetails.length - 1} more
                        </span>
                      )}
                    </td>

                    {/* Specs */}
                    <td className="px-6 py-4">
                      {winningDetails[0]?.product.specs || "—"}
                      {winningDetails.length > 1 && (
                        <span className="text-gray-400 text-xs ml-1 italic">
                          +{winningDetails.length - 1} more
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4">
                      {winningDetails[0]?.quantity || "—"}
                      {new Set(winningDetails.map((d) => d.quantity)).size > 1 && (
                        <span className="text-gray-400 text-xs ml-1 italic">
                          +{winningDetails.length - 1} more
                        </span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="px-6 py-4">
                      {winningDetails[0]?.product.unit.unit || "—"}
                      {new Set(winningDetails.map((d) => d.product.unit.unit)).size > 1 && (
                        <span className="text-gray-400 text-xs ml-1 italic">
                          +{winningDetails.length - 1} more
                        </span>
                      )}
                    </td>

                    {/* Winner Supplier */}
                    <td className="px-6 py-4">
                      {[...new Set(winners.map((w) => w.supplier?.company_name || "N/A"))].join(", ")}
                    </td>

                    {/* Total Quoted Price */}
                    <td className="px-6 py-4">
                      ₱ {totalQuotedPrice.toFixed(2)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 align-middle">
                      <a
                        href={route("supply_officer.create_po", pr.id)}
                        className={`inline-block px-4 py-2 text-sm font-medium rounded-md transition ${
                          pr.has_po
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        onClick={(e) => pr.has_po && e.preventDefault()}
                      >
                        {pr.has_po ? "PO Generated" : "Purchase Order"}
                      </a>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>



        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center flex-wrap gap-1">
        {purchaseRequests.links.map((link, i) => (
          <button
            key={i}
            disabled={!link.url}
            onClick={() =>
              link.url &&
              get(link.url, {
                data,
                preserveState: true,
                preserveScroll: true,
              })
            }

            className={`px-3 py-1 text-sm border rounded-md ${
              link.active
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
    </SupplyOfficerLayout>
  );
}
