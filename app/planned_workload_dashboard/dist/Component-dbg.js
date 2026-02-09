sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "plannedworkloaddashboard/model/models"
], (UIComponent, JSONModel, models) => {
    "use strict";

    return UIComponent.extend("plannedworkloaddashboard.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Created navigation data model to store large data between route navigation
            const oNavigationModel = new JSONModel({
                navigationData: null
            });
            this.setModel(oNavigationModel, "navigation");

            // enable routing
            this.getRouter().initialize();
        }
    });
});