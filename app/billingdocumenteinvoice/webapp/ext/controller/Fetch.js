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

            var aBillingDocuments = aSelectedContexts.map(function (oContext) {
                return oContext.getObject().BillingDocument;
            });
            var sBillingDocuments = aBillingDocuments.join(",");

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
                
                // Determine filename
                var sFileName = "Invoices";
                if (aBillingDocuments.length === 1) {
                    sFileName = "Invoice_" + aBillingDocuments[0];
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
