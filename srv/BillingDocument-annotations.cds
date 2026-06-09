using { konnekt } from './service';

annotate konnekt.BillingDocument with @(
        Capabilities.SearchRestrictions : {false},
        Capabilities.DeleteRestrictions : {
            $Type : 'Capabilities.DeleteRestrictionsType',
            Deletable: false
        },
        Capabilities : {
            FilterRestrictions : {
                FilterExpressionRestrictions :
                [{
                    Property : 'BillingDocumentDate',
                    AllowedExpressions : 'SingleRange'
                }]
            }
        },
        UI.PresentationVariant :{
        SortOrder : [
        {
                Property : BillingDocument,
                Descending : true,
            },
        ],
        Visualizations : [ 
            '@UI.LineItem',
        ],
    },

        UI.LineItem: [
            {
                $Type : 'UI.DataField',
                Label : 'Billing Document',
                ![@HTML5.CssDefaults]: {width:'10rem'},
                Value : BillingDocument,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Billing Document Type',
                ![@HTML5.CssDefaults]: {width:'10rem'},
                Value : BillingDocumentType,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Customer',
                ![@HTML5.CssDefaults]: {width:'8rem'},
                Value : SoldToParty,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Status',
                ![@HTML5.CssDefaults]: {width:'10rem'},
                Value : OverallBillingStatus,
            },
            
            {
                $Type : 'UI.DataField',
                Label : 'Billing Date',
                ![@HTML5.CssDefaults]: {width:'10rem'},
                Value : BillingDocumentDate,
            },
             {
                $Type : 'UI.DataField',
                Label : 'Net Value',
                ![@HTML5.CssDefaults]: {width:'10rem'},
                Value : TotalNetAmount,
            },

    ],
    UI.SelectionFields: [ BillingDocumentIsCancelled, BillingDocument, BillingDocumentType, BillingDocumentDate ]
);


// annotate konnekt.BillingDocument with {
//      @Common.ValueListWithFixedValues : true
//      @Common.ValueList : {
//         $Type : 'Common.ValueListType',
//         Label : 'Print Status',
//         CollectionPath : 'BDStatus',
//         Parameters : [
//             {
//                 $Type : 'Common.ValueListParameterInOut',
//                 LocalDataProperty : 'Status',
//                 ValueListProperty : 'VStatus',
//             }
            
//         ],
//     }
//     Status;
// };