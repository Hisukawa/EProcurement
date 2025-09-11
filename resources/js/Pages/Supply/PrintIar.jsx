import React, { useEffect } from 'react';

export default function PrintIar({ iarData }) {
  useEffect(() => {
    window.print();
  }, []);
  // console.log(iarData);

  const formatCurrency = (amount) =>
    `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
    })}`;

  // ✅ Prevent runtime error if `details` is undefined
  const details = iarData.purchaseOrder?.details ?? [];

  const total = details.reduce((sum, item) => {
    return sum + Number(item.total_price ?? 0);
  }, 0);
  const divisionName =
    iarData.purchase_order?.rfq?.purchase_request?.division?.division ?? 'N/A';
    console.log(divisionName);
  return (
    <div className="text-black font-sans h-full">
      <div className="text-center text-[20px] font-semibold mb-4 w-full font-serif">INSPECTION AND ACCEPTANCE REPORT</div>
      <div className="text-start text-[15px] font-extrabold mb-4 w-full font-serif">Entity Name: SDO City of Ilagan</div>

      <table className="w-full text-[13px] border-collapse">
        <tbody>
          <tr>
            <td className="border-s border-t border-black  px-2 py-1 font-semibold text-nowrap">Supplier: <span className="font-normal">{iarData.purchase_order?.supplier?.company_name }</span></td>
            <td className="border-t border-black"></td>
            <td className="border-s border-t border-black px-2 py-1 font-semibold text-nowrap">IAR No.:</td>
            <td className="border-t border-e border-black py-1"><span className="underline font-normal">{iarData.iar_number }</span></td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 py-1 font-semibold text-nowrap" colSpan={2}>PO No: <span className="font-normal">{iarData.purchase_order?.po_number}</span></td>
            <td className="border-s  border-black px-2 py-1 font-semibold text-nowrap">Date:</td>
            <td className="border-e border-black px-2 py-1"></td>
          </tr>
          <tr>
            <td className="border-s border-e border-black px-2 py-1 font-semibold" colSpan={2}>Requisitioning Office/Dept: <span className="font-normal">{divisionName}</span></td>
            <td className="border-e border-black text-nowrap px-2 py-1 font-semibold" colSpan={2}>Invoice No.: <span className='underline font-semibold text-nowrap'></span></td>
          </tr>
          <tr>
            <td className="border-s border-e border-black px-2 py-1 font-semibold" colSpan={2}>Responsibility Center Code: <span className="font-normal"></span></td>
            <td className="border-e border-black text-nowrap px-2 py-1 font-semibold" colSpan={2}>Date: <span className='underline font-semibold text-nowrap'></span></td>
          </tr>

          <tr className="text-center font-semibold">
            <td className="border border-black px-2 py-1 w-[5%]">Stock/Property No.</td>
            <td className="border border-black px-2 py-1 w-[40%]">Description</td>
            <td className="border border-black px-2 py-1">Unit</td>
            <td className="border border-black px-2 py-1">Quantity</td>
          </tr>
          {iarData.purchase_order.details.map((detail, index) => {
            const prDetail = detail.pr_detail;
            const product = prDetail?.product;
            const unitName = product?.unit?.unit ?? 'N/A';
            const productName = product?.name + ' ' +  product?.specs;

            return (
                <tr key={index} className="text-center align-top">
                  <td className="border-s border-b border-black px-2 py-1 h-[150px]"></td>
                  <td className="border-s border-b border-black px-2 py-1 h-[150px]">{productName}</td>
                  <td className="border-s border-b border-black px-2 py-1 h-[150px]">{unitName}</td>
                  <td className="border-s border-b border-e border-black px-2 py-1 h-[150px]">{prDetail?.quantity ?? 0}</td>
                </tr>
            );
          })}
          <tr>
            <td className="border-s border-e border-black px-2 py-2 text-center" colSpan={2}>Inspection</td>
            <td className="border-t border-e border-black px-2 py-2 text-center" colSpan={2}>Acceptance</td>
            
          </tr>
          <tr>
            <td className="border-s border-t border-black px-2 text-left text-xs text-nowrap font-bold" colSpan={2}>Date Inspected: <span className="inline-block border-b border-black min-w-[150px]"></span></td>
            <td className="border-s border-t border-e border-black px-2 text-left text-xs text-nowrap font-bold" colSpan={2}>Date Received: <span className="inline-block border-b border-black min-w-[150px]">{iarData.date_received}</span></td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center py-0 text-xs" colSpan={2}>
              <label className="inline-flex items-center space-x-1 text-black">
                <input type="checkbox" className="w-3 h-3 accent-black" />
                <span>Inspected, verified and found in order as to</span>
              </label>
            </td>
            <td className="border-s border-black px-2 text-center py-0 text-xs"></td>
            <td className="border-e border-black px-2 py-0 text-left text-xs">
              <label className="inline-flex items-center space-x-1 text-black">
                <input type="checkbox" className="w-3 h-3 accent-black" />
                <span>Complete:</span>
              </label>
              <span className="inline-block border-b border-black min-w-[100px] ml-1"></span>
            </td>
          </tr>
          <tr>
            <td className="border-s border-black px-2 text-center py-0 text-xs" colSpan={2}>
              quantity and specifications
            </td>
            <td className="border-s border-black px-2 text-center py-0 text-xs"></td>
            <td className="border-e border-black px-2 py-0 text-left text-xs">
              <label className="inline-flex items-center space-x-1 text-black">
                <input type="checkbox" className="w-3 h-3 accent-black" />
                <span>Partial Delivery:</span>
              </label>
              <span className="inline-block border-b border-black min-w-[100px] ml-1"></span>
            </td>
          </tr>

          <tr className="text-center align-middle">
            <td className="border-s border-black px-2 py-0 h-[130px]" colSpan={2}>
              <div className="flex flex-col justify-center items-center h-full leading-tight">
                <span className="underline font-black font-serif text-base">Francis T. Agtarap</span>
                <span className="no-underline text-xs">Team Leader</span>
              </div>
            </td>
            <td className="border-s border-e border-black px-2 py-0 h-[130px]" colSpan={2}></td>
          </tr>
          <tr className="text-center align-middle">
            <td className="border-s border-black px-2 py-0 h-[130px]" colSpan={2}>
              <div className="flex flex-col justify-center items-center h-full leading-tight">
                <span className="underline font-black font-serif text-base">Michael S. Pilarba</span>
                <span className="no-underline text-xs">Accounting Representative</span>
              </div>
            </td>
            <td className="border-s border-e border-black px-2 py-0 h-[130px]" colSpan={2}>
              <div className="flex flex-col justify-center items-center h-full leading-tight">
                <span className="underline font-black font-serif text-base">Adeline C. Soriano</span>
                <span className="no-underline text-xs">AO-IV (Supply Officer)</span>
              </div>
            </td>
          </tr>
          <tr className="text-center align-middle">
            <td className="border-s border-black px-2 py-0 h-[130px] border-b" colSpan={2}>
              <div className="flex flex-col justify-center items-center h-full leading-tight">
                <span className="underline font-black font-serif text-base">Mark Joseph A. Limon</span>
                <span className="no-underline text-xs">Accounting Representative</span>
              </div>
            </td>
            <td className="border-s border-e border-black px-2 py-0 h-[130px] border-b" colSpan={2}></td>
          </tr>
          <tr>
            <td className="border-s border-e border-b border-black px-2 py-2 text-center" colSpan={2}>Inspection Officer/Inspection Committee</td>
            <td className="border-t border-e border-b border-black px-2 py-2 text-center" colSpan={2}>Supply/Property Custodian</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
