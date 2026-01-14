const cds = require("@sap/cds");
console.log(cds.env.requires.sql);
module.exports = cds.service.impl(async function () {
  const extSrv = await cds.connect.to("ZEWM_WHS_LM_SRV");

  const { Warehouses, Queues, UnitsOfMeasure, Resources, ShiftDayNumbers } =
    this.entities;

  // External entities → EWM
  this.on("READ", Warehouses, (req) => extSrv.run(req.query));
  this.on("READ", Queues, (req) => extSrv.run(req.query));
  this.on("READ", UnitsOfMeasure, (req) => extSrv.run(req.query));
  this.on("READ", Resources, (req) => extSrv.run(req.query));
  this.on("READ", ShiftDayNumbers, (req) => extSrv.run(req.query));
});
