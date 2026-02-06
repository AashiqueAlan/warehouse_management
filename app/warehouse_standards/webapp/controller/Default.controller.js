

sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/VariantItem",
    "sap/m/MessageBox"
  ],
  (Controller,
	JSONModel,
	MessageToast,
	VariantItem,
	MessageBox) => {
    "use strict";

    return Controller.extend("warehousestandards.controller.Default", {
      onInit: function () {
        // View model only (UI state)
        const oViewModel = new JSONModel({
          warehouses: [],
          selectedWarehouse: null,
          warehouseCount: 0,
          userId: "",
          roles: [],
          allowedWarehouses: [],
          isGlobalAdmin: false,
        });

        this.getView().setModel(oViewModel, "view");

        // Load data explicitly
        this._loadWarehouses();

        this._oVM = this.byId("variantManagement");
        this._loadSavedVariants();
        this._applyDefaultVariant();
        this._loadUserContext();
      },

      _loadSavedVariants: function () {
        const sStoredvariants = localStorage.getItem("warehouseVariants");
        if (sStoredvariants) {
          try {
            const aVariants = JSON.parse(sStoredvariants);
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
        const sDefaultkey = localStorage.getItem("defaultWarehouseVariant");
        if (sDefaultkey) {
          this._oVM.setDefaultKey(sDefaultkey);
          this._oVM.setSelectedKey(sDefaultkey);
          this._applyVariant(sDefaultkey);
        }
      },

      _applyVariant: function (sKey) {
        if (sKey === "standard") {
          this.getView()
            .getModel("view")
            .setProperty("/selectedWarehouse", null);
          return;
        }

        const sStoredVariants = localStorage.getItem("warehouseVariants");

        if (sStoredVariants) {
          try {
            const aVariants = JSON.parse(sStoredVariants);
            const oVariant = aVariants.find((v) => v.key === sKey);

            if (oVariant && oVariant.warehouse) {
              this.getView()
                .getModel("view")
                .setProperty("/selectedWarehouse", oVariant.warehouse);
              this.byId("warehouseInput")?.setSelectedKey(oVariant.warehouse);
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

          const sStoredVariants = localStorage.getItem("warehouseVariants");
          let sWarehouse = null;

          if (sStoredVariants) {
            try {
              const aStoredVariants = JSON.parse(sStoredVariants);
              const oStored = aStoredVariants.find((v) => v.key === sKey);
              if (oStored) {
                sWarehouse = oStored.warehouse;
              }
            } catch (e) {
              console.error("Error parsing stored variants", e);
            }
          }

          aVariants.push({
            key: sKey,
            title: oItem.getTitle(),
            author: oItem.getAuthor(),
            warehouse: sWarehouse,
          });
        });

        localStorage.setItem("warehouseVariants", JSON.stringify(aVariants));
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
          localStorage.setItem("defaultWarehouseVariant", mParams.def);
        }

        this._checkCurrentVariant();
      },

      _createNewItem: function (mParams) {
        const sKey = "variant_" + Date.now();
        const sSelectedWarehouse = this.getView()
          .getModel("view")
          .getProperty("/selectedWarehouse");

        if (!sSelectedWarehouse) {
          MessageToast.show("Please select a warehouse before saving variant");
          return;
        }

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
          localStorage.setItem("defaultWarehouseVariant", sKey);
        }

        this._oVM.addItem(oItem);

        const sStoredVariants = localStorage.getItem("warehouseVariants");
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
          warehouse: sSelectedWarehouse,
        });

        localStorage.setItem("warehouseVariants", JSON.stringify(aVariants));

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
          const sSelectedWarehouse = this.getView()
            .getModel("view")
            .getProperty("/selectedWarehouse");

          if (!sSelectedWarehouse) {
            MessageToast.show(
              "Please select a warehouse before saving variant",
            );
            return;
          }

          const sStoredVariants = localStorage.getItem("warehouseVariants");
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
            oVariant.warehouse = sSelectedWarehouse;
            oVariant.title = mParams.name;
          }

          localStorage.setItem("warehouseVariants", JSON.stringify(aVariants));

          if (mParams.def) {
            this._oVM.setDefaultKey(mParams.key);
            localStorage.setItem("defaultWarehouseVariant", mParams.key);
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
        this._oVM.setModified(true);
      },

      onContinue: function () {
        const oVm = this.getView().getModel("view");
        const sLgnum = this.getView()
          .getModel("view")
          .getProperty("/selectedWarehouse");

        const aAllowed = oVm.getProperty("/allowedWarehouses") || [];
        const bGlobal = aAllowed.includes("ALL");
        console.log("aAllowed",aAllowed);
        console.log("bGlobal",bGlobal);
        if (!bGlobal && !aAllowed.includes(sLgnum)) {
          MessageBox.error(`You are not authorized to access warehouse ${sLgnum}`);

          return;
        }

        if (!sLgnum) {
          MessageToast.show("Please select a warehouse");
          return;
        }

        sessionStorage.setItem("selectedWarehouse", sLgnum);

        this.getOwnerComponent().getRouter().navTo("Main", { lgnum: sLgnum });
      },

      _loadUserContext: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oVm = this.getView().getModel("view");
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
