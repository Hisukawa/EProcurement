import ApproverLayout from "@/Layouts/ApproverLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import TooltipLink from "@/Components/Tooltip";
import { EyeIcon } from "lucide-react";

export default function ForReview({ sentPurchaseRequests, filters = {}, flash }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [prNumber, setPrNumber] = useState(filters.prNumber || "");
  const [focalPerson, setFocalPerson] = useState(filters.focalPerson || "");
  const [division, setDivision] = useState(filters.division || "");

  // Debounced filter updates
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(
        route("bac_approver.for_review"),
        { prNumber, focalPerson, division },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 400);
    return () => clearTimeout(delay);
  }, [prNumber, focalPerson, division]);

  return (
    <ApproverLayout header="Schools Division Office - Ilagan | For Review" flash={flash}>
      <Head title="PRs For Review" />

      <div className="bg-white rounded-lg p-6 shadow space-y-6">
        <h2 className="text-lg font-bold text-gray-800">Purchase Requests For Review</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            placeholder="Search PR Number..."
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-60"
          />
          <input
            type="text"
            value={focalPerson}
            onChange={(e) => setFocalPerson(e.target.value)}
            placeholder="Search Focal Person..."
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-60"
          />
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm w-44"
          >
            <option value="">All Divisions</option>
            <option value="1">SGOD</option>
            <option value="2">OSDS</option>
            <option value="3">CID</option>
          </select>
        </div>

        {/* Table */}
        {sentPurchaseRequests.data.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-lg font-medium">
            No purchase requests ready for review.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {["PR Number", "Focal Person", "Division", "Purpose", "Status", "Date Sent", "Action"].map((title) => (
                    <th key={title} className="px-6 py-3 text-center font-semibold uppercase tracking-wider text-xs">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {sentPurchaseRequests.data.map((pr) => (
                  <tr key={pr.id} className="text-center hover:bg-indigo-50 transition">
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      <TooltipLink
                        to={route("bac_approver.show_details", pr.id)}
                        tooltip="View PR details"
                        className="hover:underline focus:underline"
                      >
                        {pr.pr_number}
                      </TooltipLink>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {[pr.focal_person.firstname, pr.focal_person.middlename, pr.focal_person.lastname].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-6 py-4 text-gray-800">{pr.division.division}</td>
                    <td className="px-6 py-4 text-gray-700">{pr.purpose}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        pr.status.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800"
                          : pr.status.toLowerCase() === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : pr.status.toLowerCase() === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm whitespace-nowrap">
                      {new Date(pr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex space-x-2 justify-center">
                      <button
                        onClick={() => { setSelectedImage(`/storage/${pr.approval_image}`); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-semibold text-gray-800 p-4 border-b">Approved Form</h3>
              <img src={selectedImage} alt="Approved Form" className="w-full h-auto object-contain rounded-b-lg p-4" />
            </div>
          </div>
        )}
      </div>
    </ApproverLayout>
  );
}
