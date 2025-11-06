import { useForm, Head, router } from "@inertiajs/react";
import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import {
  ClipboardSignature,
  CalendarCheck,
  Package,
  Boxes,
  MessageSquareText,
  Save,
  ScanLine,
  Users, // Added for committee section
  BadgeDollarSign, // Added for unit price
  Info, // Added for discrepancy icon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Reusable input wrapper
const LabeledInput = ({ icon, label, children, error, className = "" }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      {icon}
      {label}
    </Label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Helper function to format date to YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RecordIar({ po, inspectionCommittee, iarNumber }) {
  const { data, setData, post, processing, errors } = useForm({
    po_id: po.id,
    iar_number: iarNumber ?? "",
    date_received: getTodayDate(), // Prefill with today's date
    inspection_committee_id: inspectionCommittee?.id || "",
    items: (po.details || []).map((detail) => {
      const prDetail = po.rfq?.purchase_request?.details?.find(
        (pr) => pr.id === detail.pr_detail_id
      );
      return {
        pr_details_id: detail.pr_detail_id,
        product_name: prDetail?.item || "Unknown Item",
        specs: prDetail?.specs || "No specs provided",
        quantity_ordered: parseFloat(detail.quantity || 0),
        unit_price: parseFloat(detail.unit_price || 0),
        quantity_received: "",
        remarks: "",
        total_price: 0,
      };
    }),
    committee_members: (inspectionCommittee?.members || []).map((m) => ({
      id: m.id,
      name: m.name,
      position: m.position,
      status: m.status,
    })),
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast(); // Initialize useToast here
  const [discrepancyDialogOpen, setDiscrepancyDialogOpen] = useState(false);


  // --- ITEMS HANDLING ---
const handleItemChange = (index, field, value) => {
  setData(
    "items",
    data.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item };

        if (field === "quantity_received") {
          let receivedQty = parseFloat(value) || 0;

          // ✅ Prevent less than 1
          if (receivedQty < 1) {
            receivedQty = 1;
          }

          // ✅ Prevent exceeding ordered qty
          if (receivedQty > item.quantity_ordered) {
            receivedQty = item.quantity_ordered;
          }

          updatedItem.quantity_received = receivedQty;
          updatedItem.total_price = receivedQty * updatedItem.unit_price;
        }

        if (field === "remarks") {
          updatedItem.remarks = value; // ✅ Allow typing remarks
        }

        return updatedItem;
      }
      return item;
    })
  );
};



  const grandTotal = useMemo(() => {
    return data.items.reduce((total, item) => total + item.total_price, 0);
  }, [data.items]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const hasDiscrepancy = data.items.some(
      (item) =>
        parseFloat(item.quantity_received || 0) < item.quantity_ordered
    );

    if (hasDiscrepancy) {
      setDiscrepancyDialogOpen(true); // show discrepancy warning first
    } else {
      setConfirmDialogOpen(true); // proceed to normal confirm
    }
  };


  const handleConfirmSave = () => {
    post(route("supply_officer.store_iar"), {
      preserveScroll: true,
      onSuccess: () => {
        setConfirmDialogOpen(false);
        toast({
          title: "IAR Recorded",
          description: "Inspection & Acceptance Report successfully saved!",
          duration: 3000,
          className: "bg-green-600 text-white",
        });
      },
      onError: (errors) => { // Catch errors passed from Inertia
        setConfirmDialogOpen(false); // Close dialog on error as well
        console.error("IAR Save Error:", errors); // Log errors for debugging
        toast({
          title: "Save Failed",
          description: "Please review the inputs and try again.",
          variant: "destructive",
          duration: 4000,
        });
      },
    });
  };

  // --- COMMITTEE HANDLING ---
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [replacementName, setReplacementName] = useState("");


  const handleReplaceMember = (member) => {
    setSelectedMember(member);
    setReplacementName("");
    setReplaceDialogOpen(true);
  };

  const handleConfirmReplace = () => {
    router.post(
      route("inspection.committee.save", { id: inspectionCommittee?.id }),
      {
        member_id: selectedMember.id,
        replacementName,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          // Update UI: mark old inactive, add new active (assuming backend returns updated committee members)
          // For now, client-side optimistic update:
          setData(
            "committee_members",
            data.committee_members
              .map((m) =>
                m.id === selectedMember.id
                  ? { ...m, status: "inactive" }
                  : m
              )
              .concat({
                // This is a placeholder; ideally, the backend should return the new member or entire updated list.
                id: Date.now(), // Unique ID, replace if backend returns real one
                name: replacementName,
                position: selectedMember.position,
                status: "active",
              })
          );

          setReplaceDialogOpen(false);
          toast({
            title: "Member Replaced",
            description: "Inspection Committee updated successfully!",
            duration: 3000,
          });
        },
        onError: (errors) => { // Catch errors passed from Inertia
          setReplaceDialogOpen(false); // Close dialog on error as well
          console.error("Member Replace Error:", errors); // Log errors for debugging
          toast({
            title: "Replace Failed",
            description: "Please check inputs and try again.",
            variant: "destructive",
            duration: 4000,
          });
        },
      }
    );
  };

return (
    <SupplyOfficerLayout header="Schools Divisions Office - Ilagan | Record Inspection and Acceptance">
      <Head title="Record IAR" />

      {/* --- Overall Page Background --- */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 sm:p-6 md:p-10">
        <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 md:p-10 shadow-2xl rounded-2xl max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Record Inspection and Acceptance Report
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mt-2">
              For Purchase Order{" "}
              <span className="font-semibold text-blue-700">#{po.po_number}</span>
            </p>
          </div>

          {/* ERRORS */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-2">Please correct the following:</h3>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(errors).map(
                  ([key, message]) =>
                    !key.startsWith("items.") && <li key={key}>{message}</li>
                )}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* --- Section 1: Global Information --- */}
            <section className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <ClipboardSignature className="text-blue-600" size={22} />
                Global Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-blue-100 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">

                {/* IAR Number */}
                <LabeledInput
                  icon={<ScanLine size={18} className="text-gray-500" />}
                  label="IAR Number"
                  error={errors.iar_number}
                >
                  <Input
                    type="text"
                    value={data.iar_number}
                    onChange={(e) => setData("iar_number", e.target.value)}
                    placeholder="Enter IAR Number"
                    className="h-12 text-base"
                    required
                  />
                </LabeledInput>

                {/* Date */}
                <LabeledInput
                  icon={<CalendarCheck size={18} className="text-gray-500" />}
                  label="Date Received"
                  error={errors.date_received}
                >
                  <Input
                    type="date"
                    value={data.date_received}
                    onChange={(e) => setData("date_received", e.target.value)}
                    className="h-12 text-base focus-visible:ring-yellow-400 bg-gray-50"
                    required
                  />
                </LabeledInput>
              </div>
            </section>

            {/* --- Section 2: Received Items --- */}
            <section className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <Boxes className="text-blue-600" size={22} />
                Received Items
              </h3>

              <div className="grid gap-6">
                {data.items.map((item, index) => {
                  const totalReceivedPrice =
                    (parseFloat(item.quantity_received) || 0) * item.unit_price;
                  const hasDiscrepancy =
                    parseFloat(item.quantity_received || 0) !==
                      item.quantity_ordered &&
                    parseFloat(item.quantity_received || 0) > 0;

                  return (
                    <div
                      key={item.pr_details_id}
                      className="bg-gradient-to-br from-blue-100 to-white border border-blue-100 rounded-xl p-6 shadow-md hover:shadow-lg transition"
                    >

                      {/* Item Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100">
                        <div>
                          <h4 className="text-lg sm:text-xl font-semibold text-blue-800">
                            {item.product_name}
                          </h4>
                          <p className="text-sm sm:text-md text-gray-600 mt-1">
                            {item.specs}
                          </p>
                        </div>
                        <div className="text-right mt-4 sm:mt-0">
                          <p className="text-sm font-medium text-gray-500 flex items-center justify-end gap-1">
                            <BadgeDollarSign size={14} /> Unit Price
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-green-700">
                            ₱{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Quantities */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <LabeledInput
                          icon={<Package size={16} />}
                          label="Quantity Ordered"
                        >
                          <Input
                            type="text"
                            className="text-center font-bold h-12 border-gray-200 cursor-not-allowed"
                            value={item.quantity_ordered}
                            onWheel={(e) => e.currentTarget.blur()}
                            readOnly
                          />
                        </LabeledInput>

                        <LabeledInput
                          icon={<Boxes size={16} />}
                          label="Quantity Received *"
                          error={errors[`items.${index}.quantity_received`]}
                        >
                          <Input
                            type="number"
                            className={`text-center focus-visible:ring-yellow-400 bg-gray-50 font-bold h-12 ${
                              hasDiscrepancy
                                ? "border-yellow-500 focus-visible:ring-yellow-400"
                                : "border-gray-300"
                            }`}
                            value={item.quantity_received}
                            onChange={(e) =>
                              handleItemChange(index, "quantity_received", e.target.value)
                            }
                            onWheel={(e) => e.currentTarget.blur()}
                            min="1"   // ✅ force at least 1
                            placeholder="Quantity Received"
                            required
                          />

                          {hasDiscrepancy && (
                            <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                              <Info size={12} /> Discrepancy with ordered qty
                            </p>
                          )}
                        </LabeledInput>

                        <LabeledInput
                          icon={<ScanLine size={16} />}
                          label="Total for Item"
                        >
                          <Input
                            type="text"
                            className="bg-blue-50 text-blue-800 text-center font-extrabold h-12 border-blue-200 cursor-not-allowed"
                            value={totalReceivedPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            readOnly
                          />
                        </LabeledInput>
                      </div>

                      {/* Remarks */}
                      <div className="mt-6">
                        <LabeledInput
                          icon={<MessageSquareText size={16} />}
                          label="Remarks"
                          error={errors[`items.${index}.remarks`]}
                        >
                          <Textarea
                            placeholder="Add remarks (e.g., damaged, incomplete)"
                            value={item.remarks}
                            onChange={(e) =>
                              handleItemChange(index, "remarks", e.target.value)
                            }
                            rows={3}
                            className="min-h-[70px] focus-visible:ring-yellow-400 bg-gray-50"
                          />
                        </LabeledInput>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* --- Section 3: Footer --- */}
            <section className="border-t border-gray-200 pt-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* COMMITTEE */}
                <div className="lg:col-span-2 p-6 border border-blue-100 rounded-xl bg-blue-50/70 shadow-sm">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Inspection Committee
                  </h3>
                  <ul className="space-y-3">
                    {data.committee_members
                      ?.filter((m) => m.status === "active")
                      .sort((a, b) => {
                        if (a.position.toLowerCase().includes("leader")) return -1;
                        if (b.position.toLowerCase().includes("leader")) return 1;
                        return 0;
                      })
                      .map((member) => (
                        <li
                            key={member.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100"
                          >

                          <div>
                            <p className="font-semibold text-gray-800">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.position}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplaceMember(member)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Replace
                          </Button>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* GRAND TOTAL */}
                <div className="lg:col-span-1 flex justify-center lg:justify-end">
                  <div className="text-center p-6 sm:p-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md w-full sm:w-auto">
                    <p className="text-base sm:text-lg font-semibold mb-2 opacity-90">
                      Grand Total Received
                    </p>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight break-words">
                      ₱
                      {grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition rounded-xl"
                > 
                  <Save size={18} />
                  Save Inspection Report
                </Button>
              </div>
            </section>
          </form>
        </div>
      </div>

     <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Replace Committee Member</DialogTitle>
            <DialogDescription className="text-md text-gray-600">
              Replace <strong className="text-blue-700">{selectedMember?.name}</strong> with a new inspector.
            </DialogDescription>
          </DialogHeader>

          <LabeledInput label="New Inspector Name" className="mt-4" error={errors.replacementName}> {/* Error for replacementName */}
            <Input
              type="text"
              value={replacementName}
              onChange={(e) => setReplacementName(e.target.value)}
              placeholder="Enter new inspector's full name"
              className="h-10 text-base"
            />
          </LabeledInput>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReplaceDialogOpen(false)} className="px-6 py-2">
              Cancel
            </Button>
            <Button onClick={handleConfirmReplace} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
              Confirm Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM SAVE DIALOG */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Confirm Record IAR</DialogTitle>
            <DialogDescription className="text-md text-gray-600">
              Are you sure you want to record this Inspection & Acceptance Report?
              Please ensure all details are correct.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="px-6 py-2">
              Cancel
            </Button>
            <Button disabled={processing} onClick={handleConfirmSave} className="px-6 py-2 bg-green-600 hover:bg-green-700">
              {processing ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DISCREPANCY WARNING DIALOG */}
      <Dialog open={discrepancyDialogOpen} onOpenChange={setDiscrepancyDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-yellow-700">
              Quantity Discrepancy Detected
            </DialogTitle>
            <DialogDescription className="text-md text-gray-700">
              One or more items have <strong>received quantity less than ordered</strong>.  
              Are you sure you want to continue recording this Inspection & Acceptance Report?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDiscrepancyDialogOpen(false)}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDiscrepancyDialogOpen(false);
                setConfirmDialogOpen(true); // move to final confirm
              }}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SupplyOfficerLayout>
  );
}