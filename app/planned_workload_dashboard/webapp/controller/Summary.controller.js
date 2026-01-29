sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("plannedworkloaddashboard.controller.Summary", {

    onInit() {
      this._oRouter = this.getOwnerComponent().getRouter();
      this._oRouter.getRoute("summaryView")
        .attachPatternMatched(this._onRouteMatched, this);

      this.getView().setModel(new JSONModel({
        reportTypeLabel: "",
        reportType: "",
        inboundData: [],
        outboundData: [],
        inboundData24: [],
        outboundData24: [],
        inboundData48: [],
        outboundData48: [],
        showBothPanels: false,
        showInboundOnly: false,
        showOutboundOnly: false,
        showDualTimeWindows: false,
        showDualTimeWindowsInboundOnly: false,
        showDualTimeWindowsOutboundOnly: false,
        dualShowOutbound: false,
        dualShowInbound: false,
        selectedHours: {
          hours24: false,
          hours48: false
        }
      }), "viewModel");
    },

    _onRouteMatched() {
      const oData = this.getOwnerComponent()
        .getModel("navigation")
        .getProperty("/navigationData") || {};
      console.log("Incoming data for SummaryView", oData);
      this._updateViewData(oData);
    },

    _updateViewData(oData) {
      const vm = this.getView().getModel("viewModel");

      vm.setProperty("/showDualTimeWindows", false);
      vm.setProperty("/showDualTimeWindowsInboundOnly", false);
      vm.setProperty("/showDualTimeWindowsOutboundOnly", false);
      vm.setProperty("/showBothPanels", false);
      vm.setProperty("/showInboundOnly", false);
      vm.setProperty("/showOutboundOnly", false);
      vm.setProperty("/reportTypeLabel", oData.reportTypeLabel);
      vm.setProperty("/reportType", oData.reportType);
      vm.setProperty("/selectedHours", oData.selectedHours || { hours24: false, hours48: false });

      // Check if both time windows are selected
      const isBothTimeWindows = oData.selectedHours && oData.selectedHours.hours24 && oData.selectedHours.hours48;

      if (isBothTimeWindows) {
        // Separate data by hours (DUAL VIEW ONLY)
        const inbound24Data = oData.inboundData
          ? oData.inboundData.filter(item => item.Hours === "24")
          : [];

        const inbound48Data = oData.inboundData
          ? oData.inboundData.filter(item => item.Hours === "48")
          : [];

        const outbound24Data = oData.outboundData
          ? oData.outboundData.filter(item => item.Hours === "24")
          : [];

        const outbound48Data = oData.outboundData
          ? oData.outboundData.filter(item => item.Hours === "48")
          : [];


        console.log("inbound24Data", inbound24Data);
        console.log("inbound48Data", inbound48Data);
        console.log("outbound24Data", outbound24Data);
        console.log("outbound48Data", outbound48Data);

        // Transform data by hour window
        vm.setProperty("/inboundData24", this._transformInboundTreeData(inbound24Data));
        vm.setProperty("/inboundData48", this._transformInboundTreeData(inbound48Data));
        vm.setProperty("/outboundData24", this._transformOutboundTreeData(outbound24Data));
        vm.setProperty("/outboundData48", this._transformOutboundTreeData(outbound48Data));

        // Determine which view to show based on report type
        if (oData.reportType === "IN") {
          // Inbound only with dual time windows - side by side layout
          vm.setProperty("/showDualTimeWindowsInboundOnly", true);
        } else if (oData.reportType === "OUT") {
          // Outbound only with dual time windows - side by side layout
          vm.setProperty("/showDualTimeWindowsOutboundOnly", true);
        } else if (oData.reportType === "BOTH") {
          // Both inbound and outbound with dual time windows - original stacked layout
          vm.setProperty("/showDualTimeWindows", true);
          vm.setProperty("/dualShowOutbound", true);
          vm.setProperty("/dualShowInbound", true);
        }
      } else {
        // Single time window view
        vm.setProperty("/showBothPanels", oData.reportType === "BOTH");
        vm.setProperty("/showInboundOnly", oData.reportType === "IN");
        vm.setProperty("/showOutboundOnly", oData.reportType === "OUT");

        // Transform inbound data using inbound-specific transformation
        const transformedInbound = this._transformInboundTreeData(oData.inboundData || []);
        vm.setProperty("/inboundData", transformedInbound);

        // Transform outbound data using outbound-specific transformation
        const transformedOutbound = this._transformOutboundTreeData(oData.outboundData || []);
        vm.setProperty("/outboundData", transformedOutbound);
      }
    },

    _transformOutboundTreeData(aData) {
      // STEP 1: SORT
      const sorted = [...aData].sort(
        (a, b) => Number(a.SequenceNumber) - Number(b.SequenceNumber)
      );

      const result = [];
      const scheduledChildren = [];
      const missedChildren = [];

      const val = i => this._parseValue(i.CurrentCompleted);

      sorted.forEach(item => {
        const seq = Number(item.SequenceNumber);

        // 5 & 6 → Scheduled Loads
        if (seq === 5 || seq === 6) {
          scheduledChildren.push({
            QueueDescription: item.QueueDescription,
            CurrentCompleted: val(item).toString(),
            isParent: false,
            children: []
          });
          return;
        }

        // 7 & 8 → Missed Loads
        if (seq === 7 || seq === 8) {
          missedChildren.push({
            QueueDescription: item.QueueDescription,
            CurrentCompleted: val(item).toString(),
            isParent: false,
            children: []
          });
          return;
        }

        // Everything else → flat, ordered
        result.push({
          QueueDescription: item.QueueDescription,
          CurrentCompleted: val(item).toString(),
          isParent: false,
          children: []
        });
      });

      // Insert Scheduled Loads AFTER sequence 4
      if (scheduledChildren.length) {

        result.splice(4, 0, {
          QueueDescription: "Scheduled Loads",
          CurrentCompleted: scheduledChildren
            .reduce((s, c) => s + Number(c.CurrentCompleted), 0)
            .toString(),
          isParent: true,
          children: scheduledChildren
        });
      }

      // Insert Missed Loads AFTER Scheduled Loads
      if (missedChildren.length) {
        result.splice(5, 0, {
          QueueDescription: "Missed Loads",
          CurrentCompleted: missedChildren
            .reduce((s, c) => s + Number(c.CurrentCompleted), 0)
            .toString(),
          isParent: true,
          children: missedChildren
        });
      }

      return result;
    },
    _transformInboundTreeData(aData) {
      // STEP 1: SORT
      const sorted = [...aData].sort(
        (a, b) => Number(a.SequenceNumber) - Number(b.SequenceNumber)
      );

      const result = [];
      const inboundTruckChildren = [];
      const putawayChildren = [];

      const val = i => this._parseValue(i.CurrentCompleted);

      sorted.forEach(item => {
        const seq = Number(item.SequenceNumber);

        // 1,2,3 → Total Inbound Trucks
        if (seq === 1 || seq === 2 || seq === 3) {
          inboundTruckChildren.push({
            QueueDescription: item.QueueDescription,
            CurrentCompleted: val(item).toString(),
            isParent: false,
            children: []
          });
          return;
        }

        // 4 & 5 → Putaway Pallets
        if (seq === 4 || seq === 5) {
          putawayChildren.push({
            QueueDescription: item.QueueDescription,
            CurrentCompleted: val(item).toString(),
            isParent: false,
            children: []
          });
          return;
        }

        // Everything else → flat (ex: Identified Hot Loads)
        result.push({
          QueueDescription: item.QueueDescription,
          CurrentCompleted: val(item).toString(),
          isParent: true,
          children: []
        });
      });

      // Insert Total Inbound Trucks at top
      if (inboundTruckChildren.length) {
        result.splice(0, 0, {
          QueueDescription: "Total Inbound Trucks",
          CurrentCompleted: inboundTruckChildren
            .reduce((s, c) => s + Number(c.CurrentCompleted), 0)
            .toString(),
          isParent: true,
          children: inboundTruckChildren
        });
      }

      // Insert Putaway Pallets after trucks
      if (putawayChildren.length) {
        result.splice(1, 0, {
          QueueDescription: "Putaway Pallets",
          CurrentCompleted: putawayChildren
            .reduce((s, c) => s + Number(c.CurrentCompleted), 0)
            .toString(),
          isParent: true,
          children: putawayChildren
        });
      }

      return result;
    },

    _parseValue(value) {
      if (!value) return 0;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    },

    onRowsUpdated: function (oEvent) {
      const oTreeTable = oEvent.getSource();
      const aRows = oTreeTable.getRows();
      const oModel = oTreeTable.getModel("viewModel"); // FIXED

      aRows.forEach(function (oRow) {
        const oContext = oRow.getBindingContext("viewModel"); // FIXED
        if (!oContext) {
          return;
        }

        const oData = oModel.getProperty(oContext.getPath());

        if (oData && oData.isParent === true) {
          oRow.addStyleClass("parentRowBold");
          oRow.removeStyleClass("childRowNormal");
        } else {
          oRow.removeStyleClass("parentRowBold");
          oRow.addStyleClass("childRowNormal");
        }
      });
    },

    onNavBack() {
      this._oRouter.navTo("RouteMain");
    }

  });
});
