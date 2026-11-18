const cds = require("@sap/cds");


module.exports = cds.service.impl(async function () {
    const S4_BD = await cds.connect.to("API_BILLING_DOCUMENT_SRV");
    const S4_CUST = await cds.connect.to("API_BUSINESS_PARTNER");
    const S4_irnno = await cds.connect.to("YY1_EINVOICESTATUS_CDS");
    const S4_einvoice = await cds.connect.to("YY1_BILLINGDOCUMENTAPI_CDS");

    const { BillingDocument , BusinesPartner,irnno, Billinginv, BillingStatusVH , EInvoiceStatusVH,  PlantVH, CompanyCodeVH} = this.entities;

    this.on("READ", BillingDocument, async (req) => {
        return await S4_BD.run(req.query.where(`(BillingDocumentType = 'F2' or BillingDocumentType = 'F5' or BillingDocumentType = 'F8' or BillingDocumentType = 'G2' or BillingDocumentType = 'L2')`));
    });
    
    this.after("READ", BillingDocument, async (data) => {
        const statusMap = {
            A: 'Completed (A)',
            B: 'To Be Posted (B)',
            C: 'Canceled (C)',
            D: 'Not Relevant (D)',
            E: 'Incomplete (E)'
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
                    const bpName = (bp.BusinessPartnerName || bp.BusinessPartnerFullName || '').trim();
                    if (bp.Customer) {
                        const unpaddedCustomer = bp.Customer.replace(/^0+/, '');
                        bpMap[bp.Customer] = bpName;
                        bpMap[unpaddedCustomer] = bpName;
                    }
                    if (bp.BusinessPartner) {
                        const unpaddedBP = bp.BusinessPartner.replace(/^0+/, '');
                        bpMap[bp.BusinessPartner] = bpName;
                        bpMap[unpaddedBP] = bpName;
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
   
     this.on("READ", Billinginv, async (req) => {
        return await S4_einvoice.run(req.query.where(`(BillingDocumentType = 'F2' or BillingDocumentType = 'F5' or BillingDocumentType = 'F8' or BillingDocumentType = 'G2' or BillingDocumentType = 'L2')`));
    });


    this.on('READ', 'BillingStatusVH', async () => {
        return [
            { code: 'C', name: 'Canceled' },
            { code: 'A', name: 'Completed' },
            { code: 'E', name: 'Incomplete' },
            { code: 'D', name: 'Not Relevant' },
            { code: 'B', name: 'To Be Posted' },
            
        ];
    });

   this.after('READ', Billinginv, (data) => {

    const statusMap = {
        A: 'Completed (A)',
        B: 'To Be Posted (B)',
        C: 'Canceled (C)',
        D: 'Not Relevant (D)',
        E: 'Incomplete (E)'
    };

    const rows = Array.isArray(data) ? data : [data];

    rows.forEach(item => {
        item.OverallBillingStatus  =
            statusMap[item.OverallBillingStatus] || item.OverallBillingStatus;
    });

});

    this.on('READ', EInvoiceStatusVH, async () => {
     return [
        { code: 'Submitted' },
        { code: 'Not Submitted'},
        // { code: 'Error'}
    ];
});
    //---------
   this.on("READ", CompanyCodeVH, async () => {
    return [
        { CompanyCode: "IN01" },
        { CompanyCode: "IN04" },
        { CompanyCode: "IN08" },
        { CompanyCode: "EU06" },
        { CompanyCode: "TH01" },
        { CompanyCode: "UK01" },
        { CompanyCode: "UK02" },
        { CompanyCode: "SG01" },
        { CompanyCode: "SG02" },
        { CompanyCode: "SG03" },
        { CompanyCode: "HK01" },
        { CompanyCode: "ME01" },
        { CompanyCode: "ME02" },
        { CompanyCode: "ME03" },
        { CompanyCode: "ME04" },
        { CompanyCode: "ME05" },
        { CompanyCode: "ME06" },
        { CompanyCode: "ME07" },
        { CompanyCode: "ME08" },
        { CompanyCode: "ME09" },
        { CompanyCode: "ME10" },
        { CompanyCode: "MY01" },
        { CompanyCode: "AU01" },
        { CompanyCode: "US01" }
    ];
});


//----
    this.on("READ", PlantVH, async () => {
    return [
        { Plant: "01AP" },
        { Plant: "01JH" },
        { Plant: "01KA" },
        { Plant: "01MH" },
        { Plant: "01MP" },
        { Plant: "01OD" },
        { Plant: "01TG" },
        { Plant: "01TN" },
        { Plant: "02MH" },
        { Plant: "02MP" },
        { Plant: "02TG" },
        { Plant: "03TG" },
        { Plant: "04TG" },
        { Plant: "05TG" },
        { Plant: "03MP" },
        { Plant: "04MP" },
        { Plant: "05MP" },
        { Plant: "09MP" },
        { Plant: "06EU" },
        { Plant: "01TH" },
        { Plant: "01UK" },
        { Plant: "02UK" },
        { Plant: "01SG" },
        { Plant: "02SG" },
        { Plant: "03SG" },
        { Plant: "01HK" },
        { Plant: "01ME" },
        { Plant: "02ME" },
        { Plant: "03ME" },
        { Plant: "04ME" },
        { Plant: "05ME" },
        { Plant: "06ME" },
        { Plant: "08ME" },
        { Plant: "09ME" },
        { Plant: "10ME" },
        { Plant: "01MY" },
        { Plant: "01AU" },
        { Plant: "01US" }
    ];
});




    ///---Billing Document Einvoice code
    const handleBillingArray = async req => {
        try {
            const sBillingDocuments = req.data.BillingDocument;
            if (!sBillingDocuments) {
                throw new Error('Missing required BillingDocument list');
            }

            let docList = [];
            const payerNameFromInput = {};

            // Support JSON array of objects/strings as well as comma-separated IDs
            if (typeof sBillingDocuments === 'string' && (sBillingDocuments.trim().startsWith('[') || sBillingDocuments.trim().startsWith('{'))) {
                try {
                    const parsed = JSON.parse(sBillingDocuments);
                    const items = Array.isArray(parsed) ? parsed : [parsed];
                    items.forEach(item => {
                        if (typeof item === 'object' && item !== null) {
                            const id = (item.BillingDocument || item.id || '').trim();
                            if (id) {
                                docList.push(id);
                                let name = (item.PayerName || item.Payer || item.CustomerFullName || item.BusinessPartnerName || '').trim();
                                if (name) {
                                    // Remove trailing customer code like " (20000032)"
                                    const cleanName = name.replace(/\s*\(\d+\)\s*$/, '').trim() || name;
                                    payerNameFromInput[id] = cleanName;
                                    payerNameFromInput[id.replace(/^0+/, '')] = cleanName;
                                }
                            }
                        } else if (typeof item === 'string' && item.trim()) {
                            docList.push(item.trim());
                        }
                    });
                } catch (e) {
                    // Fall back to comma-separated
                }
            }

            if (docList.length === 0) {
                docList = sBillingDocuments.split(',').map(id => id.trim()).filter(Boolean);
            }

            const aDocIds = [...new Set(docList)];
            if (aDocIds.length === 0) {
                throw new Error('No valid BillingDocument IDs provided');
            }

            // Map to store docId -> PayerName
            const docToPayerNameMap = { ...payerNameFromInput };

            // If any doc IDs are missing PayerName, look up Payer from S4_einvoice
            const docsNeedingPayer = aDocIds.filter(id => !docToPayerNameMap[id] && !docToPayerNameMap[id.replace(/^0+/, '')]);

            if (docsNeedingPayer.length > 0) {
                const queryDocIds = [];
                docsNeedingPayer.forEach(id => {
                    queryDocIds.push(id);
                    if (/^\d+$/.test(id) && id.length < 10) {
                        queryDocIds.push(id.padStart(10, '0'));
                    }
                });

                try {
                    const einvDocs = await S4_einvoice.run(
                        SELECT.from('YY1_BillingDocumentAPI')
                            .columns('BillingDocument', 'Payer')
                            .where({ BillingDocument: { in: queryDocIds } })
                    );
                    if (Array.isArray(einvDocs)) {
                        einvDocs.forEach(d => {
                            const rawPayer = (d.Payer || '').trim();
                            const cleanPayer = rawPayer.replace(/\s*\(\d+\)\s*$/, '').trim() || rawPayer;
                            if (cleanPayer) {
                                const unpaddedDoc = d.BillingDocument.replace(/^0+/, '');
                                docToPayerNameMap[d.BillingDocument] = cleanPayer;
                                docToPayerNameMap[unpaddedDoc] = cleanPayer;
                            }
                        });
                    }
                } catch (err) {
                    console.warn("Could not fetch Payer from S4_einvoice:", err.message);
                }
            }

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

                        const unpaddedId = BillDocId.replace(/^0+/, '');
                        const payerRawName = docToPayerNameMap[BillDocId] || docToPayerNameMap[unpaddedId] || docToPayerNameMap[BillDocId.padStart(10, '0')] || '';
                        const cleanPayerName = payerRawName
                            .replace(/[/\\?%*:|"<>]/g, '')
                            .replace(/[\r\n\t]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();

                        const pdfFileName = cleanPayerName ? `${BillDocId} - ${cleanPayerName}).pdf` : `${BillDocId}.pdf`;

                        zipFiles.push({
                            name: pdfFileName,
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
    };

    this.on('BillingArrayy', handleBillingArray);
    this.on('BillingArray', handleBillingArray);
});

