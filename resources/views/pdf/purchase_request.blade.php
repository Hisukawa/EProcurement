<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Request</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 14px; color: black; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        .underline { text-decoration: underline; }
        .nowrap { white-space: nowrap; }
        .border { border: 1px solid black; }
        .border-s { border-left: 1px solid black; }
        .border-e { border-right: 1px solid black; }
        .border-b { border-bottom: 1px solid black; }
        .border-t { border-top: 1px solid black; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        td, th { padding: 4px; vertical-align: middle; }
        hr { border: none; border-top: 1px solid black; }
    </style>
</head>
<body>
    <div class="text-center font-bold" style="font-size:20px; margin-bottom:12px;">
        PURCHASE REQUEST
    </div>

    <table>
        <tbody>
            {{-- Header Info --}}
            <tr>
                <td colspan="2" class="px-2 py-1 font-semibold">Entity Name:
                    <span class="underline font-normal">SDO City of Ilagan</span>
                </td>
                <td></td>
                <td class="px-2 py-1 font-semibold nowrap">Fund Cluster:</td>
                <td colspan="2" class="px-2 py-1">MOOE - 2025</td>
            </tr>
            <tr>
                <td colspan="2" rowspan="2" class="border px-2 py-1 font-semibold">Office/Section:</td>
                <td colspan="2" class="border py-1 font-semibold">PR No.: <span class="underline">{{ $pr['pr_number'] }}</span></td>
                <td colspan="2" rowspan="2" class="border px-1 py-1 font-semibold">Date: {{ \Carbon\Carbon::parse($pr['created_at'])->format('m/d/Y') }}</td>
            </tr>
            <tr>
                <td colspan="2" class="border px-1 py-1 font-semibold">Resp. Center Code:</td>
            </tr>

            {{-- Item Header --}}
            <tr class="text-center font-semibold">
                <td class="border px-2 py-1">Stock/Property No.</td>
                <td class="border px-2 py-1">Unit</td>
                <td class="border px-2 py-1">Item Description</td>
                <td class="border px-2 py-1">Quantity</td>
                <td class="border px-2 py-1">Unit Cost</td>
                <td class="border px-2 py-1">Total Cost</td>
            </tr>

            {{-- Item Rows --}}
            @forelse($pr['details'] as $detail)
            <tr class="text-center">
                <td class="border-s border-b px-2 py-1"></td>
                <td class="border-s border-b px-2 py-1">{{ $detail['unit'] }}</td>
                <td class="border-s border-b px-2 py-1 text-left">{{ $detail['item'] }}</td>
                <td class="border-s border-b px-2 py-1">{{ $detail['quantity'] }}</td>
                <td class="border-s border-b px-2 py-1">₱{{ number_format($detail['unit_price'], 2) }}</td>
                <td class="border-e border-b px-2 py-1">
                    ₱{{ number_format($detail['unit_price'] * $detail['quantity'], 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="border px-2 py-2 text-center">No items listed.</td>
            </tr>
            @endforelse

            {{-- Extra blank rows --}}
            @for($i=0; $i<4; $i++)
            <tr>
                <td class="border-s px-2 py-2"></td>
                <td class="border-s px-2 py-2"></td>
                <td class="border-s px-2 py-2"></td>
                <td class="border-s px-2 py-2"></td>
                <td class="border-s px-2 py-2"></td>
                <td class="border-e px-2 py-2"></td>
            </tr>
            @endfor

            {{-- Purpose --}}
            <tr>
                <td class="border px-2 py-2 font-semibold text-left">Purpose:</td>
                <td colspan="5" class="border px-2 py-2 text-left">{{ $pr['purpose'] }}</td>
            </tr>

            {{-- Signatures --}}
            <tr class="text-center font-semibold">
                <td class="border px-2 py-1"></td>
                <td class="border px-2 py-1 nowrap">Requested by:</td>
                <td class="border px-2 py-1 nowrap">Recommending Approval:</td>
                <td colspan="3" class="border px-2 py-1 nowrap">Approved by:</td>
            </tr>
            <tr>
                <td class="border-s px-2 py-6">Signature</td>
                <td class="border px-2 py-6"></td>
                <td class="border px-2 py-6"></td>
                <td colspan="3" class="border px-2 py-6"></td>
            </tr>
            <tr>
                <td class="border-s px-2 py-1">Printed Name</td>
                <td class="border px-2 py-1 font-bold text-center nowrap">MARY ANN M. BELTRAN</td>
                <td class="border px-2 py-1 font-bold text-center nowrap">CHERYL R. RAMIRO, PhD, CESO VI</td>
                <td colspan="3" class="border px-2 py-1 font-bold text-center nowrap">EDUARDO C. ESCORPISO JR., EdD, CESO V</td>
            </tr>
            <tr>
                <td class="border-s border-b px-2 py-1">Designation</td>
                <td class="border px-2 py-1 text-center" style="font-size:12px;">Administrative Officer V</td>
                <td class="border px-2 py-1 text-center" style="font-size:12px;">Superintendent</td>
                <td colspan="3" class="border px-2 py-1 text-center" style="font-size:12px;">Schools Division Superintendent</td>
            </tr>

            {{-- Footer Info --}}
            <tr>
                <td rowspan="2" class="border-s px-2 py-0.5 font-semibold">Focal Person:</td>
                <td colspan="2" class="text-center font-semibold py-0.5 pt-4">
                    {{ trim($focal_person->firstname . ' ' . ($focal_person->middlename ?? '') . ' ' . $focal_person->lastname) }}
                </td>
                <td class="px-2 py-0.5"></td>
                <td class="px-2 py-0.5"></td>
                <td class="px-2 py-0.5 border-e"></td>
            </tr>
            <tr>
                <td colspan="2" class="text-center py-0.5"><hr></td>
                <td class="px-2 py-0.5"></td>
                <td colspan="2" class="border px-2 py-0.5 font-semibold nowrap">Certified Allotment Available:</td>
            </tr>
            <tr>
                <td class="border-s px-2 py-0.5"></td>
                <td colspan="2" class="text-center font-semibold py-0.5">{{ $focal_person->position }}</td>
                <td class="px-2 py-0.5"></td>
                <td colspan="2" rowspan="2" class="border px-2 py-0.5"></td>
            </tr>
            <tr>
                <td class="border-s px-2 py-1"></td>
                <td class="px-2 py-1"></td>
                <td class="px-2 py-1 text-right">_______________________</td>
                <td class="px-2 py-1 nowrap">Included in DEDP</td>
            </tr>
            <tr>
                <td class="border-s px-2 py-1">Program Title:</td>
                <td class="px-2 py-1">_______________________</td>
                <td class="px-2 py-1 text-right">_______________________</td>
                <td class="px-2 py-1">With WAFP</td>
                <td colspan="2" class="border px-2 py-1 font-semibold text-center">VLADIMIR B. BICLAR</td>
            </tr>
            <tr>
                <td class="border-s px-2 py-1">Fund Source:</td>
                <td class="px-2 py-1">_______________________</td>
                <td class="px-2 py-1 text-right">_______________________</td>
                <td class="px-2 py-1 nowrap">Included in APP</td>
                <td colspan="2" class="border px-2 py-1 font-semibold text-center">Budget Officer III</td>
            </tr>
            <tr>
                <td class="border-s border-b px-2 py-1">Sub-ARO No.:</td>
                <td class="border-b px-2 py-1">_______________________</td>
                <td class="border-b px-2 py-1 text-right">_______________________</td>
                <td class="border-b px-2 py-1 nowrap">Included in PPMP</td>
                <td class="border-b px-2 py-1"></td>
                <td class="border-e border-b px-2 py-1"></td>
            </tr>
        </tbody>
    </table>
</body>
</html>
