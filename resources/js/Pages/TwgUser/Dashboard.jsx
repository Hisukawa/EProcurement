import SupplyOfficerLayout from "@/Layouts/SupplyOfficerLayout";
import { Head, Link } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Boxes,
    ClipboardList,
    Truck,
    PackageCheck,
    AlertTriangle,
    FileSpreadsheet,
    FileCheck,
    FileText,
    Layers,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LabelList,
} from "recharts";
import TwgUserLayout from "@/Layouts/TwgUserLayout";

export default function Dashboard({user}) {
    


    return (
        <TwgUserLayout header={"Schools Division Office - Ilagan | Dashboard"}>
            <Head title="Dashboard" />

            <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user.firstname}</h1>
                <p className="text-gray-600">
                    Manage inventory, RIS, ICS, PAR, PO, and Issuance efficiently from your dashboard.
                </p>
            </div>
=
        </TwgUserLayout>
    );
}
