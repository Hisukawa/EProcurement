import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { PackageCheck, PlusCircle, PrinterCheck, X } from "lucide-react";
import { useEffect, Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function DeliveryReceipts({ inventoryData, filters, units }) {

  const [search, setSearch] = useState(filters.search || "");

  const { data, setData, get, post, reset } = useForm({
    dr_number: "",
    dr_date: "",
    remarks: "",
    quantity: "",
    unit_id: "",
    custom_unit: "",
    item_desc: "",
    unit_price: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      get(route("supply_officer.delivery_receipts"), {
        preserveState: true,
        replace: true,
        data: { search },
      });
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

const groupByPO = (inventory) => {
  if (!inventory || !inventory.data) return [];

  const grouped = new Map();

  inventory.data.forEach((inv) => {
    const po = inv.po_detail?.purchase_order ?? null;
    const groupKey = po?.id ?? `no_po_${inv.id}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        po_id: po?.id ?? null,
        po: po ?? null,
        requested_by: inv.requested_by ?? null,
        items: [],
      });
    }

    grouped.get(groupKey).items.push(inv);
  });

  return Array.from(grouped.values());
};



  const groupedInventoryData = groupByPO(inventoryData);

  // Handle form submission
const handleAddDeliveryReceipt = (e) => {
  e.preventDefault();

  const today = new Date();
  const formattedDate = data.dr_date || today.toISOString().split("T")[0];

  // Generate DR number from chosen date
  const drDateObj = new Date(formattedDate);
  const drNumber = `${drDateObj.getFullYear().toString().slice(-2)}-${(
    drDateObj.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${drDateObj.getDate()}`;

  // ✅ Ensure both values are stored before posting
  post(route("supply_officer.store_central_delivery"), {
    data: {
      ...data,
      dr_number: data.dr_number || drNumber,
      dr_date: data.dr_date || formattedDate,
    },
    onSuccess: () => {
      setIsModalOpen(false);
      reset();
    },
  });
};
  const [selectedItems, setSelectedItems] = useState([]);

const toggleSelect = (id, stock) => {
  if (stock <= 0) return; // prevent selecting items with no stock
  setSelectedItems((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
};
  return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Inventory">
      <Head title="Inventory" />

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        {/* Inventory Heading and Issue Selected Items Button */}
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-800">Inventory</h2>
          
          {/* Issue Selected Items Button */}
          {selectedItems.length > 0 && (
            <button
              onClick={() =>
                router.visit(route("supply_officer.issuance"), {
                  method: "get",
                  data: { items: selectedItems },
                })
              }
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <PackageCheck size={18} /> Issue Selected Items ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Filters and Add Delivery Receipt Button */}
        <div className="flex items-center gap-3">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-3">
            <input
              type="text"
              placeholder="Search item"
              className="w-64 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 flex items-center gap-2 transition"
          >
            <PlusCircle size={18} />
            Add Delivery Receipt
          </button>
        </div>
      </div>



      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "#",
                "DR Number",
                "Item Description",
                "Unit",
                "Remaining Stock/Qty",
                "Unit Price",
                "Total Price",
                "Status",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide text-center"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
<tbody className="divide-y divide-gray-100 text-center">
  {inventoryData?.data?.length === 0 ? (
    <tr>
      <td colSpan="9" className="py-12 text-gray-500 text-lg font-medium">
        No Inventory Found.
      </td>
    </tr>
  ) : (
    inventoryData.data.map((inv) => {
      const unit = inv.unit?.unit ?? "N/A";
      const unitCost = parseFloat(inv.unit_cost) || 0;
      const issuedQty = parseFloat(inv.issued_qty) || 0;
      const totalStock = parseFloat(inv.total_stock) || 0;
      const remainingStock = Math.max(totalStock - issuedQty, 0);
      const totalPrice = (unitCost * inv.total_stock).toFixed(2);

      let statusLabel = "Available";
      if (inv.total_stock === 0) statusLabel = "Fully Issued";
      else if (inv.total_stock < totalStock) statusLabel = "Partially Issued";

      return (
        <tr key={inv.id} className="hover:bg-blue-50 transition duration-200">
          <td className="px-3 py-4">
            <input
              type="checkbox"
              checked={selectedItems.includes(inv.id)}
              disabled={remainingStock <= 0} // <-- disable if no stock left
              onChange={() => toggleSelect(inv.id, remainingStock)}
              className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
            />
          </td>
          <td className="px-6 py-4">{inv.dr_number ?? "N/A"}</td>
          <td className="px-6 py-4">{inv.item_desc ?? "No description"}</td>
          <td className="px-6 py-4">{unit}</td>
          <td className="px-6 py-4">{remainingStock}</td>
          <td className="px-6 py-4">₱ {unitCost.toFixed(2)}</td>
          <td className="px-6 py-4">₱ {totalPrice}</td>
          <td className="px-6 py-4">{statusLabel}</td>
          <td className="px-6 py-4">
  <div className="flex items-center justify-center gap-2">
    {inv.total_stock <= 0 ? (
      <span className="bg-gray-300 text-gray-600 px-3 py-2 rounded cursor-not-allowed flex items-center justify-center gap-1">
        <PackageCheck size={16} /> All Items Are Issued
      </span>
    ) : (
      <a
        href={route("supply_officer.issuance", { inventory_id: inv.id })}
        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-1"
      >
        <PackageCheck size={16} /> Issue Item
      </a>
    )}

    <a
      href={route("supply_officer.print_iar", inv.iar_id)}
      className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition flex items-center justify-center gap-1"
      target="_blank"
    >
      <PrinterCheck size={16} /> Print IAR
    </a>
  </div>
</td>

        </tr>
      );
    })
  )}
</tbody>


        </table>
      </div>

      {/* ✅ Add Delivery Receipt Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <Dialog.Title className="text-lg font-bold text-gray-800">
                    Add Delivery Receipt
                  </Dialog.Title>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddDeliveryReceipt} className="space-y-4 text-sm">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">DR Number</label>
                  <input
                    type="text"
                    className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={data.dr_number || ""}
                    onChange={(e) => setData("dr_number", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">DR Date</label>
                  <input
                    type="date"
                    className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={data.dr_date || ""}
                    onChange={(e) => {setData("dr_date", e.target.value);}}
                    required
                  />
                </div>
                {/* Item Description */}
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Item Description
                    </label>
                    <textarea
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={data.item_desc || ""}
                      onChange={(e) => setData("item_desc", e.target.value)}
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={data.quantity || ""}
                      onChange={(e) => setData("quantity", e.target.value)}
                      required
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">Unit</label>
                    <select
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
                      value={data.unit_id || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setData("unit_id", "");
                        } else {
                          setData("unit_id", val);
                          setData("custom_unit", "");
                        }
                      }}
                    >
                      <option value="">Select Unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unit}
                        </option>
                      ))}
                      <option value="custom">Other</option>
                    </select>

                    {data.unit_id === "" && (
                      <input
                        type="text"
                        placeholder="Enter custom unit"
                        className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={data.custom_unit || ""}
                        onChange={(e) => setData("custom_unit", e.target.value)}
                      />
                    )}
                  </div>

                  

                  {/* Unit Price */}
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Unit Price (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={data.unit_price || ""}
                      onChange={(e) => setData("unit_price", e.target.value)}
                      required
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">Remarks</label>
                    <textarea
                      rows="2"
                      className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={data.remarks}
                      onChange={(e) => setData("remarks", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </SupplyOfficerLayout>
  );
}
