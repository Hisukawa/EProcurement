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

  const [remarks_as_read, setRemarks] = useState("");
  const [resultDialog, setResultDialog] = useState({
    open: false,
    type: "success", // "success" | "error"
    title: "",
    description: "",
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

    router.post(route("bac_user.rollback_winner_as_read", { id: rollbackTarget.rfqId }), payload, {
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

    router.post(route("bac_user.save_remarks_as_read", { id: remarksTarget.rfqId }), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setSavingRemarks(false);
        setRemarksDialogOpen(false);
        toast({
          title: "Remarks Saved",
          description: "Supplier remarks updated successfully.",
          duration: 3000,
        });
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
    const handlePrintAOQ = (rfqId, detailId) =>
  window.open(route("bac_user.print_aoq", { id: rfqId, pr_detail_id: detailId }), "_blank");

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
                      <td className="border px-4 py-2 font-medium">{detail.item} {detail.specs}</td>

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
              </tbody>
            </table>
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
