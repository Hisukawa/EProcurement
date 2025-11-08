import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ViewDetails({ pr }) {
  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <ApproverLayout header="Schools Divisions Office - Ilagan | View Details">
      <Head title={`PR #${pr.pr_number} Details`} />

      <div className="mx-auto mt-10 p-6 bg-white shadow-xl rounded-xl">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors duration-200 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            ← Back
          </button>
        </div>

        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Purchase Request <span className="text-indigo-600">#{pr.pr_number}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Created on {new Date(pr.created_at).toLocaleString()}
          </p>
        </div>

        {/* Approved Form */}
        {pr.approval_image && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Approved Form</h3>

            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setFormModalOpen(true)}
            >
              View / Download
            </Button>

            {/* Modal */}
            <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
              <DialogContent className="w-full max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Approved Form - PR #{pr.pr_number}</DialogTitle>
                  <DialogDescription>
                    You can view or download the approved form here.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex-1 overflow-auto">
                  {pr.approval_image.endsWith(".pdf") ? (
                    <iframe
                      src={`/storage/${pr.approval_image}`}
                      className="w-full h-[70vh] border rounded-lg"
                      title="Approved Form"
                    />
                  ) : (
                    <img
                      src={`/storage/${pr.approval_image}`}
                      alt="Approved Form"
                      className="w-full max-h-[70vh] object-contain border rounded-lg"
                    />
                  )}
                </div>

                <DialogFooter className="mt-4 flex justify-end gap-2">
                  <Button 
                  onClick={() => setFormModalOpen(false)} variant="outline">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* PR Details and Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-gray-700 text-base">
          <div>
            <span className="font-semibold text-gray-800">Purpose:</span> {pr.purpose}
          </div>
          <div>
            <span className="font-semibold text-gray-800">Status:</span>
            <span
              className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold
              ${pr.status === "Approved"
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
            <span className="font-semibold text-gray-800">Requested By:</span> {pr.requester_name}
          </div>
          <div>
            <span className="font-semibold text-gray-800">Division:</span> {pr.division}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Item Details</h3>
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
                    className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-4 py-2 border-r border-gray-200">{item.item}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.specs}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.unit}</td>
                    <td className="px-4 py-2 border-r border-gray-200 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 border-r border-gray-200 text-right">₱{Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">₱{Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ApproverLayout>
  );
}
