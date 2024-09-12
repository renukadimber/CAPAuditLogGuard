namespace auditLog;

entity zconfiguration {
    key name     : String;
        type     : String;
        tenantID : String;
        status   : String;

}

entity test {
    key ID : UUID
}


entity subaccountAuditLogServiceDetails {
    key tenantID        : String;
        subaccountName  : String;
        clientID        : String;
        clientSecret    : String;
        tokenServiceURL : String;
}

entity subaccountUserDetailsServiceDetails {
    key tenantID        : String;
        subaccountName  : String;
        clientID        : String;
        clientSecret    : String;
        tokenServiceURL : String;
}

entity auditLogs {
    key message_uuid                                      : String;
        subaccountName                                    : String;
        time                                              : String;
        tenant                                            : String;
        org_id                                            : String;
        space_id                                          : String;
        app_or_service_id                                 : String;
        als_service_id                                    : String;
        user                                              : String;
        category                                          : String;
        format_version                                    : String;
        operation_performed_on_user                       : String;
        operation_performed_on_user_name                  : String;
        operation_performed_by_user                       : String;
        operation_performed_by_user_name                  : String;
        message                                           : String;
        message_success                                   : String;
        message_object_type                               : String;
        message_object_id_tableName                       : String;
        message_object_id_crudType                        : String;
        message_object_id_creationTimestamp               : String;
        message_object_id_origin                          : String;
        message_object_id_onBehalfOf                      : String;
        message_object_id_name                            : String;
        message_object_id_identity_zone_id                : String;
        message_object_id_role_name                       : String;
        message_object_id_role_identity_zone_id           : String;
        message_object_id_role_roletemplate_name          : String;
        message_object_id_role_roletemplate_app_appid     : String;
        message_object_id_user_id                         : String;
        message_object_id_rolecollection_identity_zone_id : String;
        message_object_id_rolecollection_name             : String;
        message_attributes_name                           : String;
        message_attributes_old                            : String;
        message_attributes_new                            : String;
        message_attributes_new_id                         : String;
        message_attributes_new_meta_version               : String;
        message_attributes_new_meta_created               : String;
        message_attributes_new_username                   : String;
        message_attributes_new_name_formatted             : String;
        message_attributes_new_emails_value               : String;
        message_attributes_new_emails_primary             : String;
        message_attributes_new_groups                     : String;
        message_attributes_new_phoneNumbers               : String;
        message_attributes_new_active                     : String;
        message_attributes_new_verified                   : String;
        message_attributes_new_origin                     : String;
        message_attributes_new_passwordLastModified       : String;
        message_attributes_name2                          : String;
        message_attributes_old2                           : String;
        message_attributes_new2                           : String;
        message_attributes_old_id                         : String;
        message_attributes_old_meta_version               : String;
        message_attributes_old_meta_created               : String;
        message_attributes_old_meta_lastModified          : String;
        message_attributes_old_userName                   : String;
        message_attributes_old_name_formatted             : String;
        message_attributes_old_emails_value               : String;
        message_attributes_old_emails_primary             : String;
        message_attributes_old_groups                     : String;
        message_attributes_old_phoneNumbers               : String;
        message_attributes_old_active                     : String;
        message_attributes_old_verified                   : String;
        message_attributes_old_origin                     : String;
        message_attributes_old_zoneId                     : String;
        message_attributes_old_passwordLastModified       : String;
        message_status                                    : String;
        message_category                                  : String;
        message_identityProvider                          : String;
        message_tenant                                    : String;
        message_customDetails                             : String;
        message_ingestionTime                             : String;
        actual_audit_log                                  : String;
}

entity jobExecutionStatus {
    key time   : Timestamp @cds.on.insert: $now;
        status : String;
        log    : LargeString;
}

entity finalAuditLogs {
    key message_uuid                : String;
        log_statement               : String;
        category                    : String;
        subCategory                 : String;
        dateTime                    : DateTime;
        operation_performed_on_user : String;
        operation_performed_by_user : String;
        subaccount                  : String;
        severity                    : String;
        detailedAuditLog            : String;
}
