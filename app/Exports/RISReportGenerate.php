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
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RISReportGenerate implements FromCollection, WithHeadings, WithMapping, WithEvents
{
    protected $month;
    protected $year;
    protected $lastRisNo = null;

    protected $search;

    public function __construct($month = null, $year = null, $search = null)
    {
        $this->month = $month;
        $this->year  = $year;
        $this->search = $search;
    }

public function collection()
{
    $query = RIS::with([
        'items.inventoryItem.product.unit',
        'po.details.prDetail.purchaseRequest.division',
        'po.details.prDetail.purchaseRequest.focal_person'
    ]);

    // 🔹 Filter by month and year
    if ($this->month) {
        $query->whereMonth('created_at', $this->month);
    }
    if ($this->year) {
        $query->whereYear('created_at', $this->year);
    }

    // 🔹 Apply search if provided
    if ($this->search) {
        $search = $this->search;

        $query->where(function ($q) use ($search) {
            $q->where('ris_number', 'like', "%{$search}%")
                // ✅ Search PO Number
                ->orWhereHas('po', function ($poQuery) use ($search) {
                    $poQuery->where('po_number', 'like', "%{$search}%");
                })
                // ✅ Search by Item Description or Product Name
                ->orWhereHas('items.inventoryItem', function ($itemQuery) use ($search) {
                    $itemQuery->where('item_desc', 'like', "%{$search}%");
                })
                // ✅ Search by Focal Person
                ->orWhereHas('po.details.prDetail.purchaseRequest.focal_person', function ($focalQuery) use ($search) {
                    $focalQuery->where('firstname', 'like', "%{$search}%")
                        ->orWhere('middlename', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%");
                })
                // ✅ Search by Division
                ->orWhereHas('po.details.prDetail.purchaseRequest.division', function ($divQuery) use ($search) {
                    $divQuery->where('division', 'like', "%{$search}%");
                });
        });
    }

    // 🔹 Order by created date and get all records
    $risList = $query->orderBy('created_at')->get();

    // 🔹 Flatten results (RIS + items)
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
        // dynamic date range
        $monthName = $this->month ? date("F", mktime(0, 0, 0, $this->month, 1)) : '';
        $daysInMonth = ($this->month && $this->year) ? date("t", strtotime("{$this->year}-{$this->month}-01")) : '';
        if ($this->month && $this->year) {
            $dateRange = "{$monthName} 1–{$daysInMonth}, {$this->year}";
        } elseif ($this->year) {
            $dateRange = "Year {$this->year}";
        } else {
            // fallback: show current month range
            $monthName = date("F");
            $daysInMonth = date("t");
            $yearNow = date("Y");
            $dateRange = "{$monthName} 1–{$daysInMonth}, {$yearNow}";
        }


        return [
            ['Appendix 64'], 
            ['REPORT OF SUPPLIES AND MATERIALS ISSUED'], 
            ['Entity Name: SDO City of Ilagan', '', '', '', '', '', ''], // no serial number
            ['Fund Cluster: 01', '', '', '', '', '', '', "Date: {$dateRange}"],
            ['To be filled up by the Supply and/or Property Division/Unit', '', '', '', '', 'To be filled up by the Accounting Division/Unit'],
            [ // table header row (row 6)
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

    /**
     * Map each flattened row (stdClass with ris + item) to the final array
     */
public function map($row): array
{
    $ris = $row->ris;
    $itm = $row->item;

    $inventoryItem = $itm?->inventoryItem;

    // ✅ Use item_desc directly, fallback if missing
    $itemDesc = $inventoryItem?->item_desc
        ?? optional($ris->po->details->first()?->prDetail?->product)->name
        ?? '';

    $unit     = $inventoryItem?->unit?->unit ?? '';
    $quantity = $itm?->quantity ?? 0;
    $unitCost = $itm?->unit_cost ?? 0;
    $amount   = $quantity * $unitCost;

    // only show RIS number once
    $showRis = $this->lastRisNo !== $ris->ris_number;
    if ($showRis) {
        $this->lastRisNo = $ris->ris_number;
    }

    return [
        $showRis ? $ris->ris_number : '',
        '', // Responsibility Center Code
        $inventoryItem?->stock_no ?? '', // Stock No
        $itemDesc, // ✅ Description from item_desc
        $unit,
        $quantity,
        $unitCost ? number_format((float)$unitCost, 2, '.', ',') : '',
        $amount ? number_format((float)$amount, 2, '.', ',') : '',
    ];
}




    /**
     * Styling, merging and totals after sheet is filled
     */
    public function registerEvents(): array
    {
        return [
            // inside registerEvents()
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // default font
                $sheet->getParent()->getDefaultStyle()->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10],
                ]);

                // merge header ranges
                $sheet->mergeCells('A1:H1');
                $sheet->mergeCells('A2:H2');
                $sheet->mergeCells('A3:F3');
                $sheet->mergeCells('A4:F4');
                $sheet->mergeCells('A5:E5');
                $sheet->mergeCells('F5:H5');

                // titles
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

                // header row style (row 6)
                $highestColumn = $sheet->getHighestColumn();
                $sheet->getStyle("A6:{$highestColumn}6")->applyFromArray([
                    'font' => ['name' => 'Times New Roman', 'size' => 10, 'bold' => true],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // determine data bounds
                $startDataRow = 7; // headers occupy rows 1..6
                $highestRow = $sheet->getHighestRow();

                if ($highestRow < $startDataRow) {
                    foreach (range('A', $highestColumn) as $col) {
                        $sheet->getColumnDimension($col)->setAutoSize(true);
                    }
                    return;
                }

                // number format for cost columns
                $sheet->getStyle("G{$startDataRow}:G{$highestRow}")
                    ->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle("H{$startDataRow}:H{$highestRow}")
                    ->getNumberFormat()->setFormatCode('#,##0.00');

                // Merge vertical groups for RIS No. and Responsibility Center Code
                $r = $startDataRow;
                while ($r <= $highestRow) {
                    $val = trim((string)$sheet->getCell("A{$r}")->getValue());
                    if ($val !== '') {
                        $start = $r;
                        $end = $r;
                        $nr = $r + 1;
                        while ($nr <= $highestRow) {
                            $nextVal = trim((string)$sheet->getCell("A{$nr}")->getValue());
                            if ($nextVal === '') {
                                $end = $nr;
                                $nr++;
                            } else {
                                break;
                            }
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

                // Borders: thin inside, medium outline (only until last data row, no totals)
                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle("A6:{$highestColumn}{$highestRow}")
                    ->getBorders()->getOutline()->setBorderStyle(Border::BORDER_MEDIUM);

                // autosize columns
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            }

        ];
    }

    public function styles(Worksheet $sheet)
    {
        // additional style hooks if needed
        $sheet->getStyle('A1:A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A1:A2')->getAlignment()->setHorizontal('center');
        $sheet->getStyle('A6:H6')->getFont()->setBold(true); // table headers

        return [];
    }
}
