using {ZEWM_WHS_LM_SRV as ext} from './external/ZEWM_WHS_LM_SRV';
using wh from '../db/schema';

@path: 'catalog'
service CatalogService {

  @readonly
  entity Warehouses         as
    projection on ext.shLgnumSet {
      key Lgnum,
          Lnumt
    };

  /** Queues */
  @readonly
  entity Queues             as
    projection on ext.shQueueSet {
      key Lgnum,
      key Queue,
          Text
    };

  /** Units of Measure */
  @readonly
  entity UnitsOfMeasure     as
    projection on ext.ZewmShbasmeSet {
      key Msehi,
          MSEHL
    };

  /** Resources */
  @readonly
  entity Resources          as
    projection on ext.ZewmShRsrcSet {
      key WarehouseNumber,
      key Shift,
      key Processor,
          FullName,

    };

  /** Shift / Day Numbers */
  @readonly
  entity ShiftDayNumbers    as
    projection on ext.ZewmShSsqDaynumberSet {
      key WarehouseNumber,
      key Timeint
    };

  // Expose Read_Whs_Processors + navigation
  @readonly
  entity ReadWhsProcessor   as
    projection on ext.Read_Whs_ProcessorsSet {
      key WarehouseNumber,
          NavWhseProcessors
    };

  @readonly
  entity ShiftProcessors    as
    projection on ext.Shift_ProcessorsSet {
      key WarehouseNumber,
          ShiftSequence,
          Shift,
          Processor
    };

  /** Custom HDI tables */
  entity WarehouseStandards as projection on wh.WarehouseStandards;

  entity UtilizationRates   as projection on wh.UtilizationRates;

  entity appointment        as projection on wh.opendock_dtl_appointment;

  /** Types for Planned Workload Dashboard */
  type QueueInput {
    Queue : String(10);
  }

  type WhseQueuePayload {
    WarehouseNumber : String(4);
    Queue           : String(10);
  }

  type WhseQueueResult {
    WarehouseNumber      : String(4);
    Queue                : String(10);
    QueueDescription     : String(60);

    Target               : String(30);
    PlannedLaborCapacity : String(30);
    AvailableWorkinQueue : String(30);
    CurrentCompleted     : String(30);
    CompleVsPlan         : String(6);

    Shift                : String(40);
    ShiftSequence        : String(40);

    LiveLoadComplete     : String(10);
    DropLoadComplete     : String(10);
    LoadsAddedNextday    : String(10);

    CarrierMissLive      : String(10);
    CarrierMissDrop      : String(10);
    WhsMissLive          : String(10);
    WhsMissDrop          : String(10);

    DirectHeadScheduled  : String(10);
  }


  type WhseStndPayload {
    WarehouseNumber   : String(4);
    Queue             : String(20);
    Value             : String(10);
    UnitOfMeasurement : String(5);
  }

  type WhseUtlzPayload {
    WarehouseNumber : String(4);
    Shift           : String(60);
    Resource        : String(20);
    Queue           : String(20);
    UtlizationRate  : String(10);
  }

  type WhseOpenDockPayload {
    WarehouseNumber : String(4);
    Shipment        : String(40);
    Delivery        : String(40);

    ApptStart       : String(10);
    ApptSTime       : String(10);
    ApptEnd         : String(10);
    ApptETime       : String(10);

    InbOut          : String(1);

    LiveLoad        : String(1);
    DropLoad        : String(1);
    HotLoad         : String(1);


    MissLappt       : String(1);
    MissDappt       : String(1);
    MissHappt       : String(1);


    FullTrailer     : String(1);
    Shuttle         : String(1);


    ApptStatus      : String(20);
  }


  type PlannedWDashbPayload {
    WarehouseNumber      : String(4);
    OnlyInbound          : String(1);
    OnlyOutbound         : String(1);
    BothInbOut           : String(1);
    SummaryView          : String(1);
    ShiftView            : String(1);
    LaborNeedsPlanView   : String(1);
    FortyEightHrs        : String(1);
    TwentyFourHrs        : String(1);

    NavWhseQueue         : array of WhseQueueResult;
    NavWhseQueueInbound  : array of WhseQueueResult;
    NavWhseQueueOutbound : array of WhseQueueResult;
    NavPlannedWDashb     : array of WhseStndPayload;
    NavWhseUtlz          : array of WhseUtlzPayload;
    NavWhseOpenDock      : array of WhseOpenDockPayload;
  }

  /** Action to get Shift View data from ECC backend */
  action getShiftViewData(WarehouseNumber: String(4),
                          ReportType: String(4), // IN, OUT, BOTH
                          ViewType: String(10), // SHIFT, SUMMARY, LABOR
                          FortyEightHrs: String(1),
                          TwentyFourHrs: String(1),
                          WavedDate: String(10),
                          WavedTime: String(10),
                          PickCompleteDate: String(10),
                          PickCompleteTime: String(10),
                          Queues: array of QueueInput) returns PlannedWDashbPayload;
}
