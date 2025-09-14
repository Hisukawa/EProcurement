<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Request for Quotation</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12px; line-height: 1.3; color:#000; margin: 20px; }
    h2, h3 { margin: 0; padding: 0; font-weight: bold; text-transform: uppercase; }
    h2 { font-size: 13px; }
    h3 { font-size: 12px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .underline { text-decoration: underline; }
    .italic { font-style: italic; }
    .font-bold { font-weight: bold; }
    .table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .table th, .table td { border: 1px solid #000; padding: 4px; }
    .footer { width: 100%; margin-top: 20px; font-size: 10px; }
    .footer td { width: 50%; }
  </style>
</head>
<body>

<div class="text-center">
    @if(!empty($logo) && file_exists($logo))
      <img src="{{ $logo }}" alt="DepEd Logo" style="width:50px; margin-bottom:3px;">
    @endif
    <h2>
      Republic of the Philippines<br>
      Department of Education<br>
      Region II – Cagayan Valley<br>
      Schools Division Office of the City of Ilagan
    </h2>
    <hr style="border:0; border-top:1px solid #000; margin:4px 0;">
    <h3>Bids and Awards Committee</h3>
    <h3>Request for Quotation</h3>
</div>

<div class="text-right" style="margin-top:10px;">
  <p class="underline"><strong>BAC CN# _______</strong></p>
  <p><strong>Date: ________</strong></p>
</div>

<div style="margin-top:10px;">
  <p class="underline"><strong>To all Eligible Suppliers:</strong></p>
  <ol type="I" style="margin-left:20px;">
    <li>Please quote your lowest price inclusive of VAT on the items listed below, subject to the Terms and Conditions of this RFQ and submit your quotation IN SEALED ENVELOPE duly signed by your representative not later than scheduled opening of quotation on ________________, to the BAC Secretariat at the DepEd City Division Office, Alibagu, Ilagan, Isabela.</li>
    <li>Prospective Supplier shall be responsible to verify/clarify the quoted item/s services at the address and telephone number cited above.</li>
    <li>Supplier with complete quotation and total quotation price is equal or less than the Approved Budget for the Contract shall only be appreciated.</li>
  </ol>
</div>

<div class="text-right" style="margin-top:10px;">
  <p>________________</p>
  <p>BAC Chairperson</p>
</div>

<table class="table text-center">
  <thead>
    <tr>
      <th colspan="3" class="text-left">Services to be provided:</th>
      <th>Qty</th>
      <th>Unit</th>
      <th>Estimated Unit Cost</th>
      <th>Bid Price per Unit</th>
      <th>Total Bid Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="3" class="text-left">Location:</td>
      <td colspan="5">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="text-left">Subject:</td>
      <td colspan="5">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="text-left">Delivery Period:</td>
      <td colspan="5">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="text-left">Approved Budget for the Contract (ABC):</td>
      <td colspan="5">&nbsp;</td>
    </tr>

    {{-- Item row --}}
    <tr>
      <td class="font-bold" colspan="3">{{ $detail['item'] ?? '' }}</td>
      <td class="font-bold">{{ $detail['quantity'] ?? '' }}</td>
      <td class="font-bold">{{ $detail['unit'] ?? '' }}</td>
      <td class="font-bold">{{ number_format($detail['unit_price'] ?? 0, 2) }}</td>
      <td>&nbsp;</td>
      <td class="font-bold">&nbsp;</td>
    </tr>

    {{-- Total --}}
    <tr>
      <td colspan="7" class="text-center font-bold">TOTAL:</td>
      <td class="font-bold"></td>
    </tr>

    <tr>
      <td colspan="3" class="font-bold">SDO City Of Ilagan</td>
      <td colspan="5">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="font-bold">Supplier's Company Name:</td>
      <td colspan="2">&nbsp;</td>
      <td class="font-bold text-left">TIN:</td>
      <td colspan="2">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="font-bold">Address:</td>
      <td colspan="5">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="font-bold">Contact Number:</td>
      <td colspan="2">&nbsp;</td>
      <td class="font-bold text-left">Fax No.</td>
      <td class="font-bold text-left">E-mail:</td>
      <td>&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="font-bold">Supplier's Authorized Representative Signature Over Printed Name:</td>
      <td colspan="2">&nbsp;</td>
      <td class="font-bold text-left">Date:</td>
      <td colspan="2">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="3" class="font-bold">Canvasser:</td>
      <td colspan="5">&nbsp;</td>
    </tr>
  </tbody>
</table>

<p style="margin-top:20px; text-align:center; font-style:italic; font-size:11px;">
  This is to submit our price quotations as indicated above subject to the terms and conditions of this RFQ.
</p>

<table class="footer">
  <tr>
    <td>ASDS-QF-003</td>
    <td style="text-align:right;">Rev 01</td>
  </tr>
</table>

</body>
</html>
