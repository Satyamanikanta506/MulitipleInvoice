const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
    const S4_BD = await cds.connect.to("API_BILLING_DOCUMENT_SRV");

    const { BillingDocument, OverallBillingStatusVH } = this.entities;

    this.on("READ", BillingDocument, async (req) => {
        return await S4_BD.run(req.query);
    });

    this.on("READ", OverallBillingStatusVH, async (req) => {
        const statuses = [
            { code: 'A', name: 'Completed' },
            { code: 'B', name: 'Incomplete' },
            { code: 'C', name: 'Canceled' },
            { code: 'D', name: 'Not Relevant' },
            { code: 'E', name: 'To Be Posted' }
        ];
        return statuses;
    });
});