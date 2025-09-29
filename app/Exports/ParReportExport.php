<?php
namespace App\Exports;

use App\Models\PAR;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Events\AfterSheet;

class ParReportExport implements FromCollection, WithHeadings, WithMapping, WithEvents
{
    protected $month;
    protected $year;
    public function __construct($month = null, $year = null)
    {
        $this->month = $month;
        $this->year  = $year;
    }

    public function collection()
    {
        $query = PAR::with([
            'items.inventoryItem.unit',
            'po.rfq.purchaseRequest.division',
            'po.rfq.purchaseRequest.focal_person',
        ]);

        if ($this->month) {
            $query->whereMonth('created_at', $this->month);
        }
        if ($this->year) {
            $query->whereYear('created_at', $this->year);
        }

        // Flatten: one row per item
        return $query->get()->flatMap(function ($par) {
            return $par->items
                ->map(function ($item) use ($par) {
                    return (object) [
                        'par'  => $par,
                        'item' => $item,
                    ];
                });
        });
    }


    public function headings(): array
    {
        return [
            'Inventory Item No.',
            'PAR No.',
            'Property No.',
            'Date',
            'PO No.',
            'Description',
            'Serial No.',
            'Amount',
            'Unit',
            'Qty.',
            'Name',
            'Position',
            'Office/Division',
            'Useful Life'
        ];
    }

    public function map($row): array
{
    $par  = $row->par;
    $item = $row->item;

    $inventoryItem = $item->inventoryItem;
    $division      = optional($par->po?->rfq?->purchaseRequest?->division)->division ?? '';
    $focal         = $par->po?->rfq?->purchaseRequest?->focal_person;

    // Use item_desc directly
    $productDesc = $inventoryItem?->item_desc ?? '';

    return [
        $item->inventory_item_number ?? '',                     // Inventory Item No.
        $par->par_number ?? '',                              // PAR No. $par->ics_number,          
        $item->property_no ?? '',                    // ICS No./PAR No.
        $par->created_at?->format('Y-m-d') ?? '',    // Date
        $par->po?->po_number ?? '',                  // PO No.
        $productDesc,                                // ✅ Description from item_desc
        $item->serial_no ?? '',                      // Serial No.
        number_format((float)($item->quantity * $item->unit_cost), 2, '.', ','), // Amount
        $inventoryItem?->unit?->unit ?? '',          // Unit
        $item->quantity,                             // Qty.
        trim($focal?->firstname . ' ' . $focal?->middlename . ' ' . $focal?->lastname),
        $focal?->position ?? '',
        $division,
        // $inventoryItem?->useful_life ?? '',        // Optional if exists
    ];
}


    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestColumn = $sheet->getHighestColumn();

                // Bold + center headers
                $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
                    'font' => ['bold' => true],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER
                    ],
                ]);

                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            }
        ];
    }
}
