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

    return Controller.extend("maintainutilization.controller.Main", {
      onInit: function () {
        const oVm = new JSONModel({
          rows: [],
          originalRows: [],
          deletedRows: [],
          deletedContexts: {},
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

      _onRouteMatched: function (oEvent) {
        const sWhseNo = oEvent.getParameter("arguments").lgnum;
        this._currentWarehouse = sWhseNo;

        const oVm = this.getView().getModel("ViewModel");
        oVm.setProperty("/warehouseDisplay", sWhseNo);
        oVm.setProperty("/rows", []);
        oVm.setProperty("/originalRows", []);
        oVm.setProperty("/deletedRows", []);
        oVm.setProperty("/deletedContexts", {});

        // Load data
        this._loadQueues(sWhseNo);
        this._loadShifts();
        this._loadResources(sWhseNo);
        this._loadUtilizationRates(sWhseNo);
      },

      /* ================= LOADERS ================= */

      _loadQueues: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");

        oModel
          .bindList("/Queues", null, null, [
            new Filter("Lgnum", FilterOperator.EQ, sWhseNo),
          ])
          .requestContexts(0, Infinity)
          .then(function (aCtx) {
            const aQueues = aCtx.map(function (c) {
              return c.getObject();
            });
            oVm.setProperty("/queues", aQueues);
            console.log("Queues loaded:", aQueues.length);
          })
          .catch(function (err) {
            console.error("Failed to load queues:", err);
            MessageToast.show("Failed to load queues.");
            oVm.setProperty("/queues", []);
          });
      },
      _loadShifts: function () {
        const oVm = this.getView().getModel("ViewModel");

        // TEMP: Backend ShiftDayNumbers not available yet
        // Replace with OData call when service is ready
        const aFallbackShifts = [
          {
            Timeint: "MORNING",
            Timemodel: "Morning Shift",
          },
          {
            Timeint: "EVENING",
            Timemodel: "Evening Shift",
          },
        ];

        oVm.setProperty("/shifts", aFallbackShifts);
      },

      // _loadShifts: function () {
      //   const oModel = this.getOwnerComponent().getModel();
      //   const oVm = this.getView().getModel("ViewModel");

      //   oModel
      //     .bindList("/ShiftDayNumbers")
      //     .requestContexts(0, Infinity)
      //     .then(function (aCtx) {
      //       const aShifts = aCtx.map(function (c) {
      //         return c.getObject();
      //       });
      //       oVm.setProperty("/shifts", aShifts);
      //       console.log("Shifts loaded:", aShifts.length);
      //     })
      //     .catch(function (err) {
      //       console.error("Failed to load shifts:", err);
      //       MessageToast.show("Failed to load shifts.");
      //       oVm.setProperty("/shifts", []);
      //     });
      // },

      _loadResources: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");

        oModel
          .bindList("/Resources", null, null, [
            new Filter("Lgnum", FilterOperator.EQ, sWhseNo),
          ])
          .requestContexts(0, Infinity)
          .then(function (aCtx) {
            const aResources = aCtx.map(function (c) {
              return c.getObject();
            });
            oVm.setProperty("/resources", aResources);
            console.log("Resources loaded:", aResources.length);
          })
          .catch(function (err) {
            console.error("Failed to load resources:", err);
            MessageToast.show("Failed to load resources.");
            oVm.setProperty("/resources", []);
          });
      },

      _loadUtilizationRates: function (sWhseNo) {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("ViewModel");

        oModel
          .bindList(
            "/UtilizationRates",
            null,
            [new Sorter("createdAt", false)],
            [new Filter("WhseNo", FilterOperator.EQ, sWhseNo)]
          )
          .requestContexts(0, Infinity)
          .then(function (aCtx) {
            const aRows = aCtx.map(function (c, i) {
              const oData = c.getObject();
              return {
                SNo: i + 1,

                WhseNo: oData.WhseNo,
                Shift: oData.Shift,
                Resource: oData.Resource,
                Queue: oData.Queue,
                UtilizationRate: oData.UtilizationRate,
                createdAt: oData.createdAt,
                __state: "UNCHANGED",
              };
            });

            oVm.setProperty("/rows", aRows);

            //  Clone WITHOUT oContext to avoid circular reference
            const aOriginalRows = aRows.map((row, index) => ({
              SNo: row.SNo,
              WhseNo: row.WhseNo,
              origShift: row.Shift,
              origResource: row.Resource,
              origQueue: row.Queue,
              Shift: row.Shift,
              Resource: row.Resource,
              Queue: row.Queue,
              UtilizationRate: row.UtilizationRate,
              createdAt: row.createdAt,
              __state: row.__state,
              origIndex: index,
            }));
            oVm.setProperty("/originalRows", aOriginalRows);

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
            console.error("Failed to load utilization rates", err);
            MessageToast.show("Failed to load data. You can add new rows.");
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
          Shift: "",
          Resource: "",
          Queue: "",
          UtilizationRate: 0,
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

        // EXACT WarehouseStandards pattern
        if (deletedRow.__state === "UNCHANGED") {
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
        const aShifts = oVm.getProperty("/shifts");
        const aResources = oVm.getProperty("/resources");
        const that = this;

        // ========== VALIDATION ==========
        for (var i = 0; i < aRows.length; i++) {
          if (
            !aRows[i].Shift ||
            !aRows[i].Resource ||
            !aRows[i].Queue ||
            aRows[i].UtilizationRate === "" ||
            aRows[i].UtilizationRate === null ||
            aRows[i].UtilizationRate === undefined
          ) {
            MessageBox.error("Please fill all fields in row " + (i + 1));
            return;
          }

          // Validate Shift exists
          const bShiftExists = aShifts.some(function (s) {
            return s.Timeint === aRows[i].Shift;
          });
          if (!bShiftExists) {
            MessageBox.error(
              "Shift '" +
                aRows[i].Shift +
                "' in row " +
                (i + 1) +
                " is not valid."
            );
            return;
          }

          // Validate Resource exists
          const bResourceExists = aResources.some(function (r) {
            return r.Rsrc === aRows[i].Resource;
          });
          if (!bResourceExists) {
            MessageBox.error(
              "Resource '" +
                aRows[i].Resource +
                "' in row " +
                (i + 1) +
                " is not available."
            );
            return;
          }

          // Validate Queue exists
          const bQueueExists = aQueues.some(function (q) {
            return q.Queue === aRows[i].Queue;
          });
          if (!bQueueExists) {
            MessageBox.error(
              "Queue '" +
                aRows[i].Queue +
                "' in row " +
                (i + 1) +
                " is not available."
            );
            return;
          }

          if (aRows[i].UtilizationRate < 0 || aRows[i].UtilizationRate > 100) {
            MessageBox.error(
              "Utilization Rate in row " +
                (i + 1) +
                " must be between 0 and 100."
            );
            return;
          }
        }

        // Check UI duplicates
        for (let i = 0; i < aRows.length; i++) {
          for (let j = i + 1; j < aRows.length; j++) {
            if (
              aRows[i].WhseNo === aRows[j].WhseNo &&
              aRows[i].Shift === aRows[j].Shift &&
              aRows[i].Resource === aRows[j].Resource &&
              aRows[i].Queue === aRows[j].Queue
            ) {
              MessageBox.error(
                "Duplicate entry found.\n\nRow " +
                  (i + 1) +
                  " and Row " +
                  (j + 1) +
                  " have the same combination."
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

        const bHasModifiedRows = aRows.some(function (row, index) {
          const orig = aOriginal.find(function (o) {
            return o.origIndex === index;
          });
          if (orig) {
            return (
              Number(row.UtilizationRate) !== Number(orig.UtilizationRate) ||
              row.Shift !== orig.Shift ||
              row.Resource !== orig.Resource ||
              row.Queue !== orig.Queue
            );
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

        // ========== DELETE records ==========
        aDeletedRows.forEach(function (row) {
          const sPath = `/UtilizationRates(WhseNo='${row.WhseNo}',Shift='${
            row.Shift
          }',Resource='${row.Resource}',Queue='${encodeURIComponent(
            row.Queue
          )}')`;
          const oContext = oModel.bindContext(sPath).getBoundContext();
          const oDeletePromise = oContext.requestObject().then(function () {
            return oContext.delete("$auto");
          });
          aPromises.push(oDeletePromise);
        });

        // ========== CREATE new records ==========
        aRows.forEach(function (row) {
          if (row.__state === "NEW") {
            const oListBinding = oModel.bindList("/UtilizationRates");
            const oContext = oListBinding.create({
              WhseNo: row.WhseNo,
              Shift: row.Shift,
              Resource: row.Resource,
              Queue: row.Queue,
              UtilizationRate: Number(row.UtilizationRate) || 0,
            });
            aPromises.push(oContext.created());
          }
        });

        // ========== UPDATE existing records ==========
        aRows.forEach(function (row, index) {
          if (row.__state === "UNCHANGED") {
            const orig = aOriginal.find(function (o) {
              return o.origIndex === index; //
            });
            if (orig) {
              //  CHECK ALL FIELDS FOR CHANGES
              const bIsModified =
                Number(row.UtilizationRate) !== Number(orig.UtilizationRate) ||
                row.Shift !== orig.Shift ||
                row.Resource !== orig.Resource ||
                row.Queue !== orig.Queue;

              if (bIsModified) {
                //  UPDATE ALL CHANGED FIELDS
                const sPath = `/UtilizationRates(WhseNo='${
                  row.WhseNo
                }',Shift='${orig.origShift}',Resource='${
                  orig.origResource
                }',Queue='${encodeURIComponent(orig.origQueue)}')`;
                const oContext = oModel.bindContext(sPath).getBoundContext();
                const oUpdatePromise = oContext
                  .requestObject()
                  .then(function () {
                    //  Use ORIGINAL keys for OData path, NEW values for update
                    oContext.setProperty("Shift", row.Shift);
                    oContext.setProperty("Resource", row.Resource);
                    oContext.setProperty("Queue", row.Queue);
                    oContext.setProperty(
                      "UtilizationRate",
                      Number(row.UtilizationRate)
                    );
                    return oModel.submitBatch("$auto");
                  });
                aPromises.push(oUpdatePromise);
              }
            }
          }
        });

        // Wait for all operations and then submit
        Promise.all(aPromises)
          .then(function () {
            return oModel.submitBatch("$auto");
          })
          .then(function () {
            MessageToast.show("✅ Saved successfully");
            oVm.setProperty("/editMode", false);
            oVm.setProperty("/toggleeditbtn", true);
            oVm.setProperty("/canAddRow", false);
            oVm.setProperty("/deletedRows", []);
            that._loadUtilizationRates(that._currentWarehouse);
          })
          .catch(function (e) {
            console.error("Save error:", e);
            MessageBox.error("Save failed: " + (e.message || "Unknown error"));
          });
      },

      /* ================= VALUE HELPS ================= */

      onShiftValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const aShifts = oVm.getProperty("/shifts");
        const oSource = oEvent.getSource();

        if (aShifts.length === 0) {
          MessageToast.show("No shifts available.");
          return;
        }

        this._oShiftInput = oSource;

        if (!this._oShiftDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({ header: new sap.m.Text({ text: "Shift" }) }),
              new sap.m.Column({
                header: new sap.m.Text({ text: "Time Model" }),
              }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [
                  new sap.m.Text({ text: "{Timeint}" }),
                  new sap.m.Text({ text: "{Timemodel}" }),
                ],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search Shift...",
            search: this.onShiftVHSearch.bind(this),
            liveChange: this.onShiftVHSearch.bind(this),
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
              press: function () {
                this._oShiftDialog.close();
              }.bind(this),
            }),
          });

          this._oShiftDialog.setModel(new JSONModel(aShifts));
          this.getView().addDependent(this._oShiftDialog);
          this._oShiftTable = oTable;
        } else {
          this._oShiftDialog.getModel().setData(aShifts);
        }

        this._oShiftTable.getBinding("items").filter([]);
        this._oShiftTable.removeSelections(true);
        this._oShiftTable.detachSelectionChange(this.onShiftRowSelect, this);
        this._oShiftTable.attachSelectionChange(this.onShiftRowSelect, this);
        this._oShiftDialog.open();
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
                new Filter("Timemodel", FilterOperator.Contains, sValue),
              ],
              and: false,
            })
          );
        }

        this._oShiftTable.getBinding("items").filter(aFilters);
      },

      onResourceValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const aResources = oVm.getProperty("/resources");
        const oSource = oEvent.getSource();

        if (aResources.length === 0) {
          MessageToast.show("No resources available.");
          return;
        }

        this._oResourceInput = oSource;

        if (!this._oResourceDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({
                header: new sap.m.Text({ text: "Resource" }),
              }),
              new sap.m.Column({ header: new sap.m.Text({ text: "Type" }) }),
            ],
            items: {
              path: "/",
              template: new sap.m.ColumnListItem({
                type: "Active",
                cells: [
                  new sap.m.Text({ text: "{Rsrc}" }),
                  new sap.m.Text({ text: "{RsrcType}" }),
                ],
              }),
            },
          });

          const oSearchField = new sap.m.SearchField({
            width: "100%",
            placeholder: "Search Resource...",
            search: this.onResourceVHSearch.bind(this),
            liveChange: this.onResourceVHSearch.bind(this),
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
              press: function () {
                this._oResourceDialog.close();
              }.bind(this),
            }),
          });

          this._oResourceDialog.setModel(new JSONModel(aResources));
          this.getView().addDependent(this._oResourceDialog);
          this._oResourceTable = oTable;
        } else {
          this._oResourceDialog.getModel().setData(aResources);
        }

        this._oResourceTable.getBinding("items").filter([]);
        this._oResourceTable.removeSelections(true);
        this._oResourceTable.detachSelectionChange(
          this.onResourceRowSelect,
          this
        );
        this._oResourceTable.attachSelectionChange(
          this.onResourceRowSelect,
          this
        );
        this._oResourceDialog.open();
      },

      onResourceRowSelect: function (oEvent) {
        const oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) {
          return;
        }

        const oBindingContext = oSelectedItem.getBindingContext();
        const oResourceData = oBindingContext.getObject();
        const sResource = oResourceData.Rsrc;

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
                new Filter("Rsrc", FilterOperator.Contains, sValue),
                new Filter("RsrcType", FilterOperator.Contains, sValue),
              ],
              and: false,
            })
          );
        }

        this._oResourceTable.getBinding("items").filter(aFilters);
      },

      onQueueValueHelp: function (oEvent) {
        const oVm = this.getView().getModel("ViewModel");
        const aQueues = oVm.getProperty("/queues");
        const oSource = oEvent.getSource();

        if (aQueues.length === 0) {
          MessageToast.show("No queues available.");
          return;
        }

        this._oQueueInput = oSource;

        if (!this._oQueueDialog) {
          const oTable = new sap.m.Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            columns: [
              new sap.m.Column({ header: new sap.m.Text({ text: "Queue" }) }),
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
            search: this.onQueueVHSearch.bind(this),
            liveChange: this.onQueueVHSearch.bind(this),
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
              press: function () {
                this._oQueueDialog.close();
              }.bind(this),
            }),
          });

          this._oQueueDialog.setModel(new JSONModel(aQueues));
          this.getView().addDependent(this._oQueueDialog);
          this._oQueueTable = oTable;
        } else {
          this._oQueueDialog.getModel().setData(aQueues);
        }

        this._oQueueTable.getBinding("items").filter([]);
        this._oQueueTable.removeSelections(true);
        this._oQueueTable.detachSelectionChange(this.onQueueRowSelect, this);
        this._oQueueTable.attachSelectionChange(this.onQueueRowSelect, this);
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
    });
  }
);
