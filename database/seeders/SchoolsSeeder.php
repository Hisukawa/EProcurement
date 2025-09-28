<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SchoolsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = [
            ['cluster' => 8, 'name' => 'ABUAN NATIONAL HIGH SCHOOL', 'code' => '01', 'district' => 'South'],
            ['cluster' => 10, 'name' => 'AGGASSIAN ELEMENTARY SCHOOL', 'code' => '02', 'district' => 'South'],
            ['cluster' => 1, 'name' => 'ALIBAGU ELEMENTARY SCHOOL', 'code' => '03', 'district' => 'West'],
            ['cluster' => 1, 'name' => 'ALIBAGU NATIONAL HIGH SCHOOL', 'code' => '04', 'district' => 'West'],
            ['cluster' => 4, 'name' => 'ALINGUIGAN 1ST ELEMENTARY SCHOOL', 'code' => '05', 'district' => 'East'],
            ['cluster' => 4, 'name' => 'ALINGUIGAN 2ND INTEGRATED SCHOOL', 'code' => '06', 'district' => 'East'],
            ['cluster' => 4, 'name' => 'ALINGUIGAN 3RD ELEMENTARY SCHOOL', 'code' => '07', 'district' => 'East'],
            ['cluster' => 3, 'name' => 'ARUSIP ELEMENTARY SCHOOL', 'code' => '08', 'district' => 'NorthWest'],
            ['cluster' => 3, 'name' => 'BAGONG SILANG ELEMENTARY SCHOOL', 'code' => '09', 'district' => 'NorthWest'],
            ['cluster' => 1, 'name' => 'BAGUMBAYAN ELEMENTARY SCHOOL', 'code' => '10', 'district' => 'East'],
            ['cluster' => 1, 'name' => 'BALIGATAN ELEMENTARY SCHOOL', 'code' => '11', 'district' => 'West'],
            ['cluster' => 6, 'name' => 'BALLA ELEMENTARY SCHOOL', 'code' => '12', 'district' => 'North'],
            ['cluster' => 8, 'name' => 'BALLACONG ELEMENTARY SCHOOL', 'code' => '13', 'district' => 'South'],
            ['cluster' => 5, 'name' => 'BANGAG ELEMENTARY SCHOOL', 'code' => '14', 'district' => 'North'],
            ['cluster' => 10, 'name' => 'BARIBAD ELEMENTARY SCHOOL', 'code' => '15', 'district' => 'San Antonio'],
            ['cluster' => 7, 'name' => 'BATONG LABANG ELEMENTARY SCHOOL', 'code' => '16', 'district' => 'South'],
            ['cluster' => 3, 'name' => 'BIGAO ELEMENTARY SCHOOL', 'code' => '17', 'district' => 'Northwest'],
            ['cluster' => 4, 'name' => 'BLISS ELEMENTARY SCHOOL', 'code' => '18', 'district' => 'West'],
            ['cluster' => 3, 'name' => 'CABANNUNGAN 1ST ELEMENTARY SCHOOL', 'code' => '19', 'district' => 'NorthWest'],
            ['cluster' => 3, 'name' => 'CABANNUNGAN 2ND ELEMENTARY SCHOOL', 'code' => '20', 'district' => 'NorthWest'],
            ['cluster' => 10, 'name' => 'CABECERIA 19 ELEMENTARY SCHOOL', 'code' => '21', 'district' => 'San Antonio'],
            ['cluster' => 9, 'name' => 'CABECERIA 23 ELEMENTARY SCHOOL', 'code' => '22', 'district' => 'San Antonio'],
            ['cluster' => 10, 'name' => 'CABECERIA 24 ELEMENTARY SCHOOL', 'code' => '23', 'district' => 'San Antonio'],
            ['cluster' => 8, 'name' => 'CABECERIA 25 ELEMENTARY SCHOOL', 'code' => '24', 'district' => 'South'],
            ['cluster' => 8, 'name' => 'CABECERIA 27 ELEMENTARY SCHOOL', 'code' => '25', 'district' => 'South'],
            ['cluster' => 10, 'name' => 'CABECERIA 3 ELEMENTARY SCHOOL', 'code' => '26', 'district' => 'San Antonio'],
            ['cluster' => 10, 'name' => 'CABECERIA 6 ELEMENTARY SCHOOL', 'code' => '27', 'district' => 'San Antonio'],
            ['cluster' => 7, 'name' => 'CADU ELEMENTARY SCHOOL', 'code' => '28', 'district' => 'South'],
            ['cluster' => 9, 'name' => 'CALINDAYAGAN ELEMENTARY SCHOOL', 'code' => '29', 'district' => 'San Antonio'],
            ['cluster' => 1, 'name' => 'CAMUNATAN ELEMENTARY SCHOOL', 'code' => '30', 'district' => 'West'],
            ['cluster' => 6, 'name' => 'CAPELLAN ELEMENTARY SCHOOL', 'code' => '31', 'district' => 'North'],
            ['cluster' => 5, 'name' => 'CAPO ELEMENTARY SCHOOL', 'code' => '32', 'district' => 'North'],
            ['cluster' => 9, 'name' => 'CAPUGOTAN ELEMENTARY SCHOOL', 'code' => '33', 'district' => 'San Antonio'],
            ['cluster' => 3, 'name' => 'CARIKKIKAN ELEMENTARY SCHOOL', 'code' => '34', 'district' => 'Northwest'],
            ['cluster' => 7, 'name' => 'CASILAGAN ELEMENTARY SCHOOL', 'code' => '35', 'district' => 'South'],
            ['cluster' => 10, 'name' => 'DAPPAT INTEGRATED SCHOOL', 'code' => '36', 'district' => 'San Antonio'],
            ['cluster' => 10, 'name' => 'FUGU ELEMENTARY SCHOOL', 'code' => '37', 'district' => 'South'],
            ['cluster' => 7, 'name' => 'FUYO ELEMENTARY SCHOOL', 'code' => '38', 'district' => 'North'],
            ['cluster' => 4, 'name' => 'GAYONG-GAYONG NORTE ELEMENTARY SCHOOL', 'code' => '39', 'district' => 'San Antonio'],
            ['cluster' => 4, 'name' => 'GAYONG-GAYONG SUR INTEGRATED SCHOOL', 'code' => '40', 'district' => 'San Antonio'],
            ['cluster' => 1, 'name' => "GUINATAN ELEMENTARY SCHOOL", 'code' => '41', 'district' => 'West'],
            ['cluster' => 1, 'name' => "ILAGAN EAST INTEGRATED SPED CENTER", 'code' => '42', 'district' => 'East'],
            ['cluster' => 2, 'name' => "ILAGAN SOUTH CENTRAL SCHOOL", 'code' => '43', 'district' => 'South'],
            ['cluster' => 1, 'name' => "ILAGAN WEST CENTRAL SCHOOL", 'code' => '44', 'district' => 'West'],
            ['cluster' => 2, 'name' => "ILAGAN WEST NATIONAL HIGH SCHOOL", 'code' => '45', 'district' => 'Northwest'],

            ['cluster' => 1, 'name' => "ISABELA NATIONAL HIGH SCHOOL", 'code' => '46', 'district' => 'West'],
            ['cluster' => 3, 'name' => "ISABELA SCHOOL OF ARTS AND TRADES - CABANNUNGAN ANNEX", 'code' => '47', 'district' => 'Northwest'],
            ['cluster' => 2, 'name' => "ISABELA SCHOOL OF ARTS AND TRADES - MAIN", 'code' => '48', 'district' => 'South'],
            ['cluster' => 2, 'name' => "LULUTAN ELEMENTARY SCHOOL", 'code' => '49', 'district' => 'West'],
            ['cluster' => 8, 'name' => "LUPIGUE INTEGRATED SCHOOL", 'code' => '50', 'district' => 'South'],
            ['cluster' => 4, 'name' => "MALALAM ELEMENTARY SCHOOL", 'code' => '51', 'district' => 'West'],
            ['cluster' => 3, 'name' => "MALASIN ELEMENTARY SCHOOL", 'code' => '52', 'district' => 'Northwest'],
            ['cluster' => 6, 'name' => "MANARING INTEGRATED SCHOOL", 'code' => '53', 'district' => 'North'],
            ['cluster' => 3, 'name' => "MANGCURAM ELEMENTARY SCHOOL", 'code' => '54', 'district' => 'NorthWest'],
            ['cluster' => 5, 'name' => "MARANA 1ST ELEMENTARY SCHOOL", 'code' => '55', 'district' => 'East'],
            ['cluster' => 5, 'name' => "MARANA 2ND ELEMENTARY SCHOOL", 'code' => '56', 'district' => 'East'],
            ['cluster' => 5, 'name' => "MARANA 3RD ELEMENTARY SCHOOL", 'code' => '57', 'district' => 'North'],
            ['cluster' => 5, 'name' => "MINABANG ELEMENTARY SCHOOL", 'code' => '58', 'district' => 'North'],
            ['cluster' => 5, 'name' => "MORADO ELEMENTARY SCHOOL", 'code' => '59', 'district' => 'North'],
            ['cluster' => 2, 'name' => "NAGUILIAN BACULUD ELEMENTARY SCHOOL", 'code' => '60', 'district' => 'Northwest'],

            ['cluster' => 4, 'name' => "NAMNAMA ELEMENTARY SCHOOL", 'code' => '61', 'district' => 'West'],
            ['cluster' => 7, 'name' => "NANAGUAN ELEMENTARY SCHOOL", 'code' => '62', 'district' => 'North'],
            ['cluster' => 9, 'name' => "NANGALISAN ELEMENTARY SCHOOL", 'code' => '63', 'district' => 'San Antonio'],
            ['cluster' => 5, 'name' => "PASA ELEMENTARY SCHOOL", 'code' => '64', 'district' => 'North'],
            ['cluster' => 3, 'name' => "PILAR ELEMENTARY SCHOOL", 'code' => '65', 'district' => 'Northwest'],
            ['cluster' => 7, 'name' => "RANG-AYAN ELEMENTARY SCHOOL", 'code' => '66', 'district' => 'North'],
            ['cluster' => 7, 'name' => "RANG-AYAN NATIONAL HIGH SCHOOL", 'code' => '67', 'district' => 'North'],
            ['cluster' => 9, 'name' => "SABLANG ELEMENTARY SCHOOL", 'code' => '68', 'district' => 'San Antonio'],
            ['cluster' => 4, 'name' => "SALINDINGAN ELEMENTARY SCHOOL", 'code' => '69', 'district' => 'West'],
            ['cluster' => 5, 'name' => "SAN ANDRES ELEMENTARY SCHOOL", 'code' => '70', 'district' => 'East'],
            ['cluster' => 10, 'name' => "SAN ANTONIO ELEMENTARY SCHOOL", 'code' => '71', 'district' => 'San Antonio'],
            ['cluster' => 10, 'name' => "SAN ANTONIO NATIONAL AGRO-INDUSTRIAL AND VOCATIONAL HIGH SCHOOL", 'code' => '72', 'district' => 'San Antonio'],
            ['cluster' => 4, 'name' => "SAN FELIPE ELEMENTARY SCHOOL", 'code' => '73', 'district' => 'West'],
            ['cluster' => 2, 'name' => "SAN IGNACIO ELEMENTARY SCHOOL", 'code' => '74', 'district' => 'Northwest'],
            ['cluster' => 6, 'name' => "SAN JUAN-RUGAO ELEMENTARY SCHOOL", 'code' => '75', 'district' => 'North'],
            ['cluster' => 6, 'name' => "SAN LORENZO INTEGRATED SCHOOL", 'code' => '76', 'district' => 'North'],
            ['cluster' => 10, 'name' => "SAN MANUEL CABECERIA 4 ELEMENTARY SCHOOL", 'code' => '77', 'district' => 'San Antonio'],
            ['cluster' => 6, 'name' => "SAN PABLO-QUIMALABASA ELEMENTARY SCHOOL", 'code' => '78', 'district' => 'North'],
            ['cluster' => 9, 'name' => "SAN PEDRO INTEGRATED SCHOOL", 'code' => '79', 'district' => 'San Antonio'],
            ['cluster' => 9, 'name' => "SAN RAFAEL ELEMENTARY SCHOOL", 'code' => '80', 'district' => 'San Antonio'],

            ['cluster' => 9, 'name' => "SAN RAFAEL NATIONAL AND VOCATIONAL HIGH SCHOOL", 'code' => '81', 'district' => 'San Antonio'],
            ['cluster' => 6, 'name' => "SAN RODRIGO ELEMENTARY SCHOOL", 'code' => '82', 'district' => 'North'],
            ['cluster' => 3, 'name' => "SIFFU ELEMENTARY SCHOOL", 'code' => '83', 'district' => 'Northwest'],
            ['cluster' => 8, 'name' => "SINDUN BAYABO INTEGRATED SCHOOL", 'code' => '84', 'district' => 'South'],
            ['cluster' => 8, 'name' => "SINDUN HIGHWAY ELEMENTARY SCHOOL", 'code' => '85', 'district' => 'South'],
            ['cluster' => 8, 'name' => "SINDUN MARIDE ELEMENTARY SCHOOL", 'code' => '86', 'district' => 'South'],
            ['cluster' => 5, 'name' => "SIPAY ELEMENTARY SCHOOL", 'code' => '87', 'district' => 'East'],
            ['cluster' => 7, 'name' => "STA. CATALINA ELEMENTARY SCHOOL", 'code' => '88', 'district' => 'North'],
            ['cluster' => 2, 'name' => "STA. ISABEL NATIONAL HIGH SCHOOL", 'code' => '89', 'district' => 'Northwest'],
            ['cluster' => 2, 'name' => "STA. ISABEL NORTE ELEMENTARY SCHOOL", 'code' => '90', 'district' => 'Northwest'],
            ['cluster' => 2, 'name' => "STA. ISABEL SUR ELEMENTARY SCHOOL", 'code' => '91', 'district' => 'Northwest'],
            ['cluster' => 9, 'name' => "STA. MARIA ELEMENTARY SCHOOL", 'code' => '92', 'district' => 'San Antonio'],
            ['cluster' => 7, 'name' => "STA. VICTORIA ELEMENTARY SCHOOL", 'code' => '93', 'district' => 'North'],
            ['cluster' => 1, 'name' => "STO. TOMAS ELEMENTARY SCHOOL", 'code' => '94', 'district' => 'West'],
            ['cluster' => 8, 'name' => "TALAYTAY ELEMENTARY SCHOOL", 'code' => '95', 'district' => 'South'],
            ['cluster' => 6, 'name' => "TANGCUL-SAN ISIDRO ELEMENTARY SCHOOL", 'code' => '96', 'district' => 'North'],
            ['cluster' => 2, 'name' => "TUBO ELEMENTARY SCHOOL", 'code' => '97', 'district' => 'Northwest'],
            ['cluster' => 8, 'name' => "VILLA IMELDA ELEMENTARY SCHOOL", 'code' => '98', 'district' => 'South'],
        ];

        DB::table('tbl_schools')->insert($schools);
    }
}
