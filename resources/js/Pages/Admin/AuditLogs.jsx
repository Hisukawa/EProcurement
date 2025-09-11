import { useState } from "react";
import { Head } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filter, Search } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function AuditLogs({ logs }) {
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout header="Audit Logs">
      <Head title="Audit Logs" />

      <div className="p-6 space-y-6">
        <Card className="shadow-lg rounded-2xl border border-gray-200">
          {/* Header */}
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-gray-800">
              Audit Logs
            </CardTitle>

            <div className="flex items-center gap-2 w-full sm:w-80 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Table</TableHead>
                  <TableHead className="whitespace-nowrap">Record ID</TableHead>
                  <TableHead className="whitespace-nowrap">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        {new Date(log.created_at).toLocaleString("en-PH")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user?.name || "System"}
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.record_id || "-"}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-gray-500"
                    >
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
