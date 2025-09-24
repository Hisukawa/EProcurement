import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { TrashIcon } from "@heroicons/react/16/solid";
import { Head, Link, useForm } from '@inertiajs/react';
import { PenBoxIcon, PrinterCheck, PrinterCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react'; // Only need useEffect
import Ics from './Ics';

// A small helper function to safely get nested data. This is crucial to prevent crashes.
const getSafe = (fn, defaultValue = "N/A") => {
  try {
    const value = fn();
    return value === null || value === undefined ? defaultValue : value;
  } catch (e) {
    return defaultValue;
  }
};

// The component now accepts a simple `icsRecords` prop, plus filters and user.
export default function IcsHigh({ ics, user, filters }) {

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
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Inventory Custodian Slip (ICS) - HIGH">
      <Head title='ICS - HIGH' />
      <IssuanceTabs />

      <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-xl font-bold text-gray-800">Inventory Custodian Slip (ICS) - HIGH VALUE</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow">
              Monthly Report
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow">
              Export PDF
            </button>
          </div>
        </div>
        
        {/* Filter Controls now use `data` and `setData` from the single useForm hook */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <label htmlFor="month-filter" className="text-sm font-medium">Month:</label>
            <select
              id="month-filter"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm shadow-sm"
              value={filterMonth} // <-- use local state
              onChange={(e) => setFilterMonth(e.target.value)} // <-- update local state
            >

              <option value="">All</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>

            <label htmlFor="year-filter" className="text-sm font-medium ml-4">Year:</label>
            <input
              id="year-filter"
              type="number"
              className="border border-gray-300 rounded-md px-2 py-1 w-24 text-sm shadow-sm"
              value={filterYear} // <-- use local state
              onChange={(e) => setFilterYear(e.target.value)} // <-- update local state
            />

          </div>

          <div>
            <input
              type="text"
              placeholder="Search ICS number, item..."
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm shadow-sm"
              value={search} // <-- use local state
              onChange={(e) => setSearch(e.target.value)} // <-- update local state
            />

          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">ICS No.</th>
                <th className="px-4 py-3">Division</th>
                <th className="px-4 py-3">Received By</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
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

                  const itemsWithDetails = record.items
                  ?.filter(item => item.type === 'high') // or 'high' for IcsHigh component
                  .map(item => ({
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
                      <td className="px-4 py-2">{record.received_by?.firstname} {record.received_by?.lastname}</td>

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
                          ))}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2 text-center">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>{item.quantity}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>{item.quantity}</div>)
                        }
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-2 text-right">
                        {itemsWithDetails.slice(0, 2).map((item, idx) => <div key={idx}>₱{item.unitCost.toFixed(2)}</div>)}
                        {isExpanded &&
                          itemsWithDetails.slice(2).map((item, idx) => <div key={idx + 2}>₱{item.unitCost.toFixed(2)}</div>)
                        }
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-2 text-right">
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
                      <td className="flex px-4 py-2 text-center space-x-2">
                        <a
                          href={route("supply_officer.print_ics", { id: record.id, type: "high" })}
                          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
                          target="_blank"
                        >
                          <PrinterCheck size={16} /> Print
                        </a>
                        <a
                          href={route("supply_officer.print_ics_all", record.id)}
                          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
                          target="_blank"
                        >
                          <PrinterCheck size={16} /> Print All
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
        {ics?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {ics.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'} // Use '#' for disabled links
                className={`
                  px-3 py-1 text-sm rounded-md
                  ${link.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                  ${!link.url && 'opacity-50 cursor-not-allowed'}
                `}
                dangerouslySetInnerHTML={{ __html: link.label }} // Render HTML entities like &laquo;
              />
            ))}
          </nav>
        )}
      </div>
    </SupplyOfficerLayout>
  );
}