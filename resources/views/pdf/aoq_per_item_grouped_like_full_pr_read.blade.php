<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Abstract of Quotation - Per-Item Winners</title>
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
        .left { text-align: left; }
        .right { text-align: right; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>

@foreach($groups as $pageIndex => $detail)
    {{-- ======= HEADER (unchanged visual) ======= --}}
    <div class="center">
        <img src="file://{{ public_path('deped1.png') }}" alt="DepEd Logo" style="width:70px; height:auto; margin-bottom:10px;">
        <h2 class="uppercase bold" style="font-size:14px;">Republic of the Philippines</h2>
        <h3 class="uppercase bold" style="font-size:13px;">Department of Education</h3>
        <p class="uppercase bold" style="font-size:12px; margin-bottom:0;">REGION II – CAGAYAN VALLEY</p>
        <p class="uppercase bold" style="font-size:12px; border-bottom: 1px solid #000; padding-bottom:4px; margin:0; width:100%;">
            SCHOOLS DIVISION OFFICE OF THE CITY OF ILAGAN
        </p>
        <h3 class="uppercase bold" style="margin-top:15px; font-size:13px;">ABSTRACT OF QUOTATIONS</h3>
        <p style="font-size:14px;">(AS READ)</p>
    </div>

    {{-- ======= PROJECT META ======= --}}
    <div style="font-size:12px; margin:15px 0;">
        <p class="left"><strong>Project No.:</strong> {{ $rfq['project_no'] }}</p>
        <p class="left"><strong>Date of Opening:</strong> {{ $rfq['date_of_opening'] }}</p>
        <p class="left"><strong>Venue:</strong> {{ $rfq['venue'] }}</p>
    </div>

    {{-- ======= SUMMARY TABLE: render all suppliers who quoted the group's items ======= --}}
@php
    // Get suppliers for this detail
    $suppliers = collect($detail['suppliers'] ?? [])
        // Sort by: winner first, then by total quotation ascending
        ->sortBy(function ($row) {
            return [
                $row['is_winner'] ? 0 : 1, // winner first
                $row['total_amount'] ?? INF // then by lowest total
            ];
        })
        ->values()
        ->all();
@endphp

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
        @foreach($suppliers as $idx => $row)
            <tr @if($row['is_winner']) @endif>
                <td>{{ $idx + 1 }}</td>
                <td class="left">
                    {{ $row['supplier']->company_name }}
                </td>
                <td class="right">{{ number_format($row['total_amount'], 2) }}</td>
                <td class="left">{{ $row['remarks_as_read'] ?? '' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

    {{-- ======= AWARD LINE: highlight awarded supplier for this page ======= --}}
    @php
        $awarded = collect($suppliers)->firstWhere('is_winner', 1) ?? collect($suppliers)->firstWhere('supplier.id', $detail['winner_supplier_id']) ?? null;
    @endphp

    @php
        $awarded_company = data_get($awarded, 'supplier.company_name', null);
        $awarded_remarks = data_get($awarded, 'remarks_as_read', '');
    @endphp

    <p>
        Awarded to
        <span style="text-decoration:underline; font-weight:bold;">
            {{ strtoupper($awarded_company ?? '__________') }}
        </span>
        @if(!empty($awarded_remarks))
            by offering the <em>{{ $awarded_remarks }}</em>.
        @endif
    </p>

    {{-- ======= PREPARED BY / BAC (unchanged layout) ======= --}}
    @php
        $secretariat = optional($committee)->members->firstWhere('position', 'secretariat');
        $vice        = optional($committee)->members->firstWhere('position', 'vice_chair');
        $chair       = optional($committee)->members->firstWhere('position', 'chair');
        $members     = optional($committee)->members?->filter(fn($m) => str_starts_with($m->position, 'member')) ?? collect();
        $m1          = $members->shift();
        $m2          = $members->shift();
    @endphp

    <div style="margin-top:40px; font-size:12px;">
        <p><strong>Prepared by:</strong></p>
        <span style="display:inline-block; text-decoration:underline; min-width:150px; margin-left: 80px;">
            {{ strtoupper(optional($secretariat)->name ?? '__________________') }}
        </span><br>
        <p style="margin-left:50px;">BAC Secretariat - Member</p>
    </div>

    <div style="margin-top:20px; font-size:12px;">
        <p class="bold center" style="margin-bottom:15px;">BIDS AND AWARDS COMMITTEE</p>
        <table style="border:none; width:100%; text-align:center; margin:0 auto;">
            <tr>
                <td style="border:none; width:33%;">
                    <span style="display:inline-block; text-decoration:underline; min-width:150px;">
                        {{ strtoupper(optional($m1)->name ?? '__________________') }}
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
                        {{ strtoupper(optional($m2)->name ?? '__________________') }}
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

    {{-- ======= FOOTER (unchanged) ======= --}}
    <table class="footer-table" style="width:100%; margin-top:40px; font-size:11px; border:none;">
        <tr>
            <td style="width:40%; text-align:left; border:none;">
                <img src="file://{{ public_path('deped-matatag.png') }}" alt="DepEd Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('bagong-pilipinas.png') }}" alt="Philippines Logo" style="height:70px; margin-right:5px;">
                <img src="file://{{ public_path('ilagan.png') }}" alt="Ilagan Logo" style="height:70px;">
                <div>ASDS-QF-003</div>
            </td>
            <td style="width:60%; text-align:right; border:none; line-height:1.3;">
                <div><strong>City Civic Center, Alibagu, City of Ilagan, Isabela</strong></div>
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

    @if(!$loop->last)
        <div class="page-break"></div>
    @endif
@endforeach

</body>
</html>
