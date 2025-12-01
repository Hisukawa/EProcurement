<?php

namespace App\Exports;

use App\Models\ICS;
use App\Models\RIS;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RISReportGenerate implements FromCollection, WithHeadings, WithMapping, WithEvents
{
    protected $month;
    protected $year;
    protected $search;
    protected $lastRisNo = null;

    public function __construct($month = null, $year = null, $search = null)
    {
        $this->month = $month;
        $this->year  = $year;
        $this->search = $search;
    }


    public function collection()
    {
        $query = RIS::with([
            'requestedBy.division',
            'items.inventoryItem.product.unit',
            'po.details.prDetail.purchaseRequest.division',
            'po.details.prDetail.purchaseRequest.focal_person'
        ]);

        // Filter by month and year
        if ($this->month) $query->whereMonth('created_at', $this->month);
        if ($this->year)  $query->whereYear('created_at', $this->year);

        // Search logic (fixed)
        if ($this->search) {
            $search = $this->search;

            $query->where(function ($q) use ($search) {

                $q->where('ris_number', 'like', "%{$search}%")

                  ->orWhereHas('po', fn($po) =>
                      $po->where('po_number', 'like', "%{$search}%")
                  )

                  ->orWhereHas('items.inventoryItem', fn($item) =>
                      $item->where('item_desc', 'like', "%{$search}%")
                  )

                  ->orWhereHas('items', fn($item) =>
                      $item->where('recipient', 'like', "%{$search}%")
                           ->orWhere('recipient_division', 'like', "%{$search}%")
                  );
            });
        }

        $risList = $query->orderBy('created_at')->get();

        // Flatten rows
        $rows = collect();
        foreach ($risList as $ris) {
            if ($ris->items->isEmpty()) {
                $rows->push((object)[
                    'ris' => $ris,
                    'item' => null,
                ]);
            } else {
                foreach ($ris->items as $itm) {
                    $rows->push((object)[
                        'ris' => $ris,
                        'item' => $itm,
                    ]);
                }
            }
        }

        return $rows;
    }


    public function headings(): array
    {
        $monthName = $this->month ? date("F", mktime(0, 0, 0, $this->month, 1)) : '';
        $daysInMonth = ($this->month && $this->year) ? date("t", strtotime("{$this->year}-{$this->month}-01")) : '';

        if ($this->month && $this->year) {
            $dateRange = "{$monthName} 1–{$daysInMonth}, {$this->year}";
        } elseif ($this->year) {
            $dateRange = "Year {$this->year}";
        } else {
            $monthName = date("F");
            $daysInMonth = date("t");
            $yearNow = date("Y");
            $dateRange = "{$monthName} 1–{$daysInMonth}, {$yearNow}";
        }

        return [
            ['Appendix 64'],
            ['REPORT OF SUPPLIES AND MATERIALS ISSUED'],
            ['Entity Name: SDO City of Ilagan', '', '', '', '', '', ''],
            ['Fund Cluster: 01', '', '', '', '', '', '', "Date: {$dateRange}"],
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


    public function map($row): array
    {
        $ris = $row->ris;
        $itm = $row->item;

        $inventoryItem = $itm?->inventoryItem;

        // Determine responsible person (Recipient → fallback to RequestedBy)
        $responsiblePerson = $itm->recipient;
        $responsibleDivision = $itm->recipient_division;
        

        // Item description
        $itemDesc = $inventoryItem?->item_desc
            ?? optional($ris->po->details->first()?->prDetail?->product)->name
            ?? '';

        $unit     = $inventoryItem?->unit?->unit ?? '';
        $quantity = $itm?->quantity ?? 0;
        $unitCost = $itm?->unit_cost ?? 0;
        $amount   = $quantity * $unitCost;

        // Only show RIS No once
        $showRis = $this->lastRisNo !== $ris->ris_number;
        if ($showRis) $this->lastRisNo = $ris->ris_number;

        return [
            $showRis ? $ris->ris_number : '',
            $inventoryItem?->stock_no ?? '',
            $itemDesc,
            $unit,
            $quantity,
            $unitCost ? number_format((float)$unitCost, 2, '.', ',') : '',
            $amount ? number_format((float)$amount, 2, '.', ',') : '',
        ];
    }


    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                $sheet->getParent()->getDefaultStyle()->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10],
                ]);

                // Header merges
                $sheet->mergeCells('A1:H1');
                $sheet->mergeCells('A2:H2');
                $sheet->mergeCells('A3:F3');
                $sheet->mergeCells('A4:F4');
                $sheet->mergeCells('A5:E5');
                $sheet->mergeCells('F5:H5');

                // Styles
                $sheet->getStyle('A1:H1')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
                    'font' => ['bold' => true, 'size' => 12]
                ]);

                $sheet->getStyle('A2:H2')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'font' => ['bold' => true, 'size' => 12]
                ]);

                $sheet->getStyle('A6:H6')->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'font' => ['bold' => true]
                ]);

                $startDataRow = 7;
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();

                if ($highestRow >= $startDataRow) {

                    // Format cost numeric columns
                    $sheet->getStyle("G{$startDataRow}:G{$highestRow}")
                        ->getNumberFormat()->setFormatCode('#,##0.00');

                    $sheet->getStyle("H{$startDataRow}:H{$highestRow}")
                        ->getNumberFormat()->setFormatCode('#,##0.00');

                    // Merge RIS & Responsibility Center
                    $r = $startDataRow;
                    while ($r <= $highestRow) {
                        $val = trim((string)$sheet->getCell("A{$r}")->getValue());
                        if ($val !== '') {
                            $start = $r;
                            $end = $r;
                            $nr = $r + 1;

                            while ($nr <= $highestRow && trim((string)$sheet->getCell("A{$nr}")->getValue()) === '') {
                                $end = $nr;
                                $nr++;
                            }

                            if ($end > $start) {
                                $sheet->mergeCells("A{$start}:A{$end}");
                                $sheet->mergeCells("B{$start}:B{$end}");
                                $sheet->getStyle("A{$start}:B{$end}")
                                    ->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                            }

                            $r = $end + 1;
                        } else {
                            $r++;
                        }
                    }

                    // Borders
                    $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                        ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                    $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                        ->getBorders()->getOutline()->setBorderStyle(Border::BORDER_MEDIUM);
                }

                // Auto-size columns
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            }
        ];
    }
}
