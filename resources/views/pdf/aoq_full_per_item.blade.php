<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Abstract of Quotations - Per Item Winners</title>
    <style>
        @page { margin: 40px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            max-width: 100px;
            display: block;
            margin: 0 auto;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
        .subtitle {
            font-size: 14px;
            margin: 5px 0;
        }
        .pr-info {
            margin-bottom: 20px;
        }
        .pr-info p {
            margin: 5px 0;
        }
        .supplier-group {
            margin-bottom: 30px;
        }
        .supplier-header {
            background-color: #f0f0f0;
            padding: 8px;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th, td {
            border: 1px solid #333;
            padding: 6px;
            font-size: 11px;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .overall-total {
            margin-top: 20px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }
        .committee-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 30px auto 5px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(file_exists(public_path('deped1.png')))
            <img class="logo" src="{{ public_path('deped1.png') }}" alt="Logo">
        @endif
        <div class="title">ABSTRACT OF QUOTATIONS</div>
        <div class="subtitle">Per-Item Winners Summary</div>
    </div>

    <div class="pr-info">
        <p><strong>PR Number:</strong> {{ $rfq->purchaseRequest->pr_number }}</p>
        <p><strong>Date of Opening:</strong> {{ $rfq->date_of_opening }}</p>
        <p><strong>Project Number:</strong> {{ $rfq->project_no }}</p>
        <p><strong>Venue:</strong> {{ $rfq->venue }}</p>
    </div>

    @foreach($groups as $supplierId => $group)
        <div class="supplier-group">
            <div class="supplier-header">
                @if($supplierId === 'unawarded')
                    <strong>UNAWARDED ITEMS</strong>
                @else
                    <strong>{{ $group['supplier']->name }}</strong>
                @endif
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="35%">Item Description</th>
                        <th width="25%">Technical Specifications</th>
                        <th width="8%">Unit</th>
                        <th width="8%">Qty</th>
                        <th width="12%">Unit Price</th>
                        <th width="12%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($group['items'] as $item)
                        <tr>
                            <td>{{ $item['item'] }}</td>
                            <td>{{ $item['specs'] }}</td>
                            <td>{{ $item['unit'] }}</td>
                            <td class="text-right">{{ number_format($item['quantity'], 0) }}</td>
                            <td class="text-right">{{ number_format($item['unit_price'], 2) }}</td>
                            <td class="text-right">{{ number_format($item['subtotal'], 2) }}</td>
                        </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="5" class="text-right"><strong>Supplier Total:</strong></td>
                        <td class="text-right">{{ number_format($group['supplier_total'], 2) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach

    <div class="overall-total">
        <p>Overall Total Amount: {{ number_format($overallTotal, 2) }}</p>
    </div>

    <div class="committee-section">
        <h3 style="text-align: center; margin-bottom: 40px;">BAC COMMITTEE</h3>

        <div style="display: flex; justify-content: space-around;">
            @if($committee && $committee->members)
                @foreach($committee->members as $member)
                    <div style="width: 200px; text-align: center;">
                        <div class="signature-line"></div>
                        <strong>{{ $member->name }}</strong><br>
                        {{ $member->position }}
                    </div>
                @endforeach
            @endif
        </div>
    </div>
</body>
</html>
