import RequesterIssuedTabs from "@/Layouts/RequesterIssuedTabs";
import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";

export default function IcsIssuedLow({ ics }) {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const filteredIcs = ics?.data?.filter(record => {
    const matchesSearch = search === '' ||
      record.ics_number?.toLowerCase().includes(search.toLowerCase()) ||
      record.items?.some(item => item.inventory_item?.item_desc?.toLowerCase().includes(search.toLowerCase()));

    const recordDate = new Date(record.created_at);
    const matchesMonth = filterMonth === '' || recordDate.getMonth() + 1 === Number(filterMonth);
    const matchesYear = filterYear === '' || recordDate.getFullYear() === Number(filterYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <RequesterLayout header="Schools Division Office - Ilagan | Issued ICS Low">
      <Head title="Issued ICS Low"/>
      <RequesterIssuedTabs/>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold mb-4">Inventory Custodian Slip - Low (ICS)</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.location.href = route("supply_officer.export_excel")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
            >
              Monthly Report
            </button>
            <button
              onClick={() => window.location.href = route("supply_officer.export_excel", { month: filterMonth, year: filterYear })}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month:</label>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            >
              <option value="">All</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
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
            placeholder="Search ICS number, item..."
            className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2 border">ICS No.</th>
                <th className="px-4 py-2 border">Item Description</th>
                <th className="px-4 py-2 border">Quantity</th>
                <th className="px-4 py-2 border">Date Issued</th>
                <th className="px-4 py-2 border">Issued By</th>
              </tr>
            </thead>
            <tbody>
              {filteredIcs && filteredIcs.length > 0 ? filteredIcs.map((record, index) => {
                const items = record.items || [];
                const isExpanded = expandedRows.includes(record.id);
                const hasMoreThanOneItem = items.length > 1;
                const dateIssued = record?.created_at
                  ? new Date(record.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
                  : "—";

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => hasMoreThanOneItem && toggleRow(record.id)}
                  >
                    <td className="px-4 py-2 border">{index + 1}</td>
                    <td className="px-4 py-2 border font-medium">{record.ics_number}</td>
                    <td className="px-4 py-2 border">
                      {items.length > 0 ? items[0].inventory_item?.item_desc : 'N/A'}
                      {hasMoreThanOneItem && !isExpanded && (
                        <div className="text-blue-600 text-sm mt-1">+{items.length - 1} more</div>
                      )}
                      {isExpanded && items.slice(1).map((item, idx) => (
                        <div key={idx + 1} className="mt-1">{item.inventory_item?.item_desc}</div>
                      ))}
                    </td>
                    <td className="px-4 py-2 border">
                      {items.length > 0 ? items[0].quantity : 'N/A'}
                      {isExpanded && items.slice(1).map((item, idx) => (
                        <div key={idx + 1}>{item.quantity}</div>
                      ))}
                    </td>
                    <td className="px-4 py-2 border">{dateIssued}</td>
                    <td className="px-4 py-2 border">{record.received_from ? `${record.received_from.firstname} ${record.received_from.lastname}` : 'N/A'}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">No ICS records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RequesterLayout>
  );
}
