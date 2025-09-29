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
        /* remove nowrap for signature names to allow wrapping */
        .nowrap { /* intentionally left blank or remove usage */ }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { padding: 4px; vertical-align: middle; }
        .with-border td, .with-border th { border: 1px solid black; }

        /* signature styles */
        .sig-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .sig-cell {
            width: 25%;
            vertical-align: top;
            text-align: center;
            padding: 8px;
            font-size: 11px;
        }
        .sig-label { font-weight: bold; margin-bottom: 6px; display:block; }
        .signature-line {
            display: block;
            border-bottom: 1px solid black;
            margin: 8px 18px;
            min-height: 36px;        /* space for signature */
            line-height: 18px;
        }
        .sig-name { font-weight: bold; margin-top: 6px; word-break: break-word; }
        .sig-designation { margin-top: 4px; font-size: 11px; color: #000; word-break: break-word; }
        /* Smaller font if name is very long */
        .sig-name.small { font-size: 11px; }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:30px; margin-top:30px;">
        Requisition and Inventory Slip
    </div>

    <!-- top info, items table etc (kept as you had it) -->
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

    <table>
        @php
            $focal = optional($ris->po->details->first()->prDetail->purchaseRequest->focal_person);
            $focalName = trim(($focal->firstname ?? '') . ' ' . ($focal->middlename ?? '') . ' ' . ($focal->lastname ?? ''));
            $focalDesignation = trim(($focal->position ?? '') . ($focal->division ? ' - ' . $focal->division->division : ''));
        @endphp
        
        <tr class="with-border">
            <td style="border-bottom: none !important;" colspan="4">
                Division : <span class="underline font-semibold">{{ trim(($focal->division->meaning ?? '')) }}</span>
            </td>
            <td style="border-bottom: none !important;" colspan="4" class="">
                Responsibility Center Code : <span class="underline font-semibold"></span>
            </td>
        </tr>
        <tr class="with-border">
            <td style="border-bottom: none !important;border-top:none !important" colspan="4">
                Office : <span class="underline font-semibold"></span>
            </td>
            <td style="border-bottom: none !important;border-top:none !important" colspan="4" class="">
                RIS No. : <span class="underline font-semibold">{{ $ris->ris_number ?? '' }}</span>
            </td>
        </tr>

        <tr class="with-border">
            <td colspan="4" class="text-center font-semibold" style="font-size: 14px">
                Requisition
            </td>
            <td colspan="4" class="text-center font-semibold" style="font-size: 14px">
                Issuance
            </td>
        </tr>

        <tr class="text-center font-bold with-border">
            <td style="width: 8%;">Stock No.</td>
            <td style="width: 10%;">Unit</td>
            <td style="width: 32%;">Description</td>
            <td style="width: 10%;">Quantity Requested</td>
            <td style="width: 6%;">Yes</td>
            <td style="width: 6%;">No</td>
            <td style="width: 10%;">Quantity Issued</td>
            <td style="width: 18%;">Remarks</td>
        </tr>

        @foreach($ris->items as $issued)
            @php
                $detail = $issued->inventoryItem->poDetail ?? null;
                $product = optional($detail->prDetail)->product;
                $unit = optional($product)->unit->unit ?? '';
            @endphp
            <tr class="text-center with-border">
                <td></td>
                <td>{{ $unit }}</td>
                <td class="text-left" style="padding-left:8px;">
                    {{ $product->name ?? '' }} {{ $product->specs ?? '' }}
                </td>
                <td>{{ optional($detail->prDetail)->quantity ?? 0 }}</td>
                <td></td>
                <td></td>
                <td>{{ $issued->quantity ?? 0 }}</td>
                <td></td>
            </tr>
        @endforeach


        <!-- some reserved rows (kept) -->
        @for($i = 0; $i < 8; $i++)
            <tr class="with-border">
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
            </tr>
        @endfor

        <tr class="with-border">
            <td colspan="8" style="font-size: 14px">
                Purpose:
                <span style="font-size: 12px !important">
                    {{ optional($ris->po->details->first()->prDetail->purchaseRequest)->purpose ?? 'Purpose is not specified' }}
                </span>
            </td>
        </tr>
    </table>

    {{-- prepare focal / issued names safely --}}
    @php
        $focal = optional($ris->po->details->first()->prDetail->purchaseRequest->focal_person);
        $focalName = trim(($focal->firstname ?? '') . ' ' . ($focal->middlename ?? '') . ' ' . ($focal->lastname ?? ''));
        $focalDesignation = trim(($focal->position ?? '') . ($focal->division ? ' - ' . $focal->division->division : ''));

        $issuedByName = trim(($ris->issuedBy->firstname ?? '') . ' ' . ($ris->issuedBy->middlename ?? '') . ' ' . ($ris->issuedBy->lastname ?? ''));
        $issuedByPosition = $ris->issuedBy->position ?? '';

        $receivedByName = trim(($ris->requestedBy->firstname ?? '') . ' ' . ($ris->requestedBy->middlename ?? '') . ' ' . ($ris->requestedBy->lastname ?? ''));
        $receivedByPosition = $ris->requestedBy->position ?? '';
    @endphp
    <table class="with-border" style="width:100%; border-collapse:collapse;font-size:11px; text-align:center;">
    <tr class="font-bold">
        <td style="width: 13%;border-bottom:none !important;border-top:none !important" class="text-left"></td>
        <td style="width: 19%;border-bottom:none !important;border-top:none !important" class="text-left">Requested by:</td>
        <td style="width: 22%;border-bottom:none !important;border-top:none !important" class="text-left">Approved by:</td>
        <td style="width: 23%;border-bottom:none !important;border-top:none !important" class="text-left">Issued by:</td>
        <td style="width: 23%;border-bottom:none !important;border-top:none !important" class="text-left">Received by:</td>
    </tr>
    <tr class="text-left">
        <td style="border-top:none !important">Signature:</td>
        <td style="border-top:none !important"></td>
        <td style="border-top:none !important"></td>
        <td style="border-top:none !important"></td>
        <td style="border-top:none !important"></td>
    </tr>
    <tr>
        <td class="text-left text-nowrap">Printed Name :</td>
        <td class="font-bold">
            {{ trim(($focal->firstname ?? '').' '.($focal->middlename ?? '').' '.($focal->lastname ?? '')) }}
        </td>
        <td class="font-bold">Adeline C. Soriano</td>
        <td class="font-bold">
            {{ trim(($ris->issuedBy->firstname ?? '').' '.($ris->issuedBy->middlename ?? '').' '.($ris->issuedBy->lastname ?? '')) }}
        </td>
        <td class="font-bold">
            {{ trim(($ris->requestedBy->firstname ?? '').' '.($ris->requestedBy->middlename ?? '').' '.($ris->requestedBy->lastname ?? '')) }}
        </td>
    </tr>
    <tr>
        <td class="text-left">Designation :</td>
        <td>
            {{ trim(($focal->position ?? '').($focal->division ? ' - '.$focal->division->division : '')) }}
        </td>
        <td>AO - IV (Supply Officer)</td>
        <td>{{ $ris->issuedBy->position ?? '' }}</td>
        <td>{{ $ris->requestedBy->position ?? '' }}</td>
    </tr>
    <tr>
        <td class="text-left">Date :</td>
        <td class="text-left">{{ $ris->created_at->format('y-m-d') }}</td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>


</body>
</html>
