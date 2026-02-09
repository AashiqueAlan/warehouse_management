const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
  const extSrv = await cds.connect.to("ZEWM_WHS_LM_SRV");

  const {
    Warehouses,
    Queues,
    UnitsOfMeasure,
    Resources,
    ShiftDayNumbers,
    WarehouseStandards,
    UtilizationRates,
    appointment,
    ReadWhsProcessor,
    ShiftProcessors,
  } = this.entities;

  // this.before("*", (req) => {
  //   console.log("USER CHECK =>", {
  //     event: req.event,
  //     params: req.params,
  //     id: req.user.id,
  //     roles: req.user.roles,
  //     attr: req.user.attr,
  //   });
  // });

  // ======================================================
  // Authorization: Warehouse Standards
  // ======================================================

  this.before(["CREATE", "UPDATE", "DELETE"], WarehouseStandards, (req) => {
    let whse;
    // Scope check
    if (!req.user.is("WarehouseStandards.Edit")) {
      req.reject(401, "Not authorized to edit Warehouse Standards");
    }

    if (req.event === "DELETE") {
      // DELETE
      whse = req.params?.[0]?.WhseNo;
    } else {
      // CREATE / UPDATE
      whse = req.data?.WhseNo;
    }
    const allowedWarehouses = req.user.attr?.WarehouseID || [];
    // console.log("allowedWarehouses", allowedWarehouses);
    // Global admin
    if (allowedWarehouses.includes("ALL")) return;

    //CREATE may not have WhseNo yet
    if (!whse) return;

    //Warehouse restriction
    if (!allowedWarehouses.includes(whse)) {
      req.reject(401, `Not authorized to edit warehouse ${whse}`);
    }
  });

  // ======================================================
  // Authorization: UtilizationRates
  // ======================================================

  this.before(["CREATE", "UPDATE", "DELETE"], UtilizationRates, (req) => {
    let whse;


    // Scope check
    if (!req.user.is("MaintainUtilization.Edit")) {
      req.error(401, "Not authorized to edit Utilization Rates");
    }

    if (req.event === 'DELETE') {
      // DELETE 
      whse = req.params?.[0]?.WhseNo;
    } else {
      // CREATE / UPDATE
      whse = req.data?.WhseNo;
    }
    const allowedWarehouses = req.user.attr?.WarehouseID || [];
    console.log("allowedWarehouses", allowedWarehouses);
    //  Global admin
    if (allowedWarehouses.includes("ALL")) return;

    //CREATE may not yet have WhseNo
    if (!whse) return;
    if (!allowedWarehouses.includes(whse)) {
      req.error(401, `Not authorized to edit Utilization Rates ${whse}`);
    }
  });

  // just for auth check against user & roles for UI level of initial page
  this.on("getUserContext", (req) => {
    return {
      id: req.user.id,
      roles: req.user.roles,
      allowedWarehouses: req.user.attr?.WarehouseID || [],
    };
  });

  // External entities → EWM
  this.on("READ", Warehouses, (req) => extSrv.run(req.query));
  this.on("READ", Queues, (req) => extSrv.run(req.query));
  this.on("READ", UnitsOfMeasure, (req) => extSrv.run(req.query));
  this.on("READ", Resources, (req) => extSrv.run(req.query));
  this.on("READ", ShiftDayNumbers, (req) => extSrv.run(req.query));
  this.on("READ", ShiftProcessors, (req) => extSrv.run(req.query));
  this.on("READ", ReadWhsProcessor, (req) => extSrv.run(req.query));

  

  // ======================================================
  //  Action: getShiftViewData
  //  Calls ECC backend deep entity and merges with local HANA data
  // ======================================================

  this.on("getShiftViewData", async (req) => {
    const {
      WarehouseNumber,
      ReportType,
      ViewType,
      FortyEightHrs,
      TwentyFourHrs,
      Queues,
      WavedDate,
      WavedTime,
      PickCompleteDate,
      PickCompleteTime,
    } = req.data;
    // console.log("Incoming data:", req.data);

    if (!WarehouseNumber) {
      req.error(400, "Warehouse number is required");
      return;
    }


    // Load data based on warehouse number from hana tables
    // Warehouse Standards
    // 1. Prepare the where clause for Appointments
    const where = { WhseNo: WarehouseNumber };
    switch (ReportType) {
      case "IN":
        where.inb_out = "I";
        break;
      case "OUT":
        where.inb_out = "O";
        break;
      case "BOTH":
      default:
        break;
    }

    // 2. Execute all three queries in parallel
    const [standards, utilizations, appointments] = await Promise.all([
      // Query for Standards
      SELECT.from(WarehouseStandards).where({
        WhseNo: WarehouseNumber
      }),

      // Query for Utilizations
      SELECT.from(UtilizationRates).where({
        WhseNo: WarehouseNumber,
      }),

      // Query for Appointments using the 'where' object from above
      (async () => {
        let query = SELECT.from(appointment).where(where);

        // Add date range filter if both dates are provided
        if (WavedDate && PickCompleteDate) {
          query = query.and('Appt_start', '>=', WavedDate)
            .and('Appt_start', '<=', PickCompleteDate);
        }

        const result = await query;
        // console.log('where', where);
        // console.log('WavedDate:', WavedDate, 'PickCompleteDate:', PickCompleteDate);
        // console.log('appointments', result);
        return result;
      })(),
    ]);


    // Convert date from "2026-01-22" to "20260122" format
    const formatDate = (d) => (d ? d.replace(/-/g, "") : "");

    // Convert time from "23:42" to "234200" or "23:42:00" to "234200" format
    const formatTime = (t) => {
      if (!t) return "000000";
      const parts = t.split(":");
      const hh = parts[0] || "00";
      const mm = parts[1] || "00";
      const ss = parts[2] || "00";
      return `${hh}${mm}${ss}`;
    };

    // Payload to send to backend
    const eccPayload = {
      WarehouseNumber,

      OnlyInbound: ReportType === "IN" ? "X" : "",
      OnlyOutbound: ReportType === "OUT" ? "X" : "",
      BothInbOut: ReportType === "BOTH" ? "X" : "",

      SummaryView: ViewType === "SUMMARY" ? "X" : "",
      ShiftView: ViewType === "SHIFT" ? "X" : "",
      LaborNeedsPlanView: ViewType === "LABOR" ? "X" : "",

      WavedDate: formatDate(WavedDate),
      WavedTime: formatTime(WavedTime),
      PickCompleteDate: formatDate(PickCompleteDate),
      PickCompleteTime: formatTime(PickCompleteTime),

      FortyEightHrs: FortyEightHrs === "X" ? "X" : "",
      TwentyFourHrs: TwentyFourHrs === "X" ? "X" : "",

      NavWhseQueue:
        Queues?.map((q) => ({
          WarehouseNumber,
          Queue: q.Queue,
        })) ?? [],

      NavWhseQueueInbound: [],
      NavWhseQueueOutbound: [],

      NavPlannedWDashb: standards.map((s) => ({
        WarehouseNumber,
        Queue: s.Queue,
        Value: String(s.Value),
        UnitOfMeasurement: s.Uom,
      })),

      NavWhseUtlz: utilizations.map((u) => ({
        WarehouseNumber,
        Shift: u.Shift,
        Resource: u.Resource,
        Queue: u.Queue,
        UtlizationRate: String(u.UtilizationRate),
      })),

      NavWhseOpenDock: appointments.map((a) => ({
        WarehouseNumber,
        Shipment: String(a.SHIPMENT),
        Delivery: String(a.DELIVERY),
        ApptStart: a.Appt_start || "",
        ApptStime: a.appt_stime || "",
        ApptEnd: a.appt_end || "",
        ApptEtime: a.appt_etime || "",
        InbOut: a.inb_out || "",
        LiveLoad: a.liveload || "",
        MissLappt: a.miss_lappt || "",
        Dropload: a.dropload || "",
        MissDappt: a.miss_dappt || "",
        Hotload: a.hotload || "",
        MissHappt: a.miss_happt || "",
        FullTrailer: a.full_trailer || "",
        Shuttle: a.shuttle || "",
        ApptStatus: a.Appt_status || "",
      })),
    };

    // console.log(
    //   "Prepared payload for backend:",
    //   JSON.stringify(eccPayload, null, 2),
    // );

    // call ecc backend post method
    try {
      const eccResult = await extSrv.send({
        method: "POST",
        path: "/PlannedWDashbSet",
        data: eccPayload,
      });
      //   console.log(
      //   "POST Response from Backend:",
      //   JSON.stringify(eccResult, null, 2),
      // );
      return eccResult;
    } catch (error) {
      console.error("ECC System Error:", error.message);

      req.error(500, "ECC Backend unreachable or returned an error.");
    }

    return eccResult;
  });
});
