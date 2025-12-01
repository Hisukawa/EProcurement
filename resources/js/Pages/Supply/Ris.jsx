import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, MinusCircle, PlusCircle, PrinterCheck } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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


const filteredRis =
  ris?.data
    ?.map((record) => {
      // Filter items individually
      const filteredItems = record.items?.filter((item) => {
        const risNo = record.ris_number?.toLowerCase() ?? '';
        const recipientName = item.recipient?.toLowerCase() ?? '';
        const division =
          item.recipient_division?.toLowerCase() ?? '';
        const itemDesc = item.inventory_item?.item_desc?.toLowerCase() ?? '';

        const matchesSearch =
          risNo.includes(search.toLowerCase()) ||
          division.includes(search.toLowerCase()) ||
          recipientName.includes(search.toLowerCase()) ||
          itemDesc.includes(search.toLowerCase());

        // Date filters
        const recordDate = item.created_at ? new Date(item.created_at) : null;
        const matchesMonth = filterMonth
          ? recordDate && recordDate.getMonth() + 1 === parseInt(filterMonth)
          : true;
        const matchesYear = filterYear
          ? recordDate && recordDate.getFullYear() === parseInt(filterYear)
          : true;

        return matchesSearch && matchesMonth && matchesYear;
      });

      if (filteredItems.length === 0) return null;

      return { ...record, items: filteredItems };
    })
    .filter(Boolean) || [];


  function handleDropdownChange(event, recordId) {
    const selectedValue = event.target.value;
    if (selectedValue === 'reissuance') {
      // Handle reissuance action
      console.log(`Reissuance selected for record ID: ${recordId}`);
    } else if (selectedValue === 'disposal') {
      // Handle disposal action
      console.log(`Disposal selected for record ID: ${recordId}`);
    }
  }

const [showSwitchModal, setShowSwitchModal] = useState(false);
const [switchItems, setSwitchItems] = useState([]);
const [switchRecord, setSwitchRecord] = useState(null);
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
              onClick={() => {
                const params = new URLSearchParams();
                if (filterMonth) params.append("month", filterMonth);
                if (filterYear) params.append("year", filterYear);
                if (search) params.append("search", search);

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
        <div className="overflow-x-auto mt-6 rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">RIS No.</th>
                <th className="px-4 py-3">Division</th>
                <th className="px-4 py-3">Issued To / Focal Person</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRis && filteredRis.length > 0 ? (
                filteredRis.map((record, index) => {
                  const isExpanded = expandedRows.includes(record.id);
                  const visibleItems = isExpanded ? record.items : record.items.slice(0, 1);

                  const issuedTo =
                    record.items?.[0]?.recipient
                      ?? "N/A";

                  const division =
                    record.items?.[0]?.recipient_division ??"N/A";

                  return (
                    <React.Fragment key={record.id}>
                      {/* Main Row (first item only) */}
                      <tr className="bg-white hover:bg-blue-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">{index + 1}</td>
                        <td className="px-4 py-3 text-blue-600 font-medium">{record.ris_number}</td>
                        <td className="px-4 py-3">{division}</td>
                        <td className="px-4 py-3">{issuedTo}</td>

                        <td className="px-4 py-3 font-medium">
                          {record.items[0]?.inventory_item?.item_desc ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center">{record.items[0]?.quantity ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          {Number(record.items[0]?.inventory_item?.unit_cost ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(
                            (record.items[0]?.quantity ?? 0) *
                            (record.items[0]?.inventory_item?.unit_cost ?? 0)
                          ).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(record.items[0]?.created_at).toLocaleDateString("en-PH")}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <a
                              href={route("supply_officer.print_ris", record.id)}
                              target="_blank"
                              className="inline-flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-sm text-xs font-medium"
                            >
                              <PrinterCheck size={14} /> Print
                            </a>

                            <Button
                              type="button"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-sm"
                              onClick={() => {
                                setSwitchRecord(record);
                                setSwitchItems([]);
                                setShowSwitchModal(true);
                              }}
                            >
                              Switch Type
                            </Button>
                          </div>

                          {/* Toggle */}
                          {record.items.length > 1 && (
                            <button
                              onClick={() => toggleRow(record.id)}
                              className="mt-2 text-blue-600 hover:underline text-xs flex items-center justify-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <MinusCircle size={14} /> Show Less
                                </>
                              ) : (
                                <>
                                  <PlusCircle size={14} /> Show More ({record.items.length - 1} more)
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Rows */}
                      {isExpanded &&
                        record.items.slice(1).map((item, idx) => (
                          <tr key={`${record.id}-${idx}`} className="bg-gray-50 hover:bg-blue-50 transition">
                            <td colSpan="4"></td>
                            <td className="px-4 py-3 font-medium">{item.inventory_item?.item_desc ?? "N/A"}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              {Number(item.inventory_item?.unit_cost ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {(
                                (item.quantity ?? 0) * (item.inventory_item?.unit_cost ?? 0)
                              ).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              {new Date(item.created_at).toLocaleDateString("en-PH")}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500 bg-gray-50 italic">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 mb-2 text-gray-400" />
                      <span>No RIS records found</span>
                    </div>
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
      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
  <DialogContent className="max-w-lg rounded-xl border border-gray-200 shadow-md bg-white">
    <DialogHeader className="pb-3 border-b border-gray-100">
      <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        Switch Type
      </DialogTitle>
      <DialogDescription className="text-sm text-gray-500">
        Select items you want to switch to <b>High Value</b> type.
      </DialogDescription>
    </DialogHeader>

    {/* Item Selection */}
    {switchRecord ? (
      <div className="mt-4 space-y-2 max-h-72 overflow-y-auto p-2 border rounded-md bg-gray-50">
        {(switchRecord.items || [])
          .map((item) => {
            const itemName =
              item.inventoryItem?.product?.name ?? item.inventory_item?.item_desc ?? "N/A";
            const itemSpecs = item.inventoryItem?.product?.specs ?? "";
            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                  switchItems.includes(item.id)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={switchItems.includes(item.id)}
                  onChange={(e) => {
                    setSwitchItems((prev) =>
                      e.target.checked
                        ? [...prev, item.id]
                        : prev.filter((id) => id !== item.id)
                    );
                  }}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <div className="flex flex-col flex-1">
                  <div className="font-medium text-gray-800">{itemName}</div>
                  {itemSpecs && (
                    <div className="text-gray-500 text-xs">{itemSpecs}</div>
                  )}
                  <div className="text-gray-500 text-xs mt-0.5">
                    Qty: {item.quantity} | ₱{Number(item.unit_cost ?? 0).toFixed(2)}
                  </div>
                </div>
              </label>
            );
          })}
      </div>
    ) : (
      <p className="text-gray-500 text-sm mt-3 italic">No items available.</p>
    )}

    {/* Footer */}
    <DialogFooter className="pt-5 border-t mt-4">
      <Button
        variant="outline"
        className="w-28"
        onClick={() => {
          setShowSwitchModal(false);
          setSwitchItems([]);
          setSwitchRecord(null);
        }}
      >
        Cancel
      </Button>
      <Button
        className="w-28 bg-blue-600 text-white hover:bg-blue-700"
        disabled={!switchItems.length}
        onClick={() => {
          // Navigate to the route with selected items
          router.visit(route('supply_officer.switch_type', {
            type: 'ris',
            id: switchRecord.id,
            po_id: switchRecord.po?.id,
            items: switchItems, // send selected item IDs
          }));
        }}
      >
        Continue
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </SupplyOfficerLayout>
  );
}
