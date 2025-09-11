import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { TrashIcon } from "@heroicons/react/16/solid";
import { Head, Link, useForm } from '@inertiajs/react';
import { PenBoxIcon, PrinterCheckIcon } from 'lucide-react';
import { useEffect } from 'react'; // Only need useEffect

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
export default function IcsHigh({ icsRecords, user, filters }) {

  const { data, setData, get } = useForm({
    search: filters?.search ?? "",
    month: filters?.month ?? "",
    year: filters?.year ?? new Date().getFullYear(),
  });


useEffect(() => {
  const timeoutId = setTimeout(() => {
    get(route("supply_officer.ics_issuance_high"), {
      preserveState: true,
      replace: true,
      data,   // pass whole form state
    });
  }, 500); // debounce 500ms

  return () => clearTimeout(timeoutId);
}, [data.search, data.month, data.year]);



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
              value={data.month} // Use data.month
              onChange={(e) => setData('month', e.target.value)} // Use setData
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
              value={data.year} // Use data.year
              onChange={(e) => setData('year', e.target.value)} // Use setData
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Search ICS number, item..."
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm shadow-sm"
              value={data.search}
              onChange={(e) => setData('search', e.target.value)}
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
            <tbody className="divide-y divide-gray-100">
              {icsRecords?.data?.length > 0 ? (
                icsRecords.data.map((record, index) => {
                  const dateReceived = record?.created_at
                    ? new Date(record.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—";
                    console.log(record);

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{record.ics_number}</td>
                      <td className="px-4 py-2">{record.po?.rfq?.purchase_request?.division?.division ?? "N/A"}</td>
                      <td className="px-4 py-2">
                        {record.received_by?.firstname} {record.received_by?.lastname}
                      </td>
                      <td className="px-4 py-2">{record.inventory_item?.item_desc}</td>
                      <td className="px-4 py-2">{record.quantity}</td>
                      <td className="px-4 py-2">₱{Number(record.inventory_item?.unit_cost ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2">₱{(Number(record.inventory_item?.unit_cost ?? 0) * record.quantity).toFixed(2)}</td>
                      <td className="px-4 py-2">{dateReceived}</td>
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
                  <td colSpan="10" className="text-center">No RIS records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {icsRecords?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {icsRecords.links.map((link, index) => (
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