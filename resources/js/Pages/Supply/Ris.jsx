import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PrinterCheck } from 'lucide-react';
import { useState } from 'react';
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

  const [showReturnModal, setShowReturnModal] = useState(false);
const [selectedRecord, setSelectedRecord] = useState(null);
const [selectedItems, setSelectedItems] = useState([]);
const [returnType, setReturnType] = useState("");
const handleActionSelect = (e, record) => {
  const action = e.target.value;
  e.target.value = ""; // reset immediately after selection

  if (action === "return") {
    setSelectedRecord(record);
    setSelectedItems([]);
    setReturnType("");
    setShowReturnModal(true);
    return; // stop here — no redirect
  }

  if (action === "reissuance" || action === "disposal") {
    const routeName =
      action === "reissuance"
        ? "supply_officer.reissuance_form"
        : "supply_officer.disposal_form";

    window.location.href = route(routeName, { id: record.id, type: "ris" });
  }
};

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
                        {record.requested_by?.firstname} {record.requested_by?.lastname}
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
                        <Button
                          type="button"
                          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                          onClick={() => {
                            setSwitchRecord(record);
                            setSwitchItems([]);
                            setShowSwitchModal(true);
                          }}
                        >
                          Switch Type
                        </Button>
                      <Button
                        type="button"
                        onClick={(e) => handleActionSelect(e, record)}
                        value="return"
                      >
                        Return
                      </Button>
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
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-lg rounded-xl border border-gray-200 shadow-md bg-white">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Return Items
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Select items to return and specify whether they are for reissuance or disposal.
            </DialogDescription>
          </DialogHeader>

          {/* Item Selection */}
          {selectedRecord ? (
            (() => {
              const risItems = (selectedRecord.items || []);
              const allItemsProcessed = risItems.every(
                (it) =>
                  it.reissuedItem ||
                  it.disposedItem ||
                  it.status === "reissued" ||
                  it.status === "disposed"
              );

              return (
                <div className="mt-4 space-y-2 max-h-72 overflow-y-auto p-2 border rounded-md bg-gray-50">
                  {/* Select All */}
                  {!allItemsProcessed && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md hover:bg-gray-100">
                      <input
                        id="select-all-return"
                        type="checkbox"
                        checked={
                          risItems.every((it) => selectedItems.includes(it.id)) || false
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [
                              ...new Set([...prev, ...risItems.map((it) => it.id)]),
                            ]);
                          } else {
                            setSelectedItems((prev) =>
                              prev.filter((id) => !risItems.map((it) => it.id).includes(id))
                            );
                          }
                        }}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <label
                        htmlFor="select-all-return"
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        Select all
                      </label>
                    </div>
                  )}

                  {/* If all items already processed */}
                {(() => {
                  const lowItems = selectedRecord.items || [];
                  console.log({ lowItems });

                  // Check if all items are fully processed
                  const allItemsFullyProcessed = lowItems.every((it) => {
                    const totalQty = Number(it.quantity ?? 0);
                    const reissuedQty = Number(it.total_reissued_quantity ?? 0);
                    const disposedQty = Number(it.total_disposed_quantity ?? 0);
;
                    const totalProcessed = reissuedQty + disposedQty;

                    // ✅ Only mark fully processed if quantities match, not just because of "status"
                    return totalProcessed >= totalQty;
                  });

                  if (allItemsFullyProcessed) {
                    return (
                      <div className="p-4 text-center text-gray-500 text-sm italic bg-gray-50 rounded-md border border-gray-200">
                        All items in this issuance have already been{" "}
                        <span className="font-semibold text-blue-600">reissued</span> or{" "}
                        <span className="font-semibold text-rose-600">disposed</span>.
                      </div>
                    );
                  }

                  return lowItems.map((item) => {
                    const itemName =
                      item.inventoryItem?.product?.name ??
                      item.inventory_item?.item_desc ??
                      "N/A";
                    const itemSpecs = item.inventory_item?.product?.specs ?? "";

                    const totalQty = Number(item.quantity ?? 0);
                    const reissuedQty = Number(item.total_reissued_quantity ?? 0);
                    const disposedQty = Number(item.total_disposed_quantity ?? 0);

                    const totalProcessed = reissuedQty + disposedQty;
                    const remainingQty = Math.max(totalQty - totalProcessed, 0);

                    const fullyReissued = remainingQty === 0 && reissuedQty > 0;
                    const fullyDisposed = remainingQty === 0 && disposedQty > 0;
                    const partiallyProcessed =
                      remainingQty > 0 && (reissuedQty > 0 || disposedQty > 0);
                    const alreadyProcessed = fullyReissued || fullyDisposed;

                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                          selectedItems.includes(item.id)
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        } ${alreadyProcessed ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          disabled={alreadyProcessed}
                          onChange={(e) => {
                            if (alreadyProcessed) return;
                            setSelectedItems((prev) =>
                              e.target.checked
                                ? [...prev, item.id]
                                : prev.filter((id) => id !== item.id)
                            );
                          }}
                          className="mt-1 h-4 w-4 accent-blue-600"
                        />

                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-gray-800">{itemName}</div>

                            {fullyReissued || fullyDisposed ? (
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  fullyDisposed
                                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                                    : "bg-blue-100 text-blue-700 border border-blue-300"
                                }`}
                              >
                                {fullyDisposed ? "Returned" : "Reissued"}
                              </span>
                            ) : partiallyProcessed ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-300">
                                Some Items are returned ({totalProcessed}/{totalQty})
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">
                                Remaining: {remainingQty}
                              </span>
                            )}
                          </div>

                          {itemSpecs && (
                            <div className="text-gray-500 text-xs">{itemSpecs}</div>
                          )}

                          <div className="text-gray-500 text-xs mt-0.5">
                            Qty: {item.quantity} | ₱{Number(item.unit_cost ?? 0).toFixed(2)}
                          </div>

                          {(reissuedQty > 0 || disposedQty > 0) && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Returned:{" "}
                              <span className="text-blue-600 font-medium">
                                {reissuedQty} reissued
                              </span>{" "}
                              |{" "}
                              <span className="text-rose-600 font-medium">
                                {disposedQty} disposed
                              </span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  });
                })()}



                </div>
              );
            })()
          ) : (
            <p className="text-gray-500 text-sm mt-3 italic">No items available.</p>
          )}

          {/* Return Type */}
          <div className="mt-5 border-t pt-4">
            <div className="font-medium text-gray-700 mb-2">Return Type</div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md transition-all ${
                  returnType === "reissuance"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="returnType"
                  value="reissuance"
                  checked={returnType === "reissuance"}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">For Reissuance</span>
              </label>

              <label
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md transition-all ${
                  returnType === "disposal"
                    ? "border-rose-400 bg-rose-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="returnType"
                  value="disposal"
                  checked={returnType === "disposal"}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="h-4 w-4 accent-rose-600"
                />
                <span className="text-sm text-gray-700">For Disposal</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-5 border-t mt-4">
            <Button
              variant="outline"
              className="w-28"
              onClick={() => {
                setShowReturnModal(false);
                setSelectedItems([]);
                setReturnType("");
                setSelectedRecord(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className={`w-28 text-white ${
                returnType === "disposal"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={
                !selectedItems.length || !returnType ||
                (selectedRecord &&
                  (selectedRecord.items || []).every((it) => {
                    const totalQty = Number(it.quantity ?? 0);
                    const reissuedQty = Number(it.total_reissued_quantity ?? 0);
                    const disposedQty = Number(it.total_disposed_quantity ?? 0);

                    const totalProcessed = reissuedQty + disposedQty;
                    console.log({ totalQty, reissuedQty, disposedQty, totalProcessed });
                    // Disable only if fully processed (all qty handled)
                    return totalProcessed >= totalQty;
                  })
                )
              }

              onClick={() => {
  const items = selectedRecord.items || [];

  // Check if all items are fully processed (no remaining qty)
  const allItemsProcessed = items.every((it) => {
    const totalQty = Number(it.quantity ?? 0);
    const reissuedQty = Number(it.reissued_item?.quantity ?? 0);
    const disposedQty = Number(it.disposed_item?.quantity ?? 0);
    const totalProcessed = reissuedQty + disposedQty;

    return (
      totalProcessed >= totalQty
    );
  });

  if (allItemsProcessed) {
    toast({
      title: "All items already processed",
      description: "There are no items left to return.",
      variant: "destructive",
    });
    return;
  }

  if (selectedItems.length === 0) {
    toast({
      title: "No items selected",
      description: "Please select at least one item to return.",
      variant: "destructive",
    });
    return;
  }

  if (!returnType) {
    toast({
      title: "No return type chosen",
      description: "Please specify whether this return is for reissuance or disposal.",
      variant: "destructive",
    });
    return;
  }

  const routeName =
    returnType === "reissuance"
      ? "supply_officer.reissuance_form"
      : "supply_officer.disposal_form";

  router.visit(
    route(routeName, {
      id: selectedRecord.id,
      type: "ris",
      items: selectedItems.join(","),
    })
  );

  setShowReturnModal(false);
}}

            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
