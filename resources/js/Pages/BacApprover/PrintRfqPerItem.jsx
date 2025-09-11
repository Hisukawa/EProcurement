import React, { useEffect, useRef } from "react";

// --- CHANGE #1: Accept the new 'supplier' prop from the controller ---
export default function PrintRfqPerItem({ rfq, detail, supplier }) {
  const imgRef = useRef(null);

  // This hook ensures printing happens after the header image is loaded. No changes needed here.
  useEffect(() => {
    const imgEl = imgRef.current;
    const handleImageLoad = () => {
      // Use a small timeout to ensure the DOM is fully rendered before printing
      setTimeout(() => window.print(), 100);
    };

    if (imgEl) {
      if (imgEl.complete) {
        handleImageLoad();
      } else {
        imgEl.addEventListener("load", handleImageLoad);
        // Fallback in case load event doesn't fire
        setTimeout(handleImageLoad, 500);
      }
    } else {
        // If there's no image, print directly
        handleImageLoad();
    }


    return () => {
      if (imgEl) imgEl.removeEventListener("load", handleImageLoad);
    };
  }, []);

  return (
    <div className="text-[13px] leading-tight text-black font-serif">
      {/* Header - No changes needed */}
      <div className="text-center">
        <img
          ref={imgRef}
          src="/deped1.png"
          alt="DepEd Logo"
          className="mx-auto mb-4 w-[80px] h-auto"
        />
        <h2 className="font-bold text-[14px] uppercase">
          Republic of the Philippines
          <br />
          Department of Education
          <br />
          Region II – Cagayan Valley
          <br />
          Schools Division Office of the City of Ilagan
        </h2>
        <div className="my-1">
          ________________________________________________________________________________________________
        </div>
        <h3 className="mt-4 font-bold text-[15px] uppercase">
          Bids and Awards Committee
        </h3>
        <h3 className="mt-1 font-bold text-[15px] uppercase">
          Request for Quotation
        </h3>
      </div>

      {/* RFQ Info - No changes needed */}
      <div className="mt-6 text-right">
        <p className="mb-2 underline">
          <strong>BAC CN# _______</strong>
        </p>
        <p className="mb-2">
          <strong>Date _________</strong>
        </p>
      </div>

      {/* Supplier Instructions - No changes needed */}
      <div className="mt-6">
        <p className="mb-2 underline">
          <strong>To all Eligible Suppliers:</strong>
        </p>
        <ol className="list-[upper-roman] ml-6">
          <li className="mb-1">
            Please quote your lowest price inclusive of VAT on the items listed
            below, subject to the Terms and Conditions of this RFQ and submit
            your quotation IN SEALED ENVELOPE duly signed by your representative
            not later than scheduled opening of quotation on ________________,
            to the BAC Secretariat at the DepEd City Division Office, Alibagu,
            Ilagan, Isabela.
          </li>
          <li className="mb-1">
            Prospective Supplier shall be responsible to verify/clarify the
            quoted item/s services at the address and telephone number cited
            above.
          </li>
          <li className="mb-1">
            Supplier with complete quotation and total quotation price is equal
            or less than the Approved Budget for the Contract shall only be
            appreciated.
          </li>
        </ol>
      </div>

      {/* BAC Chair - No changes needed */}
      <div className="mt-4 text-end">
        <p>________________</p>
        <p>BAC Chairperson</p>
      </div>

      {/* Table - No changes needed in the item section */}
      <div className="mt-4">
        <table className="w-full table-fixed border-collapse text-center text-[12px]">
          {/* Table Head for item details */}
          <thead>
            <tr>
              <th className="border border-black px-2 py-1" colSpan={3}></th>
              <th className="border border-black px-2 py-1">Qty</th>
              <th className="border border-black px-2 py-1">Unit</th>
              <th className="border border-black px-2 py-1">
                Estimated Unit Cost
              </th>
              <th className="border border-black px-2 py-1">Bid Price per Unit</th>
              <th className="border border-black px-2 py-1" colSpan={2}>
                Total Bid Price
              </th>
            </tr>
            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">
                Services to be provided:
              </td>
              <td className="border-s border-e border-black px-2 py-1">
                {detail.quantity || ""}
              </td>
              <td className="border-s border-e border-black px-2 py-1">
                {detail.unit || ""}
              </td>
              <td className="border-s border-e border-black px-2 py-1">
                {Number(detail.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>
            {/* ... other filler rows ... */}
            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Approved Budget for the Contract ABC:</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-b border-black px-2 py-1">&nbsp;</td>
              <td colSpan={2} className="border-s border-e border-b border-black px-2 py-1">&nbsp;</td>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {/* Item Description */}
            <tr>
              <td colSpan={3} className="border border-black px-2 py-1 font-bold">
                Item Description
              </td>
              <td className="border border-black px-2 py-1" colSpan={6}>
                Specifications
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black px-2 py-3 text-left align-top">
                {detail.item || ""}
              </td>
              <td className="border border-black px-2 py-3 text-left align-top" colSpan={6}>
                {detail.specs || ""}
              </td>
            </tr>

            {/* Blank filler row */}
            <tr>
              <td colSpan={9} className="border border-black px-2 py-4">&nbsp;</td>
            </tr>

            {/* TOTAL Row */}
            <tr>
              <td colSpan={8} className="text-right px-2 py-1 font-bold">
                TOTAL:
              </td>
              <td className="border border-black px-2 py-1 font-bold"></td>
            </tr>

            {/* --- CHANGE #2: THIS ENTIRE SUPPLIER SECTION IS NOW POPULATED --- */}
            <tr>
              <td colSpan={9} className="px-2 py-1 font-bold text-left">SDO City Of Ilagan</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black px-2 py-1 font-bold text-left">
                Supplier's Company Name:
              </td>
              <td colSpan={3} className="border border-black px-2 py-1 text-left">
                {supplier?.company_name || ''}
              </td>
              <td className="border border-black px-2 py-1 font-bold text-left">TIN:</td>
              <td colSpan={2} className="border border-black px-2 py-1 text-left">
                {supplier?.tin_num || ''}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black px-2 py-1 font-bold text-left">Address:</td>
              <td colSpan={6} className="border border-black px-2 py-1 text-left">
                {supplier?.address || ''}
              </td>
            </tr>
            <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold text-left">Supplier's Authorized Representative Signature Over Printed Name:</td>
                <td colSpan={3} className="border border-black px-2 py-1 text-left">
                    {supplier?.representative_name || ''}
                </td>
                <td className="border border-black px-2 py-1 font-bold text-left">Date:</td>
                <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
            {/* Note: Contact number, fax, and email are not in your supplier model based on the code. Add them if needed. */}
            <tr>
              <td colSpan={3} className="border border-black px-2 py-1 font-bold text-left">Canvasser:</td>
              <td colSpan={6} className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <p className="mt-8 text-sm text-center italic">
        This is to submit our price quotations as indicated above subject to the
        terms and conditions of this RFQ.
      </p>

      {/* Document Footer */}
      <div className="mt-8 flex justify-between text-xs">
        <div>ASDS-QF-003</div>
        <div className="text-right">Rev 01</div>
      </div>
    </div>
  );
}