import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users2, ClipboardList, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage({
  divisions,
  inspectionCommittees,
  bacCommittees,
}) {
  const { props } = usePage();
  const success = props.flash?.success;
  const { toast } = useToast();

  const [successOpen, setSuccessOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addDivisionOpen, setAddDivisionOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editType, setEditType] = useState("");
  const [form, setForm] = useState({ name: "", meaning: "" });

  useEffect(() => {
    if (success) setSuccessOpen(true);
  }, [success]);

  const handleReplaceInspection = () => {
    if (!editMember) return;

    router.post(
      route("admin.update_inspection", editMember.inspection_committee_id),
      {
        member_id: editMember.id,
        replacementName: form.name,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "✅ Member Replaced",
            description: "Inspection Committee updated successfully!",
            duration: 3000,
          });
          setEditOpen(false);
        },
        onError: () => {
          toast({
            title: "❌ Replace Failed",
            description: "Check the input and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleEdit = (member, type) => {
    setEditMember(member);
    setEditType(type);
    setForm({
      member_id: member.id,
      name: member.name,
      position: member.position,
      meaning: member.meaning || "",
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editMember) return;

    if (editType === "bac") {
      router.post(
        route("admin.update_bac", { id: editMember.committee_id ?? 1 }),
        {
          members: [
            {
              member_id: form.member_id,
              name: form.name,
              position: form.position,
            },
          ],
        },
        { preserveScroll: true }
      );
    } else if (editType === "inspection") {
      handleReplaceInspection();
    }else if (editType === "requesting") {
    router.post(
      route("admin.update_requesting", { division: editMember.id }),
      { name: form.name },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "✅ Officer Updated",
            description: "Division officer updated successfully.",
          });
          setForm({ name: "", meaning: "" }); // 👈 clear form
          setEditOpen(false); // close dialog
        },
        onError: () =>
          toast({
            title: "❌ Update Failed",
            description: "Please check the name and try again.",
            variant: "destructive",
          }),
      }
    );
  } else if (editType === "division") {
      router.post(
        route("admin.update_division", editMember.id),
        { name: form.name, meaning: form.meaning },
        {
          preserveScroll: true,
          onSuccess: () => {
            toast({
              title: "✅ Division Updated",
              description: "Division details successfully updated.",
            });
          },
        }
      );
    }

    setEditOpen(false);
  };

  const handleAddDivision = () => {
    if (!form.name.trim()) return;
    router.post(
      route("admin.add_division"),
      { division: form.name, meaning: form.meaning },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "✅ Division Added",
            description: "New division successfully added!",
            duration: 3000,
          });
          setForm({ name: "", meaning: "" });
          setAddDivisionOpen(false);
        },
        onError: () =>
          toast({
            title: "❌ Failed to Add",
            description: "Check your input and try again.",
            variant: "destructive",
          }),
      }
    );
  };

  const displayDivisions = divisions ?? [];
  const displayInspection = inspectionCommittees ?? [];
  const displayBac = bacCommittees ?? [];

  const getReadablePosition = (position) => {
    const positionMap = {
      chair: "Chair",
      vice_chair: "Vice Chair",
      secretariat: "Secretariat",
      member1: "Member",
      member2: "Member",
      member3: "Member",
    };
    return positionMap[position] || position;
  };

  return (
    <AdminLayout header="⚙️ System Settings">
      <Head title="Settings" />

      <div className="max-w-6xl mx-auto mt-6 space-y-12">
        {/* --- HEADER --- */}
        <header>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">
            Manage divisions, officers, and committee signatories.
          </p>
        </header>

        {/* --- DIVISIONS --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Divisions
            </h2>
            <Button onClick={() => setAddDivisionOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Division
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-blue-50 border-b">
                <tr>
                  <th className="p-3 font-semibold text-gray-700">#</th>
                  <th className="p-3 font-semibold text-gray-700">Division</th>
                  <th className="p-3 font-semibold text-gray-700">Meaning</th>
                  <th className="p-3 font-semibold text-gray-700">Officer</th>
                  <th className="p-3 font-semibold text-gray-700 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {displayDivisions.length > 0 ? (
                  displayDivisions.map((division, index) => (
                    <tr
                      key={division.id}
                      className="border-b bg-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {division.division}
                      </td>
                      <td className="p-3 text-gray-600">
                        {division.meaning || "—"}
                      </td>
                      <td className="p-3 text-gray-900">
                        {division.active_officer
                          ? division.active_officer.name
                          : "No officer assigned"}
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditMember(division);
                            setEditType("requesting");
                            setForm({
                              name: division.active_officer?.name || "",
                            });
                            setEditOpen(true);
                          }}
                        >
                          Edit Officer
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditMember(division);
                            setEditType("division");
                            setForm({
                              name: division.division,
                              meaning: division.meaning || "",
                            });
                            setEditOpen(true);
                          }}
                        >
                          Edit Division
                        </Button>
                        {/* <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            router.delete(
                              route("admin.delete_division", division.id),
                              {
                                preserveScroll: true,
                                onSuccess: () =>
                                  toast({
                                    title: "🗑 Division Removed",
                                    description: `${division.division} deleted successfully.`,
                                  }),
                              }
                            )
                          }
                        >
                          Delete
                        </Button> */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No divisions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- INSPECTION COMMITTEE --- */}
        <section>
          <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2 mb-4">
            <Users2 className="w-5 h-5" />
            Inspection Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayInspection.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-green-600">
                    {member.position}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => handleEdit(member, "inspection")}
                  >
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* --- BAC COMMITTEE --- */}
        <section>
          <h2 className="text-xl font-semibold text-purple-700 flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5" />
            BAC Committee
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBac
              .sort((a, b) => {
                const order = [
                  "chair",
                  "vice_chair",
                  "secretariat",
                  "member1",
                  "member2",
                  "member3",
                ];
                return order.indexOf(a.position) - order.indexOf(b.position);
              })
              .map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <CardTitle className="text-purple-600">
                      {getReadablePosition(member.position)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => handleEdit(member, "bac")}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      </div>

      {/* --- SUCCESS DIALOG --- */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✅ Success</DialogTitle>
            <DialogDescription>{success}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editType === "division"
                ? "Edit Division"
                : editType === "requesting"
                ? "Update Officer"
                : "Edit Committee Member"}
            </DialogTitle>
            <DialogDescription>
              {editType === "division"
                ? "Update the division name or its meaning."
                : "Update the member’s name below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editType === "division" ? (
              <>
                <div>
                  <label className="text-sm font-medium">Division Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meaning</label>
                  <Input
                    value={form.meaning}
                    onChange={(e) =>
                      setForm({ ...form, meaning: e.target.value })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {editType !== "requesting" && (
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <p className="font-medium text-gray-800">
                      {editMember?.position}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADD DIVISION DIALOG --- */}
      <Dialog open={addDivisionOpen} onOpenChange={setAddDivisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Division</DialogTitle>
            <DialogDescription>
              Enter the division name and its meaning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Division Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Meaning</label>
              <Input
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDivisionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDivision}>Add Division</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
