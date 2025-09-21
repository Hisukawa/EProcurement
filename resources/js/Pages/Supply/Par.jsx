import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Par({ purchaseOrders, inventoryItems, par, user }) {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
const [expandedRows, setExpandedRows] = useState([]);

  const filteredPar = par?.data?.filter(record => {
    const matchesSearch =
      search === '' ||
      record.par_number?.toLowerCase().includes(search.toLowerCase()) ||
      record.inventory_item?.item_desc?.toLowerCase().includes(search.toLowerCase());

    const recordDate = new Date(record.created_at);
    const matchesMonth = filterMonth === '' || recordDate.getMonth() + 1 === Number(filterMonth);
    const matchesYear = filterYear === '' || recordDate.getFullYear() === Number(filterYear);

    return matchesSearch && matchesMonth && matchesYear;
  });
  console.log(filteredPar);
  const toggleRow = (id) => {
  setExpandedRows((prev) =>
    prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
  );
};


  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | PAR">
      <Head title="PAR" />
      <IssuanceTabs />

      <div className="bg-white rounded-lg p-6 shadow space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month:</label>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
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
              onChange={e => setFilterYear(e.target.value)}
            />
          </div>

          <input
            type="text"
            placeholder="Search PAR number, item..."
            className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">PAR No.</th>
                <th className="px-4 py-2">Division</th>
                <th className="px-4 py-2">Received By</th>
                <th className="px-4 py-2">Item Description</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit Cost</th>
                <th className="px-4 py-2">Total Cost</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPar && filteredPar.length > 0 ? (
                filteredPar.map((record, index) => {
                  const hasMoreThanTwoItems = record.items.length > 2;
                  const isExpanded = expandedRows.includes(record.id);

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{record.par_number}</td>
                      <td className="px-4 py-2">
                        {record.po?.rfq?.purchase_request?.division?.division ?? "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {record.received_by?.firstname} {record.received_by?.lastname}
                      </td>

                      {/* Item Description */}
                      <td className="px-4 py-2">
                        {record.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.inventory_item?.item_desc}</div>
                        ))}
                        {hasMoreThanTwoItems && !isExpanded && (
                          <button
                            onClick={() => toggleRow(record.id)}
                            className="text-blue-600 hover:underline text-sm mt-1"
                          >
                            +{record.items.length - 2} more
                          </button>
                        )}
                        {isExpanded &&
                          record.items.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.inventory_item?.item_desc}</div>
                          ))}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2">
                        {record.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.quantity}</div>
                        ))}
                        {isExpanded &&
                          record.items.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.quantity}</div>
                          ))}
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-2">
                        {record.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>₱{Number(item.unit_cost).toFixed(2)}</div>
                        ))}
                        {isExpanded &&
                          record.items.slice(2).map((item, idx) => (
                            <div key={idx + 2}>₱{Number(item.unit_cost).toFixed(2)}</div>
                          ))}
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-2">
                        {record.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>₱{Number(item.total_cost).toFixed(2)}</div>
                        ))}
                        {isExpanded &&
                          record.items.slice(2).map((item, idx) => (
                            <div key={idx + 2}>₱{Number(item.total_cost).toFixed(2)}</div>
                          ))}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2">
                        {record.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {new Date(item.inventory_item?.last_received || item.created_at).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        ))}
                        {isExpanded &&
                          record.items.slice(2).map((item, idx) => (
                            <div key={idx + 2}>
                              {new Date(item.inventory_item?.last_received || item.created_at).toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          ))}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2 text-center space-x-2">
                        <button className="text-blue-600 hover:underline">Edit</button>
                        <button className="text-green-600 hover:underline">Copy</button>
                        <button className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">No PAR records found</td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        {par?.links?.length > 0 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {par.links.map((link, idx) => (
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
