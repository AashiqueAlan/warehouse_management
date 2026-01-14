sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller,JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("maintainutilization.controller.Default", {
       onInit: function () {
        // View model only (UI state)
        const oViewModel = new JSONModel({
          warehouses: [],
          selectedWarehouse: null,
          warehouseCount: 0,
        });

        this.getView().setModel(oViewModel, "view");

        // Load data explicitly
        this._loadWarehouses();
      },

      _loadWarehouses: function () {
        const oODataModel = this.getOwnerComponent().getModel();
        const oViewModel = this.getView().getModel("view");

        const oBinding = oODataModel.bindList("/Warehouses");

        oBinding
          .requestContexts(0, Infinity)
          .then(function (aContexts) {
            const aWarehouses = aContexts.map((oCtx) => oCtx.getObject());

            oViewModel.setProperty("/warehouses", aWarehouses);
            oViewModel.setProperty("/warehouseCount", aWarehouses.length);
          })
          .catch(function (err) {
            console.error("Failed to load Warehouses", err);
            MessageToast.show("Failed to load warehouses");
          });
      },

      onWarehouseSelected: function (oEvent) {
        const oItem = oEvent.getParameter("selectedItem");

        this.getView()
          .getModel("view")
          .setProperty("/selectedWarehouse", oItem ? oItem.getKey() : null);
      },

      onContinue: function () {
        const sLgnum = this.getView()
          .getModel("view")
          .getProperty("/selectedWarehouse");

        if (!sLgnum) {
          MessageToast.show("Please select a warehouse");
          return;
        }

        sessionStorage.setItem("selectedWarehouse", sLgnum);

        this.getOwnerComponent().getRouter().navTo("Main", { lgnum: sLgnum });
      },
    });
  }
);
