
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("plannedworkloaddashboard.controller.LaborNeed", {

    onInit() {
      this._oRouter = this.getOwnerComponent().getRouter();
      this._oRouter.getRoute("laborView")
        .attachPatternMatched(this._onRouteMatched, this);

      this.getView().setModel(new JSONModel({
        reportTypeLabel: "",
        reportType: "",

        inboundData: [],
        outboundData: [],

        inboundData24: [],
        inboundData48: [],
        outboundData24: [],
        outboundData48: [],


        showBothPanels: false,
        showInboundOnly: false,
        showOutboundOnly: false,

        showDualTimeWindows: false,
        showDualTimeWindowsInboundOnly: false,
        showDualTimeWindowsOutboundOnly: false
      }), "viewModel");
    },

    _onRouteMatched() {
      const oData = this.getOwnerComponent()
        .getModel("navigation")
        .getProperty("/navigationData") || {};
      console.log("oData", oData);
      this._updateViewData(oData);
    },

    _updateViewData(oData) {
      const vm = this.getView().getModel("viewModel");

      // reset
      vm.setProperty("/showBothPanels", false);
      vm.setProperty("/showInboundOnly", false);
      vm.setProperty("/showOutboundOnly", false);
      vm.setProperty("/showDualTimeWindows", false);
      vm.setProperty("/showDualTimeWindowsInboundOnly", false);
      vm.setProperty("/showDualTimeWindowsOutboundOnly", false);

      vm.setProperty("/reportTypeLabel", oData.reportTypeLabel);
      vm.setProperty("/reportType", oData.reportType);

      const isBothTimeWindows =
        oData.selectedHours?.hours24 &&
        oData.selectedHours?.hours48;

      if (isBothTimeWindows) {

        // split by hours
        vm.setProperty("/inboundData24",
          (oData.inboundData || []).filter(i => i.Hours === "24"));
        vm.setProperty("/inboundData48",
          (oData.inboundData || []).filter(i => i.Hours === "48"));
        vm.setProperty("/outboundData24",
          (oData.outboundData || []).filter(i => i.Hours === "24"));
        vm.setProperty("/outboundData48",
          (oData.outboundData || []).filter(i => i.Hours === "48"));

        if (oData.reportType === "IN") {
          vm.setProperty("/showDualTimeWindowsInboundOnly", true);
        } else if (oData.reportType === "OUT") {
          vm.setProperty("/showDualTimeWindowsOutboundOnly", true);
        } else {
          vm.setProperty("/showDualTimeWindows", true);
        }

      } else {
        // SINGLE TIME WINDOW (24 OR 48)

        const selectedHour = oData.selectedHours?.hours24 ? "24" : "48";

        const inboundSingle =
          (oData.inboundData || []).filter(i => i.Hours === selectedHour);

        const outboundSingle =
          (oData.outboundData || []).filter(i => i.Hours === selectedHour);

        vm.setProperty("/inboundData", inboundSingle);
        vm.setProperty("/outboundData", outboundSingle);

        vm.setProperty("/showInboundOnly", oData.reportType === "IN");
        vm.setProperty("/showOutboundOnly", oData.reportType === "OUT");
        vm.setProperty("/showBothPanels", oData.reportType === "BOTH");
      }
    },
    onNavBack() {
      this._oRouter.navTo("RouteMain");
    },
    formatTarget: function (v) {
      if (v === null || v === undefined || v === "") {
        return "";
      }

      const s = String(v).trim();

      // Case 1: date YYYY-MM-DD → leave as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
      }

      // Case 2: time HH:MM:SS → leave as-is
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) {
        return s;
      }

      // Case 3: decimal number → truncate
      if (/^-?\d+\.\d+$/.test(s)) {
        return Math.trunc(Number(s)).toString();
      }

      // Case 4: integer → leave as-is
      if (/^-?\d+$/.test(s)) {
        return s;
      }

      // Fallback: return whatever backend sent
      return s;
    },

  });
});
