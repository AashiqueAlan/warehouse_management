using {managed} from '@sap/cds/common';

namespace wh;

entity WarehouseStandards : managed {
  key ID     : UUID;
  key WhseNo : String(4);
  key Queue  : String(10);
      Value  : Integer;
      Uom    : String(3);
}

entity UtilizationRates : managed {
  key WhseNo          : String(4);
  key Shift           : String(40);
  key Resource        : String(40);
  key Queue           : String(10);
      UtilizationRate : Decimal(5, 2);
}
