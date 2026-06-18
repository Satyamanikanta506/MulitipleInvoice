using { API_BILLING_DOCUMENT_SRV as S4_BD } from './external/API_BILLING_DOCUMENT_SRV';
using { API_BUSINESS_PARTNER as S4_CUST } from './external/API_BUSINESS_PARTNER';
using { YY1_EINVOICESTATUS_CDS as S4_IRN } from './external/YY1_EINVOICESTATUS_CDS';


service konnekt {
    @cds.persistence.skip
    entity BillingDocument as projection on S4_BD.A_BillingDocument{
        @title : 'Billing Document'
        key BillingDocument,
        @title : 'Billing Type'
        BillingDocumentType,
        @title : 'Billing Date'
        BillingDocumentDate,
        @title : 'Payer'
        SoldToParty,
        virtual null as SoldToPartyText : String,
        @title : 'Net Value'
        TotalNetAmount,
        @title : 'Billing Document Status'
        OverallBillingStatus,
        virtual null as BillingDocumentStatusText : String,
        @title : 'Plant'
        YY1_Plant_BDH,
        @title : 'E Invoice Document'
        virtual null as IN_ElectronicDocInvcRefNmbr : String(20),
        virtual null as EInvoiceCriticality : Integer
    }

    action BillingArray(BillingDocument : String) returns {
        zipContent : String;
        errorMessages : String;
    };



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
    @cds.persistence.skip
    entity irnno as projection on S4_IRN.YY1_EInvoiceStatus{
        key ElectronicDocUUID,
        BillingDocument,
        IN_ElectronicDocInvcRefNmbr
    };

//     entity irnno as projection on S4_IRN.YY1_EInvoiceStatus {
//     key BillingDocument,
//     ElectronicDocUUID,

//     irn : Association to irnno
//         on irn.ElectronicDocUUID = ElectronicDocUUID
// }
}