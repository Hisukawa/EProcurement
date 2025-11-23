<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Property Acknowledgement Receipt</title>
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
            padding: 2px 4px;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:30px; margin-top:30px;">
        Property Acknowledgement Receipt
    </div>

    <table>
        <tr>
            <td class="text-left">Entity Name: <span class="underline font-bold">SDO CITY OF ILAGAN</span></td>
            <td></td>
        </tr>
        <tr>
            <td class="text-left">Fund Cluster: ________________________</td>
            <td class="text-right">PAR No: <span class="underline font-bold">{{ $par->par_number ?? '' }}</span></td>
        </tr>
    </table>

    <table class="with-border">
        <thead>
            <tr>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Property Number.</th>
                <th>Date Acquired</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($par->items as $issued)
                @php
                    $detail = $issued->inventoryItem->poDetail ?? null;
                    $product = optional($detail->prDetail)->product;
                    $unit = optional($product->unit)->unit ?? '';
                    $quantity = $issued->quantity ?? 0;
                    $propertyNo = $issued->inventory_item_number ?? '';
                    $totalCost = $issued->total_cost ?? 0;
                @endphp
            <tr class="text-center">
                <td>{{ (int) $quantity }}</td>
                <td>{{ $unit }}</td>
                <td class="text-left" style="padding-left:8px;">
                    {{ $product->name ?? '' }} {{ $product->specs ?? '' }}
                </td>
                <td>{{ $propertyNo }}</td>
                <td>{{ $par->created_at->format('y-m-d') }}</td>
                <td>{{ number_format($totalCost, 2) }}</td>
            </tr>
            @endforeach

            @for($i = 0; $i < 6; $i++)
            <tr class="with-border">
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td>
            </tr>
            @endfor

        </tbody>
    </table>

    <table class="sig-table" style="margin-top:none !important">
         @php
        $focal = optional($par->po->details->first()->prDetail->purchaseRequest->focal_person);
        $focalName = trim(($focal->firstname ?? '') . ' ' . ($focal->middlename ?? '') . ' ' . ($focal->lastname ?? ''));
        $focalDesignation = trim(($focal->position ?? '') . ($focal->division ? ' - ' . $focal->division->division : ''));

        $issuedByName = trim(($par->issuedBy->firstname ?? '') . ' ' . ($par->issuedBy->middlename ?? '') . ' ' . ($par->issuedBy->lastname ?? ''));
        $issuedByPosition = $par->issuedBy->position ?? '';
    @endphp
    @php
        // Try to find a recipient name from items (if any has recipient)
        $recipientItem = $par->items->firstWhere('recipient', '!=', null);

        if ($recipientItem && $recipientItem->recipient) {
            // Use recipient from the item if available
            $receivedByName = $recipientItem->recipient;
            $receivedByPosition = $recipientItem->recipient_division ?? '';
        } else {
            // Otherwise, fallback to the requested_by user
            $receivedByName = trim(($par->requestedBy->firstname ?? '') . ' ' . ($par->requestedBy->middlename ?? '') . ' ' . ($par->requestedBy->lastname ?? ''));
            $receivedByPosition = $par->requestedBy->position ?? '';
        }
    @endphp
        <tr class="with-border">
            <td class="sig-cell" style="border-top:none !important">
                <div class="text-left" style="font-size:13px;">Received By:</div>
                <div class="sig-name" style="font-size:13px; margin-top: 20px !important;">{{ $receivedByName }}</div>
                <div class="signature-line"></div>
                <p style="font-size:10px">Signature Over Printed Name by End User</p>
                <div class="sig-designation" style="font-size:13px;">{{ $receivedByPosition ?? 'Administrative Assistant' }}</div>
                <div class="signature-line"></div>
                <div>Position/Office</div>
                <div style="min-height: 36px;line-height: 18px;" class="signature-line"></div>
                <div>Date</div>
            </td>
            <td class="sig-cell" style="border-top:none !important">
                <div class="text-left" style="font-size:13px;">Issued by:</div>
                <div class="sig-name" style="font-size:13px; margin-top: 20px !important;">{{ $issuedByName ?? '_________________' }}</div>
                <div class="signature-line"></div>
                <p style="font-size:10px">Signature Over Printed Name and/or Property Custodian</p>
                <div class="sig-designation" style="font-size:13px;">{{ $issuedByPosition ?? 'AO - IV (Supply Officer)' }}</div>
                <div class="signature-line"></div>
                <div>Position/Office</div>
                <div style="min-height: 36px;line-height: 18px;" class="signature-line"></div>
                <div>Date</div>
            </td>
        </tr>
    </table>
</body>
</html>
