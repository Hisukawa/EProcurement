<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt of Returned Property</title>
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
        RECEIPT OF RETURNED PROPERTY
    </div>

    <table>
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="3" rowspan="2">
                Entity Name: <span class="font-semibold">Schools Division Office City of Ilagan</span>
            </td>
            <td style="border-bottom: none !important;" colspan="2" class="">
                Date: <span>{{ $reissuedItemData->created_at->format('Y-m-d') }}</span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="2" class="">
                RRSP No.: <span class="">{{ $reissuedItemData->rrsp_number }}</span>
            </td>
        </tr>
        
        <tr class="text-center font-bold with-border">
            <td style="width: 40%;">Item Description</td>
            <td style="width: 10%;">Qty</td>
            <td style="width: 20%;">ICS No.</td>
            <td style="width: 20%;">End Users</td>
            <td style="width: 25%;">Remarks</td>
        </tr>
        @foreach($reissuedItemData->items as $detail)
            <tr class="text-center with-border">
                @php
                    $returnedBy = $detail->returned_by ?? '';
                    $remarks = ($detail->remarks ?? '') . ' to ' . ($detail->recipient ?? '');
                @endphp
                <td>{{ $detail->inventoryItem->item_desc ?? '' }}</td>
                <td>{{ $detail->quantity ?? 0 }}</td>
                <td>{{ $reissuedItemData->ics_number ?? 0 }}</td>
                <td>{{ $returnedBy }}</td>
                <td>{{ $remarks }}</td>
            </tr>
        

        <tr class="with-border">
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
        </tr>
        <tr class="with-border">
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
        </tr>
        <tr class="with-border">
            <td colspan="2" style="border-bottom:none !important">Returned By:</td>
            <td colspan="3" style="border-bottom:none !important">Received By:</td>
        </tr>
        <tr class="with-border">
            <td colspan="2" class="text-center" style="height: 10%; border-top:none !important;"><span class="underline font-bold">{{  $returnedBy }}</span><br>
                {{-- <small>AO-IV (Supply Officer)</small> --}}
            </td>
            <td colspan="3" class="text-center" style="height: 10%; border-top:none !important;"><span class="underline font-bold">Adeline C. Soriano</span><br>
                <small>AO-IV (Supply Officer)</small>
            </td>
        </tr>
        @endforeach
    </table>
</body>
</html>
