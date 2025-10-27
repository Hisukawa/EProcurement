import ApproverLayout from "@/Layouts/ApproverLayout"
import { Head, router } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"
import TwgUserLayout from "@/Layouts/TwgUserLayout"

export default function ViewDetails({ pr }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSendingBack, setIsSendingBack] = useState(false);

const handleSendBack = () => {
  if (!reason.trim()) {
    setError("You must provide a reason.");
    return;
  }
  setIsSendingBack(true);

  router.post(
    route("twg_user.send_back", pr.id),
    { reason },
    {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast({
          title: "Sent Back!",
          description: "The PR has been sent back with your reason.",
          className: "bg-green-500 text-white",
        });
        setReason("");
        setSendBackOpen(false);
        setIsSendingBack(false); // ✅ Reset loading
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to send back PR. Please try again.",
          className: "bg-red-500 text-white",
        });
        setIsSendingBack(false); // ✅ Reset loading
      },
    }
  );
};
  const [resultDialog, setResultDialog] = useState({
    open: false,
    success: true,
    title: "",
    text: "",
  });


    const handleApprove = () => {
    setIsConfirming(true); // show loading
    setApproveOpen(false);

    router.post(
        route("twg_user.review", pr.id),
        {},
        {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            setIsConfirming(false);
            setResultDialog({
            open: true,
            success: true,
            title: "Reviewed!",
            text: "The PR has been reviewed.",
            });

            toast({
            title: "Reviewed!",
            description: "The PR has been reviewed.",
            className: "bg-green-500 text-white",
            });
        },
        onError: () => {
            setIsConfirming(false);
            setResultDialog({
            open: true,
            success: false,
            title: "Error",
            text: "Failed to review the PR. Please try again.",
            });

            toast({
            title: "Error",
            description: "Failed to review the PR. Please try again.",
            className: "bg-red-500 text-white",
            });
        },
        }
    );
    };

const [rejectOpen, setRejectOpen] = useState(false);
const [rejectReason, setRejectReason] = useState("");
const [isRejecting, setIsRejecting] = useState(false);
const [rejectError, setRejectError] = useState("");

const handleReject = () => {
  if (!rejectReason.trim()) {
    setRejectError("You must provide a rejection reason.");
    return;
  }

  setIsRejecting(true);
  router.post(
    route("twg_user.reject", pr.id),
    { reason: rejectReason },
    {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setIsRejecting(false);
        setRejectOpen(false);
        setRejectReason("");
        toast({
          title: "Rejected!",
          description: "The purchase request has been rejected.",
          className: "bg-red-500 text-white",
        });
      },
      onError: () => {
        setIsRejecting(false);
        toast({
          title: "Error",
          description: "Failed to reject PR. Please try again.",
          className: "bg-red-500 text-white",
        });
      },
    }
  );
};


  return (
    <TwgUserLayout header="Schools Divisions Office - Ilagan | View Details">
      <Head title={`PR #${pr.pr_number} Details`} />

      <div className="mx-auto mt-10 p-6 bg-white shadow-xl rounded-xl">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors duration-200 ease-in-out shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Purchase Request{" "}
            <span className="text-indigo-600">#{pr.pr_number}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Created on {new Date(pr.created_at).toLocaleString()}
          </p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-base">
          <div>
            <span className="font-semibold text-gray-800">Purpose:</span>{" "}
            {pr.purpose}
          </div>
          <div>
            <span className="font-semibold text-gray-800">Status:</span>
            <span
              className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold
              ${pr.status === "Reviewed"
                  ? "bg-green-100 text-green-800"
                  : pr.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {pr.status}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Requested By:</span>{" "}
            {pr.requester_name}
          </div>
          <div>
            <span className="font-semibold text-gray-800">Division:</span>{" "}
            {pr.division}
          </div>
        </div>

        {/* Approval Image */}
        {pr.approval_image && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Approval Image
            </h3>
            <img
              src={`/storage/${pr.approval_image}`}
              alt="Approval Form"
              className="w-full max-h-[400px] object-contain border border-gray-200 rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Items */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Item Details
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-200">Item</th>
                  <th className="px-4 py-3 border-r border-gray-200">Specs</th>
                  <th className="px-4 py-3 border-r border-gray-200">Unit</th>
                  <th className="px-4 py-3 border-r border-gray-200 text-center">Qty</th>
                  <th className="px-4 py-3 border-r border-gray-200 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pr.details.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 border-r border-gray-200">
                      {item.item}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      {item.specs}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200">
                      {item.unit}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 text-right">
                      ₱{Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">
                      ₱{Number(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          {pr.status.toLowerCase() !== "reviewed" && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setApproveOpen(true)}
            >
              Mark as Reviewed
            </Button>
          )}
          {pr.status.toLowerCase() !== "reviewed" && (
            <Button
            
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => setSendBackOpen(true)}
            >
              Send Back
            </Button>
          )}
          {pr.status.toLowerCase() === "pending" && (
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          )}

        </div>
      </div>

      {/* Send Back Dialog */}
      <Dialog open={sendBackOpen} onOpenChange={setSendBackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Back Reason</DialogTitle>
            <DialogDescription>
              Enter your reason for sending back...
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter your reason for sending back..."
            aria-label="Enter your reason for sending back"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError("")
            }}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBackOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBack}
              disabled={isSendingBack}
            >
              {isSendingBack ? "Sending Back..." : "Send Back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-col items-center text-center">
            <AlertTriangle/>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              You are about to mark this request as reviewed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="destructive" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isConfirming}
            >
              {isConfirming ? "Reviewing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle className={resultDialog.success ? "text-green-600" : "text-red-600"}>
                {resultDialog.success ? "✅ " : "❌ "} {resultDialog.title}
                </DialogTitle>
                <DialogDescription>{resultDialog.text}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => setResultDialog({ ...resultDialog, open: false })}>OK</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
        {/* Reject Dialog */}
<Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reject Purchase Request</DialogTitle>
      <DialogDescription>
        Provide a reason for rejecting this purchase request.
      </DialogDescription>
    </DialogHeader>

    <Textarea
      placeholder="Enter rejection reason..."
      aria-label="Enter rejection reason"
      value={rejectReason}
      onChange={(e) => {
        setRejectReason(e.target.value);
        if (rejectError) setRejectError("");
      }}
    />
    {rejectError && <p className="text-sm text-red-500 mt-2">{rejectError}</p>}

    <DialogFooter>
      <Button variant="outline" onClick={() => setRejectOpen(false)}>
        Cancel
      </Button>
      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={handleReject}
        disabled={isRejecting}
      >
        {isRejecting ? "Rejecting..." : "Reject"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </TwgUserLayout>
  )
}
