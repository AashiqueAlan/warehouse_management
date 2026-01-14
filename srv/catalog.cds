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
      key Lgnum,
      key Rsrc,
          RsrcType,

    };

  /** Shift / Day Numbers */
  @readonly
  entity ShiftDayNumbers    as
    projection on ext.shSsqDaynumberSet {
      key Timeint,
          Timemodel,
          Daynumber
    };

  /** Custom HDI tables */
  entity WarehouseStandards as projection on wh.WarehouseStandards;

  entity UtilizationRates   as projection on wh.UtilizationRates;

}
