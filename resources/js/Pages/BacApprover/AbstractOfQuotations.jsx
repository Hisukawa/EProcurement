import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router, useForm } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
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
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";

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
    (groupedDetails[detail.id] || []).some((q) => q.is_winner_as_calculated)
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


  // Your existing forms...
  const mainForm = useForm({
    project_no: "",
    date_of_opening: "",
    venue: "",
  });

  // 🔹 NEW — separate form for project info submission
  const projectInfoForm = useForm({
    project_no:rfq.project_no || "",
    date_of_opening: rfq.date_of_opening || "",
    venue: rfq.venue || "",
  });
  useEffect(() => {
  projectInfoForm.setData({
    project_no: rfq.project_no || "",
    date_of_opening: rfq.date_of_opening || "",
    venue: rfq.venue || "",
  });
}, [rfq]);


  const handleProjectInfoSubmit = (e) => {
    e.preventDefault();
    projectInfoForm.post(route("bac_user.submit_project_info", rfq.id));
  };

    const handlePrintPerItemGroupedAsRead = (rfqId) =>
    window.open(route("bac_user.print_aoq_per_item_grouped_read", { id: rfqId }), "_blank");

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

        {!hasFullBidSuppliers && (
          <p className="text-sm text-red-600 mb-4">
            ⚠️ No supplier quoted for all items. You can only declare winners per item.
          </p>
        )}
<form
  onSubmit={handleProjectInfoSubmit}
  className="mt-6 mb-4 border-t pt-6"
>
  <div className="bg-white shadow-md rounded-lg p-6 space-y-5">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-3">
      Project Information
    </h3>

    <div className="flex justify-end mb-2">
              <Button
              type="button"
                size="sm"
                className="bg-green-600 text-white"
                onClick={() => handlePrintPerItemGroupedAsRead(rfq.id)}
              >
                🖨️ Print AOQ AS READ
              </Button>
            </div>
    

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column - Project Number */}
      <div className="flex flex-col">
        <Label
          htmlFor="project_number"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Project Number
        </Label>
        <Textarea
          id="project_number"
          rows={6}
          className="resize-none bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={projectInfoForm.data.project_no}
          onChange={(e) =>
            projectInfoForm.setData("project_no", e.target.value)
          }
          placeholder="Enter project number..."
        />
      </div>

      {/* Right Column - Date + Venue */}
      <div className="flex flex-col justify-between h-full space-y-4">
        <div>
          <Label
            htmlFor="date_opening"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Date of Opening
          </Label>
          <Input
            id="date_opening"
            type="date"
            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={projectInfoForm.data.date_of_opening}
            onChange={(e) =>
              projectInfoForm.setData("date_of_opening", e.target.value)
            }
          />
        </div>

        <div>
          <Label
            htmlFor="venue"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Venue
          </Label>
          <Input
            id="venue"
            type="text"
            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={projectInfoForm.data.venue}
            onChange={(e) =>
              projectInfoForm.setData("venue", e.target.value)
            }
            placeholder="Enter venue..."
          />
        </div>
      </div>
    </div>

    <div className="pt-4 border-t mt-6 flex justify-end">
      <Button
        type="submit"
        disabled={projectInfoForm.processing}
        className="px-6"
      >
        {projectInfoForm.processing
          ? "Submitting..."
          : "Submit Project Info"}
      </Button>
    </div>
  </div>
</form>



{/* Unified Abstract Table for Printing */}
<div className="border rounded-lg bg-white shadow-sm p-4 mt-8 mb-8">
  <h3 className="text-lg font-semibold mb-4 text-gray-800">
    Abstract of Quotation
  </h3>

  <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
    <thead className="bg-gray-100">
      <tr>
        <th className="border px-4 py-3 text-left font-semibold w-64">
          Item Description
        </th>
        {Array.from(
          new Map(
            Object.values(groupedDetails)
              .flat()
              .map((q) => [q.supplier.id, q.supplier])
          ).values()
        ).map((supplier) => (
          <th
            key={supplier.id}
            className="border px-4 py-3 text-center font-semibold"
          >
            {supplier.company_name}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {pr.details.map((detail, idx) => {
        const quotes = groupedDetails[detail.id] || [];
        const suppliers = Array.from(
          new Map(
            Object.values(groupedDetails)
              .flat()
              .map((q) => [q.supplier.id, q.supplier])
          ).values()
        );

        // Find lowest quote for this item
        const lowestQuote = quotes.reduce((min, q) => {
          const price = parseFloat(q.quoted_price) || 0;
          return !min || price < parseFloat(min.quoted_price) ? q : min;
        }, null);

        return (
          <tr
            key={detail.id}
            className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            <td className="border px-4 py-3">
              <div className="font-semibold text-gray-800">
                {detail.item} {detail.specs}
              </div>
              <div className="text-xs text-red-500">
                Qty: {detail.quantity} {detail.unit}
              </div>
            </td>

            {suppliers.map((supplier) => {
              const quote = quotes.find(
                (q) => q.supplier.id === supplier.id
              );
              const isWinner = quote?.is_winner_as_read;
              const isLowest =
                lowestQuote &&
                quote?.supplier.id === lowestQuote.supplier.id;

              if (!quote)
                return (
                  <td
                    key={supplier.id}
                    className="border text-center text-gray-400 italic py-3"
                  >
                    —
                  </td>
                );

              const total =
                (parseFloat(quote.quoted_price) || 0) *
                (parseFloat(detail.quantity) || 0);

              return (
                <td
                  key={supplier.id}
                  className={`border px-4 py-2 text-center ${
                    isLowest
                      ? "bg-green-50 font-semibold text-green-700"
                      : ""
                  } ${isWinner ? "border-2 border-green-400" : ""}`}
                >
                  <div>₱{parseFloat(quote.quoted_price).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    ₱{total.toLocaleString()}
                  </div>
                  {isWinner && (
                    <div className="text-xs text-green-700 font-semibold">
                      ✅ Winner
                    </div>
                  )}
                </td>
              );
            })}
            
          </tr>
          
        );
      })}
      
{/* TOTAL ROW */}
<tr className="bg-blue-50 font-semibold text-gray-800">
  <td className="border px-4 py-2 text-right">
    Total:
  </td>

  {Array.from(
    new Map(
      Object.values(groupedDetails)
        .flat()
        .map((q) => [q.supplier.id, q.supplier])
    ).values()
  ).map((supplier) => {
    const total = supplierMap[supplier.id]?.total || 0;

    return (
      <td
        key={supplier.id}
        className="border px-4 py-2 text-center text-blue-700"
      >
        ₱{total.toLocaleString()}
      </td>
    );
  })}
</tr>

      {/* REMARKS ROW */}
      <tr className="bg-gray-50">
        <td className="border px-4 py-2 text-right font-medium text-gray-700">
          Remarks:
        </td>

        {Array.from(
          new Map(
            Object.values(groupedDetails)
              .flat()
              .map((q) => [q.supplier.id, q.supplier])
          ).values()
        ).map((supplier) => {
          // Gather remarks from all items under this supplier
          const allRemarks = Object.values(groupedDetails)
            .flat()
            .filter((q) => q.supplier.id === supplier.id)
            .map((q) => q.remarks_as_read)
            .filter(Boolean);

          const uniqueRemarks = [...new Set(allRemarks)];
          const displayRemarks =
            uniqueRemarks.length > 0
              ? uniqueRemarks.join("; ")
              : "No remarks";

          return (
            <td
              key={supplier.id}
              className="border px-4 py-2 text-center text-gray-600"
            >
              {uniqueRemarks.length > 0 ? (
                displayRemarks
              ) : (
                <span className="italic text-gray-400">No remarks</span>
              )}
            </td>
          );
        })}
      </tr>

      {/* EDIT REMARKS BUTTONS ROW */}
      <tr>
        <td className="border px-4 py-2 text-right font-medium text-gray-700">
          Actions:
        </td>

        {Array.from(
          new Map(
            Object.values(groupedDetails)
              .flat()
              .map((q) => [q.supplier.id, q.supplier])
          ).values()
        ).map((supplier) => (
          <td
            key={supplier.id}
            className="border px-4 py-3 text-center"
          >
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                setRemarksTarget({
                  rfqId: rfq.id,
                  supplierId: supplier.id,
                  detailId: null,
                  currentRemarks: "", // optional if you want to prefill
                });
                setRemarksInput("");
                setRemarksDialogOpen(true);
              }}
            >
              Edit Remarks
            </Button>
          </td>
        ))}
      </tr>
    </tbody>
  </table>
</div>






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
