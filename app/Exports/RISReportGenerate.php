<?php

namespace App\Exports;

use App\Models\RIS;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Maatwebsite\Excel\Events\AfterSheet;

class RISReportGenerate implements FromCollection, WithHeadings, WithMapping, WithEvents
{
    protected $month;
    protected $year;

    public function __construct($month, $year)
    {
        $this->month = $month;
        $this->year  = $year;
    }

    public function collection()
    {
        return RIS::with('items.inventoryItem.unit')
            ->whereMonth('created_at', $this->month)
            ->whereYear('created_at', $this->year)
            ->get();
    }

    public function headings(): array
    {
        $monthName = date("F", mktime(0, 0, 0, $this->month, 1));
        $lastDay   = date("t", strtotime("{$this->year}-{$this->month}-01"));
        $dateRange = "{$monthName} 1–{$lastDay}, {$this->year}";

        return [
            ['REPORT OF SUPPLIES AND MATERIALS ISSUED'],
            ["As of {$dateRange}"], // will be aligned over Amount column
            [
                'Stock/ Card No.',
                'Particulars',
                'Beg. Balance', '', '',
                'Receipt', '', '',
                'Weighted Avg. Cost',
                'Issue', '', '',
                'Balance', '', ''
            ],
            [
                '', '',
                'Qty', 'Unit Cost', 'Amount',
                'Qty', 'Unit Cost', 'Amount',
                'Unit Cost',
                'Qty', 'Unit Cost', 'Amount',
                'Qty', 'Unit Cost', 'Amount',
            ]
        ];
    }

    public function map($row): array
    {
        $unitCost    = $row->items->first()->unit_cost ?? 0;
        $qtyIssued   = $row->items->sum('quantity');
        $receiptQty  = $row->items->sum('received_quantity') ?? 0;
        $begBalance  = 0;

        $amountIssued   = $qtyIssued * $unitCost;
        $amountReceipt  = $receiptQty * $unitCost;
        $amountBeg      = $begBalance * $unitCost;
        $balanceQty     = $begBalance + $receiptQty - $qtyIssued;
        $balanceAmount  = $balanceQty * $unitCost;

        return [
            $row->id ?? '',
            $row->items->first()->inventoryItem->name ?? '',

            $begBalance, $unitCost, $amountBeg,

            $receiptQty, $unitCost, $amountReceipt,

            $unitCost, // WAC

            $qtyIssued, $unitCost, $amountIssued,

            $balanceQty, $unitCost, $balanceAmount,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;

                // Merge headers
                $sheet->mergeCells('A1:O1'); // Report title
                $sheet->mergeCells('A2:O2'); // Date Range above Amount
                $sheet->mergeCells('C3:E3'); // Beg Balance
                $sheet->mergeCells('F3:H3'); // Receipt
                $sheet->mergeCells('I3:I3'); // WAC single col
                $sheet->mergeCells('J3:L3'); // Issue
                $sheet->mergeCells('M3:O3'); // Balance

                // Style headers
                $sheet->getStyle('A1:O4')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 10, 'name' => 'Times New Roman'],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                        'wrapText'   => true,
                    ],
                ]);

                // Borders
                $sheet->getStyle('A3:O4')->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN]
                    ]
                ]);

                // Colors
                $sheet->getStyle('C3:E4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFD9E1F2']]
                ]);
                $sheet->getStyle('F3:H4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE2EFDA']]
                ]);
                $sheet->getStyle('I3:I4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFCE4D6']]
                ]);
                $sheet->getStyle('J3:L4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF8CBAD']]
                ]);
                $sheet->getStyle('M3:O4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFDDEBF7']]
                ]);

                // Autosize
                foreach (range('A', 'O') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
