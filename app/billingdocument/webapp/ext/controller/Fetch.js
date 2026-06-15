sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/ui/core/BusyIndicator"
], function (MessageToast, MessageBox, Dialog, Text, Input, TextArea, Button, VBox, BusyIndicator) {
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
            var fnInvokeBillingAction = async function (sFilePath) {
                var mParameters = {
                    model: aSelectedContexts[0].getModel(),
                    parameterValues: [
                        { name: 'BillingDocument', value: sBillingDocuments },
                        { name: 'filePath', value: sFilePath }
                    ],
                    skipParameterDialog: true
                };

                BusyIndicator.show();
                try {
                    var result = await that.editFlow.invokeAction('BillingArray', mParameters);
                    var oData = result.getObject();
                    var sMessage = "";
                    if (oData) {
                        if (oData.value && oData.value.BillingDocument) {
                            sMessage = oData.value.BillingDocument;
                        } else if (oData.BillingDocument) {
                            sMessage = oData.BillingDocument;
                        } else if (oData.value) {
                            sMessage = oData.value;
                        }
                    }

                    BusyIndicator.hide();
                    MessageBox.success(sMessage || "Files successfully downloaded.");
                } catch (e) {
                    MessageBox.error("An error occurred while downloading PDFs: " + e.message);
                    BusyIndicator.hide();
                }
            };

            var oInput = new Input({
                width: "100%",
                placeholder: "e.g., /Users/username/Downloads"
            });

            var oDialog = new Dialog({
                title: "Download PDF Invoices",
                type: "Message",
                content: new VBox({
                    items: [
                        new Text({ text: "Enter the local system folder path where the PDF files will be stored:" }),
                        oInput
                    ]
                }),
                beginButton: new Button({
                    text: "Download",
                    type: "Emphasized",
                    press: async function () {
                        var sFilePath = oInput.getValue().trim();
                        if (!sFilePath) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("Folder path is required to save the documents.");
                            return;
                        }
                        oInput.setValueState("None");
                        oDialog.close();
                        await fnInvokeBillingAction(sFilePath);
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        enabledForPrintEinvoice: function (oBindingContext, aSelectedContexts) {
            if (aSelectedContexts && aSelectedContexts.length >= 1) {
                return true;
            }
            return false;
        },
    };
});
