

sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VariantItem",
  ],
  function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    VariantItem,
  ) {
    "use strict";

    return Controller.extend("plannedworkloaddashboard.controller.Main", {
      onInit() {
        const oViewModel = new JSONModel({
          selectedWarehouse: "",
          selectedQueues: [],
          waveDate: null,
          waveTime: null,
          pickDate: null,
          pickTime: null,
          hours48: true,
          hours24: false,
          reportType_IN: false,
          reportType_OUT: false,
          reportType: "BOTH",
          viewType: "SUMMARY",
          show24Hours: true,
          showResults: false,
          shiftData: [],
          isLoading: false,
          directionLabel: "Queue",
          userId: "",
          roles: [],
          allowedWarehouses: [],
          isGlobalAdmin: false,

        });
        this.getView().setModel(oViewModel, "viewModel");
        this._oVM = this.byId("variantManagement");
        this._oRouter = this.getOwnerComponent().getRouter();
        this._loadSavedVariants();
        this._applyDefaultVariant();

        this.getCurrentDateTime();
        this._loadUserContext();
      },

      getCurrentDateTime() {
        const ovm = this.getView().getModel("viewModel");
        const now = new Date();
        const current = new Date();
        const currentDate = current.toISOString().slice(0, 10);
        const currentTime = current.toTimeString().slice(0, 8);
        // For Time
        const formattedTime = now.toTimeString().slice(0, 8);
        // For Date

        now.setDate(now.getDate() + 2);

        const formattedDate = now.toISOString().slice(0, 10);


        // mapping date and time
        ovm.setProperty("/waveTime", currentTime);
        ovm.setProperty("/pickTime", formattedTime);
        ovm.setProperty("/waveDate", currentDate);
        ovm.setProperty("/pickDate", formattedDate);


      },



      onReportTypeSelect(oEvent) {
        const idx = oEvent.getSource().getSelectedIndex();
        const vm = this.getView().getModel("viewModel");
        // 0 = Inbound Only, 1 = Outbound Only, 2 = Both
        const reportType = idx === 0 ? "IN" : idx === 1 ? "OUT" : "BOTH";
        vm.setProperty("/reportType", reportType);
      },

      onViewTypeSelect(oEvent) {
        const idx = oEvent.getSource().getSelectedIndex();
        const vm = this.getView().getModel("viewModel");
        const wavedateStr = vm.getProperty("/waveDate");
        const viewType = idx === 0 ? "SUMMARY" : idx === 1 ? "SHIFT" : "LABOR";
        vm.setProperty("/viewType", viewType);
        this._applyViewTypeRules(viewType);

        // if (viewType === "SHIFT") {
        //   // FORCE hours state BEFORE hiding
        //   vm.setProperty("/hours48", true);
        //   vm.setProperty("/hours24", false);

        //   // Hide CheckBox
        //   vm.setProperty("/show24Hours", false);
        //   vm.setProperty("/hoursIndex", 0);

        //   // Force +48h date logic
        //   const oDate = new Date(wavedateStr);
        //   oDate.setDate(oDate.getDate() + 2);

        //   const formattedDate = oDate.toISOString().slice(0, 10);

        //   // Mapping the date to json model
        //   // vm.setProperty("/waveDate", formattedDate);
        //   vm.setProperty("/pickDate", formattedDate);

        // } else {
        //   vm.setProperty("/show24Hours", true);
        // }
        // vm.setProperty("/showHoursSelection", viewType !== "SHIFT");
      },

      onWaveDateDatePickerChange() {
        const ovm = this.getView().getModel("viewModel");
        const wavedateStr = ovm.getProperty("/waveDate");
        const is48 = ovm.getProperty("/hours48");
        const is24 = ovm.getProperty("/hours24");
        const daysToAdd = is48 ? 2 : is24 ? 1 : 0;

        const waveDate = new Date(wavedateStr);
        waveDate.setDate(waveDate.getDate() + daysToAdd);
        const PickDate = waveDate.toISOString().slice(0, 10)
        ovm.setProperty("/pickDate", PickDate);

      },
      onWaveTimeTimePickerChange() {
        const ovm = this.getView().getModel("viewModel");
        const waveTime = ovm.getProperty("/waveTime");


        ovm.setProperty("/pickTime", waveTime)
      },

      onHoursCheckboxSelect(oEvent) {
        const vm = this.getView().getModel("viewModel");
        const wavedateStr = vm.getProperty("/waveDate");
        const is48 = vm.getProperty("/hours48");
        const is24 = vm.getProperty("/hours24");

        // Ensure at least one is selected
        if (!is48 && !is24) {
          // If nothing is selected, reselect the one that was unchecked
          const oSource = oEvent.getSource();
          const sCheckboxText = oSource.getText();
          if (sCheckboxText === "48 Hours") {
            vm.setProperty("/hours48", true);
          } else if (sCheckboxText === "24 Hours") {
            vm.setProperty("/hours24", true);
          }
          return;
        }

        // Set dates based on first selected option (48 hours takes precedence)
        const oDate = new Date(wavedateStr);
        const daysToAdd = is48 ? 2 : is24 ? 1 : 0;
        oDate.setDate(oDate.getDate() + daysToAdd);
        const formattedDate = oDate.toISOString().slice(0, 10);

        // vm.setProperty("/waveDate", formattedDate);
        vm.setProperty("/pickDate", formattedDate);
        this._oVM.setModified(true);
      },
      // =================================================
      //        Variant Management
      // =================================================
      _loadSavedVariants: function () {
        const sStoredVariants = localStorage.getItem(
          "plannedWorkloadVariants",
        );
        if (sStoredVariants) {
          try {
            const aVariants = JSON.parse(sStoredVariants);
            aVariants.forEach((oVariant) => {
              const oItem = new VariantItem({
                key: oVariant.key,
                title: oVariant.title,
                author: oVariant.author || "User",
                favorite: true,
                visible: true,
                executeOnSelect: false,
                rename: true,
                changeable: true,
                remove: true,
              });
              this._oVM.addItem(oItem);
            });
          } catch (e) {
            console.error("Failed to parse variants", e);
          }
        }
      },

      _applyDefaultVariant: function () {
        const sDefaultKey = localStorage.getItem(
          "defaultPlannedWorkloadVariant",
        );
        if (sDefaultKey) {
          this._oVM.setDefaultKey(sDefaultKey);
          this._oVM.setSelectedKey(sDefaultKey);
          this._applyVariant(sDefaultKey);
        }
      },

      _applyVariant: function (sKey) {
        if (sKey === "standard") {
          this.onClear();
          return;
        }

        const sStoredVariants = localStorage.getItem(
          "plannedWorkloadVariants",
        );

        if (sStoredVariants) {
          try {
            const aVariants = JSON.parse(sStoredVariants);
            const oVariant = aVariants.find((v) => v.key === sKey);

            if (oVariant && oVariant.state) {
              const oState = oVariant.state;
              const vm = this.getView().getModel("viewModel");
              vm.setProperty("/selectedWarehouse", oState.selectedWarehouse || "");
              vm.setProperty("/selectedQueues", oState.selectedQueues || []);
              vm.setProperty("/waveDate", oState.waveDate || null);
              vm.setProperty("/waveTime", oState.waveTime || null);
              vm.setProperty("/pickDate", oState.pickDate || null);
              vm.setProperty("/pickTime", oState.pickTime || null);
              vm.setProperty("/hours48", oState.hours48 !== undefined ? oState.hours48 : true);
              vm.setProperty("/hours24", oState.hours24 || false);
              vm.setProperty("/reportType_IN", oState.reportType_IN || false);
              vm.setProperty("/reportType_OUT", oState.reportType_OUT || false);
              vm.setProperty("/reportType", oState.reportType || "BOTH");
              vm.setProperty("/viewType", oState.viewType || "SHIFT");
              this._applyViewTypeRules(vm.getProperty("/viewType"));

              const oViewTypeGroup = this.byId("viewTypeGroup");
              if (oViewTypeGroup) {
                oViewTypeGroup.setSelectedIndex(
                  oState.viewType === "SUMMARY" ? 0 : oState.viewType === "SHIFT" ? 1 : 2,
                );
              }

              MessageToast.show("Variant '" + oVariant.title + "' applied");
            }
          } catch (e) {
            console.error("Failed to apply variant", e);
          }
        }
      },

      _saveVariantsToStorage: function () {
        const aItems = this._oVM.getItems();
        const aVariants = [];

        aItems.forEach((oItem) => {
          const sKey = oItem.getKey();

          if (sKey === "standard") {
            return;
          }

          const sStoredVariants = localStorage.getItem(
            "plannedWorkloadVariants",
          );
          let oState = null;

          if (sStoredVariants) {
            try {
              const aStoredVariants = JSON.parse(sStoredVariants);
              const oStored = aStoredVariants.find((v) => v.key === sKey);
              if (oStored) {
                oState = oStored.state;
              }
            } catch (e) {
              console.error("Error parsing stored variants", e);
            }
          }

          aVariants.push({
            key: sKey,
            title: oItem.getTitle(),
            author: oItem.getAuthor(),
            state: oState,
          });
        });

        localStorage.setItem(
          "plannedWorkloadVariants",
          JSON.stringify(aVariants),
        );
      },
      _applyViewTypeRules(viewType) {
        const vm = this.getView().getModel("viewModel");

        if (viewType === "SHIFT") {
          vm.setProperty("/hours48", true);
          vm.setProperty("/hours24", false);
          vm.setProperty("/show24Hours", false);
          vm.setProperty("/showHoursSelection", false);
          const waveDateStr = vm.getProperty("/waveDate");
          // FORCE +48h date
          if (waveDateStr) {
            const d = new Date(waveDateStr);
            d.setDate(d.getDate() + 2);
            vm.setProperty("/pickDate", d.toISOString().slice(0, 10));
          }
        } else {
          vm.setProperty("/show24Hours", true);
          vm.setProperty("/showHoursSelection", true);
        }
      },


      _checkCurrentVariant: function () {
        const sSelectedKey = this._oVM.getSelectedKey();
        const oItem = this._oVM.getItemByKey(sSelectedKey);

        if (!oItem) {
          const sKey = this._oVM.getStandardVariantKey();
          if (sKey) {
            this._oVM.setSelectedKey(sKey);
          }
        }
      },

      _updateItems: function (mParams) {
        if (mParams.deleted) {
          mParams.deleted.forEach((sKey) => {
            const oItem = this._oVM.getItemByKey(sKey);
            if (oItem) {
              this._oVM.removeItem(oItem);
              oItem.destroy();
            }
          });
        }

        if (mParams.renamed) {
          mParams.renamed.forEach((oRenamed) => {
            const oItem = this._oVM.getItemByKey(oRenamed.key);
            if (oItem) {
              oItem.setTitle(oRenamed.name);
            }
          });
        }

        if (mParams.hasOwnProperty("def")) {
          this._oVM.setDefaultKey(mParams.def);
          localStorage.setItem(
            "defaultPlannedWorkloadVariant",
            mParams.def,
          );
        }

        this._checkCurrentVariant();
      },

      _createNewItem: function (mParams) {
        const sKey = "variant_" + Date.now();
        const vm = this.getView().getModel("viewModel");

        const oState = {
          selectedWarehouse: vm.getProperty("/selectedWarehouse"),
          selectedQueues: vm.getProperty("/selectedQueues"),
          waveDate: vm.getProperty("/waveDate"),
          waveTime: vm.getProperty("/waveTime"),
          pickDate: vm.getProperty("/pickDate"),
          pickTime: vm.getProperty("/pickTime"),
          hours48: vm.getProperty("/hours48"),
          hours24: vm.getProperty("/hours24"),
          reportType_IN: vm.getProperty("/reportType_IN"),
          reportType_OUT: vm.getProperty("/reportType_OUT"),
          reportType: vm.getProperty("/reportType"),
          viewType: vm.getProperty("/viewType"),
        };

        const oItem = new VariantItem({
          key: sKey,
          title: mParams.name,
          executeOnSelect: false,
          author: "User",
          favorite: true,
          changeable: true,
          remove: true,
          rename: true,
        });

        if (mParams.def) {
          this._oVM.setDefaultKey(sKey);
          localStorage.setItem("defaultPlannedWorkloadVariant", sKey);
        }

        this._oVM.addItem(oItem);

        const sStoredVariants = localStorage.getItem(
          "plannedWorkloadVariants",
        );
        let aVariants = [];

        if (sStoredVariants) {
          try {
            aVariants = JSON.parse(sStoredVariants);
          } catch (e) {
            console.error("Failed to parse variants", e);
          }
        }

        aVariants.push({
          key: sKey,
          title: mParams.name,
          author: "User",
          state: oState,
        });

        localStorage.setItem(
          "plannedWorkloadVariants",
          JSON.stringify(aVariants),
        );

        MessageToast.show("Variant '" + mParams.name + "' saved successfully");
        this._oVM.setModified(false);
      },

      onVariantSelect: function (oEvent) {
        const sKey = oEvent.getParameter("key");
        this._applyVariant(sKey);
        this._oVM.setModified(false);
      },

      onVariantSave: function (oEvent) {
        const mParams = oEvent.getParameters();

        if (mParams.overwrite) {
          const oItem = this._oVM.getItemByKey(mParams.key);
          const vm = this.getView().getModel("viewModel");

          const oState = {
            selectedWarehouse: vm.getProperty("/selectedWarehouse"),
            selectedQueues: vm.getProperty("/selectedQueues"),
            waveDate: vm.getProperty("/waveDate"),
            waveTime: vm.getProperty("/waveTime"),
            pickDate: vm.getProperty("/pickDate"),
            pickTime: vm.getProperty("/pickTime"),
            hours48: vm.getProperty("/hours48"),
            hours24: vm.getProperty("/hours24"),
            reportType_IN: vm.getProperty("/reportType_IN"),
            reportType_OUT: vm.getProperty("/reportType_OUT"),
            reportType: vm.getProperty("/reportType"),
            viewType: vm.getProperty("/viewType"),
          };

          const sStoredVariants = localStorage.getItem(
            "plannedWorkloadVariants",
          );
          let aVariants = [];

          if (sStoredVariants) {
            try {
              aVariants = JSON.parse(sStoredVariants);
            } catch (e) {
              console.error("Failed to parse variants", e);
            }
          }

          const oVariant = aVariants.find((v) => v.key === mParams.key);
          if (oVariant) {
            oVariant.state = oState;
            oVariant.title = mParams.name;
          }

          localStorage.setItem(
            "plannedWorkloadVariants",
            JSON.stringify(aVariants),
          );

          if (mParams.def) {
            this._oVM.setDefaultKey(mParams.key);
            localStorage.setItem(
              "defaultPlannedWorkloadVariant",
              mParams.key,
            );
          }

          MessageToast.show("Variant '" + oItem.getTitle() + "' updated");
          this._oVM.setModified(false);
        } else {
          this._createNewItem(mParams);
        }
      },

      onVariantManage: function (oEvent) {
        const mParams = oEvent.getParameters();
        this._updateItems(mParams);
        this._saveVariantsToStorage();
        MessageToast.show("Variants updated successfully");
      },

      // =================================================
      //        For Generate Report
      // =================================================

      onGenerateReport() {
        const vm = this.getView().getModel("viewModel");
         const whse = vm.getProperty("/selectedWarehouse");
        //Authorization
        const aAllowed = vm.getProperty("/allowedWarehouses" ) || [];
        const bGlobal = aAllowed.includes("ALL");
        console.log("aAllowed", aAllowed);
        console.log("bGlobal", bGlobal);

        if (!bGlobal && !aAllowed.includes(whse)) {
          MessageBox.error(`You are not authorized to access warehouse ${whse}`);

          return;
        }
       
        const selectedQueues = vm.getProperty("/selectedQueues");
        const reportType = vm.getProperty("/reportType"); // IN / OUT / BOTH
        const viewType = vm.getProperty("/viewType");     // SUMMARY / SHIFT / LABOR
        const is48Hours = vm.getProperty("/hours48");
        const is24Hours = vm.getProperty("/hours24");
        const WaveDatestr = vm.getProperty("/waveDate");
        const pickDatestr = vm.getProperty("/pickDate");


        const WaveDate = new Date(WaveDatestr);
        const PickDate = new Date(pickDatestr);
        console.log(isNaN(WaveDate.getTime()));
        // Validation for Warehouse
        if (!whse) {
          MessageBox.error("Please select a Warehouse");
          return;
        }

        // Check date is entered or not
        if (!pickDatestr || !WaveDatestr) {
          MessageBox.error("Please select any date to continue");
          return;
        }

        if (isNaN(WaveDate.getTime()) || isNaN(PickDate.getTime())) {
          MessageBox.error("Invalid Date Format");
          return;
        }
        // Validation for Date
        if (PickDate < WaveDate) {
          MessageBox.error("Wave Date cannot be greater than Pick Date");
          return;
        }

        // Direction label 
        let directionLabel = "Queue";
        if (reportType === "IN") {
          directionLabel = "Inbound Queue";
        } else if (reportType === "OUT") {
          directionLabel = "Outbound Queue";
        }
        vm.setProperty("/directionLabel", directionLabel);

        // Loading state
        vm.setProperty("/isLoading", true);
        vm.setProperty("/showResults", false);

        // single payload -> flag based
        const oPayload = {
          WarehouseNumber: whse,
          ReportType: reportType,
          ViewType: viewType,

          FortyEightHrs: is48Hours ? "X" : "",
          TwentyFourHrs: is24Hours ? "X" : "",

          WavedDate: vm.getProperty("/waveDate"),
          WavedTime: vm.getProperty("/waveTime"),
          PickCompleteDate: vm.getProperty("/pickDate"),
          PickCompleteTime: vm.getProperty("/pickTime"),

          Queues: selectedQueues.length
            ? selectedQueues.map(q => ({ Queue: q }))
            : []
        };

        const oModel = this.getView().getModel();

        this._fetchReportData(oModel, oPayload)
          .then((oResult) => {
            vm.setProperty("/isLoading", false);

            const inboundData = oResult.NavWhseQueueInbound || [];
            const outboundData = oResult.NavWhseQueueOutbound || [];

            if (inboundData.length === 0 && outboundData.length === 0) {
              MessageBox.information("No data found for selected criteria");
              return;
            }

            // Prepare navigation payload 
            const oNavigationData = {
              warehouseNumber: whse,
              reportType: reportType,
              reportTypeLabel: this._getReportTypeLabel(reportType),
              waveDateTime: this._formatDateTime(
                vm.getProperty("/waveDate"),
                vm.getProperty("/waveTime")
              ),
              pickCompleteDateTime: this._formatDateTime(
                vm.getProperty("/pickDate"),
                vm.getProperty("/pickTime")
              ),
              inboundData: inboundData,
              outboundData: outboundData,
              selectedQueues: selectedQueues,
              viewType: viewType,
              selectedHours: {
                hours48: is48Hours,
                hours24: is24Hours
              }
            };

            // Store navigation data
            const oNavModel = this.getOwnerComponent().getModel("navigation");
            oNavModel.setProperty("/navigationData", oNavigationData);


            let sRouteName = "shiftDetails";
            if (viewType === "SUMMARY") {
              sRouteName = "summaryView";
            } else if (viewType === "LABOR") {
              sRouteName = "laborView";
            } else if (viewType === "SHIFT") {
              sRouteName = "shiftDetails";
            }

            this._oRouter.navTo(sRouteName);
            MessageToast.show("Report generated successfully");
          })
          .catch((oError) => {
            vm.setProperty("/isLoading", false);
            MessageBox.error("Failed to generate report");
            console.error(oError);
          });
      },

      _fetchReportData(oModel, oPayload) {
        return new Promise((resolve, reject) => {
          const oActionBinding = oModel.bindContext("/getShiftViewData(...)");

          oActionBinding.setParameter("WarehouseNumber", oPayload.WarehouseNumber);
          oActionBinding.setParameter("ReportType", oPayload.ReportType);
          oActionBinding.setParameter("ViewType", oPayload.ViewType);
          // Hours flags 
          if (oPayload.FortyEightHrs) {
            oActionBinding.setParameter("FortyEightHrs", oPayload.FortyEightHrs);
          }
          if (oPayload.TwentyFourHrs) {
            oActionBinding.setParameter("TwentyFourHrs", oPayload.TwentyFourHrs);
          }

          if (oPayload.WavedDate) {
            oActionBinding.setParameter("WavedDate", oPayload.WavedDate);
          }
          if (oPayload.WavedTime) {
            oActionBinding.setParameter("WavedTime", oPayload.WavedTime);
          }
          if (oPayload.PickCompleteDate) {
            oActionBinding.setParameter("PickCompleteDate", oPayload.PickCompleteDate);
          }
          if (oPayload.PickCompleteTime) {
            oActionBinding.setParameter("PickCompleteTime", oPayload.PickCompleteTime);
          }


          if (oPayload.Queues?.length) {
            oActionBinding.setParameter("Queues", oPayload.Queues);
          }

          oActionBinding
            .execute()
            .then(() => {
              const oResult = oActionBinding.getBoundContext().getObject();
              console.log("Backend Response", oResult);
              resolve(oResult);
            })
            .catch((oError) => {
              reject(oError);
            });
        });
      },

      formatDeltaState: function (vDelta) {
        if (vDelta === null || vDelta === undefined) {
          return "None";
        }
        return vDelta < 0 ? "Error" : "Success";
      },

      onWarehouseChange: function (oEvent) {
        const vm = this.getView().getModel("viewModel");
        const sWarehouse = oEvent.getSource().getSelectedKey();

        // Clear selected queues and results
        vm.setProperty("/selectedWarehouse", sWarehouse);
        vm.setProperty("/selectedQueues", []);
        vm.setProperty("/showResults", false);
        vm.setProperty("/shiftData", []);
        this._oVM.setModified(true);

        const oQueueMCB = this.byId("queueMultiSelect");
        if (!oQueueMCB) {

          return;
        }
        const oBinding = oQueueMCB.getBinding("items");

        if (!sWarehouse) {
          oBinding.filter([]);
          return;
        }

        // Filter queues by selected warehouse number
        const oFilter = new Filter("Lgnum", FilterOperator.EQ, sWarehouse);
        oBinding.filter([oFilter]);
      },

      onQueueMultiSelectSelectionChange: function (oEvent) {
        const vm = this.getView().getModel("viewModel");
        const aSelectedQueues = oEvent.getSource().getSelectedKeys();
        vm.setProperty("/selectedQueues", aSelectedQueues);
        this._oVM.setModified(true);
      },

      onClear() {
        const vm = this.getView().getModel("viewModel");

        vm.setProperty("/selectedWarehouse", "");
        vm.setProperty("/selectedQueues", []);
        vm.setProperty("/waveDate", null);
        vm.setProperty("/waveTime", null);
        vm.setProperty("/pickDate", null);
        vm.setProperty("/pickTime", null);
        vm.setProperty("/reportType", "BOTH");
        vm.setProperty("/reportType_IN", false);
        vm.setProperty("/reportType_OUT", false);
        vm.setProperty("/viewType", "SUMMARY");
        vm.setProperty("/hours48", true);
        vm.setProperty("/hours24", false);
        vm.setProperty("/showResults", false);
        vm.setProperty("/shiftData", []);
        vm.setProperty("/isLoading", false);
        vm.setProperty("/directionLabel", "Queue");

        // Clear queue filter
        const oQueueMCB = this.byId("queueMultiSelect");
        if (oQueueMCB) {
          const oBinding = oQueueMCB.getBinding("items");
          if (oBinding) {
            oBinding.filter([]);
          }
        }

        MessageToast.show("Selection cleared");
      },

      _getReportTypeLabel(sReportType) {
        switch (sReportType) {
          case "IN":
            return "Inbound";
          case "OUT":
            return "Outbound";
          case "BOTH":
            return "Both Inbound & Outbound";
          default:
            return "Unknown";
        }
      },

      _formatDateTime(sDate, sTime) {
        if (!sDate && !sTime) {
          return "";
        }
        return `${sDate || ""} ${sTime || ""}`.trim();
      },
      _loadUserContext: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("viewModel");
        return new Promise((resolve, reject) => {

          const oActionBinding = oModel.bindContext("/getUserContext(...)");

          oActionBinding
            .execute()
            .then(() => {
              const oResult = oActionBinding.getBoundContext().getObject();

              console.log("User Context", oResult);

              oVm.setProperty("/userId", oResult.id);
              oVm.setProperty("/roles", oResult.roles || []);
              oVm.setProperty("/allowedWarehouses", oResult.allowedWarehouses || []);
              oVm.setProperty(
                "/isGlobalAdmin",
                (oResult.allowedWarehouses || []).includes("ALL")
              );

              return oResult;
            })
            .catch((oError) => {
              reject(oError);
            });
        });

      }
    });
  },
);
