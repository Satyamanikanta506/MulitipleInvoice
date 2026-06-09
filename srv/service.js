const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
    const S4_BD = await cds.connect.to("API_BILLING_DOCUMENT_SRV");

        const { BillingDocument } = this.entities;

     this.on("READ", BillingDocument, async (req) => {
        return await S4_BD.run(req.query);
    });
});