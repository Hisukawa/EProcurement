<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Request</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: black; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: bold; } /* Dompdf ignores 600 */
        .underline { text-decoration: underline; }
        .nowrap { white-space: nowrap; }
        .border { border: 1px solid black; }
        .border-s { border-left: 1px solid black; }
        .border-e { border-right: 1px solid black; }
        .border-b { border-bottom: 1px solid black; }
        .border-t { border-top: 1px solid black; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { padding: 4px; vertical-align: middle; border: 1px solid black; }
        hr { border: 0; border-top: 1px solid black; margin: 2px 0; }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:16px; margin-bottom:12px;">
        PURCHASE REQUEST
    </div>

    <table>
        <tbody>
            {{-- Header Info --}}
            <tr>
                <td colspan="2" class="font-semibold">Entity Name:
                    <span class="underline">SDO City of Ilagan</span>
                </td>
                <td></td>
                <td class="font-semibold nowrap">Fund Cluster:</td>
                <td colspan="2">MOOE - 2025</td>
            </tr>
            <tr>
                <td colspan="2" rowspan="2" class="border font-semibold">Office/Section:</td>
                <td colspan="2" class="border font-semibold">PR No.: <span class="underline">{{ $pr['pr_number'] }}</span></td>
                <td colspan="2" rowspan="2" class="border font-semibold">Date: {{ \Carbon\Carbon::parse($pr['created_at'])->format('m/d/Y') }}</td>
            </tr>
            <tr>
                <td colspan="2" class="border font-semibold">Resp. Center Code:</td>
            </tr>

            {{-- Item Header --}}
            <tr class="text-center font-bold">
                <td>Stock/Property No.</td>
                <td>Unit</td>
                <td>Item Description</td>
                <td>Quantity</td>
                <td>Unit Cost</td>
                <td>Total Cost</td>
            </tr>

            {{-- Item Rows --}}
            @forelse($pr['details'] as $detail)
            <tr class="text-center">
                <td></td>
                <td>{{ $detail['unit'] }}</td>
                <td class="text-left">{{ $detail['item'] }}</td>
                <td>{{ $detail['quantity'] }}</td>
                <td>₱{{ number_format($detail['unit_price'], 2) }}</td>
                <td>₱{{ number_format($detail['unit_price'] * $detail['quantity'], 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="text-center">No items listed.</td>
            </tr>
            @endforelse

            {{-- Extra blank rows --}}
            @for($i=0; $i<4; $i++)
            <tr>
                <td colspan="6">&nbsp;</td>
            </tr>
            @endfor

            {{-- Purpose --}}
            <tr>
                <td class="font-semibold text-left">Purpose:</td>
                <td colspan="5" class="text-left">{{ $pr['purpose'] }}</td>
            </tr>

            {{-- Signatures --}}
            <tr class="text-center font-bold">
                <td></td>
                <td>Requested by:</td>
                <td>Recommending Approval:</td>
                <td colspan="3">Approved by:</td>
            </tr>
            <tr>
                <td>Signature</td>
                <td style="height:50px;"></td>
                <td></td>
                <td colspan="3"></td>
            </tr>
            <tr>
                <td>Printed Name</td>
                <td class="font-bold text-center nowrap">MARY ANN M. BELTRAN</td>
                <td class="font-bold text-center nowrap">CHERYL R. RAMIRO, PhD, CESO VI</td>
                <td colspan="3" class="font-bold text-center nowrap">EDUARDO C. ESCORPISO JR., EdD, CESO V</td>
            </tr>
            <tr>
                <td>Designation</td>
                <td class="text-center" style="font-size:11px;">Administrative Officer V</td>
                <td class="text-center" style="font-size:11px;">Superintendent</td>
                <td colspan="3" class="text-center" style="font-size:11px;">Schools Division Superintendent</td>
            </tr>

            {{-- Footer Info --}}
            <tr>
                <td rowspan="2" class="font-semibold">Focal Person:</td>
                <td colspan="2" class="text-center font-semibold">
                    {{ trim($focal_person->firstname . ' ' . ($focal_person->middlename ?? '') . ' ' . $focal_person->lastname) }}
                </td>
                <td></td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td colspan="2" class="text-center"><hr></td>
                <td></td>
                <td colspan="2" class="font-semibold nowrap">Certified Allotment Available:</td>
            </tr>
            <tr>
                <td></td>
                <td colspan="2" class="text-center font-semibold">{{ $focal_person->position }}</td>
                <td></td>
                <td colspan="2" rowspan="2"></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td class="text-right">_______________________</td>
                <td class="nowrap">Included in DEDP</td>
            </tr>
            <tr>
                <td>Program Title:</td>
                <td>_______________________</td>
                <td class="text-right">_______________________</td>
                <td>With WAFP</td>
                <td colspan="2" class="font-semibold text-center">VLADIMIR B. BICLAR</td>
            </tr>
            <tr>
                <td>Fund Source:</td>
                <td>_______________________</td>
                <td class="text-right">_______________________</td>
                <td>Included in APP</td>
                <td colspan="2" class="font-semibold text-center">Budget Officer III</td>
            </tr>
            <tr>
                <td>Sub-ARO No.:</td>
                <td>_______________________</td>
                <td class="text-right">_______________________</td>
                <td>Included in PPMP</td>
                <td colspan="2"></td>
            </tr>
        </tbody>
    </table>
</body>
</html>
