using auditLog as my from '../db/data-model';

service CatalogService {
    entity zconfiguration                       as projection on my.zconfiguration;
    entity getData                              as projection on my.zconfiguration;

    @cds.redirection.target
    entity auditLogs                            as projection on my.auditLogs;

    entity finalAuditLogs                       as projection on my.finalAuditLogs;
    entity zsubaccountAuditLogServiceDetails    as projection on my.subaccountAuditLogServiceDetails;
    entity zsubaccountUserDetailsServiceDetails as projection on my.subaccountUserDetailsServiceDetails;

    entity zjobExecutionStatus                  as projection on my.jobExecutionStatus order by
        time desc;

    @readonly
    entity zdetailedAuditLogs                   as projection on my.auditLogs order by
        time desc;

    @readonly
    entity zauditLogs                           as projection on my.finalAuditLogs order by
        dateTime desc;

    @readonly
    view temp as
        select from my.finalAuditLogs {
            message_uuid,
            log_statement,
            category,
            subCategory,
            dateTime,
            operation_performed_on_user,
            operation_performed_by_user,
            subaccount,
            severity,
            detailedAuditLog
        }
        order by
            finalAuditLogs.dateTime desc;

    view category as select distinct key category from finalAuditLogs;
    view subCategory as select distinct key subCategory from finalAuditLogs;
    view subaccount as select distinct key subaccount from finalAuditLogs;
    view operation_performed_on_user as select distinct key operation_performed_on_user from finalAuditLogs;
    view operation_performed_by_user as select distinct key operation_performed_by_user from finalAuditLogs;
    view severity as select distinct key severity from finalAuditLogs;
}
