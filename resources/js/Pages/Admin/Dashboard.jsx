import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";

export default function Dashboard(){
    return(
        <AdminLayout
            header={"Schools Division Office - Ilagan | Dashboard"}
        >
        <Head title="Dashboard"/>
        </AdminLayout>
    )
}