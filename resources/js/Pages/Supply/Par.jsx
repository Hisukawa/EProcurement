import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { TrashIcon } from '@heroicons/react/16/solid';
import { Head, Link } from '@inertiajs/react';
import { PenBoxIcon, PrinterCheckIcon } from 'lucide-react';
import { useState } from 'react';


export default function Par({purchaseOrders, inventoryItems, par, user}) {

    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  
    const getInventory = (specs, unitId) => inventoryItems?.data?.find(
      inv =>
        inv.item_desc === specs && inv.inventory?.unit === unitId
    )?.inventory;
  
    const getIcsRecords = (poId, inventoryID) => par?.data?.find(
      i => i.po_id === poId && i.inventory_item_id === inventoryID
    );
  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Requisition and Issue Slip">
      <Head title='PAR'/>
      <IssuanceTabs />

      {/* Your RIS content here */}
        {/* RIS table or form here */}
         <div className="bg-white rounded-lg p-6 shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold mb-4">Inventory Custodian Slip (ICS)</h2>
          {/* RIS table or form here */}
          {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow">
                Monthly Report
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow">
                Export PDF
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm shadow">
                Export Excel
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm shadow">
                + New RIS
              </button>
            </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month:</label>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
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
              placeholder="Search RIS number, item..."
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">PAR No.</th>
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
            <tbody className="divide-y divide-gray-100">
              {par?.data?.length > 0 ? (
                par.data.map((record, index) => {
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
                      <td className="px-4 py-2">{record.par_number}</td>
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
        {par?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {par.links.map((link, index) => (
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
