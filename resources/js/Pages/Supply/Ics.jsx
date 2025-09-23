import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { TrashIcon } from '@heroicons/react/16/solid';
import { Head, Link } from '@inertiajs/react';
import { PenBoxIcon, PrinterCheck, PrinterCheckIcon } from 'lucide-react';
import { useState } from 'react';


export default function Ics({ purchaseOrders, inventoryItems, ics, user }) {
  console.log(ics);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const getInventory = (poId, inventoryId) =>
    inventoryItems.find(
      (inv) => inv.po_id === poId && inv.inventory?.id === inventoryId
    )?.inventory;

  const filteredIcs = ics?.data?.filter((record) => {
    const matchesSearch =
      search === '' ||
      record.ics_number?.toLowerCase().includes(search.toLowerCase()) ||
      record.inventory_item?.item_desc?.toLowerCase().includes(search.toLowerCase());

    const recordDate = new Date(record.created_at);
    const matchesMonth = filterMonth === '' || recordDate.getMonth() + 1 === Number(filterMonth);
    const matchesYear = filterYear === '' || recordDate.getFullYear() === Number(filterYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - ICS LOW">
      <Head title="ICS - LOW" />
      <IssuanceTabs />

      <div className="bg-white rounded-lg p-6 shadow space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month:</label>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium ml-4">Year:</label>
            <input
              type="number"
              className="border border-gray-300 rounded-md px-2 py-1 w-20 text-sm"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            />
          </div>

          <input
            type="text"
            placeholder="Search ICS number, item..."
            className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">ICS No.</th>
                <th className="px-4 py-2">Division</th>
                <th className="px-4 py-2">Received By/Focal Person</th>
                <th className="px-4 py-2">Item Description</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit Cost</th>
                <th className="px-4 py-2">Total Cost</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIcs && filteredIcs.length > 0 ? (
                filteredIcs.map((record, index) => {
                  const hasMoreThanTwoItems = record.items?.length > 2;
                  const [expandedRows, setExpandedRows] = useState([]);

                  const isExpanded = expandedRows.includes(record.id);

                  const toggleRow = (id) => {
                    setExpandedRows((prev) =>
                      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
                    );
                  };

                  const itemsWithDetails = record.items?.map(item => ({
                    description: item.inventoryItem?.product?.name ?? item.inventory_item?.item_desc ?? 'N/A',
                    specs: item.inventoryItem?.product?.specs ?? '',
                    quantity: item.quantity,
                    unitCost: Number(item.unit_cost ?? 0),
                    totalCost: Number(item.total_cost ?? 0),
                    date: new Date(item.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                  })) || [];

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{record.ics_number}</td>
                      <td className="px-4 py-2">{record.po?.rfq?.purchase_request?.division?.division ?? "N/A"}</td>
                      <td className="px-4 py-2">
                        {record.received_by?.firstname} {record.received_by?.lastname}
                      </td>

                      {/* Item Description */}
                      <td className="px-4 py-2">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.description}{item.specs && ` - ${item.specs}`}</div>
                        ))}
                        {hasMoreThanTwoItems && !isExpanded && (
                          <button
                            onClick={() => toggleRow(record.id)}
                            className="text-blue-600 hover:underline text-sm mt-1"
                          >
                            +{itemsWithDetails.length - 2} more
                          </button>
                        )}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.description}{item.specs && ` - ${item.specs}`}</div>
                          ))
                        }
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>{item.quantity}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>{item.quantity}</div>)
                        }
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-2">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>₱{item.unitCost.toFixed(2)}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>₱{item.unitCost.toFixed(2)}</div>)
                        }
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-2">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>₱{item.totalCost.toFixed(2)}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>₱{item.totalCost.toFixed(2)}</div>)
                        }
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>{item.date}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>{item.date}</div>)
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2 text-center space-x-2">
                        <a
                          href={route("supply_officer.print_ics", record.id)}
                          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
                          target="_blank"
                        >
                          <PrinterCheck size={16} /> Print
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">No ICS records found</td>
                </tr>
              )}
            </tbody>



          </table>
        </div>

        {/* Pagination */}
        {ics?.links?.length > 0 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {ics.links.map((link, idx) => (
              <Link
                key={idx}
                href={link.url || '#'}
                className={`px-3 py-1 text-sm rounded-md ${
                  link.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </nav>
        )}
      </div>
    </SupplyOfficerLayout>
  );
}
