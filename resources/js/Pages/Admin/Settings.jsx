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
import { Building2, Users2, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage({ divisions, inspectionCommittees, bacCommittees }) {
  const { props } = usePage();
  const success = props.flash?.success;
  const { toast } = useToast();


  const [successOpen, setSuccessOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editType, setEditType] = useState(""); // inspection | bac
  const [form, setForm] = useState({ name: "" });

  useEffect(() => {
    if (success) setSuccessOpen(true);
  }, [success]);
const handleReplaceInspection = () => {
  if (!editMember) return;

  router.post(
    route("admin.update_inspection", editMember.committee_id), // committee id
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
      onError: (errors) => {
        toast({
          title: "❌ Replace Failed",
          description: "Check the input and try again.",
          variant: "destructive",
          duration: 4000,
        });
      },
    }
  );
};
const handleEdit = (member, type) => {
  setEditMember(member);
  setEditType(type);
  // Keep role in form so it can be sent back, but don’t allow editing
  setForm({ name: member.name, position: member.role });
  setEditOpen(true);
};

const handleSave = () => {
  if (!editMember) return;

  if (editType === "bac") {
    router.post(
      route("admin.update_bac", { committee: editMember.committee_id ?? 1 }),
      { members: [{ name: form.name, position: form.position }] },
      { preserveScroll: true }
    );
  } else if (editType === "requesting") {
    router.post(
      route("admin.update_requesting", { division: editMember.id }),
      { name: form.name }, // ✅ matches controller
      { preserveScroll: true }
    );
  }

  setEditOpen(false);
};
useEffect(() => {
  if (success) {
    // 🔔 Show toast
    toast({
      title: "✅ Success",
      description: success,
    });

    // 📌 Also open success dialog
    setSuccessOpen(true);
  }
}, [success]);




  const displayDivisions = divisions?.length ? divisions : [];
  const displayInspection = inspectionCommittees?.length ? inspectionCommittees : [];
  const displayBac = bacCommittees?.length ? bacCommittees : [];

  return (
    <AdminLayout header="⚙️ System Settings">
      <Head title="Settings" />

      <div className="max-w-6xl mx-auto mt-6 space-y-12">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">
            Manage configurations for divisions, inspection team, and committees.
          </p>
        </header>

        {/* Divisions */}
        <section>
          <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5" />
            Divisions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDivisions.map((division) => (
              <Card key={division.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-blue-600">{division.division}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">Current Officer</p>
                  <p className="font-medium text-gray-900">
                    {division.active_officer ? division.active_officer.name : "No active officer"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      setEditMember(division);
                      setEditType("requesting");
                      setForm({ name: division.active_officer?.name || "" });
                      setEditOpen(true);
                    }}
                  >
                    Update Officer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>


        {/* Inspection Team */}
        <section>
          <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2 mb-4">
            <Users2 className="w-5 h-5" />
            Inspection Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayInspection.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-green-600">{member.position}</CardTitle>
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

        {/* BAC Committee */}
        <section>
          <h2 className="text-xl font-semibold text-purple-700 flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5" />
            BAC Committee
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBac.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-purple-600">{member.position}</CardTitle>
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


      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editType === "requesting" ? "Update Officer" : "Edit Committee Member"}
            </DialogTitle>
            <DialogDescription>
              {editType === "requesting"
                ? "Update the requisitioning officer for this division."
                : "Update the committee member’s name below."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editType !== "requesting" && (
              <div>
                <label className="text-sm font-medium">Position</label>
                <p className="font-medium text-gray-800">{editMember?.position}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </AdminLayout>
  );
}
