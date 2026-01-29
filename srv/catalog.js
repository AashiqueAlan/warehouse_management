const cds = require("@sap/cds");
//  Mock data
// const MOCK_EWM = process.env.MOCK_EWM === "true";



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
    ShiftProcessors
  } = this.entities;

  //Mock need to remove when deploy
  const MOCK_BACKEND_RESPONSE = {
    NavWhseQueueInbound: [
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "001",
        "Queue": "LIVEL",
        "QueueDescription": "LIVE LOADS",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "002",
        "Queue": "FTLD",
        "QueueDescription": "LOADED TRAILERS",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "003",
        "Queue": "SHUTL",
        "QueueDescription": "SHUTTLE",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "004",
        "Queue": "RACK",
        "QueueDescription": "RACK PUTAWAY",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "005",
        "Queue": "FLOR",
        "QueueDescription": "FLOOR",
        "Target": "300.00000000000000",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "      300-",
        "VolumeAdded": "      300-",
        "Need": "300.000000",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "006",
        "Queue": "HOTL",
        "QueueDescription": "IDENTIFIED HOT LOADS",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },

    ],

    NavWhseQueueOutbound: [
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "001",
        "Queue": "WAVEDC",
        "QueueDescription": "WAVED TIME",
        "Target": "12:33:06",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "12:33:06",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "002",
        "Queue": "WAVEDD",
        "QueueDescription": "WAVED TO DATE",
        "Target": "2026-01-29",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "2026-01-29",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "005",
        "Queue": "LIVEL",
        "QueueDescription": "LIVE LOADS",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "006",
        "Queue": "DROP",
        "QueueDescription": "PRELOADS (DROPS)",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "007",
        "Queue": "CARRL",
        "QueueDescription": "LIVE MISSES",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "008",
        "Queue": "CARRD",
        "QueueDescription": "DROP MISSES",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "009",
        "Queue": "REPL",
        "QueueDescription": "REPLENS",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "010",
        "Queue": "CASE",
        "QueueDescription": "CASE PICKS REMAINING",
        "Target": "400.00000000000000",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "      400-",
        "VolumeAdded": "      400-",
        "Need": "400.000000",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "011",
        "Queue": "FLOR",
        "QueueDescription": "FLOOR PICKS REMAINING",
        "Target": "300.00000000000000",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "      300-",
        "VolumeAdded": "      300-",
        "Need": "300.000000",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "012",
        "Queue": "RACK",
        "QueueDescription": "RACK REMAINING",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      },
      {
        "WarehouseNumber": "30J2",
        "Hours": "0",
        "SequenceNumber": "013",
        "Queue": "DUPK",
        "QueueDescription": "DUPK REMAINING",
        "Target": "0",
        "PlannedLaborCapacity": "                            0",
        "AvailableWorkinQueue": "                            0",
        "CurrentCompleted": "                            0",
        "CompleVsPlan": "",
        "Shift": "30J2_EVENING",
        "ShiftSequence": "",
        "Delta": "        0",
        "VolumeAdded": "        0",
        "Need": "0",
        "Current": "        0",
        "Difference": ""
      }
    ]
  };

  function cloneWithHours(rows, hours) {
    return rows.map(r => ({
      ...r,
      Hours: hours
    }));
  }

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
    console.log("Incoming data:", req.data);

    if (!WarehouseNumber) {
      req.error(400, "Warehouse number is required");
      return;
    }

    // =========================================================================================================================
    // ======================================================
    // TEMP MOCK RESPONSE (UI development only)
    // ======================================================
   if (process.env.MOCK_EWM === "true") {
  console.warn("⚠️ MOCK_EWM enabled — returning mocked 24/48 ECC-like response");

  const inbound24 = cloneWithHours(
    MOCK_BACKEND_RESPONSE.NavWhseQueueInbound,
    "24"
  );
  const inbound48 = cloneWithHours(
    MOCK_BACKEND_RESPONSE.NavWhseQueueInbound,
    "48"
  );

  const outbound24 = cloneWithHours(
    MOCK_BACKEND_RESPONSE.NavWhseQueueOutbound,
    "24"
  );
  const outbound48 = cloneWithHours(
    MOCK_BACKEND_RESPONSE.NavWhseQueueOutbound,
    "48"
  );

  return {
    WarehouseNumber,

    OnlyInbound: ReportType === "IN" ? "X" : "",
    OnlyOutbound: ReportType === "OUT" ? "X" : "",
    BothInbOut: ReportType === "BOTH" ? "X" : "",

    SummaryView: ViewType === "SUMMARY" ? "X" : "",
    ShiftView: ViewType === "SHIFT" ? "X" : "",
    LaborNeedsPlanView: ViewType === "LABOR" ? "X" : "",

    FortyEightHrs,
    TwentyFourHrs,

    NavWhseQueueInbound:
      ReportType === "OUT"
        ? []
        : [...inbound24, ...inbound48],

    NavWhseQueueOutbound:
      ReportType === "IN"
        ? []
        : [...outbound24, ...outbound48],

    NavWhseQueue: [],
    NavPlannedWDashb: [],
    NavWhseUtlz: [],
    NavWhseOpenDock: []
  };
}

    // =========================================================================================================
    const queueList = Queues?.map((q) => q.Queue);
    // Load data based on warehouse number from hana tables
    // Warehouse Standards
    const standards = queueList?.length
      ? await SELECT.from(WarehouseStandards).where({
        WhseNo: WarehouseNumber,
        Queue: { in: queueList },
      })
      : await SELECT.from(WarehouseStandards).where({
        WhseNo: WarehouseNumber,
      });

    // Utilization Rates
    const utilizations = queueList?.length
      ? await SELECT.from(UtilizationRates).where({
        WhseNo: WarehouseNumber,
        Queue: { in: queueList },
      })
      : await SELECT.from(UtilizationRates).where({
        WhseNo: WarehouseNumber,
      });

    // Appointments
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
    let appointments = await SELECT.from(appointment).where(where);
    // console.log("appointments",appointments);

    // const flag = (v) => v === "Y" || v === "X" || v === true || v === 1 ? "Y" : "";

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
        ApptStart: a.Appt_start,
        ApptStime: a.appt_stime,
        ApptEnd: a.appt_end,
        ApptEtime: a.appt_etime,
        InbOut: a.inb_out,
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

    console.log(
      "Prepared payload for backend:",
      JSON.stringify(eccPayload, null, 2),
    );

    // call ecc backend post method
    const eccResult = await extSrv.send({
      method: "POST",
      path: "/PlannedWDashbSet",
      data: eccPayload,
    });
    console.log(
      "POST Response from Backend:",
      JSON.stringify(eccResult, null, 2),
    );

    return eccResult;
  });
});
