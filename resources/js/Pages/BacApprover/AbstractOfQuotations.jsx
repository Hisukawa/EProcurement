import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AOQTabs from "@/Layouts/AOQTabs";
import { Undo2 } from "lucide-react";

export default function AbstractOfQuotations({ rfq, groupedDetails = {}, committee }) {
  const pr = rfq.purchase_request;

  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [remarks_as_read, setRemarks] = useState("");
  const [resultDialog, setResultDialog] = useState({
    open: false,
    type: "success", // "success" | "error"
    title: "",
    description: "",
  });

  const [selectedWinner, setSelectedWinner] = useState({
    rfqId: null,
    supplierId: null,
    detailId: null,
  });
  const [committeeDialogOpen, setCommitteeDialogOpen] = useState(false);
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState(null);
  const [replacementName, setReplacementName] = useState("");
  const [awardMode, setAwardMode] = useState(rfq.award_mode ?? "whole-pr");

  // Initialize committee state from props
  const [committeeState, setCommitteeState] = useState(() => {
    const members = {};
    const positions = ["secretariat", "member1", "member2", "member3", "vice_chair", "chair"];

    positions.forEach((pos) => {
      const activeMember = committee?.members
        ?.filter((m) => m.position === pos)
        ?.find((m) => m.status === "active");

      members[pos] = {
        name: activeMember?.name || "",
        status: activeMember?.status || "inactive", // 👈 fallback is inactive
      };
    });

    return { status: committee?.status || "draft", members };
  });
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [savingCommittee, setSavingCommittee] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [confirmingWinner, setConfirmingWinner] = useState(false);
  const [submissionType, setSubmissionType] = useState('as-read'); // default

  const handleOpenRollbackDialog = (rfqId, supplierId, detailId = null) => {
    setRollbackTarget({ rfqId, supplierId, detailId });
    setRemarks("");
    setRollbackDialogOpen(true);
  };

  const handleConfirmRollback = () => {
    setRollingBack(true);
    const payload = {
      remarks_as_read,
      mode: awardMode,
      ...(awardMode === "per-item" ? { detail_id: rollbackTarget.detailId } : {}),
    };

    router.post(route("bac_approver.rollback_winner_as_read", { id: rollbackTarget.rfqId }), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setRollbackDialogOpen(false);
        setRollingBack(false);
        setResultDialog({
          open: true,
          type: "success",
          title: "Rollback Successful",
          description: "Winner selection has been rolled back.",
        });
        toast({
          title: "Rollback Successful",
          description: "Winner selection has been rolled back.",
          duration: 3000,
        });
      },
      onError: () => {
        setRollingBack(false);
        setResultDialog({
          open: true,
          type: "error",
          title: "Rollback Failed",
          description: "Unable to rollback winner. Please try again.",
        });
      },
    });
  };

  const handlePrintAOQ = (rfqId) =>
    window.open(route("bac_approver.print_aoq", { id: rfqId }), "_blank");
  const handlePrintItemAOQ = (rfqId, detailId) =>
    window.open(route("bac_approver.print_aoq", { id: rfqId, pr_detail_id: detailId }), "_blank");

  const handleOpenWinnerDialog = (rfqId, supplierId, detailId = null) => {
    setSelectedWinner({ rfqId, supplierId, detailId });
    setRemarks("");
    setWinnerDialogOpen(true);
  };

const handleConfirmWinner = async () => {
  setConfirmingWinner(true);

  const payload = {
    supplier_id: selectedWinner.supplierId,
    remarks_as_read,
    mode: awardMode,
    ...(awardMode === "per-item" ? { detail_id: selectedWinner.detailId } : {}),
  };

  try {
    const response = await axios.post(
      route("bac_approver.mark_winner", { id: selectedWinner.rfqId }),
      payload
    );

    if (response.data.success) {
      setWinnerDialogOpen(false);
      setResultDialog({
        open: true,
        type: "success",
        title: "Winner Marked",
        description:
          awardMode === "per-item"
            ? "Supplier has been awarded for the selected item."
            : "Supplier has been awarded for the entire PR.",
      });
      toast({
        title: "Winner Marked",
        description:
          awardMode === "per-item"
            ? "Supplier has been awarded for the selected item."
            : "Supplier has been awarded for the entire PR.",
        duration: 3000,
      });
      router.reload({ preserveScroll: true });
    }
  } catch (error) {
    setConfirmingWinner(false);
    setResultDialog({
      open: true,
      type: "error",
      title: "Failed to Mark Winner",
      description: "Something went wrong while marking the winner. Please try again.",
    });
  }
};


  // --- Process supplier data ---
  const supplierMap = {};
  const winnerCounts = {};
  pr.details.forEach((detail) => {
  const quotesForItem = groupedDetails[detail.id] || [];
  quotesForItem.forEach((quote) => {
    const sid = quote.supplier.id;
    if (!supplierMap[sid]) {
      supplierMap[sid] = { supplier: quote.supplier, detailIds: new Set(), total: 0, quotes: [] };
      winnerCounts[sid] = 0;
    }
    supplierMap[sid].detailIds.add(detail.id);

    // --- Multiply by quantity safely ---
    const quantity = detail.quantity ?? 1; // fallback to 1 if undefined
    const price = parseFloat(quote.quoted_price ?? 0) || 0; // fallback to 0
    supplierMap[sid].total += price * quantity;

    supplierMap[sid].quotes.push(quote); // Store quotes for easy remark comparison
    if (quote.is_winner_as_read) winnerCounts[sid]++;
  });
});


  const totalDetailsCount = pr.details.length;
  const fullBidSuppliers = Object.values(supplierMap).filter(
    (s) => s.detailIds.size === totalDetailsCount
  );

  const hasFullBidSuppliers = fullBidSuppliers.length > 0;

  // Ensure awardMode is valid
  useEffect(() => {
    if (!hasFullBidSuppliers && awardMode === "whole-pr") {
      setAwardMode("per-item");
    }
  }, [hasFullBidSuppliers, awardMode]);

  const hasAnyWinner = pr.details.some((detail) =>
    (groupedDetails[detail.id] || []).some((q) => q.is_winner_as_read)
  );

  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksTarget, setRemarksTarget] = useState(null);
  // { rfqId, supplierId, detailId (nullable), currentRemarks }
  const [remarksInput, setRemarksInput] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);

  const handleSaveRemarks = () => {
    setSavingRemarks(true);
    const payload = {
      supplier_id: remarksTarget.supplierId,
      remarks_as_read: remarksInput,
      mode: awardMode,
      ...(remarksTarget.detailId !== null ? { detail_id: remarksTarget.detailId } : {}),
    };

    // If detailId is null, it means we are in "whole-pr" mode and want to update all item remarks
    // for this supplier. THIS ASSUMES YOUR BACKEND CAN HANDLE `detail_id: null`
    // to apply the remark to all quotes for that supplier within the RFQ.
    // If your backend *only* updates a single item, you'll need to refactor this
    // to loop through all supplierMap[remarksTarget.supplierId].quotes
    // and send a separate request for each with its specific detail_id.
    // For now, adhering to the assumption that `detail_id: null` applies broadly.
    router.post(route("bac_approver.save_remarks_as_read", { id: remarksTarget.rfqId }), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setSavingRemarks(false);
        setRemarksDialogOpen(false);
        toast({
          title: "Remarks Saved",
          description: "Supplier remarks updated successfully.",
          duration: 3000,
        });
        // IMPORTANT: Trigger a reload to get updated groupedDetails
        // so the frontend reflects the changes.
        router.reload({ only: ['rfq', 'groupedDetails'] });
      },
      onError: () => {
        setSavingRemarks(false);
        toast({
          title: "Save Failed",
          description: "Could not save remarks. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      },
    });
  };

  return (
    <ApproverLayout>
      <Head title={`Abstract for ${pr.pr_number}`} />
      <div className="px-8 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Abstract of Quotations – PR #{pr.pr_number}
        </h2>
        <AOQTabs pr={pr.id} />
        {/* Back Button */}
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm shadow-sm"
          >
            ← Back
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex gap-4">
          <Button
            variant={awardMode === "whole-pr" ? "default" : "outline"}
            onClick={() => setAwardMode("whole-pr")}
            disabled={!!rfq.award_mode} // disable if mode already chosen
          >
            Winner for Entire PR
          </Button>
          {/* <Button
            variant={awardMode === "per-item" ? "default" : "outline"}
            onClick={() => setAwardMode("per-item")}
            disabled={!!rfq.award_mode} // disable if mode already chosen
          >
            Winner per Item
          </Button> */}
        </div>

        {!hasFullBidSuppliers && (
          <p className="text-sm text-red-600 mb-4">
            ⚠️ No supplier quoted for all items. You can only declare winners per item.
          </p>
        )}

        {/* WHOLE PR MODE */}
        {awardMode === "whole-pr" && (
          <div className="mb-10 border p-4 rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start p-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Comparison for Entire Purchase Request
                </h3>
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Focal Person:</strong> {pr.focal_person.firstname}{" "}
                    {pr.focal_person.lastname}
                  </p>
                  <p>
                    <strong>Division:</strong> {pr.division.division}
                  </p>
                </div>

                {/* 📝 Add note if only 1 supplier submitted full bid */}
                {fullBidSuppliers.length === 1 && (
                  <p className="mt-2 text-sm text-orange-600 font-medium">
                    ⚠️ Note: Only one supplier submitted quotes for the entire PR.
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePrintAOQ(rfq.id)}
                className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md h-fit"
              >
                🖨️ Print Abstract as Read
              </button>
            </div>

            <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3 text-left font-semibold">Item</th>
                  {fullBidSuppliers.map((s) => (
                    <th
                      key={s.supplier.id}
                      className="border px-4 py-3 text-center font-semibold text-xs w-56"
                    >
                      {s.supplier.company_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pr.details.map((detail, rowIndex) => {
                  const quotes = groupedDetails[detail.id] || [];

                  // Find lowest quote for this item
                  const lowestQuote = quotes.reduce((min, q) =>
                    !min || parseFloat(q.quoted_price) < parseFloat(min.quoted_price)
                      ? q
                      : min,
                    null
                  );

                  return (
                    <tr
                      key={detail.id}
                      className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {/* Item Name */}
                      <td className="border px-4 py-2 font-medium">{detail.item}</td>

                      {/* Supplier Quotes (No item-level remarks here anymore) */}
                      {fullBidSuppliers.map((s) => {
                        const quote = quotes.find((q) => q.supplier.id === s.supplier.id);
                        const isLowest =
                          quote && lowestQuote && quote.supplier.id === lowestQuote.supplier.id;

                        return (
                          <td
                            key={s.supplier.id}
                            className={`border px-4 py-2 text-center align-top ${
                              isLowest ? "bg-green-50" : ""
                            }`}
                          >
                            {quote ? (
                              <span
                                className={`font-semibold ${
                                  isLowest ? "text-green-700" : "text-gray-800"
                                }`}
                              >
                                <span className="mr-1">
                                  ₱{Math.round(quote.quoted_price).toLocaleString()}
                                </span>
                                <span className="mx-1">x</span>
                                <span className="mr-1">{detail.quantity}</span>
                                <span>{detail.unit}</span>
                              </span>

                              
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Totals Row */}
                <tr className="bg-gray-200 font-semibold">
                  <td className="border px-4 py-3 text-right">Total Quoted Price Per Unit</td>
                  {fullBidSuppliers.map((s) => (
                    <td
                      key={s.supplier.id}
                      className="border px-4 py-3 text-right text-green-700"
                    >
                      ₱{parseFloat(s.total).toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* New Remarks Row - per supplier, consolidated */}
                <tr className="bg-gray-50">
                  <td className="border px-4 py-3 text-right font-semibold">Supplier Remarks</td>
                  {fullBidSuppliers.map((s) => {
                    // Collect all remarks for this supplier across all items
                    const supplierAllRemarks = s.quotes
                      .filter(q => q.rfq_id === rfq.id) // Ensure quotes belong to current RFQ
                      .map(q => q.remarks_as_read?.trim() || "");

                    // Check if all remarks are identical
                    const allRemarksAreSame = supplierAllRemarks.every(
                      (val, i, arr) => val === arr[0]
                    );
                    const displayedRemarks =
                      allRemarksAreSame && supplierAllRemarks.length > 0
                        ? supplierAllRemarks[0] || "No remarks"
                        : "Varying remarks (edit to unify)";

                    return (
                      <td key={`remarks-${s.supplier.id}`} className="border px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-600 italic">
                            {displayedRemarks}
                          </span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-2 py-1"
                            onClick={() => {
                              setRemarksTarget({
                                rfqId: rfq.id,
                                supplierId: s.supplier.id,
                                detailId: null, // Critical: signal for PR-wide update
                                currentRemarks:
                                  displayedRemarks === "No remarks" || displayedRemarks.includes("Varying")
                                    ? "" // Clear input if no remarks or varying
                                    : displayedRemarks,
                              });
                              setRemarksInput(
                                displayedRemarks === "No remarks" || displayedRemarks.includes("Varying")
                                  ? ""
                                  : displayedRemarks
                              );
                              setRemarksDialogOpen(true);
                            }}
                          >
                            Edit Remarks
                          </Button>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Winner Row */}
                <tr className="bg-gray-100">
                  <td className="border px-4 py-3 text-right font-semibold">Winner</td>
                  {fullBidSuppliers.map((s) => (
                    <td key={s.supplier.id} className="border px-4 py-3 text-center">
                      {winnerCounts[s.supplier.id] === totalDetailsCount ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-green-600 font-bold">✔ Winner</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenRollbackDialog(rfq.id, s.supplier.id)}
                            disabled={!!rfq.purchase_order} // ✅ correct: check RFQ
                          >
                            <Undo2 className="h-4 w-4" />
                            Undo
                          </Button>
                        </div>
                      ) : hasAnyWinner ? (
                        "—"
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenWinnerDialog(rfq.id, s.supplier.id)}
                        >
                          Mark as Winner
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* PER ITEM MODE */}
        {awardMode === "per-item" && (
          <div className="space-y-8 mb-10 border p-4 rounded-lg bg-white shadow-sm">
            {pr.details.map((detail) => {
              const quotes = groupedDetails[detail.id] || [];
              const itemHasWinner = quotes.some((q) => q.is_winner_as_read);

              return (
                <div
                  key={detail.id}
                  className="border p-4 bg-white rounded-lg shadow-sm"
                >
                  {/* Header with Print Button */}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{detail.item}</h4>
                    <button
                      onClick={() => handlePrintItemAOQ(rfq.id, detail.id)}
                      className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md"
                    >
                      🖨️ Print AOQ
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Description:</strong> {detail.specs || "—"} <br />
                    <strong>Quantity:</strong> {detail.quantity} {detail.unit} <br />
                  </p>

                  <table className="w-full text-sm border rounded-lg overflow-hidden shadow">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Supplier</th>{" "}
                        {quotes.map((q) => (
                          <th
                            key={q.supplier.id}
                            className="px-4 py-2 text-center"
                          >
                            {q.supplier.company_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 font-medium">Quoted Price</td>
                        {quotes.map((q) => (
                          <td
                            key={q.supplier.id}
                            className="px-4 py-2 text-center align-top"
                          >
                            <span className="font-semibold text-gray-800">
                              ₱{parseFloat(q.quoted_price || 0).toLocaleString()}
                            </span>
                          </td>
                        ))}
                      </tr>
                      {/* Remarks row for per-item mode */}
                      <tr>
                        <td className="px-4 py-2 font-medium">Remarks</td>
                        {quotes.map((q) => {
                          const itemSpecificRemarks = q.remarks_as_read?.trim() || "No remarks"; // Use q.remarks directly
                          return (
                            <td key={`item-remarks-${q.supplier.id}`} className="px-4 py-2 text-center align-top">
                              <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs text-gray-600 italic">
                                  {itemSpecificRemarks}
                                </span>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="px-2 py-1"
                                  onClick={() => {
                                    setRemarksTarget({
                                      rfqId: rfq.id,
                                      supplierId: q.supplier.id,
                                      detailId: detail.id,
                                      currentRemarks: itemSpecificRemarks === "No remarks" ? "" : itemSpecificRemarks,
                                    });
                                    setRemarksInput(itemSpecificRemarks === "No remarks" ? "" : itemSpecificRemarks);
                                    setRemarksDialogOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Winner controls row for per-item mode */}
                      <tr>
                        <td className="px-4 py-2 font-medium">Winner Status</td>
                        {quotes.map((q) => (
                          <td
                            key={`item-winner-${q.supplier.id}`}
                            className="px-4 py-2 text-center align-top"
                          >
                            {q.is_winner_as_read ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-green-600 font-bold">✔ Winner</span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleOpenRollbackDialog(rfq.id, q.supplier.id, detail.id)
                                  }
                                >
                                  Rollback
                                </Button>
                              </div>
                            ) : itemHasWinner ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleOpenWinnerDialog(rfq.id, q.supplier.id, detail.id)
                                }
                              >
                                Mark as Winner
                              </Button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* BAC COMMITTEE */}
        <div className="mb-8 p-4 border rounded-lg bg-gray-50 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">BAC Committee</h3>
          <ul className="space-y-3">
            {["chair", "vice_chair", "secretariat", "member1", "member2", "member3"].map(
              (position) => {
                const info = committeeState.members[position];
                return (
                  info?.status === "active" && ( // ✅ Only render if active
                    <li
                      key={position}
                      className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{info.name || "—"}</p>
                        <p className="text-sm text-gray-500">
                          {position.replace("_", " ").toUpperCase()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember({ position, current: info });
                          setReplacementName("");
                          setCommitteeDialogOpen(true);
                        }}
                      >
                        Replace
                      </Button>
                    </li>
                  )
                );
              }
            )}
          </ul>
        </div>
      </div>


      {/* WINNER CONFIRMATION DIALOG */}
      <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Winner</DialogTitle>
            <DialogDescription>Provide remarks for awarding this supplier.</DialogDescription>
          </DialogHeader>
          <Textarea value={remarks_as_read} onChange={(e) => setRemarks(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setWinnerDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={confirmingWinner} onClick={handleConfirmWinner}>{confirmingWinner ? "Confirming Winner..." : "Confirm" }</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMMITTEE REPLACEMENT DIALOG */}
      <Dialog open={committeeDialogOpen} onOpenChange={setCommitteeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace Committee Member</DialogTitle>
            <DialogDescription>
              Enter a new member to replace{" "}
              <strong>{selectedMember?.current?.name || "N/A"}</strong> (
              {selectedMember?.position.replace("_", " ").toUpperCase()}).
            </DialogDescription>
          </DialogHeader>

          <input
            type="text"
            value={replacementName}
            onChange={(e) => setReplacementName(e.target.value)}
            placeholder="Enter new member name"
            className="w-full border px-3 py-2 rounded mb-2"
          />

          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setCommitteeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={savingCommittee}
              onClick={() => {
                if (!replacementName.trim()) return;
                setSavingCommittee(true);
                // 1. Update local state immediately
                setCommitteeState((prev) => ({
                  ...prev,
                  members: {
                    ...prev.members,
                    [selectedMember.position]: {
                      name: replacementName.trim(),
                      status: "active",
                    },
                  },
                }));

                // 2. Build payload for backend
                const payload = {
                  id: committee?.id ?? null,
                  status: committeeState.status,
                  members: Object.entries({
                    ...committeeState.members,
                    [selectedMember.position]: {
                      name: replacementName.trim(),
                      status: "active",
                    },
                  }).map(([position, info]) => ({
                    position,
                    name: info.name,
                    status: info.status,
                  })),
                };

                // 3. Submit to backend
                router.post(route("bac.committee.save"), payload, {
                  preserveScroll: true,
                  onSuccess: () => {
                    setSavingCommittee(false);
                    setCommitteeDialogOpen(false);
                    setResultDialog({
                      open: true,
                      type: "success",
                      title: "Committee Updated",
                      description: `${selectedMember.position.replace("_", " ")} replaced successfully.`,
                    });
                    toast({
                      title: "Committee Updated",
                      description: `${selectedMember.position.replace("_", " ")} replaced successfully.`,
                      duration: 3000,
                    });
                  },
                  onError: () => {
                    setSavingCommittee(false);
                    setResultDialog({
                      open: true,
                      type: "error",
                      title: "Committee Update Failed",
                      description: "Unable to replace committee member. Please try again.",
                    });
                  },
                });
              }}
            >
              {savingCommittee ? "Saving..." : "Confirm"}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Winner</DialogTitle>
            <DialogDescription>
              Provide remarks for rolling back this winner selection.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={remarks_as_read}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={rollingBack} variant="destructive" onClick={handleConfirmRollback}>
              {rollingBack ? "Rolling Back Winner..." : "Confirm Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* RESULT DIALOG */}
    <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={resultDialog.type === "error" ? "text-red-600" : "text-green-600"}>
            {resultDialog.title}
          </DialogTitle>
          <DialogDescription>{resultDialog.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Supplier Remarks</DialogTitle>
      <DialogDescription>
        Enter remarks for this supplier {awardMode === "per-item" ? "on this item" : "for the PR"}.
      </DialogDescription>
    </DialogHeader>

    <Textarea
      value={remarksInput}
      onChange={(e) => setRemarksInput(e.target.value)}
    />

    <DialogFooter>
      <Button variant="secondary" onClick={() => setRemarksDialogOpen(false)}>
        Cancel
      </Button>
      <Button disabled={savingRemarks} onClick={handleSaveRemarks}>
        {savingRemarks ? "Saving..." : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


    </ApproverLayout>
  );
}
