<?php

namespace App\Exports;

use App\Models\ICS;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithEvents;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Events\AfterSheet;

class ICSReportExport implements FromCollection, WithHeadings, WithMapping, WithEvents
{
    protected $month;
    protected $year;
    protected $type;
    protected $search;

    public function __construct($month = null, $year = null, $type = 'low', $search = null)
    {
        $this->month = $month;
        $this->year = $year;
        $this->type = $type;
        $this->search = $search;
    }

    public function collection()
    {
        $query = ICS::with([
            'items.inventoryItem.unit',
            'po.rfq.purchaseRequest.division',
            'po.rfq.purchaseRequest.focal_person',
            'po.details.prDetail.purchaseRequest.focal_person'
        ])
        ->whereHas('items', function ($q) {
            $q->where('type', $this->type);
        });

        // 🔹 Filter by month/year
        if ($this->month) {
            $query->whereMonth('created_at', $this->month);
        }
        if ($this->year) {
            $query->whereYear('created_at', $this->year);
        }

        if ($this->search) {
            $search = $this->search;

            $query->where(function ($q) use ($search) {
                $q->where('ics_number', 'like', "%{$search}%")
                    ->orWhereHas('po', function ($poQuery) use ($search) {
                        $poQuery->where('po_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items.inventoryItem', function ($itemQuery) use ($search) {
                        $itemQuery->where('item_desc', 'like', "%{$search}%");
                    })
                    ->orWhereHas('po.details.prDetail.purchaseRequest.focal_person', function ($focalQuery) use ($search) {
                        $focalQuery->where('firstname', 'like', "%{$search}%")
                            ->orWhere('middlename', 'like', "%{$search}%")
                            ->orWhere('lastname', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery->where('recipient', 'like', "%{$search}%")
                            ->orWhere('recipient_division', 'like', "%{$search}%");
                    });
            });
        }

        

        // 🔹 Flatten into one row per ICS item
        return $query->get()->flatMap(function ($ics) {
            return $ics->items
                ->where('type', $this->type)
                ->map(function ($item) use ($ics) {
                    return (object) [
                        'ics'  => $ics,
                        'item' => $item,
                    ];
                });
        });
    }

    public function headings(): array
    {
        return [
            'Inventory Item No.',
            'ICS No.',
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
            'Useful Life',
        ];
    }

    public function map($row): array
{
    $ics = $row->ics;
    $item = $row->item;

    $inventoryItem = $item->inventoryItem;
    $focal = $ics->po?->rfq?->purchaseRequest?->focal_person;
    $prDivision = optional($ics->po?->rfq?->purchaseRequest?->division)->division;
    $productDesc = $inventoryItem?->item_desc ?? '';

    // ✅ Prefer recipient and recipient_division if present
    $recipientName = $item->recipient ?: trim(
        ($focal?->firstname ?? '') . ' ' .
        ($focal?->middlename ?? '') . ' ' .
        ($focal?->lastname ?? '')
    );

    $recipientDivision = $item->recipient_division ?: $prDivision;
    $recipientPosition = $focal?->position ?? '';

    return [
        $item->inventory_item_number ?? '',                                        // Inventory Item No.
        strtoupper(substr($this->type, 0, 1)) . '-' . ($ics->ics_number ?? ''),   // ICS No.
        optional($ics->created_at)->format('Y-m-d') ?? '',                         // Date
        $ics->po?->po_number ?? $inventoryItem?->dr_number ?? '',                                                // PO No.
        $productDesc,                                                              // Description
        $item->serial_no ?? '',                                                    // Serial No.
        number_format((float)($item->quantity * $item->unit_cost), 2, '.', ','),   // Amount
        $inventoryItem?->unit?->unit ?? '',                                        // Unit
        $item->quantity ?? 0,                                                      // Qty.
        $recipientName,                                                            // ✅ Prefer item->recipient
        $recipientPosition,                                                        // Position (from focal)
        $recipientDivision,                                                        // ✅ Prefer item->recipient_division
        $item?->estimated_useful_life ?? '',                                        // Useful Life
    ];
}


    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestColumn = $sheet->getHighestColumn();

                // Bold + center headers
                $sheet->getStyle("A1:{$highestColumn}1")->applyFromArray([
                    'font' => ['bold' => true],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Autosize all columns
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }

                // Wrap text for readability
                $sheet->getStyle("A1:{$highestColumn}" . $sheet->getHighestRow())->applyFromArray([
                    'alignment' => ['wrapText' => true],
                ]);
            },
        ];
    }
}
