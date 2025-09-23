<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Request</title>
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
    <!-- Title -->
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:30px; margin-top:30px;">
        PURCHASE REQUEST
    </div>

    <!-- Header Info -->
    <table>
        <tr>
            <td colspan="2" class="font-semibold">
                Entity Name: <span class="underline">SDO City of Ilagan</span>
            </td>
            <td class="font-semibold">
                Fund Cluster: <span class="underline">MOOE</span>
            </td>
        </tr>

        <tr class="with-border">
            <td colspan="2">Office/Section: <span class="underline">{{ $focal_person->division->division }}</span></td>
            <td>PR No.: <span class="underline">{{ $pr['pr_number'] }}</span></td>
            <td>Date: {{ \Carbon\Carbon::parse($pr['created_at'])->format('m/d/Y') }}</td>
        </tr>

        <tr class="with-border">
            <td colspan="4">Responsibility Center Code: ____________________</td>
        </tr>
    </table>
    

    <!-- Items Table -->
    <table class="with-border" style="margin-top:8px;">
        <tr class="text-center font-bold">
            <td>Stock/Property No.</td>
            <td>Unit</td>
            <td>Item Description</td>
            <td>Quantity</td>
            <td>Unit Cost</td>
            <td>Total Cost</td>
        </tr>
        @forelse($pr['details'] as $detail)
        <tr class="text-center">
            <td></td>
            <td>{{ $detail['unit'] }}</td>
            <td class="text-left">{{ $detail['item'] . ' ' . $detail['specs'] }}</td>
            <td>{{ number_format($detail['quantity'], 0) }}</td>
            <td>{{ number_format($detail['unit_price'], 2) }}</td>
            <td>{{ number_format($detail['unit_price'] * $detail['quantity'], 2) }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="6" class="text-center">No items listed.</td>
        </tr>
        @endforelse
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>
        <tr>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
            <td style="border-left: 1px solid !important; border-right: 1px solid !important;">&nbsp;</td>
        </tr>

        <!-- Grand Total Row -->
        <tr class="font-bold">
            <td colspan="5" class="text-right"></td>
            <td class="text-center">
                {{ number_format(collect($pr['details'])->sum(function($d) { 
                    return $d['quantity'] * $d['unit_price']; 
                }), 2) }}
            </td>
        </tr>
    </table>


    <!-- Purpose -->
    <div style="margin-top:8px; font-size:11px;">
        <span class="font-bold">Purpose:</span>
        <span style="display:inline-block; border-bottom:1px solid black; width:85%;">
            {{ $pr['purpose'] }}
        </span>
    </div>

    <!-- Signatories -->
    <table class="with-border" style="margin-top:12px;">
        <tr class="font-bold text-center">
            <td></td>
            <td>Requested by:</td>
            <td>Recommending Approval:</td>
            <td>Approved by:</td>
        </tr>
        <tr class="text-center">
            <td style="border-bottom: none !important; height: 3%;">Signature</td>
            <td></td><td></td><td></td>
        </tr>
        <tr class="text-center">
            <td style="border-bottom: none !important; border-top: none !important;">Printed Name</td>
            <td class="font-bold nowrap">{{ trim($focal_person->firstname . ' ' . ($focal_person->middlename ?? '') . ' ' . $focal_person->lastname) }}</td>
            <td class="font-bold nowrap">CHERYL R. RAMIRO, PhD, CESO VI</td>
            <td class="font-bold nowrap">EDUARDO C. ESCORPISO JR., EdD, CESO V</td>
        </tr>
        <tr class="text-center">
            <td style=" border-top: none !important;">Designation</td>
            <td>{{ trim($focal_person->position . ' - ' . ($focal_person->division->division ?? '')) }}</td>
            <td>Asst. Schools Division Superintendent</td>
            <td>Schools Division Superintendent</td>
        </tr>
    </table>

    <!-- Footer Certification -->
<table class="with-border" style="margin-top:12px; width:100%; border-collapse:collapse; font-size:11px;">
    <tr>
        <!-- Focal Person -->
        <td style="width:35%; vertical-align:top; padding:6px;">
            <div><span class="font-semibold">Focal Person/End User:</span></div>
            <div style="text-align:center; font-weight:bold; text-decoration:underline; margin-top:4px;">
                {{ trim($focal_person->firstname . ' ' . ($focal_person->middlename ?? '') . ' ' . $focal_person->lastname) }}
            </div>
            <div style="text-align:center;">{{ $focal_person->position }}</div>
        </td>

        <!-- Date of Implementation -->
        <td style="width:35%; vertical-align:top; padding:6px;">
            <div style="text-align:right;">Date of Implementation: __________</div>
        </td>

        <!-- Certified Allotment -->
        <td rowspan="2" style="width:30%; vertical-align:center; text-align:center; padding:6px;">
            <div class="font-bold">Certified Allotment Available:</div>
            <br><br>
            <div class="font-bold">VLADIMIR B. BICLAR</div>
            <div>Budget Officer III</div>
        </td>
    </tr>

    <!-- Program info row -->
    <tr>
        <td style="padding:6px; vertical-align:top;">
            <div>Program No: __________</div>
            <div>Program Title: __________</div>
            <div>Fund Source: __________</div>
        </td>

        <td style="padding:6px; vertical-align:top;">
            <div>ATC No.: __________</div>
            <div>With WAFP __________</div>
            <div>Included in APP __________</div>
            <div>Included in PPMP __________</div>
        </td>
    </tr>
</table>


</body>
</html>
