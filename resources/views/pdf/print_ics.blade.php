<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inventory Custodian Slip</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 20px;
            color: black;
            border: 1px solid;
            padding: 10px;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        td, th { padding: 4px; vertical-align: middle; }
        .with-border td, .with-border th { border: 1px solid black; }

        /* signature styles */
        .sig-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
        }
        .sig-cell {
            width: 50%;
            vertical-align: top;
            text-align: center;
            padding: 8px;
            font-size: 11px;
            border: 1px solid black;
        }

        .signature-line {
            display: block;
            border-bottom: 1px solid black;
            margin: 8px 18px;
            background-color: #fff; /* white space for signature */
        }
        .sig-name { font-weight: bold; margin-top: 20px; word-break: break-word; }
        .sig-designation { margin-top: 4px; font-size: 11px; word-break: break-word; }

        /* highlight receiver fields */
        .receiver-highlight {
            background-color: #fce4ec; /* light pink */
            width: 100%;
            display: inline-block;
            padding: 6px 8px;
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:30px; margin-top:30px;">
        INVENTORY CUSTODIAN SLIP
    </div>

    <table>
        <tr>
            <td class="text-left">Entity Name: <span class="underline font-bold">SDO CITY OF ILAGAN</span></td>
            <td></td>
        </tr>
        <tr>
            <td class="text-left">Fund Cluster: ________________________</td>
            <td class="text-right">ICS No: <span class="underline font-bold">{{ $ics->ics_number ?? '' }}</span></td>
        </tr>
    </table>

    <table class="with-border">
        <thead>
            <tr>
                <th rowspan="2">Quantity</th>
                <th rowspan="2">Unit</th>
                <th colspan="2">Amount</th>
                <th rowspan="2">Description</th>
                <th rowspan="2">Inventory Item No.</th>
                <th rowspan="2">Estimated Useful Life</th>
            </tr>
            <tr>
                <th>Unit Cost</th>
                <th>Total Cost</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ics->po->details as $detail)
                @php
                    $issued = $ics->items->first(function ($item) use ($detail) {
                        return optional($item->inventoryItem)->po_detail_id == $detail->id;
                    });
                @endphp
            <tr class="text-center">
                <td>{{ (int) ($issued->quantity ?? 0) }}</td>
                <td>{{ $detail->prDetail->product->unit->unit ?? '' }}</td>
                <td>{{ number_format($issued->unit_cost, 2) }}</td>
                <td>{{ number_format($issued->total_cost, 2) }}</td>
                <td class="text-left" style="padding-left:8px;">
                    {{ $detail->prDetail->product->name ?? '' }}
                    {{ $detail->prDetail->product->specs ?? '' }}
                </td>
                <td></td>
                <td></td>
            </tr>
            @endforeach
            @for($i = 0; $i < 6; $i++)
                <tr class="with-border">
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
            @endfor
        </tbody>
    </table>

    <table class="sig-table" style="margin-top:none !important">
        @php
            $focal = optional($ics->po->details->first()->prDetail->purchaseRequest->focal_person);
            $focalName = trim(($focal->firstname ?? '') . ' ' . ($focal->middlename ?? '') . ' ' . ($focal->lastname ?? ''));
            $focalDesignation = trim(($focal->position ?? '') . ($focal->division ? ' - ' . $focal->division->division : ''));

            $issuedByName = trim(($ics->receivedFrom->firstname ?? '') . ' ' . ($ics->receivedFrom->middlename ?? '') . ' ' . ($ics->receivedFrom->lastname ?? ''));
            $issuedByPosition = $ics->receivedFrom->position ?? '';

            $receivedByName = trim(($ics->receivedBy->firstname ?? '') . ' ' . ($ics->receivedBy->middlename ?? '') . ' ' . ($ics->receivedBy->lastname ?? ''));
            $receivedByPosition = $ics->receivedBy->position ?? '';
        @endphp
        <tr class="with-border">
            <td class="sig-cell" style="border-top:none !important">
                <div class="text-left" style="font-size:13px;">Received from:</div>
                <div class="sig-name" style="font-size:13px; margin-top: 20px !important;">{{ $issuedByName ?? '_________________' }}</div>
                <div class="signature-line"></div>
                <p style="font-size:10px; font-style: italic;">Signature Over Printed Name</p>
                <div class="sig-designation" style="font-size: 12px">{{ $issuedByPosition ?? 'AO - IV (Supply Officer)' }}</div>
                <div class="signature-line"></div>
                <div style="font-style: italic">Position/Office</div>
                <div class="receiver-highlight py-10">&nbsp;</div>
                <div class="signature-line"></div>
                <div>Date</div>
            </td>
            <td class="sig-cell" style="border-top:none !important">
                <div class="text-left" style="font-size:13px;">Received by:</div>
                <div class="sig-name receiver-highlight" style="font-size:13px; margin-top: 20px !important;">{{ $focalName ?? '_________________' }}</div>
                <div class="signature-line"></div>
                <p style="font-size:10px; font-style:italic;">Signature Over Printed Name</p>
                <div class="sig-designation receiver-highlight">{{ $focalDesignation ?? 'Administrative Assistant' }}</div>
                <div class="signature-line"></div>
                <div style="font-style: italic">Position/Office</div>
                <div class="py-10">&nbsp;</div>
                <div class="signature-line"></div>
                <div>Date</div>
            </td>
        </tr>
    </table>
</body>
</html>
