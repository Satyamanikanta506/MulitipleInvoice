const cds = require("@sap/cds");


module.exports = cds.service.impl(async function () {
    const S4_BD = await cds.connect.to("API_BILLING_DOCUMENT_SRV");
    const S4_CUST = await cds.connect.to("API_BUSINESS_PARTNER");
    const S4_irnno = await cds.connect.to("YY1_EINVOICESTATUS_CDS");
    const S4_einvoice = await cds.connect.to("YY1_BILLINGDOCUMENTAPI_CDS");

    const { BillingDocument, OverallBillingStatusVH, BusinesPartner,irnno, Billinginv, BillingStatusVH ,BillingStatusEinv} = this.entities;

    this.on("READ", BillingDocument, async (req) => {
        return await S4_BD.run(req.query.where(`(BillingDocumentType = 'F2' or BillingDocumentType = 'F5' or BillingDocumentType = 'F8' or BillingDocumentType = 'G2' or BillingDocumentType = 'L2')`));
    });
    
    this.after("READ", BillingDocument, async (data) => {

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

        const soldToParties = [...new Set(data.map(item => item.SoldToParty).filter(Boolean))];
        if (soldToParties.length > 0) {
            try {
                const queryParties = [];
                soldToParties.forEach(p => {
                    queryParties.push(p);
                    if (/^\d+$/.test(p) && p.length < 10) {
                        queryParties.push(p.padStart(10, '0'));
                    }
                });

                const bpData = await S4_CUST.run(
                    SELECT.from(BusinesPartner)
                        .where({ Customer: { in: queryParties } })
                );
                
                const bpMap = {};
                bpData.forEach(bp => {
                    if (bp.Customer) {
                        const unpaddedCustomer = bp.Customer.replace(/^0+/, '');
                        bpMap[bp.Customer] = bp.BusinessPartnerFullName;
                        bpMap[unpaddedCustomer] = bp.BusinessPartnerFullName;
                    }
                    if (bp.BusinessPartner) {
                        const unpaddedBP = bp.BusinessPartner.replace(/^0+/, '');
                        bpMap[bp.BusinessPartner] = bp.BusinessPartnerFullName;
                        bpMap[unpaddedBP] = bp.BusinessPartnerFullName;
                    }
                });
                data.forEach(item => {
                    if (item.SoldToParty) {
                        item.SoldToPartyText = bpMap[item.SoldToParty] || bpMap[item.SoldToParty.padStart(10, '0')] || '';
                    }
                });
            } catch (err) {
                console.error("Error fetching Business Partner details:", err);
            }
        }

       
        // IRN Data
        try {
            const irnData = await S4_irnno.run(
                SELECT.from(irnno)
            );
        
            const irnMap = {};
        
            irnData.forEach(irn => {
                irnMap[irn.BillingDocument] =
                    irn.IN_ElectronicDocInvcRefNmbr;
            });        
            data.forEach(item => {            
                const irnValue =
                    irnMap[item.BillingDocument] || "";
            item.IN_ElectronicDocInvcRefNmbr =
            irnValue ? "Submitted" : "Not Submitted";
            item.EInvoiceCriticality =
                irnValue ? 3 : 2;   // 3=Green, 2=Orange
        });
        } catch (err) {

            data.forEach(item => {
              item.IN_ElectronicDocInvcRefNmbr = "Not Submitted";
              item.EInvoiceCriticality = 2;
        });
    }

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

   //-------
     this.on("READ", Billinginv, async (req) => {
        return await S4_einvoice.run(req.query.where(`(BillingDocumentType = 'F2' or BillingDocumentType = 'F5' or BillingDocumentType = 'F8' or BillingDocumentType = 'G2' or BillingDocumentType = 'L2')`));
    });


    this.on('READ', 'BillingStatusVH', async () => {
        return [
            { code: 'A', name: 'Completed' },
            { code: 'B', name: 'Incomplete' },
            { code: 'C', name: 'Canceled' },
            { code: 'D', name: 'Not Relevant' },
            { code: 'E', name: 'To Be Posted' }
        ];
    });

   this.after('READ', Billinginv, (data) => {

    const statusMap = {
        A: 'Completed',
        B: 'Incomplete',
        C: 'Canceled',
        D: 'Not Relevant',
        E: 'To Be Posted'
    };

    const rows = Array.isArray(data) ? data : [data];

    rows.forEach(item => {
        item.OverallBillingStatus  =
            statusMap[item.OverallBillingStatus] || item.OverallBillingStatus;
    });

});

 this.on('READ', 'EInvoiceStatusVH', async () => {
    return [
        { code: 'Submitted' },
        { code: 'Not Submitted'}
    ];
});

    this.on('BillingArray', async req => {
        try {
            const sBillingDocuments = req.data.BillingDocument;
            if (!sBillingDocuments) {
                throw new Error('Missing required BillingDocument list');
            }

            const aDocIds = sBillingDocuments.split(',').map(id => id.trim()).filter(Boolean);
            if (aDocIds.length === 0) {
                throw new Error('No valid BillingDocument IDs provided');
            }

            const billingDocService = await cds.connect.to('API_BILLING_DOCUMENT_SRV');
            const archiver = require('archiver');
            const { PassThrough } = require('stream');

            const successDocs = [];
            const failedDocs = [];
            const zipFiles = [];

            for (const BillDocId of aDocIds) {
                try {
                    const printPdf = await billingDocService.tx().send({
                        method: 'GET',
                        path: `GetPDF?BillingDocument='${BillDocId}'`
                    });

                    if (printPdf?.GetPDF?.BillingDocumentBinary) {
                        const cleanPdfBinary = printPdf.GetPDF.BillingDocumentBinary.replace(/(\r\n|\n|\r)/gm, "");
                        const fileBytes = Buffer.from(cleanPdfBinary, 'base64');
                        zipFiles.push({
                            name: `${BillDocId}.pdf`,
                            content: fileBytes
                        });
                        successDocs.push(BillDocId);
                    } else {
                        console.warn(`Failed to retrieve PDF document for ID: ${BillDocId}`);
                        failedDocs.push(`${BillDocId} (Empty Binary)`);
                    }
                } catch (err) {
                    console.error(`Error fetching PDF for ID ${BillDocId}:`, err);
                    failedDocs.push(`${BillDocId} (${err.message || 'Request failed'})`);
                }
            }

            if (zipFiles.length === 0) {
                throw new Error('No PDF documents could be retrieved. Errors:\n' + failedDocs.join('\n'));
            }

            // Create ZIP in memory using archiver
            const zipBuffer = await new Promise((resolve, reject) => {
                const archive = archiver('zip', { zlib: { level: 9 } });
                const buffers = [];
                const stream = new PassThrough();
                
                stream.on('data', data => buffers.push(data));
                stream.on('end', () => resolve(Buffer.concat(buffers)));
                stream.on('error', err => reject(err));
                
                archive.pipe(stream);
                
                for (const file of zipFiles) {
                    archive.append(file.content, { name: file.name });
                }
                
                archive.finalize();
            });

            const zipBase64 = zipBuffer.toString('base64');

            let errorMessages = "";
            if (failedDocs.length > 0) {
                errorMessages = failedDocs.map(entry => `- ${entry}`).join('\n');
            }

            return {
                zipContent: zipBase64,
                errorMessages: errorMessages
            };
        } catch (error) {
            console.error('Error in BillingArray handler:', error);
            throw new cds.error({
                code: 'BILLING_ARRAY_ERROR',
                message: error.message || 'Failed to process and zip PDF documents',
                status: 500
            });
        }
    });



    ///-----------------Billing Document Einvoice code
     this.on('BillingArrayy', async req => {
        try {
            const sBillingDocuments = req.data.BillingDocument;
            if (!sBillingDocuments) {
                throw new Error('Missing required BillingDocument list');
            }

            const aDocIds = sBillingDocuments.split(',').map(id => id.trim()).filter(Boolean);
            if (aDocIds.length === 0) {
                throw new Error('No valid BillingDocument IDs provided');
            }

            const billingDocService = await cds.connect.to('YY1_BILLINGDOCUMENTAPI_CDS');
            const archiver = require('archiver');
            const { PassThrough } = require('stream');

            const successDocs = [];
            const failedDocs = [];
            const zipFiles = [];

            for (const BillDocId of aDocIds) {
                try {
                    const printPdf = await S4_BD.tx().send({
                        method: 'GET',
                        path: `GetPDF?BillingDocument='${BillDocId}'`
                    });

                    if (printPdf?.GetPDF?.BillingDocumentBinary) {
                        const cleanPdfBinary = printPdf.GetPDF.BillingDocumentBinary.replace(/(\r\n|\n|\r)/gm, "");
                        const fileBytes = Buffer.from(cleanPdfBinary, 'base64');
                        zipFiles.push({
                            name: `${BillDocId}.pdf`,
                            content: fileBytes
                        });
                        successDocs.push(BillDocId);
                    } else {
                        console.warn(`Failed to retrieve PDF document for ID: ${BillDocId}`);
                        failedDocs.push(`${BillDocId} (Empty Binary)`);
                    }
                } catch (err) {
                    console.error(`Error fetching PDF for ID ${BillDocId}:`, err);
                    failedDocs.push(`${BillDocId} (${err.message || 'Request failed'})`);
                }
            }

            if (zipFiles.length === 0) {
                throw new Error('No PDF documents could be retrieved. Errors:\n' + failedDocs.join('\n'));
            }

            // Create ZIP in memory using archiver
            const zipBuffer = await new Promise((resolve, reject) => {
                const archive = archiver('zip', { zlib: { level: 9 } });
                const buffers = [];
                const stream = new PassThrough();
                
                stream.on('data', data => buffers.push(data));
                stream.on('end', () => resolve(Buffer.concat(buffers)));
                stream.on('error', err => reject(err));
                
                archive.pipe(stream);
                
                for (const file of zipFiles) {
                    archive.append(file.content, { name: file.name });
                }
                
                archive.finalize();
            });

            const zipBase64 = zipBuffer.toString('base64');

            let errorMessages = "";
            if (failedDocs.length > 0) {
                errorMessages = failedDocs.map(entry => `- ${entry}`).join('\n');
            }

            return {
                zipContent: zipBase64,
                errorMessages: errorMessages
            };
        } catch (error) {
            console.error('Error in BillingArrayy handler:', error);
            throw new cds.error({
                code: 'BILLING_ARRAY_ERROR',
                message: error.message || 'Failed to process and zip PDF documents',
                status: 500
            });
        }
    });
});