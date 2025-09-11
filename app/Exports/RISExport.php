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

class RISExport implements FromCollection, WithHeadings, WithEvents, WithMapping, WithStyles
{
    protected $month;
    protected $year;

    public function __construct($month = null, $year = null)
    {
        $this->month = $month;
        $this->year = $year;
    }

    public function collection()
    {
        $query = RIS::with(['inventoryItem.product.unit', 'po.details.prDetail.purchaseRequest.division']);

        if ($this->month) {
            $query->whereMonth('created_at', $this->month);
        }
        if ($this->year) {
            $query->whereYear('created_at', $this->year);
        }

        return $query->latest()->get();
    }

public function headings(): array
    {
        return [
            ['Appendix 64'], 
            ['REPORT OF SUPPLIES AND MATERIALS ISSUED'], 
            ['Entity Name: SDO City of Ilagan', '', '', '', '', '', 'Serial No.: 2025-03-01'], 
            ['Fund Cluster: 01', '', '', '', '', '', 'Date: April 1-31, 2025'],
            ['To be filled up by the Supply and/or Property Division/Unit', '', '', '', '', 'To be filled up by the Accounting Division/Unit'],
            [ // Table headings
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

                // === Set default font ===
                $sheet->getParent()->getDefaultStyle()->applyFromArray([
                    'font' => [
                        'name' => 'Times New Roman',
                        'size' => 10,
                    ],
                ]);

                // === Merges ===
                $sheet->mergeCells('A1:H1'); // Appendix 64
                $sheet->mergeCells('A2:H2'); // REPORT OF SUPPLIES...
                $sheet->mergeCells('A3:F3'); // Entity Name left
                $sheet->mergeCells('G3:H3'); // Serial No. right
                $sheet->mergeCells('A4:F4'); // Fund Cluster left
                $sheet->mergeCells('G4:H4'); // Date right
                $sheet->mergeCells('A5:E5'); // To be filled up by supply...
                $sheet->mergeCells('F5:H5'); // To be filled up by accounting...

                // === Title Styles ===
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

                // === Header Row Bold & Center ===
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A6:{$highestColumn}6")->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10, 'bold' => true],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // === Table Borders ===
                $highestRow = $sheet->getHighestRow();

                // Thin borders inside
                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);

                // Thick border around outline
                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getOutline()
                    ->setBorderStyle(Border::BORDER_MEDIUM);

                // === Column auto width (optional for neatness) ===
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }


    public function map($ris): array
    {
        // PO and details
        $po = $ris->po;
        $detail = $po?->details?->first()?->prDetail;
        $product = $detail?->product;

        // Item description
        $specs = $product?->specs ?? '';
        $item = trim(($product?->name ?? '') . ' ' . $specs);

        // Responsibility Center Code (use Division)
        $division = $detail?->purchaseRequest?->division?->division ?? '';

        // Stock number
        $stockNo = $ris->inventoryItem?->stock_no ?? '';

        // Unit
        $unit = $product?->unit?->unit ?? '';

        // Quantity Issued
        $quantity = $ris->quantity ?? 0;

        // Cost
        $unitCost = $ris->inventoryItem?->unit_cost ?? 0;
        $amount   = $unitCost * $quantity;

        // ✅ Only show RIS number + Division once
        static $lastRisNo = null;
        $showRis = $lastRisNo !== $ris->ris_number;
        $lastRisNo = $ris->ris_number;

        return [
            $showRis ? $ris->ris_number : '',  // RIS No.
            $showRis ? $division : '',         // Responsibility Center Code
            $stockNo,                          // Stock No.
            $item,                             // Item
            $unit,                             // Unit
            $quantity,                         // Quantity Issued
            $unitCost ? number_format($unitCost, 2) : '',
            $amount ? number_format($amount, 2) : '',
        ];
    }



    public function styles(Worksheet $sheet)
    {
        // Merge cells for title and header formatting
        $sheet->mergeCells('A1:H1');
        $sheet->mergeCells('A2:H2');
        $sheet->mergeCells('A3:F3');
        $sheet->mergeCells('A4:F4');

        $sheet->getStyle('A1:A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A1:A2')->getAlignment()->setHorizontal('center');
        
        $sheet->getStyle('A6:H6')->getFont()->setBold(true); // table headers

        return [];
    }
}

