<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order</title>
    <style>
        body { 
            font-family: "Times New Roman", Times, serif; 
            font-size: 12px; 
            color: black; 
            border: 1px solid; 
            padding: 10px; 
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: bold; }
        .underline { text-decoration: underline; }
        .nowrap { white-space: nowrap; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { padding: 4px; vertical-align: middle; }
        .with-border td, .with-border th { border: 1px solid black; }
        .signature-line {
            display:inline-block; 
            border-bottom:1px solid black; 
            min-width:180px; 
            text-align:center;
            padding: 0 10px;
        }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:30px; margin-top:30px;">
        PURCHASE ORDER
    </div>
    <table>
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="3">
                Supplier: <span class="underline font-semibold">{{ $po->supplier->company_name }}</span>
            </td>
            <td style="border-bottom: none !important;" colspan="3" class="">
                PO No.: <span class="underline font-semibold">{{ $po->po_number }}</span>
            </td>
        </tr>

        <tr class="with-border">
            <td style="border-bottom: none !important; border-top: none !important;" colspan="3">Address: <span class="underline font-semibold">{{ $po->supplier->address }}</span></td>
            <td style="border-bottom: none !important; border-top: none !important;" colspan="3">Date: <span class="underline font-semibold">{{ \Carbon\Carbon::parse($po->created_at)->format('m/d/Y') }}</span></td>
        </tr>

        <tr class="with-border">
            <td style="border-top: none !important;" colspan="3">TIN: <span class="underline font-semibold">{{ $po->supplier->tin_num }}</span></td>
            <td style="border-top: none !important;" colspan="3">Mode of Procurement: <span class="underline font-semibold">SVP</span></td>
        </tr>
        <tr style="margin-top:8px; margin-left: 10px; font-size:11px; border-left:1px solid; border-right:1px solid;height: 2%;">
            <td colspan="6">
                <span class="font-bold"style>Gentlemen:</span>
                <span style="">
                    Please furnish this Office the following articles subject to the terms and conditions contained herein:
                </span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="3">
                Place of Delivery: <span class="underline font-semibold">SDO CITY OF ILAGAN </span>
            </td>
            <td style="border-bottom: none !important;" colspan="3" class="">
                Delivery Term: <span class="underline font-semibold">F.O.B.Destination</span>
            </td>
        </tr>

        <tr class="with-border">
            <td colspan="3" style="border-bottom: none !important; border-top: none !important;" >Date of Delivery: <span class="underline font-semibold"></span></td>
            <td colspan="3" style="border-bottom: none !important; border-top: none !important;">Payment Term: <span class="underline font-semibold">n30</span></td>
        </tr>
        <tr class="text-center font-bold with-border">
            <td style="width:2%">Stock/Property No.</td>
            <td>Unit</td>
            <td style="width:45%">Description</td>
            <td>Quantity</td>
            <td>Unit Cost</td>
            <td>Amount</td>
        </tr>
        @php $total = 0; @endphp
        @foreach($po->details as $item)
            @php
                $prDetail = $po->rfq?->purchaseRequest?->details->firstWhere('id', $item->pr_detail_id);
                $specs = $prDetail?->product?->specs ?? '-';
                $unit = $prDetail?->product?->unit?->unit ?? $item->unit ?? '-';
                $total += $item->total_price;
            @endphp
            <tr class="text-center with-border">
                <td></td>
                <td>{{ $unit }}</td>
                <td class="text-left">{{ $specs }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->unit_price, 2) }}</td>
                <td>{{ number_format($item->total_price, 2) }}</td>
            </tr>
        @endforeach

        <tr class="with-border">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>

        <tr class="text-center with-border">
            <td colspan="2">(Total Amount in Words)</td>
            <td colspan="2"></td>
            <td class="font-bold">Total:</td>
            <td>{{ number_format($total, 2) }}</td>
        </tr>
        <tr class="with-border">
            <td colspan="6"  style="border-bottom: none !important"><p style="font-size: 10px;">
                In case of failure to make the full delivery within the time specified above,
                a penalty of one-tenth (1/10) of one percent for every day of delay shall be
                imposed on the undelivered item/s.
            </p></td>
        </tr>
        <tr class="with-border">
            <td  style="border-bottom:none !important;border-top:none !important;border-right: none !important; padding-left:100px;" colspan="3" class="font-bold ">Conforme <span style="padding-left: 210px">Very truly yours,</span></td>
            <td style="border-bottom:none !important;border-top:none !important; border-left: none !important; white-space: nowrap; padding-right: 50px;" colspan="3" class="font-bold"></td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-center">______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;border-left: none !important;white-space: nowrap; padding-right: 50px;" colspan="3" class="text-center underline text-nowrap">
                EDUARDO C. ESCORPISO JR., EdD, CESO V
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-center">Signature Over Printed Name of Supplier</td>
            <td style="border-bottom:none !important;border-top:none !important;border-left: none !important; white-space: nowrap; padding-right: 50px;" colspan="3" class="text-center">Signature Over Printed Name of Authorized Official</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-center"> ______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;border-left: none !important;" colspan="3" class="text-center underline">Schools Division Superintendent</td>
        </tr>
        <tr class="with-border">
            <td style="border-top:none !important;border-right: none !important;" colspan="3" class="text-center"> Date</td>
            <td style="border-top:none !important;border-left: none !important;" colspan="3" class="text-center">Designation</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start"> Fund Cluster: &nbsp; &nbsp;______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start"> ORS/BURS No.: &nbsp; &nbsp;________________________</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start"> Funds Available: &nbsp; &nbsp;______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">Date of the ORS/BURS No.: &nbsp; &nbsp;_______________</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start">&nbsp;</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">Amount: &nbsp; &nbsp;_______________________________</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start">&nbsp;</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">Allotment Available: &nbsp; &nbsp;_____________________</td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-center underline  font-bold">FERMIN DAVE F. ANDAYA</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td style=" font-size: 10px;border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-center">Signature over Printed Name of Chief Accountant/Head of Accounting Division/Unit</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">&nbsp;</td>
        </tr>
        <tr class="with-border">
            <td style=" font-size: 10px;border-bottom:none !important;border-right: none !important;" colspan="3" class="text-start">Program No.: &nbsp; &nbsp;______________________________</td>
            <td style="border-bottom:none !important;" colspan="3" class="text-start">&nbsp; &nbsp;_____________ Included in DEDP</td>
        </tr>
        <tr class="with-border">
            <td style=" font-size: 10px;border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start">Program Title: &nbsp; &nbsp;______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">&nbsp; &nbsp;_____________ With WAFP</td>
        </tr>
        <tr class="with-border">
            <td style=" font-size: 10px;border-bottom:none !important;border-top:none !important;border-right: none !important;" colspan="3" class="text-start">Fund Source: &nbsp; &nbsp;______________________________</td>
            <td style="border-bottom:none !important;border-top:none !important;" colspan="3" class="text-start">&nbsp; &nbsp;_____________ Included in APP</td>
        </tr>
        <tr class="with-border">
            <td style="font-size: 10px;border-top:none !important;border-right: none !important;" colspan="3" class="text-start">&nbsp;</td>
            <td style="border-top:none !important;" colspan="3" class="text-start">&nbsp; &nbsp;_____________ Included in PPMP</td>
        </tr>
    </table>
</body>
</html>
