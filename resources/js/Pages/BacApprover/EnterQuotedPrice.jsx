import { useState, useRef, useEffect } from "react";
import {
  ScrollText,
  FilePlus2,
  CheckCircle2,
  Save,
  Trash2,
} from "lucide-react";
import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@headlessui/react";
import axios from "axios";
import Swal from "sweetalert2";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useToast } from "@/hooks/use-toast";

export default function EnterQuotedPrices({ pr, suppliers, rfqs, purchaseRequest, rfq_details, categories }) {
  const { toast } = useToast();
useEffect(() => {
  if (rfq_details && rfq_details.length > 0) {
    // Build a map of { pr_details_id: supplier_id }
    const initialSelected = {};
    rfq_details.forEach(rfq => {
      // Allow multiple suppliers per item
      if (!initialSelected[rfq.pr_details_id]) {
        initialSelected[rfq.pr_details_id] = [];
      }
      if (!initialSelected[rfq.pr_details_id].includes(rfq.supplier_id)) {
        initialSelected[rfq.pr_details_id].push(rfq.supplier_id);
      }
    });
    setSelectedSuppliersByItem(initialSelected);
  }
}, [rfq_details]);
const [entirePRPrice, setEntirePRPrice] = useState("");
const [entirePRSupplier, setEntirePRSupplier] = useState(null);

  const inputRefs = useRef({});
  // Supplier list state
  const [supplierList, setSupplierList] = useState(suppliers ?? []);
  // Selected supplier in modal
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  // Pagination and search for supplier modal
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState("");
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", message: "", type: "success" });
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  // Submission states
  const [submittingId, setSubmittingId] = useState(null);
  const [quotedPrices, setQuotedPrices] = useState({});
  // Modal for supplier selection
  const [showModal, setShowModal] = useState(false);
  // Selected PR detail item for supplier selection
  const [selectedItemId, setSelectedItemId] = useState(null);
  // Toggle to show all suppliers or recommended only
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  // Add supplier modal
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [selectedSuppliersByItem, setSelectedSuppliersByItem] = useState({});
  // New supplier form data
  const [newSupplier, setNewSupplier] = useState({
    representative_name: "",
    company_name: "",
    address: "",
    tin_num: "",
    category_id: ""
  });
  // Estimated prices per item
  const [estimatedPrice, setEstimatedPrice] = useState(() => {
    const initial = {};
    if (pr.details) {
      pr.details.forEach(detail => {
        initial[detail.id] = detail.unit_price || "";
      });
    }
    return initial;
  });





  // Form for selections (supplier + item + estimated bid)
  const { data, setData } = useForm({
    pr_id: pr.id,
    user_id: purchaseRequest?.focal_person?.id ?? null,
    supplier_id: '',
    selections: []
  });

  // Show dialog helper
  const showDialog = ({ title, message, type, onConfirm = null }) => {
    setDialogContent({ title, message, type });
    setOnConfirmAction(() => onConfirm);
    setDialogOpen(true);
  };

  // Confirm submit single quote

const confirmSubmit = (e, detailId, supplierId, currentQuotedPrice) => {
  e.preventDefault();

  const currentQuotedPriceValue = currentQuotedPrice === "" ? null : currentQuotedPrice;

  showDialog({
    title: "Confirm Submission",
    message: "Are you sure you want to submit this quoted price?",
    type: "confirm",
    onConfirm: () => handleSubmit(detailId, supplierId, currentQuotedPriceValue),
  });
};

  // Get quoted price from rfq_details
  const getQuotedPrice = (detailId, supplierId) => {
    const quoted = rfq_details.find(
      (q) => q.pr_details_id === detailId && q.supplier_id === supplierId
    );
    return quoted?.quoted_price ?? null;
  };

  // Handle price input change
const handlePriceChange = (value, detailId, supplierId) => {
  const unitPrice = pr.details.find(d => d.id === detailId)?.unit_price || 0;
  let numericValue = parseFloat(value);

  if (numericValue > unitPrice) {
    numericValue = unitPrice; // clamp to maximum allowed
  }

  const key = `${detailId}-${supplierId}`;
  setQuotedPrices(prev => ({ ...prev, [key]: numericValue }));
};



  // Submit single quoted price
const handleSubmit = (detailId, supplierId, quoted_price_to_submit, editingKey = null) => {
  const final_quoted_price = quoted_price_to_submit === "" ? null : quoted_price_to_submit;

  const payload = {
    pr_id: pr.id,
    pr_details_id: detailId,
    supplier_id: supplierId,
    quoted_price: final_quoted_price,
  };

  const submittingKey = editingKey || `${detailId}-${supplierId}`;
  setSubmittingId(submittingKey);

  router.post(route("bac_approver.submit_quoted"), payload, {
    preserveScroll: true,
    onSuccess: () => {
      setSubmittingId(null);

      // ✅ exit edit mode if we were editing
      if (editingKey) {
        setEditingQuotes((prev) => {
          const next = { ...prev };
          delete next[editingKey];
          return next;
        });
      }

      showDialog({
        title: "Submitted!",
        message: "Quoted price submitted successfully.",
        type: "success",
      });
    },
    onError: (errors) => {
      setSubmittingId(null);
      showDialog({
        title: "Oops!",
        message: errors?.quoted_price || "Something went wrong while submitting.",
        type: "error",
      });
    },
  });
};



  // Confirm bulk submit
  const confirmSubmitAll = () => {
    showDialog({
      title: "Confirm Bulk Submission",
      message: "Are you sure you want to submit all quoted prices?",
      type: "confirm",
      onConfirm: () => handleSubmitAll(),
    });
  };

  // Submit all quoted prices
const handleSubmitAll = () => {
  if (!entirePRSupplier) return;

  const entries = pr.details
    .map((detail) => {
      const uniqueId = `${detail.id}-${entirePRSupplier}`;
      const quotedPrice = quotedPrices[uniqueId];

      const final_quoted_price =
        quotedPrice === "" ? null : quotedPrice;

      if (quotedPrice !== undefined) {
        return {
          pr_id: pr.id,
          pr_details_id: detail.id,
          supplier_id: entirePRSupplier,
          quoted_price: final_quoted_price,
        };
      }
      return null;
    })
    .filter((entry) => entry !== null);

  if (entries.length === 0) {
    showDialog({
      title: "No Prices to Submit",
      message: "Please enter at least one quoted price before submitting all.",
      type: "warning",
    });
    return;
  }

  setSubmittingId("all");

  router.post(
    route("bac_approver.submit_bulk_quoted"),
    { quotes: entries },
    {
      preserveScroll: true,
      onSuccess: () => {
        console.log("Bulk submitted successfully");

        // clear submitted prices from quotedPrices (like handleSubmit does)
        setQuotedPrices((prev) => {
          const updated = { ...prev };
          entries.forEach((entry) => {
            delete updated[`${entry.pr_details_id}-${entry.supplier_id}`];
          });
          return updated;
        });

        setSubmittingId(null);
        showDialog({
          title: "All Quoted Prices Submitted!",
          message: "All prices for this supplier have been submitted successfully.",
          type: "success",
        });
      },
      onError: (errors) => {
        console.error("Bulk submission failed", errors);
        setSubmittingId(null);
        showDialog({
          title: "Oops!",
          message: errors?.quoted_price || "Something went wrong while submitting all prices.",
          type: "error",
        });
      },
    }
  );
};



  // Add or update selection (item + supplier + estimated bid)
  const addSelection = (itemId, supplierId, estimatedBid) => {
    setData(prevData => {
      const filtered = (prevData.selections || []).filter(
        s => !(s.pr_detail_id === itemId && s.supplier_id === supplierId)
      );
      return {
        ...prevData,
        selections: [...filtered, { pr_detail_id: itemId, supplier_id: supplierId, estimated_bid: estimatedBid }],
      };
    });
  };

  // Open supplier modal for a specific item
  const openModalForItem = (itemId) => {
    setSelectedItemId(itemId);
    setShowAllSuppliers(false);
    setShowModal(true);

    const selectedItem = pr.details.find(d => d.id === itemId);
    if (selectedItem) {
      const unitPrice = selectedItem.unit_price || "";
      setEstimatedPrice(prev => ({ ...prev, [itemId]: unitPrice }));
      setData(prev => ({ ...prev, estimated_bid: unitPrice }));
    }
  };
  const { flash } = usePage().props;


  // Handle adding new supplier
  const handleSubmitSupplier = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(route("bac_approver.store_supplier"), newSupplier);
      const createdSupplier = response.data.supplier;

      setSupplierList(prev => [...prev, createdSupplier]);
      setSelectedSupplierId(String(createdSupplier.id));

      const newSupplierId = createdSupplier.id;
      const priceValue = selectedItemId === null ? "" : (estimatedPrice[selectedItemId] || "");
      const initialBid = priceValue.toString().trim() || (pr.details?.find(d => d.id === selectedItemId)?.unit_price || "");

      if (selectedItemId !== null) {
        addSelection(selectedItemId, newSupplierId, initialBid);
      } else {
        pr.details.forEach(detail => {
          const bid = detail.unit_price || "";
          addSelection(detail.id, newSupplierId, bid);
        });
      }

      setNewSupplier({
        company_name: "",
        address: "",
        tin_num: "",
        representative_name: "",
        category_id: null,
      });

      setShowAddSupplierModal(false);
      setShowModal(false);

    } catch (error) {
      if (error.response) {
      console.error("Server error:", error.response.data);
      } else {
        console.error("Error adding supplier:", error.message);
      }
      Swal.fire("Error", "Failed to add supplier. Please try again.", "error");
    }
  };

  // Filtering suppliers for modal
const selectedItem = selectedItemId && pr.details?.length
  ? pr.details.find(d => d.id === selectedItemId)
  : null;




const filteredSuppliers = supplierList
  .filter(supplier => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      supplier.representative_name?.toLowerCase().includes(q) ||
      supplier.company_name?.toLowerCase().includes(q) ||
      supplier.address?.toLowerCase().includes(q)
    );
  })
  .filter(supplier => {
    return !rfq_details.some(
      (q) => q.pr_details_id === selectedItemId && q.supplier_id === supplier.id
    );
  });

useEffect(() => {
  setCurrentPage(1);
}, [searchQuery]);
  const closeSupplierModal = () => {
    setShowModal(false);
    setEntirePRSupplier(null); // reset to avoid stale global supplier
  };



  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirst, indexOfLast);
  const [editingQuotes, setEditingQuotes] = useState({});

const handleDeleteQuote = (detailId, supplierId, uniqueId) => {
  setSubmittingId(uniqueId);

  router.delete(route("bac_approver.delete_quoted"), {
    data: {
      pr_id: pr.id,
      pr_details_id: detailId,
      supplier_id: supplierId,
    },
    preserveScroll: true,
    onSuccess: () => {
      setSubmittingId(null);

      // Reset local state
      setQuotedPrices((prev) => {
        const next = { ...prev };
        delete next[uniqueId];
        return next;
      });
      setEditingQuotes((prev) => {
        const next = { ...prev };
        delete next[uniqueId];
        return next;
      });
      setSelectedSuppliersByItem((prev) => {
        const updated = { ...prev };
        if (Array.isArray(updated[detailId])) {
          updated[detailId] = updated[detailId].filter((id) => id !== supplierId);
          if (updated[detailId].length === 0) {
            delete updated[detailId]; // clean up empty entries
          }
        }
        return updated;
      });

      // ✅ Show Toast
      toast({
        title: "Deleted",
        description: "Quoted price removed successfully.",
        variant: "default",
        setTimeout: 3000
      });

      // ✅ Show Dialog (shadcn)
      showDialog({
        open: true,
        title: "Deleted!",
        description: "The quoted price was removed successfully.",
      });
    },
    onFinish: (visit) => {
      setSubmittingId(null);

      if (flash?.message) {
      toast({
        title: flash.status === "success" ? "Deleted" : "Error",
        description: flash.message,
        variant: flash.status === "success" ? "default" : "destructive",
        setTimeout: 3000
      });

      showDialog({
        open: true,
        title: flash.status === "success" ? "Deleted!" : "Error!",
        description: flash.message,
      });
    }
    },
    onError: () => {
      setSubmittingId(null);

      toast({
        title: "Error",
        description: "Could not delete quoted price.",
        variant: "destructive",
        setTimeout: 3000
      });

      showDialog({
        open: true,
        title: "Error!",
        description: "Something went wrong while deleting.",
      });
    },
  });
};
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
const [skippedItems, setSkippedItems] = useState([]);


  return (
    <ApproverLayout>
      <Head title="Enter Quoted Prices" />
      <div className="mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-indigo-700" />
            Enter Quoted Prices for PR: {pr.pr_number}
          </h1>
        </div>
        <div className="mb-4">
          <a
          type="button"
            href={route("bac_approver.for_quotations")}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm shadow-sm"
          >
            ← Back
          </a>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <FilePlus2 className="w-5 h-5 text-indigo-600" />
              Purchase Request Info
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>PR Number:</strong> {pr.pr_number}</div>
              <div><strong>Purpose:</strong> {pr.purpose}</div>
              <div><strong>Requested By:</strong> {pr.requester_name}</div>
              <div><strong>Division:</strong> {pr.division}</div>
              <div><strong>Created:</strong> {new Date(pr.created_at).toLocaleDateString()}</div>
              <div><strong>Focal Person:</strong> {purchaseRequest?.focal_person?.firstname}</div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-10">
            {pr.details.map(detail => (
              <div key={detail.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow">
                <div className="mb-4 border-b pb-3">
                  <h3 className="text-xl font-semibold text-gray-700">
                    {detail.item}
                    <span className="text-sm text-gray-500 ml-2">({detail.specs})</span>
                  </h3>
                  
                  <div className="text-sm text-gray-600 mt-2 grid grid-cols-3 gap-4">
                    <div><strong>Unit:</strong> {detail.unit}</div>
                    <div><strong>Quantity:</strong> {detail.quantity}</div>
                    <div><strong>Est. Price per Unit:</strong> ₱{Number(detail.unit_price || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => openModalForItem(detail.id)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm shadow-sm"
                  >
                    Choose Supplier
                  </button>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm shadow-sm"
                  >
                    ➕ Add New Supplier
                  </button>
                </div>


                <div className="space-y-6 mt-6">
                  {Array.isArray(selectedSuppliersByItem[detail.id]) &&
                    selectedSuppliersByItem[detail.id].map((supplierId) => {
                      const supplier = supplierList.find((s) => s.id === supplierId);
                      if (!supplier) return null;

                      const uniqueId = `${detail.id}-${supplierId}`;
                      const isSubmitting = submittingId === uniqueId;
                      const quoted = getQuotedPrice(detail.id, supplierId);
                      const alreadySubmitted = quoted !== null;
                      const unitPrice = detail.unit_price || 0; // ✅ max allowed price

                      // Updated handle input change
                      const handleInputChange = (e) => {
                        let value = parseFloat(e.target.value);
                        if (isNaN(value)) value = "";

                        if (value > unitPrice) {
                          value = unitPrice; // clamp to max
                          Swal.fire({
                            icon: "warning",
                            title: "Exceeded Unit Price",
                            text: `Quoted price cannot exceed ₱${unitPrice.toLocaleString()}.`,
                            timer: 2000,
                            showConfirmButton: false,
                          });
                        }

                        setQuotedPrices((prev) => ({ ...prev, [uniqueId]: value }));
                      };

                      return (
                        <form
                          key={uniqueId}
                          onSubmit={(e) => {
                            e.preventDefault();
                            const latestValue = quotedPrices[uniqueId] ?? "";
                            const isEditing = !!editingQuotes[uniqueId];

                            if (alreadySubmitted && isEditing) {
                              handleSubmit(detail.id, supplierId, latestValue, uniqueId);
                            } else {
                              confirmSubmit(e, detail.id, supplierId, latestValue);
                            }
                          }}
                          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mt-4"
                        >
                          <div className="md:col-span-4">
                            <p className="font-medium text-gray-800">{supplier.representative_name}</p>
                            <p className="text-xs text-gray-500">{supplier.company_name}</p>
                          </div>
                          <div className="md:col-span-5 relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="₱ Quoted Price"
                              max={unitPrice} // browser hint
                              disabled={alreadySubmitted && !editingQuotes[uniqueId]}
                              value={
                                alreadySubmitted && !editingQuotes[uniqueId]
                                  ? parseFloat(quoted).toFixed(2)
                                  : quotedPrices[uniqueId] || ""
                              }
                              onChange={handleInputChange}
                              className={`w-full border rounded-md px-4 py-2 text-sm shadow-sm ${
                                alreadySubmitted && !editingQuotes[uniqueId]
                                  ? "bg-gray-100 border-gray-300 text-gray-500"
                                  : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
                              }`}
                            />
                            {alreadySubmitted && !editingQuotes[uniqueId] && (
                              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-green-600">
                                Already submitted
                              </span>
                            )}
                          </div>
                          <div className="md:col-span-3 flex gap-2">
                            {alreadySubmitted && !editingQuotes[uniqueId] ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuotes((prev) => ({ ...prev, [uniqueId]: true }));
                                    setQuotedPrices((prev) => ({ ...prev, [uniqueId]: quoted })); // preload
                                  }}
                                  className="w-14 flex justify-center items-center gap-2 py-2 px-4 font-medium text-sm rounded-md bg-yellow-500 hover:bg-yellow-600 text-white"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => {
                                    showDialog({
                                      title: "Confirm Delete",
                                      message: "Are you sure you want to delete this quoted price?",
                                      type: "confirm",
                                      onConfirm: () => handleDeleteQuote(detail.id, supplierId, uniqueId),
                                    });
                                  }}
                                  className="w-14 flex justify-center items-center gap-2 py-2 px-4 font-medium text-sm rounded-md bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : alreadySubmitted ? (
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleSubmit(detail.id, supplierId, quotedPrices[uniqueId] ?? "", uniqueId)}
                                className={`w-14 flex justify-center items-center gap-2 py-2 px-4 font-medium text-sm rounded-md ${
                                  isSubmitting ? "bg-gray-400 cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-14 flex justify-center items-center gap-2 py-2 px-4 font-medium text-sm rounded-md ${
                                  isSubmitting ? "bg-gray-400 cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </form>
                      );
                    })}

                </div>
              </div>
            ))}
              {entirePRSupplier && (
                <div className="mt-6 text-right">
                  <button
                    onClick={confirmSubmitAll}
                    disabled={submittingId === "all"}
                    className={`inline-flex items-center gap-2 px-6 py-2 text-white text-sm font-semibold rounded-md shadow-sm transition ${
                      submittingId === "all"
                        ? "bg-gray-400 cursor-wait"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {submittingId === "all" ? "Submitting All..." : "Submit Entire PR Quotes"}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Supplier Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-7xl p-6 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Select a Supplier
            </h2>


            {/* Search + toggle */}
            <div className="flex justify-between items-center mb-5 gap-3">
              <input
                type="text"
                placeholder="🔍 Filter suppliers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />

            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Company</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Address</th>
                    <th className="py-3 px-4 text-left">TIN</th>
                    <th className="py-3 px-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSuppliers.length > 0 ? (
                    currentSuppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-indigo-50 transition-colors"
                      >
                        <td className="py-3 px-4">{supplier.id}</td>
                        <td className="py-3 px-4">{supplier.representative_name}</td>
                        <td className="py-3 px-4">{supplier.company_name}</td>
                        <td className="py-3 px-4">
                          {categories.find(c => String(c.id) === String(supplier.category_id))?.name || "N/A"}
                        </td>


                        <td className="py-3 px-4">{supplier.address}</td>
                        <td className="py-3 px-4">{supplier.tin_num}</td>
                        <td className="py-3 px-4 space-x-2 text-nowrap">
                          <button
                            disabled={rfq_details.some(
                              (q) =>
                                q.pr_details_id === selectedItemId &&
                                q.supplier_id === supplier.id
                            )}
                            onClick={() => {
                              const priceValue =
                                selectedItemId === null
                                  ? ""
                                  : estimatedPrice[selectedItemId] || "";
                              const finalBid =
                                priceValue.toString().trim() ||
                                (pr.details?.find((d) => d.id === selectedItemId)?.unit_price ||
                                  "");

                              addSelection(selectedItemId, supplier.id, finalBid);
                              setEstimatedPrice((prev) => ({
                                ...prev,
                                [selectedItemId]: finalBid,
                              }));
                              setSelectedSuppliersByItem((prev) => {
                                const current = prev[selectedItemId] || [];
                                if (current.includes(supplier.id)) return prev;
                                return {
                                  ...prev,
                                  [selectedItemId]: [...current, supplier.id],
                                };
                              });
                              setSelectedSupplierId(String(supplier.id));
                              setShowModal(false);
                            }}
                            className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Select
                          </button>

                        <button
                          onClick={() => {
                            const updatedSelectedSuppliers = { ...selectedSuppliersByItem };
                            const updatedPrices = { ...estimatedPrice };
                            const skipped = [];

                            pr.details.forEach((detail) => {
                              const alreadyQuoted = rfq_details.some(
                                (q) => q.pr_details_id === detail.id && q.supplier_id === supplier.id
                              );

                              if (alreadyQuoted) {
                                skipped.push(detail.item_description || `Item #${detail.id}`);
                              } else {
                                const price = detail.unit_price || "";
                                updatedPrices[detail.id] = price;

                                addSelection(detail.id, supplier.id, price);

                                const current = updatedSelectedSuppliers[detail.id] || [];
                                if (!current.includes(supplier.id)) {
                                  updatedSelectedSuppliers[detail.id] = [...current, supplier.id];
                                }
                              }
                            });

                            setEstimatedPrice(updatedPrices);
                            setSelectedSuppliersByItem(updatedSelectedSuppliers);
                            setSelectedSupplierId(String(supplier.id));
                            setEntirePRSupplier(supplier.id); 
                            setShowModal(false);

                            if (skipped.length > 0) {
                              setSkippedItems(skipped);
                              setWarningDialogOpen(true);
                            }
                          }}
                          className="text-sm bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded-lg shadow"
                        >
                          Apply to Entire PR
                        </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-6 text-gray-400 italic"
                      >
                        No suppliers available for this{" "}
                        {showAllSuppliers ? "search" : "category"}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer actions */}
            <div className="mt-6 border-t pt-4 flex justify-between items-center">
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm shadow-sm"
              >
                ➕ Add New Supplier
              </button>

              <button
                onClick={() => {
                  if (!selectedSupplierId) {
                    Swal.fire("Oops!", "Please select a supplier first.", "warning");
                    return;
                  }
                  setData("supplier_id", selectedSupplierId);
                  setShowModal(false);
                  Swal.fire("Saved!", "Supplier has been selected.", "success");
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm shadow-sm"
              >
                Confirm Selection
              </button>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add Supplier Modal (simplified example) */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-[999] bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowAddSupplierModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
              aria-label="Close add supplier modal"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">Add New Supplier</h3>
            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Representative Name</label>
                <input
                  type="text"
                  required
                  value={newSupplier.representative_name}
                  onChange={e => setNewSupplier(prev => ({ ...prev, representative_name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={newSupplier.company_name}
                  onChange={e => setNewSupplier(prev => ({ ...prev, company_name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  required
                  value={newSupplier.address}
                  onChange={e => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TIN Number</label>
                <input
                  type="text"
                  required
                  value={newSupplier.tin_num}
                  onChange={e => setNewSupplier(prev => ({ ...prev, tin_num: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  value={newSupplier.category_id}
                  onChange={e => setNewSupplier(prev => ({ ...prev, category_id: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={
              dialogContent.type === "error" ? "text-red-600" :
              dialogContent.type === "success" ? "text-green-600" : ""
            }>
              {dialogContent.title}
            </DialogTitle>
            <DialogDescription>
              {dialogContent.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogContent.type === "confirm" ? (
              <>
                <Button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
                  onClick={() => {
                    setDialogOpen(false);
                    setOnConfirmAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                  onClick={() => {
                    if (typeof onConfirmAction === "function") {
                      onConfirmAction();
                    }
                    setDialogOpen(false);
                    setOnConfirmAction(null);
                  }}
                >
                  Confirm
                </Button>
              </>
            ) : (
              <Button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Some Items Skipped</DialogTitle>
          <DialogDescription>
            This supplier already quoted for some items, so they were skipped:
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button onClick={() => setWarningDialogOpen(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </ApproverLayout>
  );
}