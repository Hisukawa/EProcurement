import React, { useEffect, useRef  } from 'react';

export default function PrintRFQ({ rfq, details }) {
  console.log(rfq);
  const imgRef = useRef(null);

  useEffect(() => {
    const imgEl = imgRef.current;

    const handleImageLoad = () => {
      window.print();
    };

    if (imgEl) {
      if (imgEl.complete) {
        // If already loaded (from cache), print immediately
        handleImageLoad();
      } else {
        imgEl.addEventListener("load", handleImageLoad);
      }
    }

    return () => {
      if (imgEl) imgEl.removeEventListener("load", handleImageLoad);
    };
  }, []);
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="text-[13px] leading-tight text-black font-serif">
    <div className="text-center">
      <img ref={imgRef} src='/deped1.png' alt="DepEd Logo" className="mx-auto mb-4 w-[80px] h-auto"  />
      <h2 className="font-bold text-[14px] uppercase">
        Republic of the Philippines<br />
        Department of Education<br />
        Region II – Cagayan Valley<br />
        Schools Division Office of the City of Ilagan
      </h2>
        <div className="my-1">________________________________________________________________________________________________</div>
        <h3 className="mt-4 font-bold text-[15px] uppercase">Bids and Awards Committee</h3>
        <h3 className="mt-1 font-bold text-[15px] uppercase">Request for Quotation</h3>
      </div>

      <div className="mt-6 text-right">
        <p className="mb-2 underline"><strong>BAC CN# _______</strong></p>
        <p className="mb-2"><strong>Date _________</strong></p>
      </div>

      <div className="mt-6">
        <p className="mb-2 underline"><strong>To all Eligible Suppliers:</strong></p>
        <ol className="list-[upper-roman] ml-6">
          <li className="mb-1">
            Please quote your lowest price inclusive of VAT on the items listed below, subject to the Terms and Conditions of this RFQ and submit your quotation IN SEALED ENVELOPE duly signed by your representative not later than scheduled opening of quotation on ________________, to the BAC Secretariat at the DepEd City Division Office, Alibagu, Ilagan, Isabela.
          </li>
          <li className="mb-1">
            Prospective Supplier shall be responsible to verify/clarify the quoted item/s services at the address and telephone number cited above.
          </li>
          <li className="mb-1">
            Supplier with complete quotation and total quotation price is equal or less than the Approved Budget for the Contract shall only be appreciated.
          </li>
        </ol>
      </div>

      <div className="mt-4 text-end">
        <p>________________</p>
        <p>BAC Chairperson</p>
      </div>

      <div className="mt-4">
        <table className="w-full table-fixed border-collapse text-center text-[12px]">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1" colSpan={3}></th>
              <th className="border border-black px-2 py-1">Qty</th>
              <th className="border border-black px-2 py-1">Unit</th>
              <th className="border border-black px-2 py-1">Estimated Unit Cost</th>
              <th className="border border-black px-2 py-1">Bid Price per Unit</th>
              <th className="border border-black px-2 py-1" colSpan={2}>Total Bid Price</th>
            </tr>
            {details.map((item, idx) => (
              <tr key={`services-${idx}`}>
                <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Services to be provided:</td>
                <td className="border-s border-e border-black px-2 py-1">{item.quantity || ""}</td>
                <td className="border-s border-e border-black px-2 py-1">{item.unit || ""}</td>
                <td className="border-s border-e border-black px-2 py-1">{Number(item.unit_price || 0).toFixed(2)}</td>
                <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
                <td className="border-s border-e border-black px-2 py-1" colSpan={2}>&nbsp;</td>
              </tr>
            ))}

            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Location:</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>
            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Subject:</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>
            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Delivery Period:</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>
            <tr>
              <td colSpan={3} className="border-s border-e border-black px-2 py-1 text-left">Approved Budget for the Contract ABC:</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-b border-black px-2 py-1">&nbsp;</td>
              <td className="border-s border-e border-b border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>

          </thead>
          <tbody>
          
    <>
      <tr>
        <td colSpan={3} className="border border-black px-2 py-1 font-bold">Item Description</td>
        <td className="border border-black px-2 py-1"></td>
        <td className="border border-black px-2 py-1"></td>
        <td className="border border-black px-2 py-1">&nbsp;</td>
        <td className="border border-black px-2 py-1">&nbsp;</td>
        <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
      </tr>
      {details.map((item, idx) => (
        <tr key={idx}>
          <td colSpan={3} className="border border-black px-2">{item.item || ""}</td>
          <td className="border border-black px-2 text-nowrap">
            {/* {item.specs || ""} */}
            </td>
          <td className="border border-black px-2 py-1"></td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
        </tr>
      ))}


      {/* Two blank filler rows for layout */}
      {Array.from({ length: 1 }).map((_, idx) => (
        <tr key={`blank-${idx}`}>
          <td className="border border-black px-2 py-1" colSpan={3}>&nbsp;</td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td className="border border-black px-2 py-1">&nbsp;</td>
          <td className="border border-black px-2 py-1" colSpan={2}>&nbsp;</td>
        </tr>
      ))}
    </>
            <tr>
              <td colSpan={8} className="text-center px-2 py-1 font-bold">TOTAL:</td>
              <td className="px-2 py-1 font-bold">
                
              </td>
            </tr>
            <tr>
                <td colSpan={3} className=" px-2 py-1 font-bold">SDO City Of Ilagan</td>
                <td className=" px-2 py-1">&nbsp;</td>
                <td className=" px-2 py-1">&nbsp;</td>
                <td className=" px-2 py-1">&nbsp;</td>
                <td className=" px-2 py-1">&nbsp;</td>
                <td className=" px-2 py-1">&nbsp;</td>
                <td className=" px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold">Supplier's Company Name:</td>
                <td colSpan={2} className="border border-black px-2 py-1 ">&nbsp;</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-bold text-start">TIN:</td>
                <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold">Address:</td>
                <td colSpan={2} className="border-b border-black px-2 py-1 ">&nbsp;</td>
                <td colSpan={2} className="border-b border-black px-2 py-1 font-bold text-start">&nbsp;</td>
                <td colSpan={2} className="border-e border-b border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold">Contact Number:</td>
                <td colSpan={2} className="border border-black px-2 py-1 ">&nbsp;</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-bold text-start">Fax No.</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-bold text-start">E-mail:</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold">Supplier's Authorized Representative Signature Over Printed Name:</td>
                <td colSpan={2} className="border border-black px-2 py-1 ">&nbsp;</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-bold text-start">Date:</td>
                <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black px-2 py-1 font-bold">Canvasser:</td>
                <td colSpan={2} className="border border-black px-2 py-1 ">&nbsp;</td>
                <td colSpan={2} className="border border-black px-2 py-1 font-bold text-start">&nbsp;</td>
                <td colSpan={2} className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-sm text-center italic">
        This is to submit our price quotations as indicated above subject to the terms and conditions of this RFQ.
      </p>

      <div className="mt-8 flex justify-between text-xs">
        <div>ASDS-QF-003</div>
        <div className="text-right">Rev 01</div>
      </div>
    </div>
  );
}
