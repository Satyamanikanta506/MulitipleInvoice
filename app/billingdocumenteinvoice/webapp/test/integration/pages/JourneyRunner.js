sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"einvoice/billingdocumenteinvoice/test/integration/pages/BillinginvList",
	"einvoice/billingdocumenteinvoice/test/integration/pages/BillinginvObjectPage"
], function (JourneyRunner, BillinginvList, BillinginvObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('einvoice/billingdocumenteinvoice') + '/test/flpSandbox.html#einvoicebillingdocumenteinvoic-tile',
        pages: {
			onTheBillinginvList: BillinginvList,
			onTheBillinginvObjectPage: BillinginvObjectPage
        },
        async: true
    });

    return runner;
});

