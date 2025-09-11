import React, { useEffect, useRef } from 'react';

export default function PrintAOQ({ rfq, prDetail, top3 }) {
  const imgRef = useRef(null);
    console.log(top3);
  useEffect(() => {
    const imgEl = imgRef.current;

    const handleImageLoad = () => {
      window.print();
    };

    if (imgEl) {
      if (imgEl.complete) {
        handleImageLoad();
      } else {
        imgEl.addEventListener("load", handleImageLoad);
      }
    }

    return () => {
      if (imgEl) imgEl.removeEventListener("load", handleImageLoad);
    };
  }, []);

  return (
    <div className="p-10 text-[13px] leading-tight text-black font-serif w-[8.5in] h-[11in] mx-auto">
      <div className="text-center mb-4">
        <img
          ref={imgRef}
          src="/deped1.png"
          alt="DepEd Logo"
          className="mx-auto mb-2 w-[70px] h-auto"
        />
        <h2 className="uppercase text-[14px] font-bold">Republic of the Philippines</h2>
        <h3 className="uppercase text-[13px] font-semibold">Department of Education</h3>
        <p className="uppercase text-[12px] font-semibold">
          REGION II – CAGAYAN VALLEY<br />
          SCHOOLS DIVISION OFFICE OF THE CITY OF ILAGAN
        </p>
        <h3 className="text-[13px] font-bold mt-3 uppercase">ABSTRACT OF QUOTATIONS</h3>
        <p className="text-[12px] italic">(As Calculated Bid Price)</p>
      </div>

      <div className="text-[12px] mb-3">
        <p><strong>Lot No.:</strong> _____________</p>
        <p><strong>Date of Opening:</strong> _____________</p>
        <p><strong>Venue:</strong> _____________</p>
      </div>

      <table className="w-full border border-black text-[12px] text-center mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-black px-2 py-1 w-8">No.</th>
            <th className="border border-black px-2 py-1">Name of Contractor / Offeror</th>
            <th className="border border-black px-2 py-1">Total Quotations</th>
            <th className="border border-black px-2 py-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {top3.map((detail, idx) => (
            <tr key={idx}>
              <td className="border border-black px-2 py-1">{idx + 1}</td>
              <td className="border border-black px-2 py-1">{detail.supplier.company_name}</td>
              <td className="border border-black px-2 py-1">
                ₱{parseFloat(detail.quoted_price).toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="border border-black px-2 py-1">
                {detail.is_winner ? " Lowest Calculated Bid" : ""}
              </td>
            </tr>
          ))}
          {/* Filler rows to ensure 3 entries */}
          {Array.from({ length: 3 - top3.length }).map((_, idx) => (
            <tr key={`blank-${idx}`}>
              <td className="border border-black px-2 py-1">{top3.length + idx + 1}</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[12px] mt-2">
        Awarded to: <span className="underline font-semibold">{top3.find(x => x.is_winner)?.supplier.company_name || "__________"}</span> offering the <em>Lowest Calculated Bid</em>.
      </p>

      <div className="mt-6 text-[12px]">
        <p><strong>Prepared by:</strong></p>
        <p className="mt-4 underline">BAC Secretariat - Member</p>
      </div>

      <div className="mt-8 text-[12px]">
        <p className="font-bold text-center mb-2">BIDS AND AWARDS COMMITTEE</p>
        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <p>BAC Member</p>
          <p>BAC Member</p>
          <p>BAC Member</p>
          <p></p>
          <p>Vice Chairperson</p>
          <p></p>
          <p colSpan={3} className="col-span-3 mt-6">BAC Chairperson</p>
        </div>
      </div>

      <footer className="mt-12 text-xs text-gray-600 flex justify-between">
        <div>ASDS-QF-003</div>
        <div>Rev:00</div>
      </footer>
    </div>
  );
}
