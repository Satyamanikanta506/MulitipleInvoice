const cds = require("@sap/cds");


module.exports = cds.service.impl(async function () {
    const S4_BD = await cds.connect.to("API_BILLING_DOCUMENT_SRV");
    const S4_CUST = await cds.connect.to("API_BUSINESS_PARTNER");

    const { BillingDocument, OverallBillingStatusVH, BusinesPartner } = this.entities;

    this.on("READ", BillingDocument, async (req) => {
        return await S4_BD.run(req.query.where(`(BillingDocumentType = 'F2' or BillingDocumentType = 'F5' or BillingDocumentType = 'F8' or BillingDocumentType = 'G2' or BillingDocumentType = 'L2')`));
    });
    
    this.after("READ", BillingDocument, (data) => {

        const statusMap = {
            A: "Completed",
            B: "Incomplete",
            C: "Canceled",
            D: "Not Relevant",
            E: "To Be Posted"
        };

        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach(item => {
            item.BillingDocumentStatusText =
                statusMap[item.OverallBillingStatus] || item.OverallBillingStatus;
        });

    });

    this.on("READ",BusinesPartner, async (req) =>{
        return await S4_CUST.run(req.query);
    } );


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


    this.on('BillingArray', async req => {
        try {
            const sBillingDocuments = req.data.BillingDocument;
            const filePath = req.data.filePath;
            if (!sBillingDocuments) {
                throw new Error('Missing required BillingDocument list');
            }
            if (!filePath) {
                throw new Error('Local folder path (filePath) is required');
            }

            const aDocIds = sBillingDocuments.split(',').map(id => id.trim()).filter(Boolean);
            if (aDocIds.length === 0) {
                throw new Error('No valid BillingDocument IDs provided');
            }

            const billingDocService = await cds.connect.to('API_BILLING_DOCUMENT_SRV');
            const fs = require('fs');
            const path = require('path');
            const resolvedPath = path.resolve(filePath.trim());
            fs.mkdirSync(resolvedPath, { recursive: true });

            const successDocs = [];
            const failedDocs = [];

            for (const BillDocId of aDocIds) {
                try {
                    const printPdf = await billingDocService.tx().send({
                        method: 'GET',
                        path: `GetPDF?BillingDocument='${BillDocId}'`
                    });

                    if (printPdf?.GetPDF?.BillingDocumentBinary) {
                        const cleanPdfBinary = printPdf.GetPDF.BillingDocumentBinary.replace(/(\r\n|\n|\r)/gm, "");
                        const fileBytes = Buffer.from(cleanPdfBinary, 'base64');
                        const fileDest = path.join(resolvedPath, `${BillDocId}.pdf`);
                        fs.writeFileSync(fileDest, fileBytes);
                        
                        console.log(`Successfully saved PDF locally at: ${fileDest}`);
                        successDocs.push(BillDocId);
                    } else {
                        console.warn(`Failed to retrieve PDF document for ID: ${BillDocId}`);
                        failedDocs.push(`${BillDocId} (Empty Binary)`);
                    }
                } catch (err) {
                    console.error(`Error fetching/saving PDF for ID ${BillDocId}:`, err);
                    failedDocs.push(`${BillDocId} (${err.message || 'Request failed'})`);
                }
            }

            // Construct response summary message
            let responseMsg = "";
            if (successDocs.length > 0) {
                responseMsg += `Successfully saved to ${filePath}:\n` + successDocs.map(id => `- ${id}.pdf`).join('\n') + `\n\n`;
            } else {
                responseMsg += `No documents were successfully saved.\n\n`;
            }

            if (failedDocs.length > 0) {
                responseMsg += `Not saved / Failed:\n` + failedDocs.map(entry => `- ${entry}`).join('\n');
            }

            return { BillingDocument: responseMsg };
        } catch (error) {
            console.error('Error in BillingArray handler:', error);
            throw new cds.error({
                code: 'BILLING_ARRAY_ERROR',
                message: error.message || 'Failed to process and save PDF documents',
                status: 500
            });
        }
    });
});