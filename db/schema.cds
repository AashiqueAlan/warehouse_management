namespace wh;

using {managed} from '@sap/cds/common';

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

entity opendock_dtl_appointment {
    key WhseNo       : String ;
    key SHIPMENT     : Integer64;
    key DELIVERY     : Integer64;
        Appt_status  : String;
        Appt_start   : Date;
        appt_stime   : Time;
        appt_end     : Date;
        appt_etime   : Time;
        inb_out      : String;
        liveload     : String;
        miss_lappt   : String;
        dropload     : String;
        miss_dappt   : String;
        hotload      : String;
        miss_happt   : String;
        full_trailer : String;
        shuttle      : String;
}
