sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
  ) {
    "use strict";

    return Controller.extend("maintainutilization.controller.Main", {
      onInit: function () {
        const oVm = new JSONModel({
          rows: [],
          originalRows: [],
          deletedRows: [],
          // deletedContexts: {},
          queues: [],
          shifts: [],
          resources: [],
          editMode: false,
          toggleeditbtn: true,
          canAddRow: true,
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

      _loadInitialProcessors: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");

        const oListBinding = oModel.bindList(
          "/ReadWhsProcessor",
          null,
          null,
          [new Filter("WarehouseNumber", FilterOperator.EQ, sWhseNo)],
          { $expand: "NavWhseProcessors" },
        );

        oListBinding.requestContexts(0, 1).then((aCtx) => {
          if (!aCtx.length) return;

          const aProcessors = aCtx[0].getObject().NavWhseProcessors || [];

          const aRows = aProcessors.map((p, i) => ({
            SNo: i + 1,
            WhseNo: p.WarehouseNumber,
            Shift: p.Shift,
            Resource: p.Processor,
            Queue: "",
            UtilizationRate: 0,
            __state: "NEW",
            __source: "FALLBACK"
          }));

          oVm.setProperty("/rows", aRows);
          oVm.setProperty("/originalRows", []);
          oVm.setProperty("/editMode", false);
          oVm.setProperty("/toggleeditbtn", true);
          oVm.setProperty("/canAddRow", true);
        });
      },

      _onRouteMatched: function (oEvent) {
        const sWhseNo = oEvent.getParameter("arguments").lgnum;
        this._currentWarehouse = sWhseNo;

        const oVm = this.getView().getModel("ViewModel");
        oVm.setProperty("/warehouseDisplay", sWhseNo);
        oVm.setProperty("/queues", []);
        oVm.setProperty("/shifts", []);
        oVm.setProperty("/resources", []);
        oVm.setProperty("/rows", []);
        oVm.setProperty("/originalRows", []);
        oVm.setProperty("/deletedRows", []);
        // oVm.setProperty("/deletedContexts", {});
        this._loadWarehouseData(sWhseNo);
      },

      /* ================= LOADERS ================= */
      _loadWarehouseData: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");

        oModel
          .bindList("/UtilizationRates", null, null, [
            new Filter("WhseNo", FilterOperator.EQ, sWhseNo),
          ])
          .requestContexts(0, Infinity)
          .then((aCtx) => {
            if (aCtx.length > 0) {
              //  CASE 1: DB DATA EXISTS
              const aRows = aCtx.map((c, i) => {
                const o = c.getObject();
                return {
                  SNo: i + 1,
                  __rowKey: `${o.WhseNo}|${o.Shift}|${o.Resource}|${o.Queue}`,
                  WhseNo: o.WhseNo,
                  Shift: o.Shift,
                  Resource: o.Resource,
                  Queue: o.Queue,
                  UtilizationRate: o.UtilizationRate,
                  __state: "UNCHANGED",
                  __source: "DB"
                };
              });

              oVm.setProperty("/rows", aRows);
              oVm.setProperty(
                "/originalRows",
                aRows.map((r) => ({
                  __rowKey: r.__rowKey,
                  origShift: r.Shift,
                  origResource: r.Resource,
                  origQueue: r.Queue,
                  UtilizationRate: r.UtilizationRate,
                })),
              );

              oVm.setProperty("/editMode", false);
              oVm.setProperty("/toggleeditbtn", true);
              oVm.setProperty("/canAddRow", false);
            } else {
              //  CASE 2: NO DB DATA → BACKEND FALLBACK
              this._loadInitialProcessors(sWhseNo);
            }
          })
          .catch((e) => {
            console.error("Failed to load warehouse data", e);
            MessageToast.show("Failed to load warehouse data");
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
          Shift: "",
          Resource: "",
          Queue: "",
          UtilizationRate: 0,
          __state: "NEW",
          __source: "UI"
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
          10,
        );

        const deletedRow = aRows[iIndex];

        //  WarehouseStandards pattern
        if (deletedRow.__state === "UNCHANGED") {
          const aDeletedRows = oVm.getProperty("/deletedRows") || [];
          aDeletedRows.push(deletedRow);
          oVm.setProperty("/deletedRows", aDeletedRows);
        }

        aRows.splice(iIndex, 1);

        // re-number
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
        const that = this;

        // ===== VALIDATION =====
        for (let i = 0; i < aRows.length; i++) {
          const r = aRows[i];

          if (!r.Shift || !r.Resource || !r.Queue || r.UtilizationRate == null || r.UtilizationRate === "") {
            MessageBox.error("Please fill all fields in row " + (i + 1));
            return;
          }

          if (r.UtilizationRate < 0 || r.UtilizationRate > 100) {
            MessageBox.error("Utilization Rate must be between 0 and 100 (row " + (i + 1) + ")");
            return;
          }
        }

        // ===== CHANGE CHECK =====
        const bHasNew = aRows.some(r => r.__state === "NEW");
        const bHasDelete = aDeletedRows.length > 0;
        const bHasUpdate = aRows.some(r => {
          if (r.__state === "NEW") return false;
          const o = aOriginal.find(x => x.__rowKey === r.__rowKey);
          return o && Number(o.UtilizationRate) !== Number(r.UtilizationRate);
        });

        if (!bHasNew && !bHasDelete && !bHasUpdate) {
          MessageToast.show("No changes detected");
          oVm.setProperty("/editMode", false);
          oVm.setProperty("/toggleeditbtn", true);
          return;
        }

        const aPromises = [];

        // ===== DELETE =====
        aDeletedRows.forEach(r => {
          const sPath =
            "/UtilizationRates(WhseNo='" + r.WhseNo +
            "',Shift='" + r.Shift +
            "',Resource='" + r.Resource +
            "',Queue='" + encodeURIComponent(r.Queue) + "')";

          const ctx = oModel.bindContext(sPath).getBoundContext();
          aPromises.push(ctx.requestObject().then(() => ctx.delete("$auto")));
        });

        // ===== CREATE =====

        aRows.forEach(r => {
          if (r.__state === "NEW") {

            const existsInDb =
              r.__source !== "UI" &&
              aOriginal.some(o =>
                o.origShift === r.Shift &&
                o.origResource === r.Resource &&
                o.origQueue === r.Queue
              );

            if (existsInDb) {
              // treat as UPDATE instead of CREATE
              const sPath =
                "/UtilizationRates(WhseNo='" + r.WhseNo +
                "',Shift='" + r.Shift +
                "',Resource='" + r.Resource +
                "',Queue='" + encodeURIComponent(r.Queue) + "')";

              const ctx = oModel.bindContext(sPath).getBoundContext();
              ctx.setProperty("UtilizationRate", Number(r.UtilizationRate));
              return;
            }

            // REAL CREATE
            const lb = oModel.bindList("/UtilizationRates");
            const ctx = lb.create({
              WhseNo: r.WhseNo,
              Shift: r.Shift,
              Resource: r.Resource,
              Queue: r.Queue,
              UtilizationRate: Number(r.UtilizationRate)
            });
            aPromises.push(ctx.created());
          }
        });


        // ===== UPDATE =====
        aRows.forEach(r => {
          if (r.__state === "UNCHANGED") {
            const o = aOriginal.find(x => x.__rowKey === r.__rowKey);
            if (o && Number(o.UtilizationRate) !== Number(r.UtilizationRate)) {
              const sPath =
                "/UtilizationRates(WhseNo='" + r.WhseNo +
                "',Shift='" + o.origShift +
                "',Resource='" + o.origResource +
                "',Queue='" + encodeURIComponent(o.origQueue) + "')";

              const ctx = oModel.bindContext(sPath).getBoundContext();
              ctx.setProperty("UtilizationRate", Number(r.UtilizationRate));
            }
          }
        });

        // ===== COMMIT =====
        Promise.all(aPromises)
          .then(() => oModel.submitBatch("$auto"))
          .then(() => {
            MessageToast.show("✅ Saved successfully");
            oVm.setProperty("/editMode", false);
            oVm.setProperty("/toggleeditbtn", true);
            oVm.setProperty("/canAddRow", false);
            oVm.setProperty("/deletedRows", []);
            that._loadWarehouseData(that._currentWarehouse);
          })
          .catch(() => {
            MessageBox.error("Save failed");
          });
      },


      /* ================= VALUE HELPS ================= */

      onShiftValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const sWhseNo = this._currentWarehouse;
        this._oShiftInput = oEvent.getSource();



        if (oVm.getProperty("/shifts").length > 0) {
          this._openShiftDialog();
          return;
        }

        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel()
          .bindList("/ShiftDayNumbers", null, null, [
            new Filter("WarehouseNumber", FilterOperator.EQ, sWhseNo),
          ])
          .requestContexts(0, Infinity)
          .then(aCtx => {
            oVm.setProperty(
              "/shifts",
              aCtx.map(c => c.getObject())
            );
            this._openShiftDialog();
          }).catch(() => {
            MessageToast.show("Failed to load Shifts");
          }).finally(() => {
            sap.ui.core.BusyIndicator.hide();
          });
      },


      onShiftRowSelect: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) {
          return;
        }

        const oBindingContext = oSelectedItem.getBindingContext();
        const oShiftData = oBindingContext.getObject();
        const sShift = oShiftData.Timeint;

        const oCtx = this._oShiftInput.getBindingContext("ViewModel");
        const oVm = this.getView().getModel("ViewModel");

        oVm.setProperty(oCtx.getPath() + "/Shift", sShift);
        this._oShiftDialog.close();
      },

      onShiftVHSearch: function (oEvent) {
        const sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue") || "";
        const aFilters = [];

        if (sValue) {
          aFilters.push(
            new Filter({
              filters: [
                new Filter("Timeint", FilterOperator.Contains, sValue),
                ,
              ],
              and: false,
            }),
          );
        }

        this._oShiftTable.getBinding("items").filter(aFilters);
      },

      onResourceValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const oSource = oEvent.getSource();
        const sWhseNo = this._currentWarehouse;

        this._oResourceInput = oSource;

        //  If already loaded, just open dialog
        if (oVm.getProperty("/resources").length > 0) {
          this._openResourceDialog();
          return;
        }

        sap.ui.core.BusyIndicator.show(0);
        const oModel = this.getOwnerComponent().getModel();

        oModel.bindList("/Resources", null, null, [
          new Filter("WarehouseNumber", FilterOperator.EQ, sWhseNo),
        ])
          .requestContexts(0, Infinity)
          .then(aCtx => {
            const aAll = aCtx.map(c => c.getObject());

            // Deduplicate by Processor
            const m = {};
            aAll.forEach(r => {
              if (!m[r.Processor]) {
                m[r.Processor] = {
                  Processor: r.Processor,
                  FullName: r.FullName || ""
                };
              }
            });

            oVm.setProperty("/resources", Object.values(m));
            this._openResourceDialog();
          })
          .catch(() => {
            MessageToast.show("Failed to load resources");
          }).finally(() => {
            sap.ui.core.BusyIndicator.hide();
          });
      },


      onResourceRowSelect: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) {
          return;
        }

        const oBindingContext = oSelectedItem.getBindingContext();
        const oResourceData = oBindingContext.getObject();
        const sResource = oResourceData.Processor;

        const oCtx = this._oResourceInput.getBindingContext("ViewModel");

        const oVm = this.getView().getModel("ViewModel");

        oVm.setProperty(oCtx.getPath() + "/Resource", sResource);
        this._oResourceDialog.close();
      },

      onResourceVHSearch: function (oEvent) {
        const sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue") || "";
        const aFilters = [];

        if (sValue) {
          aFilters.push(
            new Filter({
              filters: [
                new Filter("Processor", FilterOperator.Contains, sValue),
                new Filter("FullName", FilterOperator.Contains, sValue)
              ],
              and: false,
            }),
          );
        }

        this._oResourceTable.getBinding("items").filter(aFilters);
      },

      onQueueValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const sWhseNo = this._currentWarehouse;
        this._oQueueInput = oEvent.getSource();

        if (oVm.getProperty("/queues").length > 0) {
          this._openQueueDialog();
          return;
        }
        sap.ui.core.BusyIndicator.show(0);
        this.getOwnerComponent().getModel()
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
          }).catch(() => {
            MessageToast.show("Failed to load Queues");
          }).finally(() => {
            sap.ui.core.BusyIndicator.hide();
          });
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
            }),
          );
        }

        this._oQueueTable.getBinding("items").filter(aFilters);
      },
      _openResourceDialog: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aResources = oVm.getProperty("/resources");

        if (!this._oResourceDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({ header: new sap.m.Text({ text: "Resource" }) }),
              new sap.m.Column({ header: new sap.m.Text({ text: "Name" }) }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [
                  new sap.m.Text({ text: "{Processor}" }),
                  new sap.m.Text({ text: "{FullName}" }),
                ],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search Resource...",
            liveChange: this.onResourceVHSearch.bind(this),
            search: this.onResourceVHSearch.bind(this),
          });

          this._oResourceDialog = new sap.m.Dialog({
            title: "Select Resource",
            contentWidth: "600px",
            contentHeight: "500px",
            draggable: true,
            resizable: true,
            content: [oSearchField, oTable],
            endButton: new sap.m.Button({
              text: "Cancel",
              press: () => this._oResourceDialog.close(),
            }),
          });

          this._oResourceDialog.setModel(new JSONModel(aResources));
          this.getView().addDependent(this._oResourceDialog);
          this._oResourceTable = oTable;
        } else {
          this._oResourceDialog.getModel().setData(aResources);
        }

        this._oResourceTable.removeSelections(true);
        this._oResourceTable
          .getBinding("items")
          .filter([]);
        this._oResourceTable.attachSelectionChange(
          this.onResourceRowSelect,
          this
        );

        this._oResourceDialog.open();
      },
      _openShiftDialog: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aShifts = oVm.getProperty("/shifts");

        if (!this._oShiftDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            columns: [
              new sap.m.Column({ header: new sap.m.Text({ text: "Shift" }) }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [new sap.m.Text({ text: "{Timeint}" })],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search Shift...",
            liveChange: this.onShiftVHSearch.bind(this),
            search: this.onShiftVHSearch.bind(this),
          });

          this._oShiftDialog = new sap.m.Dialog({
            title: "Select Shift",
            contentWidth: "600px",
            contentHeight: "500px",
            draggable: true,
            resizable: true,
            content: [oSearchField, oTable],
            endButton: new sap.m.Button({
              text: "Cancel",
              press: () => this._oShiftDialog.close(),
            }),
          });

          this._oShiftDialog.setModel(new JSONModel(aShifts));
          this.getView().addDependent(this._oShiftDialog);
          this._oShiftTable = oTable;
        } else {
          this._oShiftDialog.getModel().setData(aShifts);
        }

        this._oShiftTable.removeSelections(true);
        this._oShiftTable.getBinding("items").filter([]);
        this._oShiftTable.attachSelectionChange(
          this.onShiftRowSelect,
          this
        );

        this._oShiftDialog.open();
      },

      _openQueueDialog: function () {
        const oVm = this.getView().getModel("ViewModel");
        const aQueues = oVm.getProperty("/queues");

        if (!this._oQueueDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            columns: [
              new sap.m.Column({ header: new sap.m.Text({ text: "Queue" }) }),
              new sap.m.Column({ header: new sap.m.Text({ text: "Description" }) }),
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


    });
  },
);
