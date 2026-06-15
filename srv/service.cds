using { API_BILLING_DOCUMENT_SRV as S4_BD } from './external/API_BILLING_DOCUMENT_SRV';

service konnekt {
    entity BillingDocument as projection on S4_BD.A_BillingDocument{
        @title : 'Billing Document'
        key BillingDocument,
        @title : 'Billing Type'
        BillingDocumentType,
        @title : 'Billing Date'
        BillingDocumentDate,
        @title : 'Sold-to Party'
        SoldToParty,
        @title : 'Net Value'
        TotalNetAmount,
        @title : 'Billing Document Status'
        OverallBillingStatus
    }

    action BillingArray(BillingDocument : String, filePath : String) returns {BillingDocument: String};

    @readonly
    @cds.persistence.skip
    entity OverallBillingStatusVH {
        @Common.Text: name
        @Common.TextArrangement: #TextFirst
        key code : String(1);
        name : String;
    }
}