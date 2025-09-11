import TooltipLink from "@/Components/Tooltip";
import { useToast } from "@/hooks/use-toast";
import RequesterLayout from "@/Layouts/RequesterLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PrinterIcon, SendHorizontalIcon } from "lucide-react";

export default function ManageRequests({ purchaseRequests, search: initialSearch, month: initialMonth }) {
  const { props } = usePage();
  const [search, setSearch] = useState(initialSearch || "");
  const [month, setMonth] = useState(initialMonth || "");
  const [approvalImages, setApprovalImages] = useState({});
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();
  const [isSendingApproval, setIsSendingApproval] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    prId: null,
    text: "",
  });

  const [resultDialog, setResultDialog] = useState({
    open: false,
    success: true,
    title: "",
    text: "",
  });


useEffect(() => {
  const message = localStorage.getItem("flashSuccess");
  const highlightId = localStorage.getItem("highlightPrId");

  if (message) {
    setSuccessMessage(message);
    setIsSuccessDialogOpen(true);
    toast({
        title: "PR Submitted",
        description: message,
        className: "bg-green-500 text-white",
        duration: 3000,
      });
    localStorage.removeItem("flashSuccess");
  }

  if (highlightId) {
    setHighlightPrId(Number(highlightId));
    localStorage.removeItem("highlightPrId");
  }
}, []);



    const [highlightPrId, setHighlightPrId] = useState(null);

useEffect(() => {
  const highlightId = localStorage.getItem("highlightPrId");

  if (highlightId && props.highlightPrId) {
    setHighlightPrId(highlightId);
    localStorage.removeItem("highlightPrId");
  } else if (props.highlightPrId) {
    setHighlightPrId(props.highlightPrId);
  }
}, [props.highlightPrId]);


  // ✅ Month options memoized
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(0, i).toLocaleString("default", { month: "long" }),
      })),
    []
  );

const showAlert = useCallback((success, title, text) => {
  setAlertDialog({
    open: true,
    title,
    text,
    success,
  });
}, []);


  const handleFileChange = useCallback((e, id) => {
    const file = e.target.files[0];
    if (file) {
      setApprovalImages((prev) => ({ ...prev, [id]: file }));
    }
  }, []);

const handleSendForApproval = useCallback((id) => {
  setConfirmDialog({
    open: true,
    prId: id,
    text: "You won't be able to edit this PR after sending.",
  });
}, []);

const handleConfirmSend = useCallback(() => {
  if (!confirmDialog.prId) return;
  setIsSendingApproval(true);

  const id = confirmDialog.prId;
  const formData = new FormData();
  if (approvalImages[id]) {
    formData.append("approval_image", approvalImages[id]);
  }

  router.post(route("requester.pr.send_for_approval", id), formData, {
    forceFormData: true,
    preserveScroll: true,
    preserveState: true,
    onSuccess: () => {
      setResultDialog({
        open: true,
        success: true,
        title: "Sent!",
        text: "The approved PR form has been sent.",
      });
      toast({
        title: "PR Sent",
        description: "PR is sent for approval",
        className: "bg-green-500 text-white",
        duration: 3000,
      });
      setApprovalImages((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setConfirmDialog({ open: false, prId: null, text: "" });
      setIsSendingApproval(false);
    },
    onError: () => {
      setResultDialog({
        open: true,
        success: false,
        title: "Error",
        text: "Failed to send approved PR form.",
      });
      setConfirmDialog({ open: false, prId: null, text: "" });
      setIsSendingApproval(false);
    },
  });
}, [confirmDialog.prId, approvalImages]);


  const handlePrint = useCallback((id) => {
    window.open(route("requester.print", id), "_blank");
  }, []);

useEffect(() => {
  if (search === (initialSearch || "") && month === (initialMonth || "")) {
    return; // don't trigger on initial load
  }

  const delay = setTimeout(() => {
    router.get(route("requester.manage_requests"), { search, month }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  }, 300);

  return () => clearTimeout(delay);
}, [search, month]);
useEffect(() => {
  let interval;
  const startPolling = () => {
    interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.reload({
          only: ["purchaseRequests"],
          preserveScroll: true,
          preserveState: true,
        });
      }
    }, 10000);
  };

  startPolling();
  return () => clearInterval(interval);
}, []);



  return (
    <RequesterLayout header="Schools Division Office - Ilagan | Manage Requests">
      <Head title="Manage Requests" />

      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Purchase Requests</h2>
          <button
            onClick={() => router.get(route("requester.create"))}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-md shadow"
          >
            + Create PR
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-5">
          <p className="text-gray-600 text-sm">
            Showing {purchaseRequests.from ?? 0} - {purchaseRequests.to ?? 0} of {purchaseRequests.total ?? 0} requests
          </p>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PR # or purpose..."
              className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64"
            />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-10 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Months</option>
              {monthOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {["PR Number", "Purpose", "Status", "Date Created", "Signed PR Form", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseRequests.data.map((pr) => (
                <tr
      id={`pr-${pr.id}`}
      key={pr.id}
      className={`hover:bg-indigo-50 transition duration-200 ${
        pr.id === highlightPrId ? "bg-green-100" : ""
      }`}
    >

                  {/* PR Number */}
                  <td className="px-6 py-4 text-center text-indigo-600 font-medium">
                    {(pr.is_sent === 0 && pr.status !== "Approved") ? (
                      <TooltipLink
                        to={route("requester.add_details", pr.id)}
                        tooltip="Edit PR"
                        className="hover:underline text-indigo-600"
                      >
                        {pr.pr_number}
                      </TooltipLink>
                    ) : (
                      <span className="text-gray-500 cursor-not-allowed">{pr.pr_number}</span>
                    )}
                  </td>

                  {/* Purpose */}
                  <td className="px-6 py-4 text-center text-gray-700">{pr.purpose}</td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pr.status === "Approved" ? "bg-green-100 text-green-800" :
                        pr.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        pr.status === "Rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {pr.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-center text-gray-600 text-sm font-mono">
                    {new Date(pr.created_at).toLocaleDateString()}
                  </td>

                  {/* File Upload */}
                  <td className="px-6 py-4 text-center">
                    {pr.is_sent === 0 ? (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, pr.id)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      <span className="text-green-600 font-medium text-sm">Approved form already sent</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center space-x-2">
                      {pr.is_sent === 0 && (
                        <div className="relative group inline-block">
                          <button
                            onClick={() => handleSendForApproval(pr.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                          >
                            <SendHorizontalIcon />
                          </button>
                          <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Send for Approval
                          </span>
                        </div>
                      )}

                      <div className="relative group inline-block">
                        <button
                          onClick={() => handlePrint(pr.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          <PrinterIcon />
                        </button>
                        <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Print
                        </span>
                      </div>
                    </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {purchaseRequests.links.length > 3 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              {purchaseRequests.links.map((link, i) => (
                <button
                  key={i}
                  disabled={!link.url}
                  onClick={() =>
                    link.url &&
                    router.visit(link.url, { preserveScroll: true, preserveState: true })
                  }
                  className={`px-4 py-2 text-sm rounded-md border transition ${
                    link.active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                  } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={24} />
            Success!
          </DialogTitle>
          <DialogDescription className="pt-4 text-base">
            {successMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setIsSuccessDialogOpen(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send for Approval?</DialogTitle>
        <DialogDescription>{confirmDialog.text}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
          Cancel
        </Button>
        <Button onClick={handleConfirmSend} disabled={isSendingApproval}>{isSendingApproval ? "Sending..." : "Confirm"}</Button>
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



    </RequesterLayout>
  );
}
