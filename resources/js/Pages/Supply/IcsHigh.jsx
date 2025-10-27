import IssuanceTabs from '@/Layouts/IssuanceTabs';
import SupplyOfficerLayout from '@/Layouts/SupplyOfficerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, PrinterCheck } from 'lucide-react';
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

export default function IcsHigh({ ics, user, filters }) {
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [expandedRows, setExpandedRows] = useState([]); // moved here ✅

  // toggle expand/collapse
  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // filtering logic
  const filteredIcs = ics?.data?.filter((record) => {
    const requestedBy = `${record.requested_by?.firstname ?? ''} ${record.requested_by?.lastname ?? ''}`;
    const focalPerson = record.po?.rfq?.purchase_request?.focal_person?.name ?? '';

    const matchesSearch =
      search === '' ||
      record.ics_number?.toLowerCase().includes(search.toLowerCase()) ||
      record.inventory_item?.item_desc?.toLowerCase().includes(search.toLowerCase()) ||
      requestedBy.toLowerCase().includes(search.toLowerCase()) ||
      focalPerson.toLowerCase().includes(search.toLowerCase());

    const recordDate = new Date(record.created_at);
    const matchesMonth = filterMonth === '' || recordDate.getMonth() + 1 === Number(filterMonth);
    const matchesYear = filterYear === '' || recordDate.getFullYear() === Number(filterYear);

    return matchesSearch && matchesMonth && matchesYear;
  });
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

    window.location.href = route(routeName, { id: record.id, type: "ics" });
  }
};

const [showSwitchModal, setShowSwitchModal] = useState(false);
const [switchItems, setSwitchItems] = useState([]);
const [switchRecord, setSwitchRecord] = useState(null);

  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Inventory Custodian Slip (ICS) - HIGH">
      <Head title="ICS - HIGH" />
      <IssuanceTabs />

      <div className="bg-white rounded-lg p-6 shadow-md space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-xl font-bold text-gray-800">
            Inventory Custodian Slip (ICS) - HIGH VALUE
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                (window.location.href = route(
                  'supply_officer.generate_ics_report_high',
                  {
                    month: filterMonth,
                    year: filterYear,
                    search: search,
                    type: 'high',
                  }
                ))
              }
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm shadow"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <label htmlFor="month-filter" className="text-sm font-medium">
              Month:
            </label>
            <select
              id="month-filter"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm shadow-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((month, idx) => (
                <option key={idx} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>

            <label htmlFor="year-filter" className="text-sm font-medium ml-4">
              Year:
            </label>
            <input
              id="year-filter"
              type="number"
              className="border border-gray-300 rounded-md px-2 py-1 w-24 text-sm shadow-sm"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Search ICS number, item, focal person, receiver..."
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">ICS No.</th>
                  <th className="px-4 py-3 font-semibold">Division</th>
                  <th className="px-4 py-3 font-semibold">Requested By</th>
                  <th className="px-4 py-3 font-semibold">Item Description</th>
                  <th className="px-4 py-3 text-center font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Cost</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Cost</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredIcs && filteredIcs.length > 0 ? (
                  filteredIcs.map((record, index) => {
                    const itemsWithDetails =
                      record.items
                        ?.filter((item) => item.type === "high")
                        .map((item) => ({
                          description:
                            item.inventoryItem?.product?.name ??
                            item.inventory_item?.item_desc ??
                            "N/A",
                          specs: item.inventoryItem?.product?.specs ?? "",
                          quantity: item.quantity,
                          unitCost: Number(item.unit_cost ?? 0),
                          totalCost: Number(item.total_cost ?? 0),
                          date: new Date(item.created_at).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          recipient: item.recipient ?? null,
                        })) || [];

                    const isExpanded = expandedRows.includes(record.id);
                    const visibleItems = isExpanded
                      ? itemsWithDetails
                      : itemsWithDetails.slice(0, 1);

                    return (
                      <React.Fragment key={record.id}>
                        {visibleItems.map((item, itemIdx) => {
                          const baseRowClass = `transition-all duration-150 ${
                            itemIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 hover:shadow-sm`;

                          // 🔹 If item has its own recipient (displayed separately)
                          if (item.recipient) {
                            return (
                              <tr key={`${record.id}-${itemIdx}`} className={baseRowClass}>
                                <td className="px-4 py-3 font-semibold text-gray-800">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-blue-600 font-medium">
                                  H-{record.ics_number}
                                </td>
                                <td className="px-4 py-3">
                                  {record.po?.rfq?.purchase_request?.division?.division ?? "N/A"}
                                </td>
                                <td className="px-4 py-3">
                                  {record.requested_by?.firstname} {record.requested_by?.lastname}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-medium">{item.description}</span>
                                  {item.specs && (
                                    <span className="block text-xs text-gray-500">
                                      {item.specs}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                <td className="px-4 py-3 text-right">
                                  ₱{item.unitCost.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  ₱{item.totalCost.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">{item.date}</td>

                                <td className="px-4 py-3 text-center">
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <a
                                      href={route("supply_officer.print_ics_all", record.id)}
                                      target="_blank"
                                      className="inline-flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-sm text-xs font-medium"
                                    >
                                      <PrinterCheck size={14} />
                                      Print
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

                                    <Button
                                      type="button"
                                      onClick={(e) => handleActionSelect(e, record)}
                                      value="return"
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-sm"
                                    >
                                      Return
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // 🔹 If items are grouped (no recipient)
                          return (
                            <tr key={`${record.id}-no-recipient-${itemIdx}`} className={baseRowClass}>
                              {itemIdx === 0 && (
                                <>
                                  <td
                                    rowSpan={visibleItems.length}
                                    className="px-4 py-3 font-semibold text-gray-800 align-top"
                                  >
                                    {index + 1}
                                  </td>
                                  <td
                                    rowSpan={visibleItems.length}
                                    className="px-4 py-3 text-blue-600 font-medium align-top"
                                  >
                                    H-{record.ics_number}
                                  </td>
                                  <td
                                    rowSpan={visibleItems.length}
                                    className="px-4 py-3 align-top"
                                  >
                                    {record.po?.rfq?.purchase_request?.division?.division ?? "N/A"}
                                  </td>
                                  <td
                                    rowSpan={visibleItems.length}
                                    className="px-4 py-3 align-top"
                                  >
                                    {record.requested_by?.firstname}{" "}
                                    {record.requested_by?.lastname}
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3">
                                <span className="font-medium">{item.description}</span>
                                {item.specs && (
                                  <span className="block text-xs text-gray-500">
                                    {item.specs}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">
                                ₱{item.unitCost.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                ₱{item.totalCost.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">{item.date}</td>

                              {itemIdx === visibleItems.length - 1 && (
                                <td
                                  rowSpan={visibleItems.length}
                                  className="px-4 py-3 text-center align-top"
                                >
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <a
                                      href={route("supply_officer.print_ics_all", record.id)}
                                      target="_blank"
                                      className="inline-flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-sm text-xs font-medium"
                                    >
                                      <PrinterCheck size={14} />
                                      Print
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

                                    <Button
                                      type="button"
                                      onClick={(e) => handleActionSelect(e, record)}
                                      value="return"
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-sm"
                                    >
                                      Return
                                    </Button>
                                  </div>

                                  {/* Expand/Collapse toggle */}
                                  {itemsWithDetails.length > 2 && (
                                    <button
                                      onClick={() => toggleRowExpansion(record.id)}
                                      className="mt-2 text-blue-600 hover:underline text-xs flex items-center justify-center gap-1"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <MinusCircle size={14} /> Show Less
                                        </>
                                      ) : (
                                        <>
                                          <PlusCircle size={14} /> Show More
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-10 text-gray-500 bg-gray-50 italic"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 mb-2 text-gray-400" />
                        <span>No ICS records found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>


        {/* Pagination */}
        {ics?.links?.length > 3 && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            {ics.links.map((link, index) => (
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
            const highItems = (selectedRecord.items || []).filter((it) => it.type === "high");

            // ✅ Proper quantity-based check
            const allItemsProcessed = highItems.every((it) => {
              const totalQty = Number(it.quantity ?? 0);
              const reissuedQty = Number(it.total_reissued_quantity ?? 0);
              const disposedQty = Number(it.total_disposed_quantity ?? 0);
              return reissuedQty + disposedQty >= totalQty;
            });
            console.log("allItemsProcessed", allItemsProcessed);

            return (
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto p-2 border rounded-md bg-gray-50">
                {/* Select All */}
                {!allItemsProcessed && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md hover:bg-gray-100">
                    <input
                      id="select-all-return"
                      type="checkbox"
                      checked={highItems
                        .filter((it) => {
                          const totalQty = Number(it.quantity ?? 0);
                          const reissuedQty = Number(it.total_reissued_quantity ?? 0);
                          const disposedQty = Number(it.total_disposed_quantity ?? 0);
                          return reissuedQty + disposedQty < totalQty;
                        })
                        .every((it) => selectedItems.includes(it.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // ✅ Only add unprocessed items
                          const unprocessedIds = highItems
                            .filter((it) => {
                              const totalQty = Number(it.quantity ?? 0);
                              
                              const reissuedQty = Number(it.total_reissued_quantity ?? 0);
                              const disposedQty = Number(it.total_disposed_quantity ?? 0);
                              return reissuedQty + disposedQty < totalQty;
                            })
                            .map((it) => it.id);
                          setSelectedItems((prev) => [...new Set([...prev, ...unprocessedIds])]);
                        } else {
                          const idsToRemove = highItems.map((it) => it.id);
                          setSelectedItems((prev) => prev.filter((id) => !idsToRemove.includes(id)));
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

                {/* All items already processed */}
                {allItemsProcessed ? (
                  <div className="p-4 text-center text-gray-500 text-sm italic bg-gray-50 rounded-md border border-gray-200">
                    All items in this issuance have already been{" "}
                    <span className="font-semibold text-blue-600">reissued</span> or{" "}
                    <span className="font-semibold text-rose-600">disposed</span>.
                  </div>
                ) : (
                  highItems.map((item) => {
                    const itemName =
                      item.inventoryItem?.product?.name ??
                      item.inventory_item?.item_desc ??
                      "N/A";
                    const itemSpecs = item.inventoryItem?.product?.specs ?? "";

                    const totalQty = Number(item.quantity ?? 0);
                    const reissuedQty = Number(item.total_reissued_quantity ?? 0);
                    const disposedQty = Number(item.total_disposed_quantity ?? 0);
                    const totalProcessed = reissuedQty + disposedQty;
                    const remainingQty = Math.max(totalQty - totalProcessed, 0);
                    const fullyProcessed = totalProcessed >= totalQty;

                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                          selectedItems.includes(item.id)
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        } ${fullyProcessed ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          disabled={fullyProcessed}
                          onChange={(e) => {
                            if (fullyProcessed) return;
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

                            {fullyProcessed ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                                Fully processed
                              </span>
                            ) : totalProcessed > 0 ? (
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
                  })
                )}
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
            disabled={!selectedItems.length || !returnType}
            onClick={() => {
              const highItems = (selectedRecord.items || []).filter((it) => it.type === "high");
              const allItemsProcessed = highItems.every((it) => {
              const totalQty = Number(it.quantity ?? 0);
              const reissuedQty = Number(it.total_reissued_quantity ?? 0);
              const disposedQty = Number(it.total_disposed_quantity ?? 0);
                return reissuedQty + disposedQty >= totalQty;
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
                  description:
                    "Please specify whether this return is for reissuance or disposal.",
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
                  type: "ics",
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
          .filter((it) => it.type === "high")
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
            type: 'ics',
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
