<?php

namespace App\Exports;

use App\Models\RIS;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class RISExportMonthly implements FromCollection, WithHeadings, WithEvents, WithMapping, WithStyles
{
    protected $month;
    protected $year;

    public function __construct($month, $year)
    {
        $this->month = $month;
        $this->year = $year;
    }

    public function collection()
    {
        return RIS::with(['inventoryItem.product.unit', 'po.details.prDetail.purchaseRequest.division'])
            ->whereMonth('created_at', $this->month)
            ->whereYear('created_at', $this->year)
            ->orderBy('created_at')
            ->get();
    }

    public function headings(): array
    {
        $monthName = date("F", mktime(0, 0, 0, $this->month, 1));
        $dateRange = "{$monthName} 1–" . date("t", strtotime("{$this->year}-{$this->month}-01")) . ", {$this->year}";

        return [
            ['Appendix 64'],
            ['REPORT OF SUPPLIES AND MATERIALS ISSUED'],
            ['Entity Name: SDO City of Ilagan', '', '', '', '', '', "Serial No.: {$this->year}-{$this->month}"],
            ['Fund Cluster: 01', '', '', '', '', '', "Date: {$dateRange}"],
            ['To be filled up by the Supply and/or Property Division/Unit', '', '', '', '', 'To be filled up by the Accounting Division/Unit'],
            [
                'RIS No.',
                'Responsibility Center Code',
                'Stock No.',
                'Item',
                'Unit',
                'Quantity Issued',
                'Unit Cost',
                'Amount'
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Default font
                $sheet->getParent()->getDefaultStyle()->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10],
                ]);

                // Merge headers
                $sheet->mergeCells('A1:H1');
                $sheet->mergeCells('A2:H2');
                $sheet->mergeCells('A3:F3');
                $sheet->mergeCells('G3:H3');
                $sheet->mergeCells('A4:F4');
                $sheet->mergeCells('G4:H4');
                $sheet->mergeCells('A5:E5');
                $sheet->mergeCells('F5:H5');

                // Title styles
                $sheet->getStyle('A1:H1')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
                    'font'      => ['name' => 'Times New Roman', 'size' => 12, 'bold' => true],
                ]);

                $sheet->getStyle('A2:H2')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'font'      => ['name' => 'Times New Roman', 'size' => 12, 'bold' => true],
                ]);

                $sheet->getStyle('A3:H4')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                    'font'      => ['name' => 'Times New Roman', 'size' => 10],
                ]);

                $sheet->getStyle('A5:H5')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'font'      => ['name' => 'Times New Roman', 'size' => 10, 'italic' => true],
                ]);

                // Header row
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A6:{$highestColumn}6")->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10, 'bold' => true],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Borders
                $highestRow = $sheet->getHighestRow();
                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);

                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getOutline()
                    ->setBorderStyle(Border::BORDER_MEDIUM);

                // Autosize columns
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }

    public function map($ris): array
    {
        $po = $ris->po;
        $detail = $po?->details?->first()?->prDetail;
        $product = $detail?->product;

        $item = trim(($product?->name ?? '') . ' ' . ($product?->specs ?? ''));
        $division = $detail?->purchaseRequest?->division?->division ?? '';
        $stockNo = $ris->inventoryItem?->stock_no ?? '';
        $unit = $product?->unit?->unit ?? '';
        $quantity = $ris->quantity ?? 0;
        $unitCost = $ris->inventoryItem?->unit_cost ?? 0;
        $amount   = $unitCost * $quantity;

        static $lastRisNo = null;
        $showRis = $lastRisNo !== $ris->ris_number;
        $lastRisNo = $ris->ris_number;

        return [
            $showRis ? $ris->ris_number : '',
            $showRis ? $division : '',
            $stockNo,
            $item,
            $unit,
            $quantity,
            $unitCost ? number_format($unitCost, 2) : '',
            $amount ? number_format($amount, 2) : '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A1:A2')->getAlignment()->setHorizontal('center');
        $sheet->getStyle('A6:H6')->getFont()->setBold(true);

        return [];
    }
}
