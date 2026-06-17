using { API_BILLING_DOCUMENT_SRV as S4_BD } from './external/API_BILLING_DOCUMENT_SRV';
using { API_BUSINESS_PARTNER as S4_CUST } from './external/API_BUSINESS_PARTNER';


service konnekt {
    @cds.persistence.skip
    entity BillingDocument as projection on S4_BD.A_BillingDocument{
        @title : 'Billing Document'
        key BillingDocument,
        @title : 'Billing Type'
        BillingDocumentType,
        @title : 'Billing Date'
        BillingDocumentDate,
        @title : 'Sold-to Party'
        SoldToParty,
        virtual null as SoldToPartyText : String,
        @title : 'Net Value'
        TotalNetAmount,
        @title : 'Billing Document Status'
        OverallBillingStatus,
        virtual null as BillingDocumentStatusText : String,
        @title : 'Plant'
        YY1_Plant_BDH
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

    @cds.persistence.skip
    entity BusinesPartner as projection on S4_CUST.A_BusinessPartner{
        key BusinessPartner,
        Customer,
        BusinessPartnerFullName

    }
}