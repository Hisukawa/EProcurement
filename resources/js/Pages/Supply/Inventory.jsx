import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { PackageCheck } from "lucide-react";
import { useEffect, Fragment, useState } from "react";

export default function Inventory({ inventoryData, filters }) {
  const { data, setData, get } = useForm({
    search: filters.search || "",
    status: filters.status || "",
    date_received: filters.date_received || "",
  });

  // NEW: Selected items for multi-issuance
  const [selectedItems, setSelectedItems] = useState([]);

const toggleSelect = (id, stock) => {
  if (stock <= 0) return; // prevent selecting items with no stock
  setSelectedItems((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
};


  useEffect(() => {
    const delay = setTimeout(() => {
      get(route("supply_officer.inventory"), {
        preserveState: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(delay);
  }, [data.search, data.status, data.date_received]);

  const groupByPO = (inventory) => {
    if (!inventory || !inventory.data) return [];

    const grouped = new Map();

    inventory.data.forEach((inv) => {
      const po = inv.po_detail?.purchase_order;
      if (!po) return;

      if (!grouped.has(po.id)) {
        grouped.set(po.id, {
          po_id: po.id,
          po: po,
          requested_by: inv.requested_by,
          items: [],
        });
      }
      grouped.get(po.id).items.push(inv);
    });

    return Array.from(grouped.values());
  };

  const groupedInventoryData = groupByPO(inventoryData);

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Inventory">
      <Head title="Inventory" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Inventory</h2>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search item or Focal Person"
            className="w-64 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
          />

          <select
            value={data.status}
            onChange={(e) => setData("status", e.target.value)}
            className="border border-gray-300 px-8 py-2 rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
          </select>
        </form>
      </div>

      {/* NEW: Issue Selected Items Button */}
      {selectedItems.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() =>
              router.visit(route("supply_officer.issuance"), {
                method: "get",
                data: { items: selectedItems },
              })

            }
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <PackageCheck size={18} /> Issue Selected Items ({selectedItems.length})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3"></th> {/* NEW checkbox column */}

              {[
                "PO Number",
                "Requested By",
                "Specs",
                "Unit",
                "Remaining Stock",
                "Unit Cost",
                "Total Price",
                "Status",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-center">
            {groupedInventoryData.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-gray-500 text-lg font-medium">
                  No Inventory Found.
                </td>
              </tr>
            ) : (
              groupedInventoryData.map((group) => (
                <Fragment key={group.po_id}>
                  {/* PO group header */}
                  <tr className="bg-gray-100 font-semibold">
                    <td></td>
                    <td className="px-6 py-3 text-blue-700">
                      {group.po?.po_number ?? "N/A"}
                    </td>
                    <td className="px-6 py-3">
                      {group.requested_by
                        ? [group.requested_by.firstname, group.requested_by.middlename, group.requested_by.lastname]
                            .filter(Boolean)
                            .join(" ")
                        : "N/A"}
                    </td>
                    <td colSpan="7" className="text-left px-6 py-3">
                      {group.po?.supplier?.name ?? ""}
                    </td>
                  </tr>

                  {/* Item rows */}
                  {group.items.map((inv) => {
                    const unit = inv.unit?.unit ?? "N/A";
                    const unitCost = parseFloat(inv.unit_cost) || 0;
                    const issuedQty = parseFloat(inv.issued_qty) || 0;
                    const totalStock = parseFloat(inv.total_stock) || 0;
                    const remainingStock = Math.max(totalStock - issuedQty, 0);
                    const totalPrice = (unitCost * inv.total_stock).toFixed(2);

                    let statusLabel = "Available";
                    if (inv.total_stock === 0) statusLabel = "Fully Issued";
                    else if (inv.total_stock < totalStock) statusLabel = "Partially Issued";

                    return (
                      <tr key={inv.id} className="hover:bg-blue-50 transition duration-200">
                        {/* NEW checkbox */}
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(inv.id)}
                            disabled={remainingStock <= 0} // <-- disable if no stock left
                            onChange={() => toggleSelect(inv.id, remainingStock)}
                            className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>


                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4">{inv.item_desc ?? "No description"}</td>
                        <td className="px-6 py-4">{unit}</td>
                        <td className="px-6 py-4">{inv.total_stock}</td>
                        <td className="px-6 py-4">₱ {unitCost.toFixed(2)}</td>
                        <td className="px-6 py-4">₱ {totalPrice}</td>
                        <td className="px-6 py-4">{statusLabel}</td>

                        <td className="px-6 py-4">
                          {inv.total_stock <= 0 ? (
                            <span className="bg-gray-300 text-gray-600 px-3 py-2 rounded cursor-not-allowed flex items-center justify-center gap-1">
                              <PackageCheck size={16} /> All Items Are Issued
                            </span>
                          ) : (
                            <a
                              href={route("supply_officer.issuance", inv.id)}
                              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
                            >
                              <PackageCheck size={16} /> Issue Item
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center flex-wrap gap-1">
        {inventoryData.links.map((link, i) => (
          <button
            key={i}
            disabled={!link.url}
            onClick={() =>
              link.url &&
              get(link.url, {
                preserveState: true,
                preserveScroll: true,
              })
            }
            className={`px-3 py-1 text-sm border rounded-md ${
              link.active ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
    </SupplyOfficerLayout>
  );
}
