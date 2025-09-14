<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Abstract of Quotation - Item</title>
    <style>
        body { font-family: "Times New Roman", serif; font-size: 13px; line-height: 1.3; color: #000; margin: 40px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; text-align: center; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 4px 6px; }
        .footer-table { width: 100%; font-size: 11px; color: #555; margin-top: 50px; border: none; }
        .footer-table td { border: none; }
    </style>
</head>
<body>
    <div class="center">
        <img src="file://{{ public_path('deped1.png') }}" alt="DepEd Logo" style="width:70px; height:auto; margin-bottom:10px;">
        <h2 class="uppercase bold" style="font-size:14px;">Republic of the Philippines</h2>
        <h3 class="uppercase bold" style="font-size:13px;">Department of Education</h3>
        <p class="uppercase bold" style="font-size:12px;">
            REGION II – CAGAYAN VALLEY<br>
            SCHOOLS DIVISION OFFICE OF THE CITY OF ILAGAN
        </p>
        <h3 class="uppercase bold" style="margin-top:15px; font-size:13px;">ABSTRACT OF QUOTATIONS</h3>
        <p class="italic" style="font-size:12px;">(As Calculated Bid Price)</p>
    </div>

    <div style="font-size:12px; margin:15px 0;">
        <p><strong>Lot No.:</strong> _____________</p>
        <p><strong>Date of Opening:</strong> _____________</p>
        <p><strong>Venue:</strong> _____________</p>
    </div>

    <table>
        <thead style="background:#f2f2f2;">
            <tr>
                <th style="width:8%;">No.</th>
                <th>Name of Contractor / Offeror</th>
                <th>Total Quotations</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotes as $idx => $detail)
                <tr @if($detail->is_winner) style="background:#d9f7d9;" @endif>
                    <td>{{ $idx+1 }}</td>
                    <td>{{ $detail->supplier->company_name }}</td>
                    <td>₱{{ number_format($detail->quoted_price, 2) }}</td>
                    <td>{{ $detail->is_winner ? 'Winner' : '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @php
        $awarded = collect($quotes)->firstWhere('is_winner', 1);
    @endphp

    <p>
        Awarded to:
        <span style="text-decoration:underline; font-weight:bold;">
            {{ $awarded['supplier']['company_name'] ?? '__________' }}
        </span>
        @if(isset($awarded['remarks']) && !empty($awarded['remarks']))
            offering the <em>{{ $awarded['remarks'] }}</em>.
        @endif
    </p>

    <div style="margin-top:40px; font-size:12px;">
        <p><strong>Prepared by:</strong></p>
        <p style="margin-top:20px; text-decoration:underline;">BAC Secretariat - Member</p>
    </div>

    <div style="margin-top:60px; font-size:12px;">
        <p class="bold center" style="margin-bottom:15px;">BIDS AND AWARDS COMMITTEE</p>
        <table style="border:none; text-align:center; margin:0 auto;">
            <tr>
                <td style="border:none; width:33%;">BAC Member</td>
                <td style="border:none; width:33%;">BAC Member</td>
                <td style="border:none; width:33%;">BAC Member</td>
            </tr>
            <tr>
                <td style="border:none;"></td>
                <td style="border:none;">Vice Chairperson</td>
                <td style="border:none;"></td>
            </tr>
            <tr>
                <td colspan="3" style="border:none; padding-top:40px;">BAC Chairperson</td>
            </tr>
        </table>
    </div>

    <table class="footer-table">
        <tr>
            <td>ASDS-QF-003</td>
            <td style="text-align:right;">Rev:00</td>
        </tr>
    </table>
</body>
</html>
