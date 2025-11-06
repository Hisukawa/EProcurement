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
    protected $search;
    public function __construct($month = null, $year = null, $search = null)
    {
        $this->month = $month;
        $this->year  = $year;
        $this->search = $search;
    }

    public function collection()
    {
        $query = PAR::with([
            'items.inventoryItem.unit',
            'po.rfq.purchaseRequest.division',
            'po.details.prDetail.purchaseRequest.focal_person'
        ]);

        if ($this->month) {
            $query->whereMonth('created_at', $this->month);
        }
        if ($this->year) {
            $query->whereYear('created_at', $this->year);
        }
            if ($this->search) {
        $search = $this->search;

        $query->where(function ($q) use ($search) {
            $q->where('par_number', 'like', "%{$search}%")
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
                })
                ->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery->where('recipient', 'like', "%{$search}%")
                            ->orWhere('recipient_division', 'like', "%{$search}%");
                    });
        });
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
    $prDivision = optional($par->po?->rfq?->purchaseRequest?->division)->division;
    $focal         = $par->po?->rfq?->purchaseRequest?->focal_person;
    $recipientName = $item->recipient ?: trim(
        ($focal?->firstname ?? '') . ' ' .
        ($focal?->middlename ?? '') . ' ' .
        ($focal?->lastname ?? '')
    );
    $recipientDivision = $item->recipient_division ?: $prDivision;
    $recipientPosition = $focal?->position ?? '';

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
        $recipientName ?? '',
        $focal?->position ?? '',
        $recipientDivision,
        $item?->estimated_useful_life ?? '',        // Optional if exists
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
