<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Request for Quotation</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12px; line-height: 1.2; color:#000; margin: 20px; }
    h2, h3 { margin: 0; padding: 0; font-weight: bold; text-transform: uppercase; }
    h2 { font-size: 13px; }
    h3 { font-size: 12px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .table th, .table td { border: 1px solid #000; padding: 3px; }
    .footer { width: 100%; font-size: 10px; margin-top: 20px; }
    .footer td { text-align: left; }
  </style>
</head>
<body>

<div class="text-center">
    <img src="{{ $logo }}" alt="DepEd Logo" style="width:50px; margin-bottom:3px;">
    <h2>
      Republic of the Philippines<br>
      Department of Education<br>
      Region II – Cagayan Valley<br>
      Schools Division Office of the City of Ilagan
    </h2>
    <div style="border-top:2px solid #000; margin:4px 0 6px 0;"></div>
    <h3>Bids and Awards Committee</h3>
    <h3>Request for Quotation</h3>
</div>

<table style="width:100%; margin-top:5px; font-size:12px;">
  <tr>
    <td style="width:70%"></td>
    <td style="text-align:right;">BAC CN: _______</td>
  </tr>
  <tr>
    <td></td>
    <td style="text-align:right;">Date: __________</td>
  </tr>
</table>

<div style="margin-top:10px;">
  <p><strong>To all Eligible Suppliers:</strong></p>
  <ol type="I" style="margin-left:20px;">
    <li>Please quote your lowest price inclusive of VAT on the items listed below, subject to the Terms and Conditions of this RFQ and submit your quotation IN SEALED ENVELOPE duly signed by your representative not later than scheduled opening of quotation on ________________, to the BAC Secretariat at the DepEd City Division Office, Alibagu, Ilagan, Isabela.</li>
    <li>Prospective Supplier shall be responsible to verify/clarify the quoted item/s services at the address and telephone number cited above.</li>
    <li>Supplier with complete quotation and total quotation price is equal or less than the Approved Budget for the Contract shall only be appreciated.</li>
  </ol>
</div>

  @php
    $chair = $committee->members->firstWhere('position', 'chair');
  @endphp
<div class="text-right" style="margin-top:10px;">
  <span style="display:inline-block; text-decoration:underline; min-width:200px;">
      {{ strtoupper(optional($chair)->name ?? '__________________') }}
  </span><br>
  <p>BAC Chairperson</p>
</div>

<table class="table text-center">
  <thead>
    <tr>
      <th colspan="5" class="text-left"></th>
      <th>Qty</th>
      <th>Unit</th>
      <th>Estimated Unit Cost</th>
      <th>Bid Price per Unit</th>
      <th>Total Bid Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="5" class="text-left" style="border-bottom: none !important">Services to be provided:</td>
      <td style="border-bottom: none !important"></td>
      <td style="border-bottom: none !important"></td>
      <td style="border-bottom: none !important"></td>
      <td style="border-bottom: none !important"></td>
      <td style="border-bottom: none !important"></td>
    </tr>
    <tr>
      <td colspan="5" class="text-left" style="border-bottom: none !important; border-top: none !important;">Location:</td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
    </tr>
    <tr>
      <td colspan="5" class="text-left" style="border-bottom: none !important; border-top: none !important;">Subject:</td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
    </tr>
    <tr>
      <td colspan="5" class="text-left" style="border-bottom: none !important; border-top: none !important;">Delivery Period:</td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
      <td style="border-bottom: none !important; border-top: none !important;"></td>
    </tr>
    <tr>
      <td colspan="5" class="text-left" style="border-top: none !important;">Approved Budget for the Contract (ABC):</td>
      <td style="border-top: none !important;"></td>
      <td style="border-top: none !important;"></td>
      <td style="border-top: none !important;"></td>
      <td style="border-top: none !important;"></td>
      <td style="border-top: none !important;"></td>
    </tr>

    {{-- ✅ Loop items --}}
    @foreach($details as $item)
    <tr>
      <td colspan="5" class="font-bold text-center">{{ $item['item'] ?? ''. " ". $item['specs'] ?? ' '}}</td>
      <td class="font-bold">{{ $item['quantity'] ?? '' }}</td>
      <td class="font-bold">{{ $item['unit'] ?? '' }}</td>
      <td class="font-bold">{{ number_format($item['unit_price'], 2) ?? '' }}</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
    @endforeach

    <tr>
      <td colspan="9" class="text-center font-bold">TOTAL:</td>
      <td class="font-bold"></td>
    </tr>

    <tr>
      <td colspan="10" class="font-bold text-left" style="border-left:none !important; border-right:none !important;">SDO City Of Ilagan</td>
    </tr>

    <tr>
      <td colspan="2" class="font-bold text-left">Supplier's Company Name:</td>
      <td colspan="4">&nbsp;</td>
      <td colspan="2">TIN</td>
      <td colspan="2">&nbsp;</td>
    </tr>

    <tr>
      <td colspan="2" class="font-bold text-left">Address:</td>
      <td colspan="2" style="border-right:none !important; border-left:none !important">&nbsp;</td>
      <td colspan="2" style="border-right:none !important; border-left:none !important">&nbsp;</td>
      <td colspan="4"  style="border-left:none !important">&nbsp;</td>
    </tr>

    <tr>
      <td colspan="2" class="font-bold text-left">Contact Number:</td>
      <td colspan="4">&nbsp;</td>
      <td colspan="2" class="text-left">Fax No.</td>
      <td colspan="2" class="text-left">E-mail</td>
    </tr>

    <tr>
      <td colspan="2" class="font-bold text-left">Supplier's Authorized Representative Signature Over Printed Name:</td>
      <td colspan="4">&nbsp;</td>
      <td colspan="2" class="font-bold text-left align-top">Date:</td>
      <td colspan="2">&nbsp;</td>
    </tr>

    <tr>
      <td colspan="2" class="font-bold text-left">Canvasser:</td>
      <td colspan="4">&nbsp;</td>
      <td colspan="2">&nbsp;</td>
      <td colspan="2">&nbsp;</td>
    </tr>
  </tbody>
</table>

<p style="margin-top:20px; text-align:center; font-style:italic; font-size:11px;">
  This is to submit our price quotations as indicated above subject to the terms and conditions of this RFQ.
</p>


    <table class="footer" style="width:100%; margin-top:40px; font-size:11px; border:none;">
        <tr>
            <!-- Left logos -->
            <td style="width:40%; text-align:left; border:none;">
                <img src="file://{{ public_path('deped-matatag.png') }}" alt="DepEd Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('bagong-pilipinas.png') }}" alt="Philippines Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('ilagan.png') }}" alt="Ilagan Logo" style="height:70px;">
                <div>ASDS-QF-003</div>
            </td>

            <!-- Office info -->
            <td style="width:60%; text-align:right; border:none; line-height:1.3;">
                <div><strong>INHS Compound, Claravall St., San Vicente, City of Ilagan, Isabela</strong></div>
                <div>Telephone Nos: (078) 624-0077</div>
                <div>
                    <span style="margin-right:10px;">www.facebook.com/sdoilagan</span> 
                    <span style="margin-right:10px;">ilagan@deped.gov.ph</span> 
                    <span>www.sdoilagan.gov.ph</span>
                </div>
                <div style="margin-top:5px;">Rev:00</div>
            </td>
        </tr>
    </table>

</body>
</html>
