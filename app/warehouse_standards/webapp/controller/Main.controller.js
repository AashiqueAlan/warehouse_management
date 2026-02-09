sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    Sorter
  ) {
    "use strict";

    return Controller.extend("warehousestandards.controller.Main", {
      onInit: function () {
        const oVm = new JSONModel({
          rows: [],
          originalRows: [],
          deletedRows: [],
          queues: [],
          uoms: [],
          editMode: false,
          toggleeditbtn: true,
          canAddRow: false,
          warehouseDisplay: "",
        });

        this.getView().setModel(oVm, "ViewModel");

        this.getOwnerComponent()
          .getRouter()
          .getRoute("Main")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      /* ================= ROUTE ================= */

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("RouteDefault");
      },

      _onRouteMatched: function (oEvent) {
        const sWhseNo = oEvent.getParameter("arguments").lgnum;
        this._currentWarehouse = sWhseNo;

        const oVm = this.getView().getModel("ViewModel");
        oVm.setProperty("/warehouseDisplay", sWhseNo);
        oVm.setProperty("/queues", []);
        oVm.setProperty("/uoms", []);
        oVm.setProperty("/rows", []);
        oVm.setProperty("/originalRows", []);
        oVm.setProperty("/deletedRows", []);


        this._loadWarehouseStandards(sWhseNo);



      },

      /* ================= LOADERS ================= */

      _loadWarehouseStandards: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");
        // const that = this;

        oModel
          .bindList(
            "/WarehouseStandards",
            null,
            null,
            [new Filter("WhseNo", FilterOperator.EQ, sWhseNo)]
          )
          .requestContexts(0, Infinity)
          .then(function (aCtx) {
            const aRows = aCtx.map(function (c, i) {
              const oData = c.getObject();
              return {
                SNo: i + 1,
                ID: oData.ID,
                Queue: oData.Queue,
                Value: oData.Value,
                Uom: oData.Uom,
                WhseNo: oData.WhseNo,
                createdAt: oData.createdAt,
                __state: "UNCHANGED",
              };
            });

            oVm.setProperty("/rows", aRows);
            oVm.setProperty("/originalRows", JSON.parse(JSON.stringify(aRows)));

            // If no data, enable edit mode automatically
            if (aRows.length === 0) {
              oVm.setProperty("/editMode", true);
              oVm.setProperty("/toggleeditbtn", false);
              oVm.setProperty("/canAddRow", true);
              MessageToast.show(
                "No existing records found for warehouse " + sWhseNo
              );
            } else {
              oVm.setProperty("/editMode", false);
              oVm.setProperty("/toggleeditbtn", true);
              oVm.setProperty("/canAddRow", false);
            }
          })
          .catch(function (err) {
            console.error("Failed to load warehouse standards", err);
            MessageToast.show("Failed to load data. You can add new rows.");

            // Enable edit mode on error
            oVm.setProperty("/rows", []);
            oVm.setProperty("/originalRows", []);
            oVm.setProperty("/editMode", true);
            oVm.setProperty("/toggleeditbtn", false);
          });
      },

      /* ================= ACTIONS ================= */

      onEditButtonPress: function () {
        const oVm = this.getView().getModel("ViewModel");
        oVm.setProperty("/editMode", true);
        oVm.setProperty("/toggleeditbtn", false);
        oVm.setProperty("/canAddRow", true);
      },

      onAddRow: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aRows = oVm.getProperty("/rows");

        aRows.push({
          SNo: aRows.length + 1,
          WhseNo: this._currentWarehouse,
          Queue: "",
          Value: 0,
          Uom: "",
          __state: "NEW",
        });

        oVm.setProperty("/rows", aRows);
        oVm.setProperty("/editMode", true);
        oVm.setProperty("/toggleeditbtn", false);
      },

      onDeleteRow: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const aRows = oVm.getProperty("/rows");
        const iIndex = parseInt(
          oEvent
            .getParameter("listItem")
            .getBindingContext("ViewModel")
            .getPath()
            .split("/")[2],
          10
        );

        const deletedRow = aRows[iIndex];

        if (deletedRow.__state === "UNCHANGED" && deletedRow.ID) {
          const aDeletedRows = oVm.getProperty("/deletedRows") || [];
          aDeletedRows.push(deletedRow);
          oVm.setProperty("/deletedRows", aDeletedRows);
        }

        aRows.splice(iIndex, 1);

        aRows.forEach(function (r, i) {
          r.SNo = i + 1;
        });

        oVm.setProperty("/rows", aRows);
      },

      /* ================= SAVE ================= */

      onSaveButtonPress: function () {
        const oVm = this.getView().getModel("ViewModel");
        const oModel = this.getOwnerComponent().getModel();
        const aRows = oVm.getProperty("/rows");
        const aOriginal = oVm.getProperty("/originalRows");
        const aDeletedRows = oVm.getProperty("/deletedRows") || [];
        const aQueues = oVm.getProperty("/queues");
        const aUoms = oVm.getProperty("/uoms");
        const that = this;

        // Validation - Check if all fields are filled
        for (var i = 0; i < aRows.length; i++) {
          if (!aRows[i].Queue || !aRows[i].Uom ||
            aRows[i].Value === "" ||
            aRows[i].Value === null ||
            aRows[i].Value === undefined) {
            MessageBox.error("Please fill all fields in row " + (i + 1));
            return;
          }

          if (aRows[i].__state === "NEW") {
            const bQueueExists = aQueues.some(q => q.Queue === aRows[i].Queue);
            if (!bQueueExists) {
              MessageBox.error(
                "Queue '" + aRows[i].Queue + "' in row " + (i + 1) +
                " is not available for warehouse " + that._currentWarehouse
              );
              return;
            }

            const bUomExists = aUoms.some(u => u.Msehi === aRows[i].Uom);
            if (!bUomExists) {
              MessageBox.error(
                "UOM '" + aRows[i].Uom + "' in row " + (i + 1) + " is not valid"
              );
              return;
            }
          }
        }

        // Check if anything has changed
        const bHasNewRows = aRows.some(function (row) {
          return row.__state === "NEW";
        });

        const bHasDeletedRows = aDeletedRows.length > 0;

        const bHasModifiedRows = aRows.some(function (row) {
          if (row.__state === "UNCHANGED") {
            const orig = aOriginal.find(function (o) {
              return o.ID === row.ID;
            });
            if (orig) {
              return (
                row.Value !== orig.Value ||
                row.Uom !== orig.Uom ||
                row.Queue !== orig.Queue
              );
            }
          }
          return false;
        });

        if (!bHasNewRows && !bHasDeletedRows && !bHasModifiedRows) {
          MessageToast.show("No changes detected");
          oVm.setProperty("/editMode", false);
          oVm.setProperty("/toggleeditbtn", true);
          oVm.setProperty("/canAddRow", false);
          return;
        }

        const aPromises = [];

        // Delete records
        aDeletedRows.forEach(function (row) {
          if (row.ID) {
            const sPath =
              "/WarehouseStandards(ID=" +
              row.ID +
              ",WhseNo='" +
              row.WhseNo +
              "',Queue='" +
              encodeURIComponent(row.Queue) +
              "')";
            const oContext = oModel.bindContext(sPath).getBoundContext();
            const oDeletePromise = oContext.requestObject().then(function () {
              return oContext.delete("$auto");
            });
            aPromises.push(oDeletePromise);
          }
        });

        // Create new records
        aRows.forEach(function (row) {
          if (row.__state === "NEW") {
            const oListBinding = oModel.bindList("/WarehouseStandards");
            const oContext = oListBinding.create({
              WhseNo: row.WhseNo,
              Queue: row.Queue,
              Value: Number(row.Value) || 0,
              Uom: row.Uom,
            });
            aPromises.push(oContext.created());
          }
        });

        // Update existing records
        aRows.forEach(function (row) {
          if (row.__state === "UNCHANGED") {
            const orig = aOriginal.find(function (o) {
              return o.ID === row.ID;
            });
            if (orig && (row.Value !== orig.Value || row.Uom !== orig.Uom)) {
              const sPath =
                "/WarehouseStandards(ID=" +
                row.ID +
                ",WhseNo='" +
                row.WhseNo +
                "',Queue='" +
                encodeURIComponent(orig.Queue) +
                "')";
              const oContext = oModel.bindContext(sPath).getBoundContext();
              const oUpdatePromise = oContext.requestObject().then(function () {
                oContext.setProperty("Value", Number(row.Value) || 0);
                oContext.setProperty("Uom", row.Uom);
                // return oModel.submitBatch("$auto");
              });
              aPromises.push(oUpdatePromise);
            }
          }
        });

        // Wait for all operations and then submit
        Promise.all(aPromises)
          .then(function () {
            return oModel.submitBatch("$auto");
          })
          .then(function () {
            MessageToast.show("✅Saved successfully");
            oVm.setProperty("/editMode", false);
            oVm.setProperty("/toggleeditbtn", true);
            oVm.setProperty("/canAddRow", false);
            oVm.setProperty("/deletedRows", []);
            that._loadWarehouseStandards(that._currentWarehouse);
          })
          .catch(function (e) {
            let sMsg = "You are not authorized to perform this action";

            if (e && e.responseText) {
              try {
                const oErr = JSON.parse(e.responseText);
                sMsg = oErr.error?.message?.value || sMsg;
              } catch (ignore) { }
            }

            MessageBox.error(sMsg);
          });
      },
      /* ================= VALUE HELPS ================= */

      onQueueValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const sWhseNo = this._currentWarehouse;
        this._oQueueInput = oEvent.getSource();

        //  Cached for this warehouse
        if (oVm.getProperty("/queues").length > 0) {
          this._openQueueDialog();
          return;
        }

        sap.ui.core.BusyIndicator.show(0);

        this.getOwnerComponent()
          .getModel()
          .bindList("/Queues", null, null, [
            new Filter("Lgnum", FilterOperator.EQ, sWhseNo),
          ])
          .requestContexts(0, Infinity)
          .then(aCtx => {
            oVm.setProperty(
              "/queues",
              aCtx.map(c => c.getObject())
            );
            this._openQueueDialog();
          })
          .catch(() => {
            MessageToast.show("Failed to load Queues");
          })
          .finally(() => {
            sap.ui.core.BusyIndicator.hide();
          });
      },
      _openQueueDialog: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aQueues = oVm.getProperty("/queues");

        if (!this._oQueueDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({
                header: new sap.m.Text({ text: "Queue" }),
              }),
              new sap.m.Column({
                header: new sap.m.Text({ text: "Description" }),
              }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [
                  new sap.m.Text({ text: "{Queue}" }),
                  new sap.m.Text({ text: "{Text}" }),
                ],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search Queue...",
            liveChange: this.onQueueVHSearch.bind(this),
            search: this.onQueueVHSearch.bind(this),
          });

          this._oQueueDialog = new sap.m.Dialog({
            title: "Select Queue",
            contentWidth: "600px",
            contentHeight: "500px",
            draggable: true,
            resizable: true,
            content: [oSearchField, oTable],
            endButton: new sap.m.Button({
              text: "Cancel",
              press: () => this._oQueueDialog.close(),
            }),
          });

          this._oQueueDialog.setModel(new JSONModel(aQueues));
          this.getView().addDependent(this._oQueueDialog);
          this._oQueueTable = oTable;
        } else {
          // Refresh data if cache changed
          this._oQueueDialog.getModel().setData(aQueues);
        }

        this._oQueueTable.removeSelections(true);
        this._oQueueTable.getBinding("items").filter([]);
        this._oQueueTable.attachSelectionChange(
          this.onQueueRowSelect,
          this
        );

        this._oQueueDialog.open();
      },



      onQueueRowSelect: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) {
          return;
        }

        const oBindingContext = oSelectedItem.getBindingContext();
        const oQueueData = oBindingContext.getObject();
        const sQueue = oQueueData.Queue;

        const oCtx = this._oQueueInput.getBindingContext("ViewModel");
        const oVm = this.getView().getModel("ViewModel");
        const aRows = oVm.getProperty("/rows");

        // Check for duplicate queue - exclude current row from check
        const bDuplicate = aRows.some(
          (row) => row.Queue === sQueue && row !== oCtx.getObject()
        );

        if (bDuplicate) {
          MessageToast.show("This queue is already added");
          oSelectedItem.setSelected(false);
          return;
        }

        // Set the queue value to the input field
        oVm.setProperty(oCtx.getPath() + "/Queue", sQueue);
        this._oQueueDialog.close();
      },

      onQueueVHSearch: function (oEvent) {
        const sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue") || "";
        const aFilters = [];

        if (sValue) {
          aFilters.push(
            new Filter({
              filters: [
                new Filter("Queue", FilterOperator.Contains, sValue),
                new Filter("Text", FilterOperator.Contains, sValue),
              ],
              and: false,
            })
          );
        }

        this._oQueueTable.getBinding("items").filter(aFilters);
      },

      onUomValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        this._oUomInput = oEvent.getSource();

        //  Cached
        if (oVm.getProperty("/uoms").length > 0) {
          this._openUomDialog();
          return;
        }

        sap.ui.core.BusyIndicator.show(0);

        this.getOwnerComponent()
          .getModel()
          .bindList("/UnitsOfMeasure")
          .requestContexts(0, Infinity)
          .then(aCtx => {
            oVm.setProperty(
              "/uoms",
              aCtx.map(c => c.getObject())
            );
            this._openUomDialog();
          })
          .catch(() => {
            MessageToast.show("Failed to load UOMs");
          })
          .finally(() => {
            sap.ui.core.BusyIndicator.hide();
          });
      },
      _openUomDialog: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aUoms = oVm.getProperty("/uoms");

        if (!this._oUomDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({
                header: new sap.m.Text({ text: "UOM" }),
              }),
              new sap.m.Column({
                header: new sap.m.Text({ text: "Description" }),
              }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [
                  new sap.m.Text({ text: "{Msehi}" }),
                  new sap.m.Text({ text: "{MSEHL}" }),
                ],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search UOM...",
            liveChange: this.onUomVHSearch.bind(this),
            search: this.onUomVHSearch.bind(this),
          });

          this._oUomDialog = new sap.m.Dialog({
            title: "Select UOM",
            contentWidth: "600px",
            contentHeight: "500px",
            draggable: true,
            resizable: true,
            content: [oSearchField, oTable],
            endButton: new sap.m.Button({
              text: "Cancel",
              press: () => this._oUomDialog.close(),
            }),
          });

          this._oUomDialog.setModel(new JSONModel(aUoms));
          this.getView().addDependent(this._oUomDialog);
          this._oUomTable = oTable;
        } else {
          // Refresh data if cache changed
          this._oUomDialog.getModel().setData(aUoms);
        }

        this._oUomTable.removeSelections(true);
        this._oUomTable.getBinding("items").filter([]);
        this._oUomTable.attachSelectionChange(
          this.onUomRowSelect,
          this
        );

        this._oUomDialog.open();
      },


      onUomRowSelect: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) {
          return;
        }

        const oBindingContext = oSelectedItem.getBindingContext();
        const oUomData = oBindingContext.getObject();
        const sUom = oUomData.Msehi;

        const oCtx = this._oUomInput.getBindingContext("ViewModel");
        const oVm = this.getView().getModel("ViewModel");

        oVm.setProperty(oCtx.getPath() + "/Uom", sUom);
        this._oUomDialog.close();
      },

      onUomVHSearch: function (oEvent) {
        const sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue") || "";
        const aFilters = [];

        if (sValue) {
          aFilters.push(
            new Filter({
              filters: [
                new Filter("Msehi", FilterOperator.Contains, sValue),
                new Filter("MSEHL", FilterOperator.Contains, sValue),
              ],
              and: false,
            })
          );
        }

        this._oUomTable.getBinding("items").filter(aFilters);
      },





    });
  }
);
