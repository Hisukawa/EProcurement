import { usePage } from "@inertiajs/react";
import { useEffect } from "react";

export default function PrintPR({ pr }) {
    const user = usePage().props.auth.user;
    console.log(user);
    useEffect(() => {
        window.print();
    }, []);

    const formatCurrency = (amount) =>
        `₱${parseFloat(amount).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
        })}`;

    return (
        <div className="text-black text-[14px] font-sans h-full">
            <div className="text-center text-[20px] font-bold mb-4 w-full">PURCHASE REQUEST</div>

            <table className="w-full text-[13px] border-collapse">
                <tbody>
                    {/* Header Info */}
                    <tr>
                        <td className=" px-2 py-1 font-semibold w-[30%]" colSpan={2}>Entity Name: <span className="underline font-normal">SDO City of Ilagan</span></td>
                        <td></td>
                        <td className=" px-2 py-1 font-semibold text-nowrap">Fund Cluster:</td>
                        <td className=" px-2 py-1" colSpan={2}>MOOE - 2025</td>
                    </tr>
                    <tr>
                        <td className="border border-black px-2 py-1 font-semibold" rowSpan={2} colSpan={2}>Office/Section:</td>
                        <td className="border border-black py-1 font-semibold" colSpan={2}>PR No.: <span className="underline">{pr.pr_number}</span></td>
                        <td className="border border-black px-1 py-1 font-semibold" colSpan={2} rowSpan={2}>Date: {new Date(pr.created_at).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td className="border border-black  px-1 py-1 font-semibold" colSpan={2}>Resp. Center Code:</td>
                    </tr>

                    {/* Item Header */}
                    <tr className="text-center font-semibold">
                        <td className="border border-black px-2 py-1">Stock/Property No.</td>
                        <td className="border border-black px-2 py-1">Unit</td>
                        <td className="border border-black px-2 py-1">Item Description</td>
                        <td className="border border-black px-2 py-1">Quantity</td>
                        <td className="border border-black px-2 py-1">Unit Cost</td>
                        <td className="border border-black px-2 py-1">Total Cost</td>
                    </tr>

                    {/* Item Rows */}
                    {pr.details?.length > 0 ? (
                        pr.details.map((detail, idx) => (
                            <tr key={idx} className="text-center">
                                <td className="border-s border-black px-2 py-1"></td>
                                <td className="border-s border-black px-2 py-1">{detail.unit}</td>
                                <td className="border-s border-black px-2 py-1 text-left">{detail.item}</td>
                                <td className="border-s border-black px-2 py-1">{detail.quantity}</td>
                                <td className="border-s border-black px-2 py-1">{formatCurrency(detail.unit_price)}</td>
                                <td className="border-e border-black px-2 py-1">
                                    {formatCurrency(detail.unit_price * detail.quantity)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="border border-black px-2 py-2 text-center" colSpan={6}>No items listed.</td>
                        </tr>
                    )}
                    {/* Spaces */}
                    <tr>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-e border-black px-2 py-2"></td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-e border-black px-2 py-2"></td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-e border-black px-2 py-2"></td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-s border-black px-2 py-2"></td>
                        <td className="border-e border-black px-2 py-2"></td>
                    </tr>
                    
                    {/* Purpose */}
                    <tr>
                        <td className="border border-black px-2 py-2 font-semibold text-left">Purpose:</td>
                        <td className="border border-black px-2 py-2 text-left" colSpan={5}>{pr.purpose}</td>
                    </tr>

                    {/* Signatures */}
                    <tr className="text-center font-semibold">
                        <td className="border border-black px-2 py-1"></td>
                        <td className="border border-black px-2 py-1 text-nowrap">Requested by:</td>
                        <td className="border border-black px-2 py-1 text-nowrap">Recommending Approval:</td>
                        <td className="border border-black px-2 py-1 text-nowrap" colSpan={3}>Approved by:</td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-6">Signature</td>
                        <td className="border border-black px-2 py-6"></td>
                        <td className="border border-black px-2 py-6"></td>
                        <td className="border border-black px-2 py-6" colSpan={3}></td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-1">Printed Name</td>
                        <td className="border border-black px-2 py-1 font-bold text-center text-nowrap">MARY ANN M. BELTRAN</td>
                        <td className="border border-black px-2 py-1 font-bold text-center text-nowrap">CHERYL R. RAMIRO, PhD, CESO VI</td>
                        <td className="border border-black px-2 py-1 font-bold text-center text-nowrap" colSpan={3}>EDUARDO C. ESCORPISO JR., EdD, CESO V</td>
                    </tr>
                    <tr>
                        <td className="border-s border-b border-black px-2 py-1">Designation</td>
                        <td className="border border-black px-2 py-1 text-center text-[12px]">Administrative Officer V</td>
                        <td className="border border-black px-2 py-1 text-center text-[12px]">Superintendent</td>
                        <td className="border border-black px-2 py-1 text-center text-[12px]" colSpan={3}>Schools Division Superintendent</td>
                    </tr>

                    {/* Footer Info */}
                    <tr>
                    <td className="border-s border-black px-2 py-0.5 font-semibold" rowSpan={2}>Focal Person:</td>
                    <td className="text-center font-semibold py-0.5  pt-4" colSpan={2}>{`${user.firstname} ${user.middlename ?? ''} ${user.lastname}`.trim()}</td>
                    <td className="px-2 py-0.5"></td>
                    <td className="px-2 py-0.5"></td>
                    <td className="px-2 py-0.5 border-e border-black"></td>
                    </tr>
                    <tr>
                    <td className="text-center py-0.5" colSpan={2}>
                        <hr className="border-t border-black" />
                    </td>
                    <td className="px-2 py-0.5"></td>
                    <td className="border border-black px-2 py-0.5 font-semibold text-nowrap" colSpan={2}>Certified Allotment Available:</td>
                    </tr>
                    <tr>
                    <td className="border-s border-black px-2 py-0.5"></td>
                    <td className="text-center font-semibold py-0.5" colSpan={2}>{user.position}</td>
                    <td className="px-2 py-0.5"></td>
                    <td className="border border-black px-2 py-0.5" colSpan={2} rowSpan={2}></td>
                    </tr>

                    <tr>
                        <td className="border-s border-black px-2 py-1"></td>
                        <td className="px-2 py-1"></td>
                        <td className="px-2 py-1  text-right">_______________________</td>
                        <td className="px-2 py-1 text-nowrap">Included in DEDP</td>
                        
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-1">Program Title:</td>
                        <td className="px-2 py-1">_______________________</td>
                        <td className="px-2 py-1 text-right">_______________________</td>
                        <td className="px-2 py-1">With WAFP</td>
                        <td className="border border-black px-2 py-1 font-semibold text-center" colSpan={2}>VLADIMIR B. BICLAR</td>
                    </tr>
                    <tr>
                        <td className="border-s border-black px-2 py-1">Fund Source:</td>
                        <td className="px-2 py-1">_______________________</td>
                        <td className="px-2 py-1 text-right">_______________________</td>
                        <td className="px-2 py-1 text-nowrap">Included in APP</td>
                        <td className="border border-black px-2 py-1 font-semibold text-center" colSpan={2}>Budget Officer III</td>
                    </tr>
                    <tr>
                        <td className="border-s border-b border-black px-2 py-1">Sub-ARO No.:</td>
                        <td className="px-2 py-1 border-b border-black">_______________________</td>
                        <td className="px-2 py-1 border-b border-black text-right">_______________________</td>
                        <td className="px-2 py-1 border-b border-black text-nowrap">Included in PPMP</td>
                        <td className="border-b border-black px-2 py-1"></td>
                        <td className="border-b px-2 py-1 border-e border-black "></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
