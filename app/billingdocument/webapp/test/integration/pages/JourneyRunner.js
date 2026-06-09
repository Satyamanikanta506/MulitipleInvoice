sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"billingdocument/test/integration/pages/BillingDocumentList",
	"billingdocument/test/integration/pages/BillingDocumentObjectPage"
], function (JourneyRunner, BillingDocumentList, BillingDocumentObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('billingdocument') + '/test/flpSandbox.html#billingdocument-tile',
        pages: {
			onTheBillingDocumentList: BillingDocumentList,
			onTheBillingDocumentObjectPage: BillingDocumentObjectPage
        },
        async: true
    });

    return runner;
});

