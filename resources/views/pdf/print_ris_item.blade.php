<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Requisition and Inventory Slip</title>
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
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { padding: 4px; vertical-align: middle; }
        .with-border td, .with-border th { border: 1px solid black; }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin:30px 0;">
        Requisition and Inventory Slip
    </div>

    {{-- Top Info --}}
    <table>
        <tr>
            <td colspan="4" class="font-semibold">
                Entity Name: <span class="underline">Division of the City of Ilagan</span>
            </td>
            <td colspan="4" class="font-semibold">
                Fund Cluster: <span class="underline">_____________</span>
            </td>
        </tr>
    </table>

    @foreach($ris->items as $issued)
        @php
            $detail = $issued->inventoryItem->poDetail ?? null;
            $product = optional($detail->prDetail)->product;
            $unit = optional($product->unit)->unit ?? '';

            // Item-specific recipient (falls back to requestedBy)
            $recipient = optional($issued->receivedBy);
            $receivedByName = trim(($recipient->firstname ?? '') . ' ' . ($recipient->middlename ?? '') . ' ' . ($recipient->lastname ?? ''));
            $receivedByPosition = $recipient->position ?? ($ris->requestedBy->position ?? '');
            
            $focal = optional($ris->po->details->first()->prDetail->purchaseRequest->focal_person);
            $focalName = trim(($focal->firstname ?? '') . ' ' . ($focal->middlename ?? '') . ' ' . ($focal->lastname ?? ''));
            $focalDesignation = trim(($focal->position ?? '') . ($focal->division ? ' - ' . $focal->division->division : ''));
            $issuedByName = trim(($ris->issuedBy->firstname ?? '') . ' ' . ($ris->issuedBy->middlename ?? '') . ' ' . ($ris->issuedBy->lastname ?? ''));
        @endphp

        {{-- Item Table --}}
        <table>
            <tr class="with-border">
                <td colspan="4">
                    Division : <span class="underline font-semibold">{{ $focal->division->division ?? '' }}</span>
                </td>
                <td colspan="4">
                    RIS No. : <span class="underline font-semibold">{{ $ris->ris_number }}</span>
                </td>
            </tr>
            <tr class="with-border text-center font-semibold" style="font-size:14px;">
                <td colspan="4">Requisition</td>
                <td colspan="4">Issuance</td>
            </tr>
            <tr class="with-border text-center font-bold">
                <td style="width:8%;">Stock No.</td>
                <td style="width:10%;">Unit</td>
                <td style="width:32%;">Description</td>
                <td style="width:10%;">Quantity Requested</td>
                <td style="width:6%;">Yes</td>
                <td style="width:6%;">No</td>
                <td style="width:10%;">Quantity Issued</td>
                <td style="width:18%;">Remarks</td>
            </tr>
            <tr class="with-border text-center">
                <td></td>
                <td>{{ $unit }}</td>
                <td class="text-left" style="padding-left:8px;">{{ $product->name ?? '' }} {{ $product->specs ?? '' }}</td>
                <td>{{ optional($detail->prDetail)->quantity ?? 0 }}</td>
                <td></td>
                <td></td>
                <td>{{ $issued->quantity ?? 0 }}</td>
                <td></td>
            </tr>

            {{-- Signature for this item --}}
            <tr class="with-border" style="text-align:center; font-size:11px;">
                <td colspan="1"></td>
                <td>Requested by:<br><b>{{ $focalName }}</b><br>{{ $focalDesignation }}</td>
                <td>Approved by:<br><b>Adeline C. Soriano</b><br>AO - IV (Supply Officer)</td>
                <td>Issued by:<br><b>{{ $issuedByName }}</b><br>{{ $ris->issuedBy->position ?? '' }}</td>
                <td>Received by:<br><b>{{ $receivedByName }}</b><br>{{ $receivedByPosition }}</td>
            </tr>
        </table>
        <br><br>
    @endforeach
</body>
</html>
