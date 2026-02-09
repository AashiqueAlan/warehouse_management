

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("plannedworkloaddashboard.controller.ShiftDetails", {

    onInit() {
      this._oRouter = this.getOwnerComponent().getRouter();
      this._oRouter.getRoute("shiftDetails")
        .attachPatternMatched(this._onRouteMatched, this);

      this.getView().setModel(new JSONModel({
        reportTypeLabel: "",
        reportType: "",
        showBothPanels: false,
        showInboundOnly: false,
        showOutboundOnly: false,
        shifts: [],
        operationalMetrics: [],
        hasOperationalData: false,

        inboundShifts: [],
        outboundShifts: [],

        inboundOperationalMetrics: [],
        outboundOperationalMetrics: [],
        hasInboundOperationalData: false,
        hasOutboundOperationalData: false,

        hasInboundData: true,
        hasOutboundData: true,

        showLaborNeedsPlan: false,


      }), "viewModel");
    },

    _onRouteMatched() {
      const oData = this.getOwnerComponent()
        .getModel("navigation")
        .getProperty("/navigationData") || {};

      this._updateViewData(oData);
    },

    _updateViewData(oData) {
      const vm = this.getView().getModel("viewModel");
      vm.setProperty("/waveDateTime", oData.waveDateTime || "");
      vm.setProperty("/pickCompleteDateTime", oData.pickCompleteDateTime || "");
      vm.setProperty("/reportTypeLabel", oData.reportTypeLabel);
      vm.setProperty("/reportType", oData.reportType);
      vm.setProperty("/showBothPanels", oData.reportType === "BOTH");
      vm.setProperty("/showInboundOnly", oData.reportType === "IN");
      vm.setProperty("/showOutboundOnly", oData.reportType === "OUT");
      // vm.setProperty("/wavedDate", oData.)
      const selectedQueues = oData.selectedQueues || [];
      let inboundData = oData.inboundData || [];
      let outboundData = oData.outboundData || [];

      // Filter data based on selected queues if any queues were selected
      if (selectedQueues.length > 0) {
        inboundData = this._filterByQueues(inboundData, selectedQueues);
        outboundData = this._filterByQueues(outboundData, selectedQueues);
      }

      // Check if filtered data is empty
      const hasInboundData = inboundData.length > 0;
      const hasOutboundData = outboundData.length > 0;

      vm.setProperty("/hasInboundData", hasInboundData);
      vm.setProperty("/hasOutboundData", hasOutboundData);

      // ===== BOTH VIEW LOGIC  =====
      if (oData.reportType === "BOTH") {

        console.log("outbound", outboundData);
        console.log("inbound", inboundData);
        vm.setProperty("/inboundShifts", this._groupByShift(inboundData));
        vm.setProperty("/outboundShifts", this._groupByShift(outboundData));

        return;
      }


      // ===== SINGLE VIEW LOGIC (Inbound Only or Outbound Only)  =====
      // Set inbound shifts
      vm.setProperty("/inboundShifts", this._groupByShift(inboundData));

      // Set outbound shifts
      vm.setProperty("/outboundShifts", this._groupByShift(outboundData));
    },

    _filterByQueues(aData, aSelectedQueues) {
      if (!aSelectedQueues || aSelectedQueues.length === 0) {
        return aData;
      }

      return aData.filter(item => {
        const queue = item.Queue || item.QueueDescription || "";
        return aSelectedQueues.includes(queue);
      });
    },


    // Separate the incoming data by SequenceNumber and Shift
    _groupByShift(aData) {
      const map = {};

      aData.forEach(o => {
        //  Group ONLY by Shift
        const shiftName = o.Shift || "UNASSIGNED";

        if (!map[shiftName]) {
          map[shiftName] = {
            name: shiftName,
            queues: []
          };
        }

        map[shiftName].queues.push(o);

      });



      // based on the sequence number the each shift will be sorted
      Object.values(map).forEach(group => {
        group.queues.sort((a, b) => {
          const sa = parseInt(a.SequenceNumber, 10) || 0;
          const sb = parseInt(b.SequenceNumber, 10) || 0;
          return sa - sb;
        });
      });

      console.log("map", Object.values(map));
      return Object.values(map);

    },



    formatTarget: function (v) {
      if (v === null || v === undefined || v === "") {
        return "0";
      }

      const s = String(v).trim();

      // Case 1: date YYYY-MM-DD 
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
      }

      // Case 2: time HH:MM:SS 
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) {
        return s;
      }

      // Case 3: decimal number (truncate)
      if (/^-?\d+\.\d+$/.test(s)) {
        return Math.trunc(Number(s)).toString();
      }

      // Case 4: integer 
      if (/^-?\d+$/.test(s)) {
        return s;
      }

      // Fallback: return whatever backend sent
      return s;
    },
    formatOptionalMetric: function (v, seq) {
      const nSeq = parseInt(seq, 10);

      // normalize value
      const s = v === null || v === undefined ? "" : String(v).trim();

      // TEMP RULE: first 4 rows → blank for empty OR zero-like values
      if (nSeq && nSeq <= 4) {
        if (s === "" || s === "0") {
          return "";
        }
      }

      // fallback to existing behavior
      return this.formatTarget(v);
    },



    onNavBack() {
      this._oRouter.navTo("RouteMain");
    }

  });
});
