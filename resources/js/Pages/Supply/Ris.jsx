import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { Head, Link } from '@inertiajs/react';
import { PrinterCheck } from 'lucide-react';
import { useState } from 'react';

export default function Ris({ purchaseOrders, inventoryItems, ris, user }) {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [expandedRows, setExpandedRows] = useState([]); // ✅ moved here

  // Toggle expand/collapse rows
  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Pre-index inventory by (specs+unit)
  const inventoryMap = new Map(
    inventoryItems.map((inv) => [`${inv.item_desc}_${inv.inventory?.unit}`, inv.inventory])
  );

  // Pre-index RIS by (poId + inventoryId)
  const risMap = new Map();
  ris?.data?.forEach((r) => {
    const key = `${r.po_id}_${r.inventory_item_id}`;
    if (!risMap.has(key)) risMap.set(key, []);
    risMap.get(key).push(r);
  });

  // Apply filters and search
  const filteredRis =
    ris?.data?.filter((record) => {
      const risNo = record.ris_number?.toLowerCase() ?? '';
      const issuedTo = `${record.issued_to?.firstname ?? ''} ${
        record.issued_to?.lastname ?? ''
      }`.toLowerCase();
      const division =
        record.po?.details?.[0]?.pr_detail?.purchase_request?.division?.division?.toLowerCase() ??
        '';

      // Items text (description)
      const itemsText =
        record.items?.map((item) => item.inventory_item?.item_desc ?? '').join(' ').toLowerCase();

      // Search match
      const matchesSearch =
        risNo.includes(search.toLowerCase()) ||
        issuedTo.includes(search.toLowerCase()) ||
        division.includes(search.toLowerCase()) ||
        itemsText.includes(search.toLowerCase());

      // Date filter
      const recordDate = record.items?.[0]?.created_at ? new Date(record.items[0].created_at) : null;

      const matchesMonth = filterMonth
        ? recordDate && recordDate.getMonth() + 1 === parseInt(filterMonth)
        : true;

      const matchesYear = filterYear
        ? recordDate && recordDate.getFullYear() === parseInt(filterYear)
        : true;

      return matchesSearch && matchesMonth && matchesYear;
    }) || [];

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Requisition and Issue Slip">
      <Head title="RIS" />
      <IssuanceTabs />

      <div className="bg-white rounded-lg p-6 shadow space-y-4">
        {/* Header + Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold mb-4">Requisition and Issue Slip (RIS)</h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => (window.location.href = route('supply_officer.export_excel'))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            >
              Report for this Month
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (filterMonth) params.append("month", filterMonth);
                if (filterYear) params.append("year", filterYear);

                window.location.href = route("supply_officer.generate_report") + "?" + params.toString();
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
            >
              Generate Report
            </button>

          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month:</label>
            <select
              className="border border-gray-300 rounded-md px-7 py-1 text-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All</option>
              {[
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ].map((month, idx) => (
                <option key={idx} value={idx + 1}>
                  {month}
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

          <div>
            <input
              type="text"
              placeholder="Search Focal Person, RIS number..."
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">RIS No.</th>
                <th className="px-4 py-2">Division</th>
                <th className="px-4 py-2">Issued To/Focal Person</th>
                <th className="px-4 py-2">Item Description</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit Cost</th>
                <th className="px-4 py-2">Total Cost</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRis.length > 0 ? (
                filteredRis.map((record, index) => {
                  const hasMoreThanTwoItems = record.items?.length > 2;
                  const isExpanded = expandedRows.includes(record.id);

                  const itemsWithDates =
                    record.items?.map((item) => ({
                      description: item.inventory_item?.item_desc ?? 'N/A',
                      quantity: item.quantity,
                      unitCost: Number(item.inventory_item?.unit_cost ?? 0),
                      totalCost: Number(item.inventory_item?.unit_cost ?? 0) * item.quantity,
                      date: new Date(item.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }),
                    })) || [];

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{record.ris_number}</td>
                      <td className="px-4 py-2">
                        {record.po?.details?.[0]?.pr_detail?.purchase_request?.division?.division ??
                          'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        {record.issued_to?.firstname} {record.issued_to?.lastname}
                      </td>

                      {/* Item Description */}
                      <td className="px-4 py-2">
                        {itemsWithDates.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.description}</div>
                        ))}
                        {hasMoreThanTwoItems && !isExpanded && (
                          <button
                            onClick={() => toggleRow(record.id)}
                            className="text-blue-600 hover:underline text-sm mt-1"
                          >
                            +{itemsWithDates.length - 2} more
                          </button>
                        )}
                        {isExpanded &&
                          itemsWithDates.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.description}</div>
                          ))}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2">
                        {itemsWithDates.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.quantity}</div>
                        ))}
                        {isExpanded &&
                          itemsWithDates.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.quantity}</div>
                          ))}
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-2">
                        {itemsWithDates.slice(0, 2).map((item, idx) => (
                          <div key={idx}>₱{item.unitCost.toFixed(2)}</div>
                        ))}
                        {isExpanded &&
                          itemsWithDates.slice(2).map((item, idx) => (
                            <div key={idx + 2}>₱{item.unitCost.toFixed(2)}</div>
                          ))}
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-2">
                        {itemsWithDates.slice(0, 2).map((item, idx) => (
                          <div key={idx}>₱{item.totalCost.toFixed(2)}</div>
                        ))}
                        {isExpanded &&
                          itemsWithDates.slice(2).map((item, idx) => (
                            <div key={idx + 2}>₱{item.totalCost.toFixed(2)}</div>
                          ))}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2">
                        {itemsWithDates.slice(0, 2).map((item, idx) => (
                          <div key={idx}>{item.date}</div>
                        ))}
                        {isExpanded &&
                          itemsWithDates.slice(2).map((item, idx) => (
                            <div key={idx + 2}>{item.date}</div>
                          ))}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2 text-center space-x-2 flex">
                        <a
                          href={route('supply_officer.print_ris', record.id)}
                          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
                          target="_blank"
                        >
                          <PrinterCheck size={16} /> Print
                        </a>
                        <button className="bg-blue-600 text-white px-3 py-2 rounded">
                          Switch Type
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">
                    No RIS records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ris?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {ris.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'}
                className={`
                  px-3 py-1 text-sm rounded-md
                  ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                  ${!link.url && 'opacity-50 cursor-not-allowed'}
                `}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </nav>
        )}
      </div>
    </SupplyOfficerLayout>
  );
}
