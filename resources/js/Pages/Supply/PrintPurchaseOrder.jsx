import React, { useEffect } from 'react';

export default function PrintPurchaseOrder({ po }) {
  useEffect(() => {
    window.print();
  }, []);
  console.log(po);

  const formatCurrency = (amount) =>
    `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
    })}`;

  const total = po.details.reduce((sum, item) => sum + Number(item.total_price), 0);

  return (
    <div className="text-black font-sans h-full">
      <div className="text-center text-[20px] font-bold mb-4 w-full font-serif">PURCHASE ORDER</div>

      <table className="w-full text-[13px] border-collapse">
        <tbody>
          <tr>
            <td className="border-s border-t border-black  px-2 py-1 font-semibold text-nowrap" colSpan={2}>Supplier: <span className="font-normal">{po.supplier.company_name}</span></td>
            <td className="border-t border-black"></td>
            <td className="border-s border-t border-black px-2 py-1 font-semibold text-nowrap">PO No.:</td>
            <td className="border-t border-e border-black py-1" colSpan={2}><span className="underline font-normal">{po.po_number}</span></td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 py-1 font-semibold text-nowrap" colSpan={3}>Address: <span className="font-normal">{po.supplier.address}</span></td>
            <td className="border-s  border-black px-2 py-1 font-semibold text-nowrap">Date:</td>
            <td className="border-e border-black px-2 py-1" colSpan={2}>{new Date(po.created_at).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td className="border-s border-e border-black px-2 py-1 font-semibold" colSpan={3}>TIN: <span className="font-normal">{po.supplier.tin_num}</span></td>
            <td className="border-e border-black text-nowrap px-2 py-1 font-semibold" colSpan={3}>Mode of Procurement: <span className='underline font-semibold text-nowrap'>SVP</span></td>
          </tr>

          <tr className="text-center font-semibold">
            <td className="border border-black px-2 py-1 w-[5%]">Stock/Property No.</td>
            <td className="border border-black px-2 py-1 w-[5%]">Unit</td>
            <td className="border border-black px-2 py-1 w-[30%]">Description</td>
            <td className="border border-black px-2 py-1">Quantity</td>
            <td className="border border-black px-2 py-1">Unit Cost</td>
            <td className="border border-black px-2 py-1">Amount</td>
          </tr>

            {po.details.map((item, idx) => {
            const prDetail = po.rfq?.purchase_request?.details?.find(
                (d) => d.id === item.pr_detail_id
            );

            const specs = prDetail?.product?.specs || "-";
            const unit = prDetail?.product?.unit?.unit || item.unit || "-";

            return (
                <tr key={idx} className="text-center">
                <td className="border-s border-b border-black px-2 py-1"></td>
                <td className="border-s border-b border-black px-2 py-1">{unit}</td>
                <td className="border-s border-b border-black px-2 py-1 text-left">{specs}</td>
                <td className="border-s border-b border-black px-2 py-1">{item.quantity}</td>
                <td className="border-s border-b border-black px-2 py-1">{formatCurrency(item.unit_price)}</td>
                <td className="border-s border-e border-b border-black px-2 py-1">{formatCurrency(item.total_price)}</td>
                </tr>
            );
            })}



          <tr>
            <td className="border-s border-e border-black px-2 py-2 text-center" colSpan={2}>Total Amount in Words</td>
            <td className="border-t border-black" colSpan={2}></td>
            <td className="border-s border-e border-black px-2 py-2 font-bold">Total: </td>
            <td className="border-t border-e border-black">{formatCurrency(total)}</td>
            
          </tr>
          <tr>
            <td className="border border-black px-2 py-2 italic text-xs" colSpan={6}>
              In case of failure to make the full delivery within the time specified above,
              a penalty of one-tenth (1/10) of one percent for every day of delay shall be
              imposed on the undelivered items.
            </td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 py-2 font-semibold text-left" colSpan={3}>Conforme</td>
            <td className="border-e border-black px-2 py-2 font-semibold text-left" colSpan={3}>Very truly yours,</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 font-bold text-center" colSpan={3}><span className="inline-block border-b border-black min-w-[200px]"></span></td>
            <td className="border-e border-black px-2 font-semibold text-center underline" colSpan={3}>EDUARDO C. ESCORPISO JR., EdD, CESO V</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center text-xs" colSpan={3}>Signature over Printed Name of Supplier</td>
            <td className="border-e border-black px-2 text-center text-xs" colSpan={3}>Signature over Printed Name of Authorize Official</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center text-xs" colSpan={3}><span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-e border-black px-2 font-semibold text-center underline" colSpan={3}>Schools Division Superintendent</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center text-xs" colSpan={3}>Date</td>
            <td className="border-e border-black px-2 text-center" colSpan={3}>Designation</td>
          </tr>
            <tr>
                <td className="border-s border-t border-black px-2 text-left text-xs text-nowrap" colSpan={3}>Fund Cluster:<span className="inline-block border-b border-black min-w-[150px]"></span></td>
                <td className="border-s border-e border-t border-black px-2 text-left" colSpan={3}>ORS/BURS No.:</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-left text-xs text-nowrap" colSpan={3}>Fund Available:<span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-s border-e border-black px-2 text-left" colSpan={3}>Date of the ORS/BURS:</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-left text-xs text-nowrap" colSpan={3}></td>
            <td className="border-s border-e border-black px-2 text-left" colSpan={3}>Amount:</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-left text-xs text-nowrap" colSpan={3}></td>
            <td className="border-s border-e border-black px-2 text-left" colSpan={3}>Allotment Available:</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center text-nowrap" colSpan={3}>FERMIN DAVE F. ANDAYA, CPA</td>
            <td className="border-s border-e border-black px-2 text-left" colSpan={3}></td>
          </tr>
        <tr>
            <td className="border-s border-black px-2 text-center text-[10px] text-nowrap" colSpan={3}>Signature over Printed Name of Chief Accountant/Head of Accounting Division/Unit</td>
            <td className="border-s border-e border-black px-2 text-left" colSpan={3}></td>
          </tr>
          <tr>
            <td className="border-s border-t border-black px-2 text-left text-xs text-nowrap" colSpan={3}>Program No: <span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-s border-t border-e border-black px-2 py-2 text-left" colSpan={3}><span className="inline-block border-b border-black min-w-[100px]"></span>Included in DEDP</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-left text-xs text-nowrap" colSpan={3}>Program Title: <span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-s border-e border-black px-2 py-2 text-left" colSpan={3}><span className="inline-block border-b border-black min-w-[100px]"></span>With WAFP</td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-left text-xs text-nowrap" colSpan={3}>Fund Source: <span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-s  border-e border-black px-2 py-2 text-left" colSpan={3}><span className="inline-block border-b border-black min-w-[100px]"></span> Included in APP</td>
          </tr>
          <tr>
            <td className="border-s border-b border-black px-2 text-left text-xs text-nowrap" colSpan={3}></td>
            <td className="border-s border-b border-e border-black px-2 py-2 text-left" colSpan={3}><span className="inline-block border-b border-black min-w-[100px]"></span> Included in PPMP</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
