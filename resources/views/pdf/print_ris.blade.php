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

    {{-- Focal person / RIS info --}}
    @php
        $focal = data_get($ris, 'po.details.0.prDetail.purchaseRequest.focal_person', []);
        $focalName = trim(($focal['firstname'] ?? '') . ' ' . ($focal['middlename'] ?? '') . ' ' . ($focal['lastname'] ?? ''));
        $focalDesignation = trim(($focal['position'] ?? '') . (data_get($focal, 'division.division') ? ' - ' . data_get($focal, 'division.division') : ''));
        $focalDivisionMeaning = data_get($focal, 'division.meaning', '');
        $purpose = data_get($ris, 'po.details.0.prDetail.purchaseRequest.purpose', 'Purpose is not specified');

        $issuedByName = trim(
            (data_get($ris, 'issuedBy.firstname') ?? '') . ' ' .
            (data_get($ris, 'issuedBy.middlename') ?? '') . ' ' .
            (data_get($ris, 'issuedBy.lastname') ?? '')
        );
        $issuedByPosition = data_get($ris, 'issuedBy.position', '');

        $requestedByName = trim(
            (data_get($ris, 'requestedBy.firstname') ?? '') . ' ' .
            (data_get($ris, 'requestedBy.middlename') ?? '') . ' ' .
            (data_get($ris, 'requestedBy.lastname') ?? '')
        );
        $requestedByPosition = data_get($ris, 'requestedBy.position', '');

        // Recipient fallback
        $recipientItem = $ris->items->firstWhere('recipient', '!=', null);
        $receivedByName = $recipientItem->recipient ?? '';
        $receivedByPosition = $recipientItem->recipient_division ?? '';
    @endphp

    <table>
        <tr class="with-border">
            <td colspan="4" style="border-bottom:none;">
                Division: <span class="underline font-semibold">{{ $focalDivisionMeaning }}</span>
            </td>
            <td colspan="4" style="border-bottom:none;">
                Responsibility Center Code: <span class="underline font-semibold"></span>
            </td>
        </tr>
        <tr class="with-border">
            <td colspan="4" style="border-top:none;border-bottom:none;">
                Office: <span class="underline font-semibold"></span>
            </td>
            <td colspan="4" style="border-top:none;border-bottom:none;">
                RIS No.: <span class="underline font-semibold">{{ $ris->ris_number ?? '' }}</span>
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

@foreach($ris->items as $issued)
    @php
        $inventoryItem = $issued->inventoryItem;

        // Use inventory fields directly
        $unit = optional($inventoryItem->unit)->unit ?? ''; // unit from tbl_units
        $description = $inventoryItem->item_desc ?? '';
        $quantityRequested = $inventoryItem->total_stock ?? 0;
        $quantityIssued = $issued->quantity ?? 0;
        $remarks = $issued->remarks ?? '';
        $stockNumber = $inventoryItem->id ?? ''; // or use a stock_number field if exists
    @endphp

    <tr class="with-border text-center">
        <td>{{ $stockNumber }}</td>
        <td>{{ $unit }}</td>
        <td class="text-left" style="padding-left:8px;">{{ $description }}</td>
        <td>{{ $quantityRequested }}</td>
        <td></td>
        <td></td>
        <td>{{ $quantityIssued }}</td>
        <td>{{ $remarks }}</td>
    </tr>
@endforeach



        @for($i=0;$i<8;$i++)
            <tr class="with-border"><td colspan="8">&nbsp;</td></tr>
        @endfor

        <tr class="with-border">
            <td colspan="8" style="font-size:14px;">
                Purpose: <span style="font-size:12px;">{{ $purpose }}</span>
            </td>
        </tr>
    </table>

    {{-- Signatures --}}
    <table class="with-border" style="width:100%; font-size:11px; text-align:center; margin-top:10px;">
        <tr class="font-bold text-left">
            <td style="width:13%;border:none;"></td>
            <td style="width:19%;border:none;">Requested by:</td>
            <td style="width:22%;border:none;">Approved by:</td>
            <td style="width:23%;border:none;">Issued by:</td>
            <td style="width:23%;border:none;">Received by:</td>
        </tr>
        <tr class="text-left">
            <td style="border:none;">Signature:</td>
            <td style="border:none;"></td>
            <td style="border:none;"></td>
            <td style="border:none;"></td>
            <td style="border:none;"></td>
        </tr>
        <tr>
            <td class="text-left text-nowrap">Printed Name :</td>
            <td class="font-bold">{{ $receivedByName }}</td>
            <td class="font-bold">Adeline C. Soriano</td>
            <td class="font-bold">{{ $issuedByName }}</td>
            <td class="font-bold">{{ $receivedByName }}</td>
        </tr>
        <tr>
            <td class="text-left">Designation :</td>
            <td></td>
            <td>AO - IV (Supply Officer)</td>
            <td>{{ $issuedByPosition }}</td>
            <td></td>
        </tr>
        <tr>
            <td class="text-left">Date :</td>
            <td>{{ optional($ris->created_at)->format('Y-m-d') ?? '' }}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>

</body>
</html>
