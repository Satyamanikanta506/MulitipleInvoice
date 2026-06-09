using { API_BILLING_DOCUMENT_SRV as S4_BD } from './external/API_BILLING_DOCUMENT_SRV';

service konnekt {
    entity BillingDocument as projection on S4_BD.A_BillingDocument{
        key BillingDocument,
        BillingDocumentType,
        BillingDocumentDate,
        SoldToParty,
        TotalNetAmount,
        OverallBillingStatus
    }
}