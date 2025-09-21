<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Abstract of Quotation - Full PR</title>
    <style>
        body { font-family: "Times New Roman", serif; font-size: 13px; line-height: 1.3; color: #000; margin: 40px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; text-align: center; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 4px 6px; }
        .footer-table { width: 100%; font-size: 11px; margin-top: 50px; border: none; }
        .footer-table td { border: none; }
    </style>
</head>
<body>
    <div class="center">
        <img src="file://{{ public_path('deped1.png') }}" alt="DepEd Logo" style="width:70px; height:auto; margin-bottom:10px;">
        <h2 class="uppercase bold" style="font-size:14px;">Republic of the Philippines</h2>
        <h3 class="uppercase bold" style="font-size:13px;">Department of Education</h3>
<p class="uppercase bold" style="font-size:12px; margin-bottom:0;">
    REGION II – CAGAYAN VALLEY
</p>
<p class="uppercase bold" style="font-size:12px; border-bottom: 1px solid #000; padding-bottom:4px; margin:0; width:100%;">
    SCHOOLS DIVISION OFFICE OF THE CITY OF ILAGAN
</p>


        <h3 class="uppercase bold" style="margin-top:15px; font-size:13px;">ABSTRACT OF QUOTATIONS</h3>
        <p style="font-size:14px;">(As Calculated Bid Price – Entire PR)</p>
    </div>

    <div style="font-size:12px; margin:15px 0;">
        <p><strong>Lot No.:</strong> _____________</p>
        <p><strong>Date of Opening:</strong> _____________</p>
        <p><strong>Venue:</strong> _____________</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:8%;">No.</th>
                <th>Name of Contractor / Offeror</th>
                <th>Total Quotation</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($suppliers as $idx => $detail)
                <tr>
                    <td>{{ $idx+1 }}</td>
                    <td>{{ $detail['supplier']->company_name }}</td>
                    <td>{{ number_format($detail['total_amount'], 2) }}</td>
                    <td>{{ $detail['is_winner'] ? 'Winner' : '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @php
        $awarded = collect($suppliers)->firstWhere('is_winner', 1);
    @endphp

    <p>
        Awarded to
        <span style="text-decoration:underline; font-weight:bold;">
            {{ $awarded['supplier']->company_name ?? '__________' }}
        </span>
        @if(isset($awarded['remarks']) && !empty($awarded['remarks']))
            <em>{{ $awarded['remarks'] }}</em>.
        @endif
    </p>
    @php
        $secretariat = $committee->members->firstWhere('position', 'secretariat');
    @endphp
    <div style="margin-top:40px; font-size:12px;">
        <p><strong>Prepared by:</strong></p>
        <p style="margin-top:20px;">BAC Secretariat - {{ strtoupper(optional($secretariat)->name ?? '__________________') }}</p>
    </div>

<div style="margin-top:20px; font-size:12px;">
    <p class="bold center" style="margin-bottom:15px;">BIDS AND AWARDS COMMITTEE</p>
    <table style="border:none; width:100%; text-align:center; margin:0 auto;">
        <tr>
            @php
                $vice = $committee->members->firstWhere('position', 'vice_chair');
                $chair = $committee->members->firstWhere('position', 'chair');
                $members = $committee->members->filter(fn($m) => str_starts_with($m->position, 'member'));
            @endphp

            <td style="border:none; width:33%;">
                <span style="display:inline-block; text-decoration:underline; min-width:150px;">
                    {{ strtoupper(optional($members->shift())->name ?? '__________________') }}
                </span><br>
                BAC Member
            </td>
            <td style="border:none; width:33%;">
                <span style="display:inline-block; text-decoration:underline; min-width:150px;">
                    {{ strtoupper(optional($vice)->name ?? '__________________') }}
                </span><br>
                Vice Chairperson
            </td>
            <td style="border:none; width:33%;">
                <span style="display:inline-block; text-decoration:underline; min-width:150px;">
                    {{ strtoupper(optional($members->shift())->name ?? '__________________') }}
                </span><br>
                BAC Member
            </td>
        </tr>

        <tr>
            <td colspan="3" style="border:none; padding-top:20px;">
                <span style="display:inline-block; text-decoration:underline; min-width:200px;">
                    {{ strtoupper(optional($chair)->name ?? '__________________') }}
                </span><br>
                BAC Chairperson
            </td>
        </tr>
    </table>
</div>



    <table class="footer-table" style="width:100%; margin-top:40px; font-size:11px; border:none;">
        <tr>
            <!-- Left logos -->
            <td style="width:40%; text-align:left; border:none;">
                <img src="file://{{ public_path('deped-matatag.png') }}" alt="DepEd Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('bagong-pilipinas.png') }}" alt="Philippines Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('ilagan.png') }}" alt="Ilagan Logo" style="height:70px;">
                <div>ASDS-QF-003</div>
            </td>

            <!-- Office info -->
            <td style="width:60%; text-align:right; border:none; line-height:1.3;">
                <div><strong>INHS Compound, Claravall St., San Vicente, City of Ilagan, Isabela</strong></div>
                <div>Telephone Nos: (078) 624-0077</div>
                <div>
                    <span style="margin-right:10px;">www.facebook.com/sdoilagan</span> 
                    <span style="margin-right:10px;">ilagan@deped.gov.ph</span> 
                    <span>www.sdoilagan.gov.ph</span>
                </div>
                <div style="margin-top:5px;">Rev:00</div>
            </td>
        </tr>
    </table>

</body>
</html>
