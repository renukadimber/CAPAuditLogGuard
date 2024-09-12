
const cds = require('@sap/cds')
const { SELECT, INSERT, UPDATE, DELETE } = cds.ql
const axios = require('axios');
const { response } = require('express');

module.exports = (srv) => {


    let log = '';
    let errorLog = '';

    //Function To call the Audit Log API
    //Parameters - Token URL , client ID and Client Secret of the subaccount
    async function callAuditLogRetrievalAPI(tokenURL, clientID, clientSecret) {

        //Declare variables
        let currentDay, currentMonth, currentYear, currentHours, currentMinutes, currentSeconds, date1, previousDay, previousMonth, previousYear,
            previousHours, previousMinutes, previousSeconds, date2, finalDateQuery, output;
        var apiURL;
        //Calculate current timestamp and previous (-24 hours) timestamp
        var todaysDate = new Date();
        var previousDate = new Date();
        previousDate.setDate(previousDate.getDate() - 1);

        //calculate current timestamp and format it according to the Audit log API format
        currentDay = ("0" + todaysDate.getDate()).slice(-2);
        currentMonth = ("0" + (todaysDate.getMonth() + 1)).slice(-2);
        currentYear = todaysDate.getFullYear();
        currentHours = ("0" + todaysDate.getHours()).slice(-2);
        currentMinutes = ("0" + todaysDate.getMinutes()).slice(-2);
        currentSeconds = ("0" + todaysDate.getSeconds()).slice(-2);
        date1 = currentYear + "-" + currentMonth + "-" + currentDay + "T" + currentHours + ":" + currentMinutes + ":" + currentSeconds;

        //calculate previous(-24 hours) timestamp and format it according to the Audit log API format
        previousDay = ("0" + previousDate.getDate()).slice(-2);
        previousMonth = ("0" + (previousDate.getMonth() + 1)).slice(-2);
        previousYear = previousDate.getFullYear();
        previousHours = ("0" + previousDate.getHours()).slice(-2);
        previousMinutes = ("0" + previousDate.getMinutes()).slice(-2);
        previousSeconds = ("0" + previousDate.getSeconds()).slice(-2);
        date2 = previousYear + "-" + previousMonth + "-" + previousDay + "T" + previousHours + ":" + previousMinutes + ":" + previousSeconds;

        //final filter that will be used in Audit Log API call
        finalDateQuery = "?time_from=" + date2 + "&time_to=" + date1;

        //Format Token URL
        const tokenUrl = tokenURL + '/oauth/token';

        //Format main Audit Log API URL for API call using the date filters calculated above
        apiURL = 'https://auditlog-management.cfapps.eu10.hana.ondemand.com/auditlog/v2/auditlogrecords' + finalDateQuery;
        //apiURL = 'https://auditlog-management.cfapps.eu10.hana.ondemand.com/auditlog/v2/auditlogrecords??time_from=2023-10-01T07:47:51&time_to=2023-10-13T07:47:51'
        console.log(apiURL);

        //convert client ID and secret to Base64 format
        const encodedCredentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

        //Input payload
        const data = {
            grant_type: 'client_credentials',
        };

        //API call for generating token
        try {

            const tokenResponse = await axios.post(tokenUrl, data, {
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            const accessToken = tokenResponse.data.access_token;
            //console.log(accessToken);

            const apiResponse = await axios.get(apiURL, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    output = response.data;
                    //log = log + "Audit Log API call was successful\n"
                    console.log("Audit Log API call was successful")
                })
                .catch(error => {
                    console.error('Error:', error);
                });

        } catch (error) {
            log = log + "Audit Log API Call Failed"
        }

        return output;
    }

    //Function To call the User Details API to fetch the user name and email based 
    //on the UUID value from Audit Logs
    //Parameters - Token URL , client ID , Client Secret and user ID(UUID) of the user 
    //in the subaccount
    async function callUserDetailsRetrievalAPI(tokenURL, clientID, clientSecret, userID) {
        let output;

        //Format Token URL
        const tokenUrl = tokenURL + '/oauth/token';

        //Formar User Details API call by using the userID parameter value
        const apiURL = 'https://api.authentication.eu10.hana.ondemand.com/Users/' + userID;

        //encode the client ID and Client secret to Base64 format
        const encodedCredentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

        //Input payload
        const data = {
            grant_type: 'client_credentials',
        };

        try {
            const tokenResponse = await axios.post(tokenUrl, data, {
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            const accessToken = tokenResponse.data.access_token;

            const apiResponse = await axios.get(apiURL, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    output = response.data;
                    //console.log("User Details API call was successful")
                })
                .catch(error => {
                    // console.error('Error:', error);
                });

        } catch (error) {
            console.error("User Details API Call Failed");
        }

        return output;
    }

    //Function which will execute on the GET call on entity set - getData by Job scheduling service
    srv.before("READ", "getData", async req => {

        var flag_roleProvision, flag_userProvision;
        let subaccountName, objectType, crudType, executionStatus, message_success,
            message_object_type,
            message_object_id_tableName,
            message_object_id_crudType,
            message_object_id_creationTimestamp,
            message_object_id_origin,
            message_object_id_onBehalfOf,
            message_object_id_user_id,
            message_object_id_rolecollection_identity_zone_id,
            message_object_id_rolecollection_name,
            message_attributes_name,
            message_attributes_old,
            message_attributes_old_id,
            message_attributes_old_meta_version,
            message_attributes_old_meta_created,
            message_attributes_old_meta_lastModified,
            message_attributes_old_userName,
            message_attributes_old_name_formatted,
            message_attributes_old_emails_value,
            message_attributes_old_emails_primary,
            message_attributes_old_groups,
            message_attributes_old_phoneNumbers,
            message_attributes_old_active,
            message_attributes_old_verified,
            message_attributes_old_origin,
            message_attributes_old_zoneId,
            message_attributes_old_passwordLastModified,
            myArr_attributes_new,
            message_attributes_new,
            message_attributes_new_id,
            message_attributes_new_meta_version,
            message_attributes_new_meta_created,
            message_attributes_new_userName,
            message_attributes_new_name_formatted,
            message_attributes_new_emails_value,
            message_attributes_new_emails_primary,
            message_attributes_new_groups,
            message_attributes_new_phoneNumbers,
            message_attributes_new_active,
            message_attributes_new_verified,
            message_attributes_new_origin,
            message_attributes_new_passwordLastModified,
            message_status,
            message_category,
            message_identityProvider,
            message_tenant,
            message_customDetails,
            message_ingestionTime,
            myArr_attributes_old,
            operation_performed_on_user, operation_performed_by_user,
            message_attributes_name2,
            message_attributes_old2,
            message_attributes_new2,
            operation_performed_by_user_name,
            operation_performed_on_user_name,
            message_object_id_name,
            message_object_id_identity_zone_id,
            message_object_id_role_name,
            message_object_id_role_identity_zone_id,
            message_object_id_role_roletemplate_name,
            message_object_id_role_roletemplate_app_appid,
            configurationStatus
            ;

        //declare all entitysets
        const { finalAuditLogs, auditLogs, zconfiguration, zsubaccountUserDetailsServiceDetails,
            zsubaccountAuditLogServiceDetails, zjobExecutionStatus } = srv.entities;

        //read configuration status from table zconfiguration
        configurationStatus = await SELECT.columns`name,type,tenantID,status`.from(zconfiguration);

        //If data exists in configuration status table
        if (configurationStatus.length > 0) {

            //check the status of 'User Provision' and 'Role Provision' values and set the 
            //flags according to the same
            for (let i = 0; i < configurationStatus.length; i++) {

                if (configurationStatus[i].name == 'User Provision') {

                    if (configurationStatus[i].status == 'true') {
                        flag_userProvision = 1;
                    }
                    else {
                        flag_userProvision = 0;
                    }
                    //console.log(configurationStatus,flag_roleProvision,flag_userProvision);
                }

                if (configurationStatus[i].name == 'Role Provision') {
                    if (configurationStatus[i].status == 'true') {
                        flag_roleProvision = 1;
                    }
                    else {
                        flag_roleProvision = 0;
                    }

                }
            }

            //loop on all the subaccounts present in the configuration table with status as true
            for (let i = 0; i < configurationStatus.length; i++) {

                if ((configurationStatus[i].status == 'true') && (configurationStatus[i].type ==
                    'Subaccount')) {

                    //capture the name of current subaccount in the loop
                    subaccountName = configurationStatus[i].name;
                    console.log(subaccountName);

                    //fetch the service key details for subaccount from the backend table for 
                    //Audit log API call - zsubaccountAuditLogServiceDetails
                    let auditLogServiceDetails = await SELECT.columns`tenantID,subaccountName,clientID,clientSecret,tokenServiceURL`.from(zsubaccountAuditLogServiceDetails).where({ tenantID: configurationStatus[i].tenantID });

                    //fetch the service key details for subaccount from the backend table for 
                    //User Details API call- zsubaccountUserDetailsServiceDetails
                    let userDataServiceDetails = await SELECT.columns`tenantID,subaccountName,clientID,clientSecret,tokenServiceURL`.from(zsubaccountUserDetailsServiceDetails).where({ tenantID: configurationStatus[i].tenantID });

                    //If data exists for the current subaccount for Audit Log API call
                    if (auditLogServiceDetails.length > 0) {
                        //console.log(log);
                        //log = log + "Audit Log service key details are present for subaccount " + subaccountName + " . Proceeding with the Audit Log API call\n";

                        //Call the Function 'callAuditLogRetrievalAPI' to fetch the audit logs
                        var auditLogOutputData = await callAuditLogRetrievalAPI(auditLogServiceDetails[0].tokenServiceURL, auditLogServiceDetails[0].clientID, auditLogServiceDetails[0].clientSecret);
                        //console.log(auditLogOutputData);
                        //if audit logs exist 
                        if (auditLogOutputData) {

                            //Loop on audit logs data to capture the specific logs related to user provision and role 
                            //provision
                            for (let i = 0; i < auditLogOutputData.length; i++) {

                                //parse the 'message' data to JSON for capturing the data
                                const myArr = JSON.parse(auditLogOutputData[i].message);

                                //If object key exists in the audit log
                                if (myArr.object) {

                                    objectType = myArr.object.type;

                                    //If category is 'audit.configuration' and if object type is 'scim user' i.e. for
                                    //operations related to user or if object type is 'xsrolecollection2role' or 'xs_rolecollection2user' or 
                                    //'xsrolecollections' i.e. for opeartions related to role collection and also checking the
                                    //flag values of user provision and role provision
                                    if
                                        (
                                        (auditLogOutputData[i].category == 'audit.configuration')
                                        &&
                                        (
                                            ((objectType == 'scim user') && (flag_userProvision == '1'))
                                            ||
                                            (((objectType == 'xsrolecollections') || (objectType == 'xsrolecollection2role') || (objectType == 'xs_rolecollection2user')) && (flag_roleProvision == '1'))
                                        )
                                    ) {


                                        //capture complete audit log
                                        var actual_audit_log = JSON.stringify(auditLogOutputData[i]);

                                        //convert message to JSON string
                                        var actual_message = JSON.stringify(auditLogOutputData[i].message);

                                        //function to check if the specific key exists in the log
                                        function hasKey(obj, keyToFind) {
                                            if (obj && typeof obj === 'object') {
                                                if (keyToFind in obj) {
                                                    return true; // Key found at the current level
                                                } else {
                                                    for (const key in obj) {
                                                        if (obj.hasOwnProperty(key)) {
                                                            if (hasKey(obj[key], keyToFind)) {
                                                                return true; // Key found in a nested object
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            return false; // Key not found in the object
                                        }

                                        const keyToFind = 'old';

                                        //if key exists in the log
                                        if (hasKey(myArr, keyToFind)) {

                                            //capture length of the 'old' object
                                            var length = (myArr.attributes[0].old).length;

                                            //if length of 'old' object is greater than 10 then capture the data of 
                                            // all the fields present under that node
                                            if (length > 10) {
                                                myArr_attributes_old = null;
                                                myArr_attributes_old = JSON.parse(myArr.attributes[0].old);

                                                message_attributes_old_id = null;
                                                if (myArr_attributes_old.id) {
                                                    message_attributes_old_id = (myArr_attributes_old.id).toString();
                                                }

                                                message_attributes_old_meta_version = null;
                                                if (myArr_attributes_old.meta.version) {
                                                    message_attributes_old_meta_version = (myArr_attributes_old.meta.version).toString();
                                                }

                                                message_attributes_old_meta_created = null;
                                                if (myArr_attributes_old.meta.created) {
                                                    message_attributes_old_meta_created = (myArr_attributes_old.meta.created).toString();
                                                }

                                                message_attributes_old_meta_lastModified = null;
                                                if (myArr_attributes_old.meta.lastModified) {
                                                    message_attributes_old_meta_lastModified = (myArr_attributes_old.meta.lastModified).toString();
                                                }

                                                message_attributes_old_userName = null;
                                                if (myArr_attributes_old.userName) {
                                                    message_attributes_old_userName = (myArr_attributes_old.userName).toString();
                                                }

                                                message_attributes_old_name_formatted = null;
                                                if (myArr_attributes_old.name.formatted) {
                                                    message_attributes_old_name_formatted = (myArr_attributes_old.name.formatted).toString();
                                                    if (message_attributes_old_name_formatted == 'null null') {
                                                        message_attributes_old_name_formatted = null;
                                                    }
                                                }

                                                message_attributes_old_emails_value = null;
                                                if (myArr_attributes_old.emails[0].value) {
                                                    message_attributes_old_emails_value = (myArr_attributes_old.emails[0].value).toString();
                                                }

                                                message_attributes_old_emails_primary = null;
                                                if (myArr_attributes_old.emails[0].primary) {
                                                    message_attributes_old_emails_primary = (myArr_attributes_old.emails[0].primary).toString();
                                                }

                                                message_attributes_old_groups = null;
                                                if (myArr_attributes_old.groups) {
                                                    message_attributes_old_groups = (myArr_attributes_old.groups).toString();
                                                    if (message_attributes_old_groups = []) {
                                                        message_attributes_old_groups = null;
                                                    }
                                                }

                                                message_attributes_old_phoneNumbers = null;
                                                if (myArr_attributes_old.phoneNumbers) {
                                                    message_attributes_old_phoneNumbers = (myArr_attributes_old.phoneNumbers).toString();
                                                    if (message_attributes_old_phoneNumbers = []) {
                                                        message_attributes_old_phoneNumbers = null;
                                                    }
                                                }

                                                message_attributes_old_active = null;
                                                if (myArr_attributes_old.active) {
                                                    message_attributes_old_active = (myArr_attributes_old.active).toString();
                                                }

                                                message_attributes_old_verified = null;
                                                if (myArr_attributes_old.verified) {
                                                    message_attributes_old_verified = (myArr_attributes_old.verified).toString();
                                                }

                                                message_attributes_old_origin = null;
                                                if (myArr_attributes_old.origin) {
                                                    message_attributes_old_origin = (myArr_attributes_old.origin).toString();
                                                }

                                                message_attributes_old_zoneId = null;
                                                if (myArr_attributes_old.zoneId) {
                                                    message_attributes_old_zoneId = (myArr_attributes_old.zoneId).toString();
                                                }

                                                message_attributes_old_passwordLastModified = null;
                                                if (myArr_attributes_old.passwordLastModified) {
                                                    message_attributes_old_passwordLastModified = (myArr_attributes_old.passwordLastModified).toString();
                                                    //format the last modified date properly to store the data in table
                                                    const date = new Date(myArr_attributes_old.passwordLastModified);

                                                    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };

                                                    const formattedDate = date.toLocaleDateString('en-IN', options);

                                                    message_attributes_old_passwordLastModified = formattedDate;
                                                }
                                            }
                                            else {

                                                message_attributes_old = null;
                                                message_attributes_old2 = null;
                                                if (myArr.attributes[0].old) {
                                                    message_attributes_old = (myArr.attributes[0].old).toString();
                                                    if ((myArr.attributes).length > 1) {
                                                        message_attributes_old2 = (myArr.attributes[1].old).toString();
                                                    }

                                                }

                                                message_attributes_new2 = null;
                                                message_attributes_old2 = null;
                                                message_attributes_name2 = null;
                                                if (((myArr.attributes).length) > 1) {
                                                    //console.log(myArr.attributes);
                                                    if (myArr.attributes[1].new) {
                                                        message_attributes_new2 = myArr.attributes[1].new;
                                                    }

                                                    if (myArr.attributes[1].old) {
                                                        message_attributes_old2 = myArr.attributes[1].old;
                                                    }

                                                    if (myArr.attributes[1].name) {
                                                        message_attributes_name2 = myArr.attributes[1].name;
                                                    }
                                                    // console.log(myArr.attributes, message_attributes_new2, message_attributes_old2, message_attributes_name2);
                                                }
                                            }

                                        } else {

                                            //If old key does not exists then check if the 'new' key has data
                                            if (myArr.attributes[0].new) {

                                                //if length of 'new' key greater than 10
                                                if (((myArr.attributes[0].new).length) > 10) {

                                                    myArr_attributes_new = null;
                                                    myArr_attributes_new = JSON.parse(myArr.attributes[0].new);

                                                    message_attributes_new_id = null;
                                                    if (myArr_attributes_new.id) {
                                                        message_attributes_new_id = (myArr_attributes_new.id).toString();
                                                    }

                                                    message_attributes_new_meta_version = null;
                                                    if (myArr_attributes_new.meta.version) {
                                                        message_attributes_new_meta_version = (myArr_attributes_new.meta.version).toString();
                                                    }

                                                    message_attributes_new_meta_created = null;
                                                    if (myArr_attributes_new.meta.created) {
                                                        message_attributes_new_meta_created = (myArr_attributes_new.meta.created).toString();
                                                    }

                                                    message_attributes_new_userName = null;
                                                    if (myArr_attributes_new.userName) {

                                                        message_attributes_new_userName = (myArr_attributes_new.userName).toString();
                                                    }

                                                    message_attributes_new_name_formatted = null;
                                                    if (myArr_attributes_new.name.formatted) {
                                                        message_attributes_new_name_formatted = (myArr_attributes_new.name.formatted).toString();
                                                        if (message_attributes_new_name_formatted == 'null null') {
                                                            message_attributes_new_name_formatted = null;
                                                        }

                                                    }

                                                    message_attributes_new_emails_value = null;
                                                    if (myArr_attributes_new.emails[0].value) {
                                                        message_attributes_new_emails_value = (myArr_attributes_new.emails[0].value).toString();
                                                    }

                                                    message_attributes_new_emails_primary = null;
                                                    if (myArr_attributes_new.emails[0].primary) {
                                                        message_attributes_new_emails_primary = (myArr_attributes_new.emails[0].primary).toString();
                                                    }

                                                    message_attributes_new_groups = null;
                                                    if (myArr_attributes_new.groups) {
                                                        message_attributes_new_groups = (myArr_attributes_new.groups).toString();
                                                        if (message_attributes_new_groups = []) {
                                                            message_attributes_new_groups = null;
                                                        }
                                                    }

                                                    message_attributes_new_phoneNumbers = null;
                                                    if (myArr_attributes_new.phoneNumbers) {
                                                        message_attributes_new_phoneNumbers = (myArr_attributes_new.phoneNumbers).toString();
                                                        if (message_attributes_new_phoneNumbers = []) {
                                                            message_attributes_new_phoneNumbers = null;
                                                        }
                                                    }

                                                    message_attributes_new_active = null;
                                                    if (myArr_attributes_new.active) {
                                                        message_attributes_new_active = (myArr_attributes_new.active).toString();
                                                    }

                                                    message_attributes_new_verified = null;
                                                    if (myArr_attributes_new.verified) {
                                                        message_attributes_new_verified = (myArr_attributes_new.verified).toString();
                                                    }

                                                    message_attributes_new_origin = null;
                                                    if (myArr_attributes_new.origin) {
                                                        message_attributes_new_origin = (myArr_attributes_new.origin).toString();
                                                    }

                                                    message_attributes_new_passwordLastModified = null;
                                                    if (myArr_attributes_new.passwordLastModified) {
                                                        message_attributes_new_passwordLastModified = (myArr_attributes_new.passwordLastModified).toString();

                                                        const date = new Date(myArr_attributes_new.passwordLastModified);

                                                        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
                                                        const formattedDate = date.toLocaleDateString('en-IN', options);
                                                        message_attributes_new_passwordLastModified = formattedDate;
                                                    }
                                                }
                                                else {
                                                    myArr_attributes_new = null;
                                                    myArr_attributes_new = myArr.attributes[0].new;
                                                }

                                            }

                                        }

                                        //capture all other nested structure values to the table
                                        try {
                                            message_success = null;
                                            if (myArr.success) {
                                                message_success = (myArr.success).toString();
                                            }

                                            message_object_type = null;
                                            if (myArr.object.type) {
                                                message_object_type = (myArr.object.type).toString();
                                            }

                                            message_object_id_tableName = null;
                                            if (myArr.object.id.tableName) {
                                                message_object_id_tableName = (myArr.object.id.tableName).toString();

                                                if (message_object_id_tableName == undefined) {
                                                    message_object_id_tableName = null;
                                                }
                                            }

                                            message_object_id_crudType = null;
                                            if (myArr.object.id.crudType) {
                                                message_object_id_crudType = (myArr.object.id.crudType).toString();
                                            }

                                            message_object_id_creationTimestamp = null;
                                            if (myArr.object.id.creationTimestamp) {
                                                message_object_id_creationTimestamp = (myArr.object.id.creationTimestamp).toString();
                                            }

                                            message_object_id_origin = null;
                                            if (myArr.object.id.origin) {
                                                message_object_id_origin = (myArr.object.id.origin).toString();
                                            }

                                            message_object_id_name = null;
                                            if (myArr.object.id.name) {
                                                message_object_id_name = (myArr.object.id.name).toString();
                                            }

                                            message_object_id_identity_zone_id = null;
                                            if (myArr.object.id.identity_zone_id) {
                                                message_object_id_identity_zone_id = (myArr.object.id.identity_zone_id).toString();
                                            }

                                            message_object_id_onBehalfOf = null;
                                            if (myArr.object.id.onBehalfOf) {
                                                message_object_id_onBehalfOf = (myArr.object.id.onBehalfOf).toString();
                                            }

                                            message_object_id_user_id = null;
                                            if (myArr.object.id.user_id) {
                                                message_object_id_user_id = (myArr.object.id.user_id).toString();

                                            }
                                            else {
                                                message_object_id_user_id = null;
                                            }

                                            //If service key details exist in the table for the subaccount
                                            if (userDataServiceDetails.length > 0) {

                                                var userDetailsOutputData1 = null;
                                                var userDetailsOutputData2 = null;
                                                var check1 = null;

                                                operation_performed_by_user = null;
                                                operation_performed_by_user_name = null;
                                                operation_performed_on_user = null;
                                                operation_performed_on_user_name = null;

                                                //check if user name includes 'user/sap.default/'
                                                check1 = message_object_id_onBehalfOf.includes('user/sap.default/');

                                                if (message_object_id_user_id == null) {
                                                    if (message_attributes_old_userName != null) {
                                                        message_object_id_user_id = message_attributes_old_userName;
                                                    }
                                                    if (message_attributes_old_userName == null) {
                                                        message_object_id_user_id = message_attributes_new_userName;
                                                    }

                                                }

                                                //User details API call for capturing the name and email of user who has performed the operation
                                                userDetailsOutputData1 = await callUserDetailsRetrievalAPI(userDataServiceDetails[0].tokenServiceURL, userDataServiceDetails[0].clientID, userDataServiceDetails[0].clientSecret, message_object_id_onBehalfOf);

                                                //User details API call for capturing the name and email of user on which operation has been performed
                                                userDetailsOutputData2 = await callUserDetailsRetrievalAPI(userDataServiceDetails[0].tokenServiceURL, userDataServiceDetails[0].clientID, userDataServiceDetails[0].clientSecret, message_object_id_user_id);

                                                //API call returns values
                                                if (userDetailsOutputData1 != undefined) {
                                                    operation_performed_by_user = userDetailsOutputData1.emails[0].value;
                                                    operation_performed_by_user_name = (userDetailsOutputData1.name.givenName) + ' ' + (userDetailsOutputData1.name.familyName);

                                                }

                                                //API call  returns values
                                                if (userDetailsOutputData2 != undefined) {
                                                    operation_performed_on_user = userDetailsOutputData2.emails[0].value;

                                                    if (hasKey(userDetailsOutputData2, 'familyName')) {
                                                        operation_performed_on_user_name = (userDetailsOutputData2.name.givenName) + ' ' + (userDetailsOutputData2.name.familyName);
                                                    }
                                                    else {
                                                        operation_performed_on_user_name = userDetailsOutputData2.emails[0].value;
                                                    }
                                                }

                                                if (userDetailsOutputData2 == undefined) {
                                                    operation_performed_on_user = message_object_id_user_id;
                                                    operation_performed_on_user_name = message_object_id_user_id;
                                                }
                                                if ((message_object_id_onBehalfOf != null) && check1 == true) {
                                                    var temp = message_object_id_onBehalfOf.replace('user/sap.default/', '');
                                                    operation_performed_by_user = temp;
                                                    operation_performed_by_user_name = temp;
                                                    check1 = null, temp = null;
                                                }


                                            }

                                            message_object_id_rolecollection_identity_zone_id = null;
                                            if (myArr.object.id.rolecollection_identity_zone_id) {
                                                message_object_id_rolecollection_identity_zone_id = (myArr.object.id.rolecollection_identity_zone_id).toString();
                                            }

                                            //message_object_id_rolecollection_name = null;
                                            if (myArr.object.id.rolecollection_name) {
                                                message_object_id_rolecollection_name = (myArr.object.id.rolecollection_name).toString();
                                            }

                                            message_object_id_role_name = null;
                                            message_object_id_role_identity_zone_id = null;
                                            message_object_id_role_roletemplate_name = null;
                                            message_object_id_role_roletemplate_app_appid = null;
                                            if (objectType == 'xsrolecollection2role') {

                                                message_object_id_role_name = (myArr.object.id.role_name).toString();
                                                message_object_id_role_identity_zone_id = (myArr.object.id.role_identity_zone_id).toString();
                                                message_object_id_role_roletemplate_name = (myArr.object.id.role_roletemplate_name).toString();
                                                message_object_id_role_roletemplate_app_appid = (myArr.object.id.role_roletemplate_app_appid).toString();
                                            }

                                            message_attributes_name2 = null;
                                            if (((myArr.attributes).length) > 1) {
                                                if (myArr.attributes[1].name) {
                                                    message_attributes_name2 = (myArr.attributes[1].name).toString();

                                                }
                                            }

                                            message_attributes_name = null;
                                            if (myArr.attributes[0].name) {
                                                message_attributes_name = (myArr.attributes[0].name).toString();
                                            }

                                            message_status = null;
                                            if (myArr.status) {
                                                message_status = (myArr.status).toString();
                                            }

                                            message_category = null;
                                            if (myArr.category) {
                                                message_category = (myArr.category).toString();
                                            }

                                            message_identityProvider = null;
                                            if (myArr.identityProvider) {
                                                message_identityProvider = (myArr.identityProvider).toString();
                                            }

                                            message_tenant = null;
                                            if (myArr.tenant) {
                                                message_tenant = (myArr.tenant).toString();
                                            }

                                            message_customDetails = null;
                                            if (myArr.customDetails) {
                                                message_customDetails = (myArr.customDetails).toString();
                                                if (message_customDetails = {}) {
                                                    message_customDetails = null;
                                                }
                                            }

                                            message_ingestionTime = null;
                                            if (myArr.ingestionTime) {
                                                message_ingestionTime = (myArr.ingestionTime).toString();
                                            }


                                            /*let q1 = await INSERT.into(auditLogs).columns(
                                                'message_uuid',
                                                'subaccountName',
                                                'time',
                                                'tenant',
                                                'org_id',
                                                'space_id',
                                                'app_or_service_id',
                                                'als_service_id',
                                                'user',
                                                'category',
                                                'format_version',
                                                'operation_performed_on_user',
                                                'operation_performed_on_user_name',
                                                'operation_performed_by_user',
                                                'operation_performed_by_user_name',
                                                'message',
                                                'message_success',
                                                'message_object_type',
                                                'message_object_id_tableName',
                                                'message_object_id_crudType',
                                                'message_object_id_creationTimestamp',
                                                'message_object_id_origin',
                                                'message_object_id_onBehalfOf',
                                                'message_object_id_name',
                                                'message_object_id_identity_zone_id',
                                                'message_object_id_role_name',
                                                'message_object_id_role_identity_zone_id',
                                                'message_object_id_role_roletemplate_name',
                                                'message_object_id_role_roletemplate_app_appid',
                                                'message_object_id_user_id',
                                                'message_object_id_rolecollection_identity_zone_id',
                                                'message_object_id_rolecollection_name',
                                                'message_attributes_name',
                                                'message_attributes_old',
                                                'message_attributes_new',
                                                'message_attributes_name2',
                                                'message_attributes_old2',
                                                'message_attributes_new2',
                                                'message_attributes_old_id',
                                                'message_attributes_old_meta_version',
                                                'message_attributes_old_meta_created',
                                                'message_attributes_old_meta_lastModified',
                                                'message_attributes_old_userName',
                                                'message_attributes_old_name_formatted',
                                                'message_attributes_old_emails_value',
                                                'message_attributes_old_emails_primary',
                                                'message_attributes_old_groups',
                                                'message_attributes_old_phoneNumbers',
                                                'message_attributes_old_active',
                                                'message_attributes_old_verified',
                                                'message_attributes_old_origin',
                                                'message_attributes_old_zoneId',
                                                'message_attributes_old_passwordLastModified',
                                                'message_attributes_new_id',
                                                'message_attributes_new_meta_version',
                                                'message_attributes_new_meta_created',
                                                'message_attributes_new_userName',
                                                'message_attributes_new_name_formatted',
                                                'message_attributes_new_emails_value',
                                                'message_attributes_new_emails_primary',
                                                'message_attributes_new_groups',
                                                'message_attributes_new_phoneNumbers',
                                                'message_attributes_new_active',
                                                'message_attributes_new_verified',
                                                'message_attributes_new_origin',
                                                'message_attributes_new_passwordLastModified',
                                                'message_status',
                                                'message_category',
                                                'message_identityProvider',
                                                'message_tenant',
                                                'message_customDetails',
                                                'message_ingestionTime',
                                                'actual_audit_log'
                                            ).values(
                                                auditLogOutputData[i].message_uuid,
                                                subaccountName,
                                                auditLogOutputData[i].time,
                                                auditLogOutputData[i].tenant,
                                                auditLogOutputData[i].org_id,
                                                auditLogOutputData[i].space_id,
                                                auditLogOutputData[i].app_or_service_id,
                                                auditLogOutputData[i].als_service_id,
                                                auditLogOutputData[i].user,
                                                auditLogOutputData[i].category,
                                                auditLogOutputData[i].format_version,
                                                operation_performed_on_user,
                                                operation_performed_on_user_name,
                                                operation_performed_by_user,
                                                operation_performed_by_user_name,
                                                actual_message,
                                                message_success,
                                                message_object_type,
                                                message_object_id_tableName,
                                                message_object_id_crudType,
                                                message_object_id_creationTimestamp,
                                                message_object_id_origin,
                                                message_object_id_onBehalfOf,
                                                message_object_id_name,
                                                message_object_id_identity_zone_id,
                                                message_object_id_role_name,
                                                message_object_id_role_identity_zone_id,
                                                message_object_id_role_roletemplate_name,
                                                message_object_id_role_roletemplate_app_appid,
                                                message_object_id_user_id,
                                                message_object_id_rolecollection_identity_zone_id,
                                                message_object_id_rolecollection_name,
                                                message_attributes_name,
                                                message_attributes_old,
                                                message_attributes_new,
                                                message_attributes_name2,
                                                message_attributes_old2,
                                                message_attributes_new2,
                                                message_attributes_old_id,
                                                message_attributes_old_meta_version,
                                                message_attributes_old_meta_created,
                                                message_attributes_old_meta_lastModified,
                                                message_attributes_old_userName,
                                                message_attributes_old_name_formatted,
                                                message_attributes_old_emails_value,
                                                message_attributes_old_emails_primary,
                                                message_attributes_old_groups,
                                                message_attributes_old_phoneNumbers,
                                                message_attributes_old_active,
                                                message_attributes_old_verified,
                                                message_attributes_old_origin,
                                                message_attributes_old_zoneId,
                                                message_attributes_old_passwordLastModified,
                                                message_attributes_new_id,
                                                message_attributes_new_meta_version,
                                                message_attributes_new_meta_created,
                                                message_attributes_new_userName,
                                                message_attributes_new_name_formatted,
                                                message_attributes_new_emails_value,
                                                message_attributes_new_emails_primary,
                                                message_attributes_new_groups,
                                                message_attributes_new_phoneNumbers,
                                                message_attributes_new_active,
                                                message_attributes_new_verified,
                                                message_attributes_new_origin,
                                                message_attributes_new_passwordLastModified,
                                                message_status,
                                                message_category,
                                                message_identityProvider,
                                                message_tenant,
                                                message_customDetails,
                                                message_ingestionTime,
                                                actual_audit_log
                                            )*/

                                            let q1 = await UPSERT.into(auditLogs, [{
                                                'message_uuid': auditLogOutputData[i].message_uuid,
                                                'subaccountName': subaccountName,
                                                'time': auditLogOutputData[i].time,
                                                'tenant': auditLogOutputData[i].tenant,
                                                'org_id': auditLogOutputData[i].org_id,
                                                'space_id': auditLogOutputData[i].space_id,
                                                'app_or_service_id': auditLogOutputData[i].app_or_service_id,
                                                'als_service_id': auditLogOutputData[i].als_service_id,
                                                'user': auditLogOutputData[i].user,
                                                'category': auditLogOutputData[i].category,
                                                'format_version': auditLogOutputData[i].format_version,
                                                'operation_performed_on_user': operation_performed_on_user,
                                                'operation_performed_on_user_name': operation_performed_on_user_name,
                                                'operation_performed_by_user': operation_performed_by_user,
                                                'operation_performed_by_user_name': operation_performed_by_user_name,
                                                'message': actual_message,
                                                'message_success': message_success,
                                                'message_object_type': message_object_type,
                                                'message_object_id_tableName': message_object_id_tableName,
                                                'message_object_id_crudType': message_object_id_crudType,
                                                'message_object_id_creationTimestamp': message_object_id_creationTimestamp,
                                                'message_object_id_origin': message_object_id_origin,
                                                'message_object_id_onBehalfOf': message_object_id_onBehalfOf,
                                                'message_object_id_name': message_object_id_name,
                                                'message_object_id_identity_zone_id': message_object_id_identity_zone_id,
                                                'message_object_id_role_name': message_object_id_role_name,
                                                'message_object_id_role_identity_zone_id': message_object_id_role_identity_zone_id,
                                                'message_object_id_role_roletemplate_name': message_object_id_role_roletemplate_name,
                                                'message_object_id_role_roletemplate_app_appid': message_object_id_role_roletemplate_app_appid,
                                                'message_object_id_user_id': message_object_id_user_id,
                                                'message_object_id_rolecollection_identity_zone_id': message_object_id_rolecollection_identity_zone_id,
                                                'message_object_id_rolecollection_name': message_object_id_rolecollection_name,
                                                'message_attributes_name': message_attributes_name,
                                                'message_attributes_old': message_attributes_old,
                                                'message_attributes_new': message_attributes_new,
                                                'message_attributes_name2': message_attributes_name2,
                                                'message_attributes_old2': message_attributes_old2,
                                                'message_attributes_new2': message_attributes_new2,
                                                'message_attributes_old_id': message_attributes_old_id,
                                                'message_attributes_old_meta_version': message_attributes_old_meta_version,
                                                'message_attributes_old_meta_created': message_attributes_old_meta_created,
                                                'message_attributes_old_meta_lastModified': message_attributes_old_meta_lastModified,
                                                'message_attributes_old_userName': message_attributes_old_userName,
                                                'message_attributes_old_name_formatted': message_attributes_old_name_formatted,
                                                'message_attributes_old_emails_value': message_attributes_old_emails_value,
                                                'message_attributes_old_emails_primary': message_attributes_old_emails_primary,
                                                'message_attributes_old_groups': message_attributes_old_groups,
                                                'message_attributes_old_phoneNumbers': message_attributes_old_phoneNumbers,
                                                'message_attributes_old_active': message_attributes_old_active,
                                                'message_attributes_old_verified': message_attributes_old_verified,
                                                'message_attributes_old_origin': message_attributes_old_origin,
                                                'message_attributes_old_zoneId': message_attributes_old_zoneId,
                                                'message_attributes_old_passwordLastModified': message_attributes_old_passwordLastModified,
                                                'message_attributes_new_id': message_attributes_new_id,
                                                'message_attributes_new_meta_version': message_attributes_new_meta_version,
                                                'message_attributes_new_meta_created': message_attributes_new_meta_created,
                                                'message_attributes_new_userName': message_attributes_new_userName,
                                                'message_attributes_new_name_formatted': message_attributes_new_name_formatted,
                                                'message_attributes_new_emails_value': message_attributes_new_emails_value,
                                                'message_attributes_new_emails_primary': message_attributes_new_emails_primary,
                                                'message_attributes_new_groups': message_attributes_new_groups,
                                                'message_attributes_new_phoneNumbers': message_attributes_new_phoneNumbers,
                                                'message_attributes_new_active': message_attributes_new_active,
                                                'message_attributes_new_verified': message_attributes_new_verified,
                                                'message_attributes_new_origin': message_attributes_new_origin,
                                                'message_attributes_new_passwordLastModified': message_attributes_new_passwordLastModified,
                                                'message_status': message_status,
                                                'message_category': message_category,
                                                'message_identityProvider': message_identityProvider,
                                                'message_tenant': message_tenant,
                                                'message_customDetails': message_customDetails,
                                                'message_ingestionTime': message_ingestionTime,
                                                'actual_audit_log': actual_audit_log
                                            }]);
                                            console.log(q1);
                                            executionStatus = 'Success';


                                            //console.log(q1);

                                            //Adding the data to FinalAuditLog Table
                                            let detailedAuditLogs = await SELECT.from(auditLogs).where({ message_uuid: auditLogOutputData[i].message_uuid });
                                            var category,
                                                subCategory,
                                                dateTime,
                                                date,
                                                time,
                                                performed_on_user,
                                                performed_by_user,
                                                subaccount,
                                                severity,
                                                log_statement,
                                                detailedAuditLog,
                                                message_uuid,
                                                userProvision,
                                                roleProvision;

                                            if ((detailedAuditLogs.length) == 1) {
                                                subaccount = detailedAuditLogs[0].subaccountName;
                                                // console.log(detailedAuditLogs.length);
                                                {

                                                    detailedAuditLog = detailedAuditLogs[0].actual_audit_log;
                                                    message_uuid = detailedAuditLogs[0].message_uuid;
                                                    //console.log(detailedAuditLogs[0].message_object_type)

                                                    if (detailedAuditLogs[0].message_object_type == 'scim user') {
                                                        category = 'User Provision'
                                                    }
                                                    if ((detailedAuditLogs[0].message_object_type == 'xsrolecollections') || (detailedAuditLogs[0].message_object_type == 'xsrolecollection2role') || (detailedAuditLogs[0].message_object_type == 'xs_rolecollection2user')) {
                                                        category = 'Role Provision'
                                                    }
                                                    subCategory = null;


                                                    date = (detailedAuditLogs[0].time).slice(0, 10);
                                                    time = (detailedAuditLogs[0].time).slice(11, 22);
                                                    dateTime = detailedAuditLogs[0].time;
                                                    performed_on_user = detailedAuditLogs[0].operation_performed_on_user_name;
                                                    performed_by_user = detailedAuditLogs[0].operation_performed_by_user_name;
                                                    //subaccount = detailedAuditLogs[0].subaccountName;
                                                    userProvision = 0;
                                                    roleProvision = 0;
                                                    if (detailedAuditLogs[0].message_success = 'true') {
                                                        severity = 'Success'
                                                    }
                                                    else if (detailedAuditLogs[0].message_success = 'false') {
                                                        severity = 'Error'
                                                    }
                                                    userProvision = category.includes('User');
                                                    roleProvision = category.includes('Role');




                                                    if (userProvision == true) {
                                                        // console.log(detailedAuditLogs[0].message_object_id_crudType, userProvision, roleProvision);
                                                        if (detailedAuditLogs[0].message_object_id_crudType == 'CREATE') {
                                                            log_statement = 'The user \'' + performed_on_user + '\' was created by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                        }
                                                        if (detailedAuditLogs[0].message_object_id_crudType == 'DELETE') {
                                                            log_statement = 'The user \'' + performed_on_user + '\' was deleted by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                        }
                                                    }
                                                    else if (roleProvision == true) {
                                                        //console.log(detailedAuditLogs[0].message_object_id_crudType, userProvision, roleProvision);
                                                        if (detailedAuditLogs[0].message_object_type == 'xsrolecollections') {
                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'CREATE') {
                                                                log_statement = 'The role collection \'' + detailedAuditLogs[0].message_object_id_name + '\' was created by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                            }
                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'UPDATE') {
                                                                log_statement = 'The role collection \'' + detailedAuditLogs[0].message_object_id_name + '\' was updated with the description \'' + detailedAuditLogs[0].message_attributes_new2 + '\' by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                            }

                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'DELETE') {
                                                                log_statement = 'The role collection \'' + detailedAuditLogs[0].message_object_id_name + '\' was deleted by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                            }
                                                        }
                                                        else if (detailedAuditLogs[0].message_object_type == 'xs_rolecollection2user') {
                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'CREATE') {
                                                                log_statement = 'The role collection \'' + detailedAuditLogs[0].message_object_id_rolecollection_name + '\' was assigned to the user \'' + performed_on_user + '\' by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                            }


                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'DELETE') {
                                                                log_statement = 'The role collection \'' + detailedAuditLogs[0].message_object_id_rolecollection_name + '\' was unassigned from the user \'' + performed_on_user + '\' by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;

                                                            }
                                                        }
                                                        else if (detailedAuditLogs[0].message_object_type == 'xsrolecollection2role') {
                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'CREATE') {
                                                                log_statement = 'The role \'' + detailedAuditLogs[0].message_object_id_role_name + '\' was added to the role collection \'' + detailedAuditLogs[0].message_object_id_rolecollection_name + '\' by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;
                                                            }


                                                            if (detailedAuditLogs[0].message_object_id_crudType == 'DELETE') {
                                                                log_statement = 'The role \'' + detailedAuditLogs[0].message_object_id_role_name + '\' was removed from the role collection  \'' + detailedAuditLogs[0].message_object_id_rolecollection_name + '\' by \'' + performed_by_user + '\' in the subaccount \'' + subaccount + '\' on ' + date + ' at ' + time;

                                                            }
                                                        }
                                                    }
                                                    subCategory = detailedAuditLogs[0].message_object_id_crudType;
                                                    //console.log(category, detailedAuditLogs[0].message_attributes_old, detailedAuditLogs[0].message_object_id_crudType);
                                                    if (
                                                        (
                                                            (category == 'User Provision')
                                                            &&
                                                            ((detailedAuditLogs[0].message_attributes_old) == '1')
                                                            &&
                                                            ((detailedAuditLogs[0].message_object_id_crudType) == 'DELETE')
                                                        )
                                                        || (category == 'Role Provision')
                                                        || (
                                                            (category == 'User Provision')
                                                            &&
                                                            ((detailedAuditLogs[0].message_object_id_crudType) == 'CREATE')
                                                        )
                                                    ) {

                                                        try {


                                                            let q2 = await UPSERT.into(finalAuditLogs, [{
                                                                'message_uuid': message_uuid,
                                                                'log_statement': log_statement,
                                                                'category': category,
                                                                'subCategory': detailedAuditLogs[0].message_object_id_crudType,
                                                                'dateTime': dateTime,
                                                                'operation_performed_on_user': performed_on_user,
                                                                'operation_performed_by_user': performed_by_user,
                                                                'subaccount': subaccount,
                                                                'severity': severity,
                                                                'detailedAuditLog': detailedAuditLog
                                                            }]);

                                                            executionStatus = 'Success';
                                                        }
                                                        catch (error) {
                                                            executionStatus = 'Failed';

                                                        }

                                                    }
                                                    //q2 = null;
                                                    category = null;
                                                    subCategory = null;
                                                    date = null;
                                                    time = null;
                                                    performed_on_user = null;
                                                    performed_by_user = null;
                                                    subaccount = null;
                                                    severity = null;
                                                    log_statement = null;
                                                    detailedAuditLog = null;
                                                    message_uuid = null;
                                                    userProvision = null;
                                                    roleProvision = null;
                                                    detailedAuditLogs[0] = [];



                                                }
                                            }
                                        }
                                        catch (error) {
                                            console.log(error);
                                            // console.log("ERROR :Failed to add the record in 'AuditLogs' table", error)
                                            log = log + "Failed to add the record in 'AuditLogs' table\n";
                                            executionStatus = 'Failed';
                                        }
                                    }
                                }
                            };

                        }
                        else {
                            log = log + "AuditLogOutputData is empty\n"
                            //console.error('Error:', "auditLogOutputData is empty");
                        };
                        log = log + "\nAudit Logs successfully saved for subaccount - " + subaccountName;
                    }
                    else {
                        errorLog = errorLog + subaccountName + ", ";
                        //console.log("Service key details are not present in table for subaccount " + subaccountName);
                    };



                };
                myArr = null;
                subaccountName = null; objectType = null; crudType = null; message_success = null;
                message_object_type = null;
                message_object_id_tableName = null;
                message_object_id_crudType = null;
                message_object_id_creationTimestamp = null;
                message_object_id_origin = null;
                message_object_id_onBehalfOf = null;
                message_object_id_user_id = null;
                message_object_id_rolecollection_identity_zone_id = null;
                message_object_id_rolecollection_name = null;
                message_attributes_name = null;
                message_attributes_old = null;
                message_attributes_old_id = null;
                message_attributes_old_meta_version = null;
                message_attributes_old_meta_created = null;
                message_attributes_old_meta_lastModified = null;
                message_attributes_old_userName = null;
                message_attributes_old_name_formatted = null;
                message_attributes_old_emails_value = null;
                message_attributes_old_emails_primary = null;
                message_attributes_old_groups = null;
                message_attributes_old_phoneNumbers = null;
                message_attributes_old_active = null;
                message_attributes_old_verified = null;
                message_attributes_old_origin = null;
                message_attributes_old_zoneId = null;
                message_attributes_old_passwordLastModified = null;
                message_attributes_new = null;
                message_attributes_new_id = null;
                message_attributes_new_meta_version = null;
                message_attributes_new_meta_created = null;
                message_attributes_new_userName = null;
                message_attributes_new_name_formatted = null;
                message_attributes_new_emails_value = null;
                message_attributes_new_emails_primary = null;
                message_attributes_new_groups = null;
                message_attributes_new_phoneNumbers = null;
                message_attributes_new_active = null;
                message_attributes_new_verified = null;
                message_attributes_new_origin = null;
                message_attributes_new_passwordLastModified = null;
                message_attributes_new = null;
                message_status = null;
                message_category = null;
                message_identityProvider = null;
                message_tenant = null;
                message_customDetails = null;
                message_ingestionTime = null;
                myArr_attributes_old = null;
                operation_performed_on_user = null; operation_performed_by_user = null;
                message_attributes_name2 = null;
                message_attributes_old2 = null;
                message_attributes_new2 = null;
                message_object_id_role_name = null;
                message_object_id_role_identity_zone_id = null;
                message_object_id_role_roletemplate_name = null;
                message_object_id_role_roletemplate_app_appid = null;



            }
        }
        else {
            return srv.error(404, "Configuration Status Table is empty");
        }

        console.log(executionStatus);
        const d = new Date();
        if (errorLog) {
            if (errorLog.length > 2) {
                errorLog = "\nAudit Log Service key details are not present for subaccounts - " + errorLog;
            }
        }
        log = log + errorLog;
        var date = "date";
        date = d;
        let q2 = await INSERT.into(zjobExecutionStatus).columns(
            'status', 'log'
        ).values(
            executionStatus, log
        )
        executionStatus = null;
        log = '';
        errorLog = '';



    }

    )

    srv.after("READ", "zauditLogs", async req => {
        if (req) {
            for (let i = 0; i < req.length; i++) {
                if (req[i].detailedAuditLog) {
                    req[i].detailedAuditLog = JSON.parse(req[i].detailedAuditLog);
                    req[i].detailedAuditLog.message = JSON.parse(req[i].detailedAuditLog.message);
                    console.log("\n", req[i].detailedAuditLog);
                }
                else {
                    console.log("does not")
                }
            }
        }
    })
}