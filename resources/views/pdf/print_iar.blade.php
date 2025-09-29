<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inspection and Acceptance Report</title>
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
        Inspection and Acceptance Report
    </div>
    <table>
        <tr>
            <td colspan="2" class="font-semibold">
                Entity Name: <span class="underline">SDO City of Ilagan</span>
            </td>
            <td class="font-semibold">
                &nbsp;
            </td>
        </tr>
    </table>

    <table>
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="2">
                Supplier: <span class="underline font-semibold">{{ $iarData->purchaseOrder->supplier->company_name ?? '' }}</span>
            </td>
            <td style="border-bottom: none !important;" colspan="2" class="">
                IAR No.: <span class="underline font-semibold">{{ $iarData->iar_number }}</span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;border-top:none !important" colspan="2">
                PO No.:<span class="underline font-semibold">{{ $iarData->purchaseOrder->po_number ?? '' }}</span>
            </td>
            <td style="border-bottom: none !important;border-top:none !important" colspan="2" class="">
                Date: <span class="underline font-semibold"></span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;border-top:none !important" colspan="2">
                Requisitioning Office/Dept : <span class="underline font-semibold">{{ $iarData->purchaseOrder->rfq->purchaseRequest->division->meaning ?? '' }}</span>
            </td>
            <td style="border-bottom: none !important;border-top:none !important" colspan="2" class="">
                Invoice No.: <span class="underline font-semibold"></span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;border-top:none !important" colspan="2">
                Responsibility Center Code : <span class="underline font-semibold"></span>
            </td>
            <td style="border-bottom: none !important;border-top:none !important" colspan="2" class="">
                Date: <span class="underline font-semibold"></span>
            </td>
        </tr>
        <tr class="text-center font-bold with-border">
            <td style="width: 15%;">Stock/Property No.</td>
            <td style="width: 40%;">Description</td>
            <td style="width: 25%;">Unit</td>
            <td style="width: 25%;">Quantity</td>
        </tr>
        @foreach($iarData->purchaseOrder->details as $detail)
            <tr class="text-center with-border">
                <td></td>
                <td>{{ $detail->prDetail->product->name ?? '' }} {{ $detail->prDetail->product->specs ?? '' }}</td>
                <td>{{ $detail->prDetail->product->unit->unit ?? '' }}</td>
                <td>{{ $detail->prDetail->quantity ?? 0 }}</td>
            </tr>
        @endforeach

        <tr class="with-border">
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
        </tr>
        <tr class="with-border">
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
        </tr>
        <tr class="with-border">
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
        </tr>
        <tr class="with-border font-semibold" style="font-size: 14px">
            <td colspan="2" class="text-center">Inspection</td>
            <td colspan="2" class="text-center">Acceptance</td>
        </tr>
        <tr class="with-border">
            <td colspan="2" style="border-bottom:none !important">Date Inspected: __________________</td>
            <td colspan="2" style="border-bottom:none !important">Date Received: {{ $iarData->date_received }}</td>
        </tr>
        <tr class="with-border">
            <td colspan="2" class="text-center" style="border-bottom:none !important; border-top:none !important">Inspected, verified and found in order</td>
            <td colspan="2" class="text-start" style="padding-left: 80px;border-bottom:none !important; border-top:none !important">Complete _____________________</td>
        </tr>
        <tr class="with-border">
            <td colspan="2" class="text-center" style="border-bottom:none !important; border-top:none !important">as to quantity and specifications</td>
            <td colspan="2" class="text-start" style="padding-left: 80px; border-bottom:none !important; border-top:none !important">Partial Delivery _____________________</td>
        </tr>
        @php
            $activeMembers = $inspectors->members->where('status', 'active');
            $leader = $activeMembers->firstWhere('position', 'Leader');
            $members = $activeMembers->filter(fn($m) => str_starts_with($m->position, 'Member'));
        @endphp
        <tr class="with-border">
            <td colspan="2" class="text-center" style="height: 7%">
                <span class="underline font-bold">{{ strtoupper(optional($leader)->name ?? '__________________') }}</span><br>
                <small>Team Leader</small></td>
            <td colspan="2" class="text-center">&nbsp;
            </td>
        </tr>
        <tr class="with-border">
            <td colspan="2" class="text-center" style="height: 7%">
                <span class="underline font-bold">{{ strtoupper(optional($members->shift())->name ?? '__________________') }}</span><br>
                <small>Accounting Representative</small></td>
            <td colspan="2" class="text-center"><span class="underline font-bold">Adeline C. Soriano</span><br>
                <small>AO-IV (Supply Officer)</small>
            </td>
        </tr>
        <tr class="with-border">
            <td colspan="2" class="text-center" style="height: 5%">
                <span class="underline font-bold">{{ strtoupper(optional($members->shift())->name ?? '__________________') }}</span><br>
                <small>Supply Representative</small></td>
            <td colspan="2" class="text-center"><span class="underline font-bold">
            </td>
        </tr>
        <tr class="with-border font-semibold" style="font-size: 12px">
            <td colspan="2" class="text-center">Inspection Officer/Inspection Committee</td>
            <td colspan="2" class="text-center">Supply/Property Custodian</td>
        </tr>

    </table>

    <table>
        <tr>
            
        </tr>
        
        <tr>
            <td colspan="2" class="text-center">
                
            </td>
            <td colspan="2" class="text-center">
                
            </td>
        </tr>
    </table>
</body>
</html>
