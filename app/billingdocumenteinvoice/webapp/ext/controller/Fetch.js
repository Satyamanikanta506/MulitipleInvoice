sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/util/File"
], function (MessageToast, MessageBox, Dialog, Text, Input, TextArea, Button, VBox, BusyIndicator, SapFile) {
    'use strict';

    return {
        /**
         * Generated event handler.
         *
         * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
         * @param aSelectedContexts the selected contexts of the table rows.
         */
        PrintInvoice: async function (oBindingContext, aSelectedContexts) {
            if (!aSelectedContexts || aSelectedContexts.length === 0) {
                return;
            }

            var aBillingDocData = aSelectedContexts.map(function (oContext) {
                var oObj = oContext.getObject();
                var sPayerRaw = (oObj.Payer || "").trim();
                // Extract clean Payer Name (remove trailing customer code like " (20000032)")
                var sPayerName = sPayerRaw.replace(/\s*\(\d+\)\s*$/, "").trim() || sPayerRaw;
                return {
                    BillingDocument: oObj.BillingDocument,
                    PayerName: sPayerName
                };
            });

            var bHasPayerName = aBillingDocData.some(function (item) { return !!item.PayerName; });
            var sBillingDocuments = bHasPayerName
                ? JSON.stringify(aBillingDocData)
                : aBillingDocData.map(function (item) { return item.BillingDocument; }).join(",");

            var that = this;
            var mParameters = {
                model: aSelectedContexts[0].getModel(),
                parameterValues: [
                    { name: 'BillingDocument', value: sBillingDocuments }
                ],
                skipParameterDialog: true
            };

            BusyIndicator.show();
            try {
                var result = await that.editFlow.invokeAction('BillingArrayy', mParameters);
                var oData = result.getObject();
                
                var sZipContent = "";
                var sErrorMessages = "";
                
                if (oData && oData.value) {
                    sZipContent = oData.value.zipContent;
                    sErrorMessages = oData.value.errorMessages;
                } else if (oData) {
                    sZipContent = oData.zipContent;
                    sErrorMessages = oData.errorMessages;
                }

                if (!sZipContent) {
                    throw new Error("No ZIP content received from server.");
                }

                // Decode base64 to Blob
                var base64ToBlob = function (base64, mimeType) {
                    var byteCharacters = atob(base64);
                    var byteNumbers = new Array(byteCharacters.length);
                    for (var i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    return new Blob([byteArray], { type: mimeType });
                };

                var oBlob = base64ToBlob(sZipContent, "application/zip");
                
                // Determine filename for the downloaded ZIP
                var sFileName = "Invoices";
                if (aBillingDocData.length === 1) {
                    sFileName = "Invoice_" + aBillingDocData[0].BillingDocument;
                } else {
                    sFileName = "Invoices_" + new Date().toISOString().slice(0, 10);
                }

                // Save ZIP file in browser
                SapFile.save(oBlob, sFileName, "zip", "application/zip");

                BusyIndicator.hide();

                if (sErrorMessages) {
                    MessageBox.warning("ZIP downloaded successfully, but some documents failed:\n\n" + sErrorMessages);
                } else {
                    MessageToast.show("Invoices successfully downloaded as ZIP.");
                }
            } catch (e) {
                MessageBox.error("An error occurred while downloading PDFs: " + e.message);
                BusyIndicator.hide();
            }
        },

        enabledForPrintEinvoice: function (oBindingContext, aSelectedContexts) {
            if (aSelectedContexts && aSelectedContexts.length >= 1) {
                return true;
            }
            return false;
        },
    };
});
