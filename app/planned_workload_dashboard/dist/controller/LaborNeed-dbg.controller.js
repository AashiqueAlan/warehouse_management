
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
        showBothPanels: false,
        showInboundOnly: false,
        showOutboundOnly: false
      }), "viewModel");
    },

    _onRouteMatched() {
      const oData = this.getOwnerComponent()
        .getModel("navigation")
        .getProperty("/navigationData") || {};
      console.log("oData",oData);
      this._updateViewData(oData);
    },

    _updateViewData(oData) {
      const vm = this.getView().getModel("viewModel");

      vm.setProperty("/reportTypeLabel", oData.reportTypeLabel);
      vm.setProperty("/reportType", oData.reportType);
      vm.setProperty("/showBothPanels", oData.reportType === "BOTH");
      vm.setProperty("/showInboundOnly", oData.reportType === "IN");
      vm.setProperty("/showOutboundOnly", oData.reportType === "OUT");
      vm.setProperty("/inboundData", oData.inboundData || []);
      vm.setProperty("/outboundData", oData.outboundData || []);
    },

    onNavBack() {
      this._oRouter.navTo("RouteMain");
    }

  });
});
